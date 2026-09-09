<?php

/**
 * Plan Personalizado (a-la-carte)
 *
 * Los precios son por instalación / mes (RD$), antes de impuestos.
 * La activación real por cliente puede implementarse luego con una tabla de suscripción/licencia.
 */
return [
    'moneda' => 'RD$',
    'periodo' => 'mensual',

    // Precio base recomendado (infra/soporte), aunque el cliente elija 1 módulo.
    // Puedes ponerlo en 0 si deseas que sea 100% por módulo.
    'precio_base' => (float) env('PLAN_PERSONALIZADO_BASE', 1500),

    /**
     * Catálogo de módulos disponibles para el plan personalizado.
     * - clave: debe coincidir con el “prefijo” de permisos (ej: clientes.* => clientes)
     */
    'catalogo' => [
        'dashboard' => ['nombre' => 'Dashboard', 'precio' => 0],
        'clientes' => ['nombre' => 'Clientes', 'precio' => 600],
        'productos' => ['nombre' => 'Productos', 'precio' => 600],
        'inventario' => ['nombre' => 'Inventario', 'precio' => 800],
        'almacenes' => ['nombre' => 'Almacenes', 'precio' => 400],
        'compras' => ['nombre' => 'Compras', 'precio' => 900],
        'ventas' => ['nombre' => 'Ventas (POS)', 'precio' => 900],
        'financiamientos' => ['nombre' => 'Financiamientos', 'precio' => 1200],
        'cobros' => ['nombre' => 'Cobros', 'precio' => 1200],
        'rutas_cobro' => ['nombre' => 'Rutas de cobro (mapa)', 'precio' => 700],
        'garantias' => ['nombre' => 'Garantías', 'precio' => 600],
        'servicio_tecnico' => ['nombre' => 'Servicio técnico', 'precio' => 900],
        'caja' => ['nombre' => 'Caja', 'precio' => 700],
        'gastos' => ['nombre' => 'Gastos', 'precio' => 400],
        'reportes' => ['nombre' => 'Reportes', 'precio' => 700],
        'usuarios' => ['nombre' => 'Usuarios', 'precio' => 500],
        'roles_permisos' => ['nombre' => 'Roles y permisos', 'precio' => 600],
        'configuracion' => ['nombre' => 'Configuración', 'precio' => 0],
        'notificaciones' => ['nombre' => 'Notificaciones', 'precio' => 400],
    ],
];

