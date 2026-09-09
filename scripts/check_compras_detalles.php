<?php

use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\MovimientoInventario;
use App\Models\StockProducto;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$compras = Compra::query()->orderByDesc('id')->limit(20)->get(['id', 'sucursal_id', 'almacen_id', 'fecha', 'total', 'estado']);
$out = [];

foreach ($compras as $c) {
    $detCount = DetalleCompra::query()->where('compra_id', $c->id)->count();
    $movCount = MovimientoInventario::query()
        ->where('referencia_tipo', 'compra')
        ->where('referencia_id', $c->id)
        ->count();

    $out[] = [
        'compra_id' => $c->id,
        'fecha' => (string) $c->fecha,
        'almacen_id' => $c->almacen_id,
        'total' => (float) $c->total,
        'detalles' => $detCount,
        'movimientos' => $movCount,
    ];
}

$neg = StockProducto::query()->where('stock', '<', 0)->count();

echo json_encode([
    'compras_ultimas' => $out,
    'compras_sin_detalles' => Compra::query()->doesntHave('detalles')->count(),
    'compras_con_detalles' => Compra::query()->has('detalles')->count(),
    'movimientos_compra_total' => MovimientoInventario::query()->where('referencia_tipo', 'compra')->count(),
    'stock_rows_total' => StockProducto::query()->count(),
    'stock_negativos' => $neg,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";

