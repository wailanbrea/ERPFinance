<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (['ver', 'crear', 'editar', 'eliminar', 'imprimir', 'exportar', 'anular', 'aprobar', 'rechazar', 'cerrar', 'transferir', 'ajustar'] as $accion) {
            Permission::firstOrCreate(
                ['name' => "facturas.{$accion}", 'guard_name' => 'web']
            );
        }
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Permission::query()->where('name', 'like', 'facturas.%')->delete();
    }
};
