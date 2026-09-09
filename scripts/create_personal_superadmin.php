<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

$email = 'wailandkey@gmail.com';
$password = 'Driffgraff09';

// Usar empresa central (id=1) como tu empresa de trabajo
$empresa = Empresa::query()->where('slug', 'central')->first() ?: Empresa::query()->first();
if (! $empresa) {
    echo "No existe empresa.\n";
    exit(1);
}

$sucursal = Sucursal::query()->where('empresa_id', $empresa->id)->orderBy('id')->first();
if (! $sucursal) {
    echo "No existe sucursal para empresa {$empresa->id}.\n";
    exit(1);
}

$u = User::query()->firstOrNew(['email' => $email]);
$u->name = $u->name ?: 'Wailand Key';
$u->password = Hash::make($password);
$u->empresa_id = $empresa->id;
$u->sucursal_id = $sucursal->id;
$u->email_verified_at = $u->email_verified_at ?: now();
$u->save();

Role::firstOrCreate(['name' => 'SuperAdmin']);
$u->syncRoles(['SuperAdmin']);

// Marcarte como admin de la empresa central si quieres
$empresa->admin_user_id = $u->id;
$empresa->save();

echo "OK: creado/actualizado {$email} como SuperAdmin. empresa_id={$empresa->id}, sucursal_id={$sucursal->id}\n";

