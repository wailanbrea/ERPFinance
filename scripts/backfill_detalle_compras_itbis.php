<?php

// Rellena ITBIS en detalle_compras existentes (anteriores a la migración).
// - itbis_aplica = true (si viene null)
// - itbis_tasa = 18 (si viene null/0)
// - costo_unitario_con_itbis = costo_unitario * (1 + tasa/100) cuando aplica
// También recalcula subtotal y el total de la compra.

use App\Models\Compra;
use App\Models\DetalleCompra;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tasaDefault = 18.0;
$updatedDetalles = 0;
$updatedCompras = 0;

DB::transaction(function () use ($tasaDefault, &$updatedDetalles, &$updatedCompras) {
    $detalles = DetalleCompra::query()
        ->orderBy('id')
        ->get();

    foreach ($detalles as $d) {
        $aplica = $d->itbis_aplica;
        if ($aplica === null) {
            $aplica = true;
        } else {
            $aplica = (bool) $aplica;
        }

        $tasa = $d->itbis_tasa;
        $tasaNum = ($tasa === null || (float) $tasa <= 0) ? $tasaDefault : (float) $tasa;

        $costoUnit = (float) ($d->costo_unitario ?? 0);
        $con = $aplica ? round($costoUnit * (1.0 + ($tasaNum / 100.0)), 2) : round($costoUnit, 2);

        $actualCon = (float) ($d->costo_unitario_con_itbis ?? 0);
        $needs = ($actualCon <= 0.0) || ((float) $d->subtotal !== round(((float) $d->cantidad) * $con, 2));

        if ($needs) {
            $d->itbis_aplica = $aplica;
            $d->itbis_tasa = $tasaNum;
            $d->costo_unitario_con_itbis = $con;
            $d->subtotal = round(((float) $d->cantidad) * $con, 2);
            $d->save();
            $updatedDetalles++;
        }
    }

    // Recalcular totales de compras.
    $compras = Compra::query()->orderBy('id')->get();
    foreach ($compras as $c) {
        $sum = (float) DetalleCompra::query()->where('compra_id', $c->id)->sum('subtotal');
        if (round((float) $c->total, 2) !== round($sum, 2)) {
            $c->total = round($sum, 2);
            $c->save();
            $updatedCompras++;
        }
    }
});

echo "OK: detalles_actualizados={$updatedDetalles}, compras_totales_actualizados={$updatedCompras}\n";

