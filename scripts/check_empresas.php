<?php

use App\Models\Empresa;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$rows = Empresa::query()
    ->with(['adminUser:id,email,name'])
    ->orderBy('id')
    ->get()
    ->map(fn (Empresa $e) => [
        'id' => $e->id,
        'slug' => $e->slug,
        'nombre' => $e->nombre,
        'plan' => $e->plan,
        'licencia_activa' => (bool) $e->licencia_activa,
        'admin' => $e->adminUser?->email,
    ])
    ->all();

echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";

