<?php

// Crea 2 empresas (DEMO y OWNER) y asigna usuarios:
// - admin@erp-bsolutions.local -> empresa demo
// - wailandkey@gmail.com  -> empresa owner (tuya)
// Además crea sucursal principal si no existe y asigna admin_user_id.

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

function ensureEmpresa(string $slug, array $attrs): Empresa {
    return Empresa::query()->firstOrCreate(['slug' => $slug], $attrs);
}

function ensureSucursal(Empresa $empresa): Sucursal {
    $s = Sucursal::query()->where('empresa_id', $empresa->id)->orderBy('id')->first();
    if ($s) return $s;
    return Sucursal::query()->create([
        'empresa_id' => $empresa->id,
        'nombre' => 'Sucursal Principal',
        'codigo' => strtoupper($empresa->slug).'-PRINCIPAL',
        'telefono' => null,
        'direccion' => null,
        'activa' => true,
    ]);
}

$demoEmail = 'admin@erp-bsolutions.local';
$ownerEmail = 'wailandkey@gmail.com';

DB::transaction(function () use ($demoEmail, $ownerEmail) {
    $demoEmpresa = ensureEmpresa('demo', [
        'nombre' => 'Empresa DEMO',
        'plan' => 'full',
        'licencia_activa' => true,
        'max_usuarios_empleados' => 3,
        'inicio' => now()->toDateString(),
        'estado_pago' => 'al_dia',
        'nota' => 'Empresa destinada a demostración pública.',
    ]);
    $ownerEmpresa = ensureEmpresa('owner', [
        'nombre' => 'Empresa OWNER (BSolutions)',
        'plan' => 'full',
        'licencia_activa' => true,
        'max_usuarios_empleados' => 20,
        'inicio' => now()->toDateString(),
        'estado_pago' => 'al_dia',
        'nota' => 'Empresa del dueño / administración del SaaS.',
    ]);

    $demoSucursal = ensureSucursal($demoEmpresa);
    $ownerSucursal = ensureSucursal($ownerEmpresa);

    $demoUser = User::query()->where('email', $demoEmail)->first();
    if ($demoUser) {
        $demoUser->empresa_id = $demoEmpresa->id;
        $demoUser->sucursal_id = $demoUser->sucursal_id ?: $demoSucursal->id;
        $demoUser->save();
        $demoEmpresa->admin_user_id = $demoUser->id;
        $demoEmpresa->save();
    }

    $ownerUser = User::query()->where('email', $ownerEmail)->first();
    if ($ownerUser) {
        $ownerUser->empresa_id = $ownerEmpresa->id;
        $ownerUser->sucursal_id = $ownerUser->sucursal_id ?: $ownerSucursal->id;
        $ownerUser->save();
        $ownerEmpresa->admin_user_id = $ownerUser->id;
        $ownerEmpresa->save();
    }
});

echo "OK: empresas demo/owner listas y usuarios asignados.\n";

