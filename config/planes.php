<?php

/**
 * Licencias: mismo código, distinta capacidad.
 *
 * - Roles Spatie (`Plan Basico` / `Plan Full`) definen permisos por usuario.
 * - `instalacion.plan` (ERP_PLAN en .env) limita la instalación: aunque un usuario
 *   tenga permisos en BD, no podrá entrar a módulos fuera del plan contratado.
 *
 * `modulos`: clave interna = prefijo de permisos Spatie (ej. clientes.ver → clientes).
 */

$planInstalacion = strtolower(trim((string) env('ERP_PLAN', 'full')));
if (! in_array($planInstalacion, ['basico', 'full'], true)) {
    $planInstalacion = 'full';
}

return [
    'instalacion' => [
        /** basico | full — forzar capacidad del servidor (licencia) */
        'plan' => $planInstalacion,
    ],

    /**
     * Panel Usuarios: un rol principal de plan (exclusivo) + roles operativos opcionales.
     * Nombres deben coincidir con Spatie (RolesYPermisosSeeder).
     */
    'panel_usuarios' => [
        'roles_plan' => [
            ['rol' => 'Plan Basico', 'etiqueta' => 'Plan Básico', 'detalle' => 'Catálogo, ventas contado/apartado, caja, reportes; sin financiamiento ni cobros.'],
            ['rol' => 'Plan Full', 'etiqueta' => 'Plan Full', 'detalle' => 'Todo el ERP: financiamiento, cobros, rutas, garantías, servicio técnico, roles.'],
            ['rol' => 'Administrador', 'etiqueta' => 'Administrador', 'detalle' => 'Acceso total al sistema (dueño o TI).'],
        ],
        'roles_operativos' => [
            ['rol' => 'Vendedor', 'etiqueta' => 'Vendedor', 'detalle' => 'Refuerzo en POS, clientes y catálogo (se suma al plan).'],
            ['rol' => 'Cobrador', 'etiqueta' => 'Cobrador', 'detalle' => 'Cartera y rutas (útil con Plan Full).'],
            ['rol' => 'Técnico', 'etiqueta' => 'Técnico', 'detalle' => 'Garantías y servicio técnico (útil con Plan Full).'],
        ],
    ],

    /**
     * Primer segmento de la URL (tras el dominio/base) → clave de módulo.
     * Rutas sin entrada aquí no se filtran por plan (perfil, welcome, auth).
     */
    'segmento_a_modulo' => [
        'dashboard' => 'dashboard',
        'notificaciones' => 'notificaciones',
        'clientes' => 'clientes',
        'productos' => 'productos',
        'categorias' => 'productos',
        'marcas' => 'productos',
        'almacenes' => 'almacenes',
        'inventario' => 'inventario',
        'proveedores' => 'compras',
        'compras' => 'compras',
        'ventas' => 'ventas',
        'ventas-por-mayor' => 'ventas',
        'facturas' => 'facturas',
        'financiamientos' => 'financiamientos',
        'cobros' => 'cobros',
        'rutas-cobro' => 'rutas_cobro',
        'garantias' => 'garantias',
        'servicio-tecnico' => 'servicio_tecnico',
        'caja' => 'caja',
        'gastos' => 'gastos',
        'reportes' => 'reportes',
        'usuarios' => 'usuarios',
        'roles-permisos' => 'roles_permisos',
        'configuracion' => 'configuracion',
    ],

    'basico' => [
        'clave' => 'basico',
        'nombre' => 'Plan Básico',
        'descripcion' => 'Retail / operación diaria: catálogo, inventario, compras, ventas al contado y apartado, caja, gastos y reportes. Sin cartera financiera ni postventa extendida.',
        /**
         * Cupo: usuarios con rol Spatie «Plan Basico» (cada uno ocupa un asiento).
         * 0 o negativo = sin límite (solo recomendable en desarrollo).
         */
        'max_usuarios_empleados' => (int) env('PLAN_BASICO_MAX_USUARIOS', 10),
        /**
         * Módulos incluidos (orden = menú lateral de referencia).
         * Clave = prefijo Spatie; valor = nombre comercial legible.
         */
        'modulos' => [
            'dashboard' => 'Dashboard',
            'clientes' => 'Clientes',
            'productos' => 'Productos (incluye categorías y marcas)',
            'inventario' => 'Inventario',
            'almacenes' => 'Almacenes',
            'compras' => 'Compras y proveedores',
            'ventas' => 'Ventas al detalle (POS) y al por mayor',
            'facturas' => 'Facturas e impresión PDF',
            'caja' => 'Caja',
            'gastos' => 'Gastos',
            'reportes' => 'Reportes',
            'usuarios' => 'Usuarios',
            'configuracion' => 'Configuración',
        ],
        'incluye' => [
            'Dashboard y operación diaria',
            'Clientes, productos, categorías, marcas',
            'Almacenes, inventario y compras (proveedores)',
            'POS / ventas al contado y apartado',
            'Caja (apertura, movimientos, cierre)',
            'Gastos y reportes',
            'Usuarios y configuración de sucursal',
        ],
        'excluye' => [
            'Financiamientos y plan de cuotas',
            'Cobros de cartera y rutas de cobro',
            'Garantías',
            'Servicio técnico',
            'Roles y permisos (administración avanzada de accesos)',
        ],
        'permisos' => [
            'dashboard.ver',
            'clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.eliminar',
            'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar',
            'inventario.ver',
            'almacenes.ver', 'almacenes.crear', 'almacenes.editar', 'almacenes.eliminar',
            'compras.ver', 'compras.crear', 'compras.editar', 'compras.eliminar',
            'ventas.ver', 'ventas.crear',
            'facturas.ver', 'facturas.imprimir',
            'caja.ver', 'caja.crear', 'caja.editar',
            'gastos.ver', 'gastos.crear',
            'reportes.ver',
            'usuarios.ver', 'usuarios.crear', 'usuarios.editar',
            'configuracion.ver', 'configuracion.editar',
        ],
    ],

    'full' => [
        'clave' => 'full',
        'nombre' => 'Plan Full',
        'descripcion' => 'Todo el Plan Básico más financiamiento, cobros y rutas, garantías, servicio técnico y gestión de roles.',
        /** Cupo de usuarios con rol «Plan Full». 0 o negativo = sin límite. */
        'max_usuarios_empleados' => (int) env('PLAN_FULL_MAX_USUARIOS', 50),
        'modulos' => [
            'dashboard' => 'Dashboard',
            'notificaciones' => 'Notificaciones',
            'clientes' => 'Clientes',
            'productos' => 'Productos (incluye categorías y marcas)',
            'inventario' => 'Inventario',
            'almacenes' => 'Almacenes',
            'compras' => 'Compras y proveedores',
            'ventas' => 'Ventas al detalle (POS), al por mayor (contado, apartado y financiado)',
            'facturas' => 'Facturas e impresión PDF',
            'financiamientos' => 'Financiamientos',
            'cobros' => 'Cobros',
            'rutas_cobro' => 'Rutas de cobro',
            'garantias' => 'Garantías',
            'servicio_tecnico' => 'Servicio técnico',
            'caja' => 'Caja',
            'gastos' => 'Gastos',
            'reportes' => 'Reportes',
            'usuarios' => 'Usuarios',
            'roles_permisos' => 'Roles y permisos',
            'configuracion' => 'Configuración',
        ],
        'incluye' => [
            'Todo lo del Plan Básico',
            'Financiamientos (contratos y plan de pago)',
            'Cobros de cuotas y rutas de cobro',
            'Garantías y servicio técnico',
            'Roles y permisos (delegación avanzada)',
        ],
        'excluye' => [],
        /** null = sincronizar con Permission::all() en el seeder */
        'permisos' => null,
    ],
];
