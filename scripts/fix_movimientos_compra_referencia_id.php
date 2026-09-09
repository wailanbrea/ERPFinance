<?php

// Corrige movimientos de inventario de compras que quedaron con referencia_id = subtotal (u otro valor)
// y los actualiza para que referencia_id = compras.id.
//
// Heurística:
// - movimientos_inventario.referencia_tipo = 'compra'
// - movimientos_inventario.tipo = 'entrada'
// - movimientos_inventario.referencia_id = detalle_compras.costo_unitario (valor viejo)
// - producto_id y almacen_id coinciden
// - actualiza referencia_id a compras.id

use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$updated = DB::transaction(function () {
    // Solo actualizar filas donde el referencia_id no corresponde a un compra_id existente.
    // (evita tocar movimientos ya correctos).
    $sql = "
        UPDATE movimientos_inventario mi
        INNER JOIN detalle_compras dc
            ON dc.producto_id = mi.producto_id
            AND dc.cantidad = mi.cantidad
            AND dc.costo_unitario = mi.referencia_id
        INNER JOIN compras c
            ON c.id = dc.compra_id
            AND c.almacen_id = mi.almacen_id
        LEFT JOIN compras cx
            ON cx.id = mi.referencia_id
        SET mi.referencia_id = c.id
        WHERE mi.referencia_tipo = 'compra'
            AND mi.tipo = 'entrada'
            AND cx.id IS NULL
    ";

    return DB::update($sql);
});

echo "OK: updated={$updated}\n";

