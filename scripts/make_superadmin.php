<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Spatie\Permission\Models\Role;

$email = $argv[1] ?? 'admin@erp-bsolutions.local';

$u = User::query()->where('email', $email)->first();
if (! $u) {
    echo "No existe usuario {$email}\n";
    exit(1);
}

Role::firstOrCreate(['name' => 'SuperAdmin']);
$u->assignRole('SuperAdmin');

echo "OK: {$email} ahora es SuperAdmin\n";

