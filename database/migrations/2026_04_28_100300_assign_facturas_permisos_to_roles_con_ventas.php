<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        if (! Permission::query()->where('name', 'ventas.ver')->exists()) {
            return;
        }

        $facturasVer = Permission::query()->where('name', 'facturas.ver')->first();
        $facturasImprimir = Permission::query()->where('name', 'facturas.imprimir')->first();
        if (! $facturasVer || ! $facturasImprimir) {
            return;
        }

        $roles = Role::query()
            ->whereHas('permissions', fn ($q) => $q->where('name', 'ventas.ver'))
            ->get();

        foreach ($roles as $role) {
            $role->givePermissionTo([$facturasVer, $facturasImprimir]);
        }
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
