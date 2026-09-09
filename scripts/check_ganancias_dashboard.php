<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Gasto;
use App\Models\Venta;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

$user = \App\Models\User::query()->where('email', 'admin@erp-bsolutions.local')->first();
if (! $user) {
    echo "No existe admin@erp-bsolutions.local\n";
    exit(0);
}

$ref = now()->startOfDay();
$hoy = $ref->toDateString();
$inicioSemana = $ref->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
$finSemana = $hoy;
$inicioMes = $ref->copy()->startOfMonth()->toDateString();
$finMes = $hoy;

$sumVentas = function (string $from, string $to) use ($user): float {
    return (float) Venta::query()
        ->where('sucursal_id', $user->sucursal_id)
        ->where('estado', '!=', 'anulada')
        ->whereBetween('fecha', [$from, $to])
        ->sum('total');
};

$sumCostoVentas = function (string $from, string $to) use ($user): float {
    return (float) DB::table('detalle_ventas as dv')
        ->join('ventas as v', 'v.id', '=', 'dv.venta_id')
        ->join('productos as p', 'p.id', '=', 'dv.producto_id')
        ->where('v.sucursal_id', $user->sucursal_id)
        ->where('v.estado', '!=', 'anulada')
        ->whereBetween('v.fecha', [$from, $to])
        ->selectRaw('COALESCE(SUM(dv.cantidad * COALESCE(p.costo, 0)), 0) as total')
        ->value('total') ?? 0.0;
};

$sumGastos = function (string $from, string $to) use ($user): float {
    return (float) Gasto::query()
        ->where('sucursal_id', $user->sucursal_id)
        ->where('estado', '!=', 'anulado')
        ->whereBetween('fecha', [$from, $to])
        ->sum('monto');
};

$calc = function (string $from, string $to) use ($sumVentas, $sumCostoVentas, $sumGastos): array {
    $ventas = $sumVentas($from, $to);
    $costo = $sumCostoVentas($from, $to);
    $gastos = $sumGastos($from, $to);
    return [
        'ventas' => round($ventas, 2),
        'costo' => round($costo, 2),
        'gastos' => round($gastos, 2),
        'ganancia' => round($ventas - $costo - $gastos, 2),
    ];
};

echo "Sucursal: {$user->sucursal_id}\n";
echo "Hoy: {$hoy}\n";
echo "Semana (acum): {$inicioSemana} -> {$finSemana}\n";
echo "Mes (acum): {$inicioMes} -> {$finMes}\n\n";

foreach ([
    'dia' => [$hoy, $hoy],
    'semana' => [$inicioSemana, $finSemana],
    'mes' => [$inicioMes, $finMes],
    'mes_completo' => [$inicioMes, $ref->copy()->endOfMonth()->toDateString()],
] as $k => [$from, $to]) {
    $r = $calc($from, $to);
    echo strtoupper($k).": from={$from} to={$to}\n";
    echo "  ventas={$r['ventas']} costo={$r['costo']} gastos={$r['gastos']} ganancia={$r['ganancia']}\n";
}

