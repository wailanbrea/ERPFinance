<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

$empresa = Empresa::query()->first();
if (!$empresa) {
    echo "ERROR: No hay empresa creada.\n";
    exit(1);
}

$sucursal = Sucursal::query()->where('empresa_id', $empresa->id)->first() ?: Sucursal::query()->first();
if (!$sucursal) {
    echo "ERROR: No hay sucursal creada.\n";
    exit(1);
}

// 1. Roles necesarios
Role::firstOrCreate(['name' => 'SuperAdmin']);
Role::firstOrCreate(['name' => 'Administrador']);
Role::firstOrCreate(['name' => 'Plan Full']);
Role::firstOrCreate(['name' => 'Plan Basico']);
Role::firstOrCreate(['name' => 'Vendedor']);
Role::firstOrCreate(['name' => 'Cobrador']);
Role::firstOrCreate(['name' => 'Técnico']);

// 2. Crear / actualizar usuario OWNER: wailandkey@gmail.com
$owner = User::query()->firstOrNew(['email' => 'wailandkey@gmail.com']);
$owner->name = 'Wailand Key (Owner)';
$owner->password = Hash::make('Driffgraff09');
$owner->empresa_id = $empresa->id;
$owner->sucursal_id = $sucursal->id;
$owner->email_verified_at = now();
$owner->save();
$owner->syncRoles(['SuperAdmin', 'Administrador']);
$empresa->admin_user_id = $owner->id;
$empresa->save();
echo "✓ Owner creado/actualizado: wailandkey@gmail.com [SuperAdmin, Administrador]\n";

// 3. Crear / actualizar usuario REYNEL: reynel@bsolutions.dev con Plan Full
$reynel = User::query()->firstOrNew(['email' => 'reynel@bsolutions.dev']);
$reynel->name = 'Reynel';
$reynel->password = Hash::make('reynel1234');
$reynel->empresa_id = $empresa->id;
$reynel->sucursal_id = $sucursal->id;
$reynel->email_verified_at = now();
$reynel->save();
$reynel->syncRoles(['Plan Full']);
echo "✓ Usuario creado/actualizado: reynel@bsolutions.dev [Plan Full]\n";

// 4. Actualizar correos existentes a dominio @bsolutions.dev
$correosMap = [
    'admin@erp-bsolutions.local' => 'admin@bsolutions.dev',
    'vendedor@erp-bsolutions.local' => 'vendedor@bsolutions.dev',
    'cobrador@erp-bsolutions.local' => 'cobrador@bsolutions.dev',
    'tecnico@erp-bsolutions.local' => 'tecnico@bsolutions.dev',
];

foreach ($correosMap as $oldEmail => $newEmail) {
    $existing = User::query()->where('email', $oldEmail)->first();
    if ($existing) {
        $existing->email = $newEmail;
        $existing->save();
        echo "✓ Correo actualizado: {$oldEmail} -> {$newEmail}\n";
    }
}

// 5. Asegurar usuario admin@bsolutions.dev (Administrador y Demo)
$admin = User::query()->firstOrNew(['email' => 'admin@bsolutions.dev']);
if (!$admin->exists) {
    $admin->name = 'Administrador Bsolutions';
    $admin->password = Hash::make('admin1234');
    $admin->empresa_id = $empresa->id;
    $admin->sucursal_id = $sucursal->id;
}
$admin->email_verified_at = now();
$admin->save();
$admin->syncRoles(['Administrador', 'Plan Full']);
echo "✓ Usuario Administrador / Demo configurado: admin@bsolutions.dev [Administrador, Plan Full]\n";

// 6. Asegurar usuario demo@bsolutions.dev
$demo = User::query()->firstOrNew(['email' => 'demo@bsolutions.dev']);
if (!$demo->exists) {
    $demo->name = 'Usuario Demo';
    $demo->password = Hash::make('password');
    $demo->empresa_id = $empresa->id;
    $demo->sucursal_id = $sucursal->id;
    $demo->email_verified_at = now();
    $demo->save();
    $demo->syncRoles(['Plan Full']);
    echo "✓ Usuario demo creado: demo@bsolutions.dev [Plan Full]\n";
} else {
    $demo->syncRoles(['Plan Full']);
    echo "✓ Usuario demo ya existe: demo@bsolutions.dev [Plan Full]\n";
}

// 7. Sincronizar configuración de demo en .env si es necesario
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    $envContent = file_get_contents($envPath);
    $newContent = $envContent;

    if (preg_match('/^DEMO_USER_EMAIL=.*/m', $newContent)) {
        $newContent = preg_replace('/^DEMO_USER_EMAIL=.*/m', 'DEMO_USER_EMAIL=admin@bsolutions.dev', $newContent);
    } else {
        $newContent .= "\nDEMO_USER_EMAIL=admin@bsolutions.dev";
    }

    if (preg_match('/^DEMO_USER_EMAILS=.*/m', $newContent)) {
        $newContent = preg_replace('/^DEMO_USER_EMAILS=.*/m', 'DEMO_USER_EMAILS=admin@bsolutions.dev,demo@bsolutions.dev', $newContent);
    } else {
        $newContent .= "\nDEMO_USER_EMAILS=admin@bsolutions.dev,demo@bsolutions.dev";
    }

    if ($newContent !== $envContent) {
        file_put_contents($envPath, $newContent);
        echo "✓ Archivo .env sincronizado con DEMO_USER_EMAIL=admin@bsolutions.dev\n";
    }
}

echo "\n--- Resumen de usuarios activos en la base de datos ---\n";
foreach (User::with('roles')->get() as $u) {
    echo "  • {$u->name} ({$u->email}) - Roles: " . $u->roles->pluck('name')->join(', ') . "\n";
}
