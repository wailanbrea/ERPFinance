<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesYPermisosSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $acciones = [
            'ver',
            'crear',
            'editar',
            'eliminar',
            'imprimir',
            'exportar',
            'anular',
            'aprobar',
            'rechazar',
            'cerrar',
            'transferir',
            'ajustar',
        ];

        $modulos = [
            'dashboard',
            'notificaciones',
            'clientes',
            'productos',
            'inventario',
            'almacenes',
            'compras',
            'ventas',
            'facturas',
            'financiamientos',
            'cobros',
            'rutas_cobro',
            'garantias',
            'servicio_tecnico',
            'caja',
            'gastos',
            'reportes',
            'usuarios',
            'roles_permisos',
            'configuracion',
        ];

        foreach ($modulos as $modulo) {
            foreach ($acciones as $accion) {
                Permission::firstOrCreate(['name' => "{$modulo}.{$accion}"]);
            }
        }

        $admin = Role::firstOrCreate(['name' => 'Administrador']);
        $admin->syncPermissions(Permission::all());

        $vendedor = Role::firstOrCreate(['name' => 'Vendedor']);
        $vendedor->syncPermissions([
            'dashboard.ver',
            'clientes.ver', 'clientes.crear', 'clientes.editar',
            'productos.ver',
            'inventario.ver',
            'ventas.ver', 'ventas.crear',
            'facturas.ver', 'facturas.imprimir',
            'financiamientos.ver',
            'cobros.ver',
        ]);

        $cobrador = Role::firstOrCreate(['name' => 'Cobrador']);
        $cobrador->syncPermissions([
            'dashboard.ver',
            'clientes.ver',
            'financiamientos.ver',
            'cobros.ver', 'cobros.crear',
            'rutas_cobro.ver',
        ]);

        $tecnico = Role::firstOrCreate(['name' => 'Técnico']);
        $tecnico->syncPermissions([
            'dashboard.ver',
            'clientes.ver',
            'productos.ver',
            'garantias.ver', 'garantias.crear', 'garantias.editar',
            'servicio_tecnico.ver', 'servicio_tecnico.crear', 'servicio_tecnico.editar',
        ]);

        $superAdmin = Role::firstOrCreate(['name' => 'SuperAdmin']);
        $superAdmin->syncPermissions(Permission::all());

        // Licencias comerciales (mismo código, distinta capacidad) — ver config/planes.php
        $defPlanes = config('planes');
        $planBasico = Role::firstOrCreate(['name' => 'Plan Basico']);
        $permisosBasico = $defPlanes['basico']['permisos'] ?? [];
        $planBasico->syncPermissions(
            Permission::query()->whereIn('name', $permisosBasico)->pluck('name')->all()
        );

        $planFull = Role::firstOrCreate(['name' => 'Plan Full']);
        $planFull->syncPermissions(Permission::all());
    }
}

