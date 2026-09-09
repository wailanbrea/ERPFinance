<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$sucursalId = \App\Models\Sucursal::where('codigo', 'CENTRAL')->value('id');
$almacenId = \App\Models\Almacen::where('sucursal_id', $sucursalId)->where('nombre', 'Principal')->value('id');

$count = \App\Models\StockProducto::where('almacen_id', $almacenId)->where('stock', '<=', 0)->count();
echo $count . "\n";

