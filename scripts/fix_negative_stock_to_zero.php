<?php

// Corrige stocks negativos: deja stock en 0 y registra un movimiento tipo "ajuste"
// para que el kardex quede coherente (saldo nunca negativo).

use App\Models\Almacen;
use App\Models\MovimientoInventario;
use App\Models\StockProducto;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$sucursalId = (int) ($_GET['sucursal_id'] ?? 0);
if (! $sucursalId) {
    // Intentar inferir sucursal desde el primer almacén activo
    $sucursalId = (int) (Almacen::query()->orderBy('id')->value('sucursal_id') ?? 0);
}

if (! $sucursalId) {
    fwrite(STDERR, "ERROR: no se pudo determinar sucursal_id.\n");
    exit(1);
}

$stocks = StockProducto::query()
    ->where('stock', '<', 0)
    ->orderBy('id')
    ->get();

$fixed = 0;
$skipped = 0;

foreach ($stocks as $sp) {
    $neg = (float) $sp->stock;
    if ($neg >= 0) {
        $skipped++;
        continue;
    }

    DB::transaction(function () use ($sp, $sucursalId, $neg, &$fixed) {
        $spLocked = StockProducto::query()
            ->where('id', $sp->id)
            ->lockForUpdate()
            ->first();

        if (! $spLocked) {
            return;
        }

        $negNow = (float) $spLocked->stock;
        if ($negNow >= 0) {
            return;
        }

        $cantidad = abs($negNow);
        $spLocked->stock = 0;
        $spLocked->save();

        MovimientoInventario::create([
            'sucursal_id' => $sucursalId,
            'almacen_id' => (int) $spLocked->almacen_id,
            'producto_id' => (int) $spLocked->producto_id,
            'tipo' => 'ajuste',
            'cantidad' => $cantidad,
            'saldo' => 0,
            'referencia_tipo' => 'ajuste',
            'referencia_id' => null,
            'nota' => 'Ajuste automático: corrección de stock negativo a 0.',
        ]);

        $fixed++;
    });
}

echo "OK: fixed={$fixed}, skipped={$skipped}\n";

