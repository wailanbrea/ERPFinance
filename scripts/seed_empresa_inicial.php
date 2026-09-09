<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;

// Crea una empresa inicial y asigna sucursales/usuarios existentes.
$nombre = 'Cliente Demo (Central)';
$slug = 'central';

$empresa = Empresa::query()->firstOrCreate(
    ['slug' => $slug],
    [
        'nombre' => $nombre,
        'plan' => 'full',
        'licencia_activa' => true,
        'max_usuarios_empleados' => 15,
        'inicio' => now()->toDateString(),
        'proximo_pago' => now()->addMonth()->toDateString(),
        'ultimo_pago' => now()->toDateString(),
        'estado_pago' => 'al_dia',
        'nota' => 'Empresa inicial creada automáticamente.',
    ]
);

// Intentar asignar admin_user_id al administrador local si existe
$admin = User::query()->where('email', 'admin@erp-bsolutions.local')->first();
if ($admin) {
    $empresa->admin_user_id = $admin->id;
    $empresa->save();
}

// Asignar todas las sucursales sin empresa
$sucs = Sucursal::query()->whereNull('empresa_id')->get();
foreach ($sucs as $s) {
    $s->empresa_id = $empresa->id;
    $s->save();
}

// Asignar usuarios sin empresa:
// - si tienen sucursal, usar la empresa de la sucursal
// - si no, asignar a empresa inicial
$users = User::query()->whereNull('empresa_id')->get();
foreach ($users as $u) {
    if ($u->sucursal_id) {
        $s = Sucursal::query()->find($u->sucursal_id);
        $u->empresa_id = $s?->empresa_id ?: $empresa->id;
    } else {
        $u->empresa_id = $empresa->id;
    }
    $u->save();
}

echo "Empresa inicial: id={$empresa->id}, slug={$empresa->slug}\n";
echo "Sucursales asignadas: {$sucs->count()}\n";
echo "Usuarios asignados: {$users->count()}\n";

