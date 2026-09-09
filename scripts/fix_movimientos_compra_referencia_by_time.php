<?php

// Corrige referencia_id de movimientos de compras usando created_at exacto.
// Si un movimiento de compra fue creado en el mismo timestamp que la compra,
// entonces referencia_id debe ser compras.id.

use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$updated = DB::transaction(function () {
    $sql = "
        UPDATE movimientos_inventario mi
        INNER JOIN compras c
            ON c.almacen_id = mi.almacen_id
            AND c.created_at = mi.created_at
        SET mi.referencia_id = c.id
        WHERE mi.referencia_tipo = 'compra'
            AND mi.tipo = 'entrada'
    ";
    return DB::update($sql);
});

echo "OK: updated={$updated}\n";

