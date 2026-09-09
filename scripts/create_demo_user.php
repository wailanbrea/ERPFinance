<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = getenv('DEMO_USER_EMAIL') ?: 'demo@bsolutions.local';
$password = getenv('DEMO_USER_PASSWORD') ?: 'demo1234';
$name = getenv('DEMO_USER_NAME') ?: 'Demo ERP Bsolutions Finanzas';
$role = getenv('DEMO_USER_ROLE') ?: 'Plan Full';

$sid = \App\Models\Sucursal::where('codigo', 'CENTRAL')->value('id');

$u = \App\Models\User::query()->firstOrCreate(
    ['email' => $email],
    [
        'name' => $name,
        'password' => bcrypt($password),
        'sucursal_id' => $sid,
        'email_verified_at' => now(),
    ]
);

\Spatie\Permission\Models\Role::firstOrCreate(['name' => $role]);
$u->syncRoles([$role]);

echo "OK: {$u->email}\n";
