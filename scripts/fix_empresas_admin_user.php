<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Empresa;
use App\Models\User;

$fixed = 0;

$empresas = Empresa::query()->get();
foreach ($empresas as $e) {
    if ($e->admin_user_id) {
        continue;
    }

    // 1) preferir admin@erp-bsolutions.local solo para la empresa central
    if ($e->slug === 'central') {
        $u = User::query()->where('email', 'admin@erp-bsolutions.local')->first();
        if ($u) {
            $e->admin_user_id = $u->id;
            $e->save();
            $fixed++;
            continue;
        }
    }

    // 2) fallback: primer usuario de la empresa con rol Administrador
    $admin = User::query()
        ->where('empresa_id', $e->id)
        ->whereHas('roles', fn ($q) => $q->where('name', 'Administrador'))
        ->orderBy('id')
        ->first();

    if ($admin) {
        $e->admin_user_id = $admin->id;
        $e->save();
        $fixed++;
    }
}

echo "Empresas admin_user_id asignadas: {$fixed}\n";

