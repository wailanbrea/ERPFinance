<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$ruta = \App\Models\RutaCobro::query()
    ->where('nombre', 'Ruta Cobro HOY - Demo (5 clientes)')
    ->latest('id')
    ->first();

if (! $ruta) {
    echo "No existe la ruta demo.\n";
    exit(1);
}

$total = \App\Models\ClienteRuta::query()->where('ruta_cobro_id', $ruta->id)->count();

$conCoords = \App\Models\ClienteRuta::query()
    ->join('direcciones_clientes as dc', function ($j) {
        $j->on('dc.cliente_id', '=', 'clientes_rutas.cliente_id')
            ->where('dc.principal', '=', 1);
    })
    ->where('clientes_rutas.ruta_cobro_id', $ruta->id)
    ->whereNotNull('dc.lat')
    ->whereNotNull('dc.lng')
    ->count();

echo "Ruta #{$ruta->id} total paradas: {$total}\n";
echo "Paradas con lat/lng: {$conCoords}\n";

