<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$make = fn (string $title, string $msg, array $meta = []) => new \App\Notifications\SistemaNotificacion($title, $msg, $meta);

$admin = \App\Models\User::where('email', 'admin@erp-bsolutions.local')->first();
if ($admin) {
    $admin->notify($make('Prueba de notificación', 'Esto es una notificación del sistema.', ['label' => 'Ver notificaciones', 'url' => route('notificaciones.index')]));
}

$demo = \App\Models\User::where('email', 'demo@bsolutions.local')->first();
if ($demo) {
    $demo->notify($make('Bienvenido a la DEMO', 'Puedes navegar, pero no puedes crear/editar datos.', ['label' => 'Ver dashboard', 'url' => route('dashboard')]));
}

echo "OK\n";

