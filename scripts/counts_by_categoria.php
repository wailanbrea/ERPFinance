<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cats = \App\Models\Categoria::query()->orderBy('nombre')->get(['id', 'nombre', 'activa']);
foreach ($cats as $c) {
    $count = \App\Models\Producto::query()->where('categoria_id', $c->id)->count();
    echo "{$c->id}\t{$c->nombre}\tactiva=" . (int) $c->activa . "\tproductos={$count}\n";
}

