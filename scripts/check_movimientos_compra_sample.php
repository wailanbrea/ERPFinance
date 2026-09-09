<?php

use App\Models\MovimientoInventario;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$rows = MovimientoInventario::query()
    ->where('referencia_tipo', 'compra')
    ->orderByDesc('id')
    ->limit(20)
    ->get(['id', 'sucursal_id', 'almacen_id', 'producto_id', 'tipo', 'cantidad', 'saldo', 'referencia_tipo', 'referencia_id', 'created_at'])
    ->map(fn ($m) => [
        'id' => $m->id,
        'almacen_id' => $m->almacen_id,
        'producto_id' => $m->producto_id,
        'tipo' => $m->tipo,
        'cantidad' => (float) $m->cantidad,
        'saldo' => (float) $m->saldo,
        'referencia_id' => $m->referencia_id,
        'created_at' => (string) $m->created_at,
    ])
    ->all();

echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";

