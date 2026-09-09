<?php

use App\Models\StockProducto;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$n = StockProducto::query()->where('stock', '<', 0)->count();
echo "negativos={$n}\n";

