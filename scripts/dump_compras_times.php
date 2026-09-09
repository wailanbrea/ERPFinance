<?php

use App\Models\Compra;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$rows = Compra::query()
    ->orderBy('id')
    ->get(['id', 'fecha', 'almacen_id', 'total', 'created_at'])
    ->map(fn ($c) => [
        'id' => $c->id,
        'fecha' => (string) $c->fecha,
        'almacen_id' => $c->almacen_id,
        'total' => (float) $c->total,
        'created_at' => (string) $c->created_at,
    ])
    ->all();

echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";

