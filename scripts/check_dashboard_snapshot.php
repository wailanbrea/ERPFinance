<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Caja;
use App\Models\CuotaFinanciamiento;
use App\Models\Financiamiento;
use App\Models\Garantia;
use App\Models\Gasto;
use App\Models\Pago;
use App\Models\ServicioTecnico;
use App\Models\StockProducto;
use App\Models\Venta;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

$user = \App\Models\User::query()->where('email', 'admin@erp-bsolutions.local')->first();
if (! $user) {
    echo "No existe admin@erp-bsolutions.local\n";
    exit(0);
}

$ref = Carbon::parse('2026-04-27')->startOfDay();
$hoy = $ref->toDateString();
$ayer = $ref->copy()->subDay()->toDateString();
$corteMora60 = $ref->copy()->subDays(60)->toDateString();
$inicioSemana = $ref->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
$finSemana = $ref->toDateString();
$inicioMes = $ref->copy()->startOfMonth()->toDateString();
$finMes = $ref->toDateString();

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

$ganancias = function (string $from, string $to) use ($sumVentas, $sumCostoVentas, $sumGastos): array {
    $ventas = $sumVentas($from, $to);
    $costo = $sumCostoVentas($from, $to);
    $gastos = $sumGastos($from, $to);
    return [
        'ventas' => round($ventas, 2),
        'costo_ventas' => round($costo, 2),
        'gastos' => round($gastos, 2),
        'ganancia' => round($ventas - $costo - $gastos, 2),
    ];
};

$ventasDia = (float) Venta::query()
    ->where('sucursal_id', $user->sucursal_id)
    ->where('estado', '!=', 'anulada')
    ->where('fecha', $hoy)
    ->sum('total');

$ventasAyer = (float) Venta::query()
    ->where('sucursal_id', $user->sucursal_id)
    ->where('estado', '!=', 'anulada')
    ->where('fecha', $ayer)
    ->sum('total');

$cobrosDia = (float) Pago::query()
    ->where('sucursal_id', $user->sucursal_id)
    ->where('fecha', $hoy)
    ->sum('monto');

$cobrosAyer = (float) Pago::query()
    ->where('sucursal_id', $user->sucursal_id)
    ->where('fecha', $ayer)
    ->sum('monto');

$cuotasVencidas = (int) CuotaFinanciamiento::query()
    ->join('financiamientos', 'financiamientos.id', '=', 'cuotas_financiamiento.financiamiento_id')
    ->where('financiamientos.sucursal_id', $user->sucursal_id)
    ->where('cuotas_financiamiento.vencimiento', '<', $hoy)
    ->where('cuotas_financiamiento.estado', '!=', 'pagada')
    ->count();

$moraAltaClientes = (int) CuotaFinanciamiento::query()
    ->join('financiamientos', 'financiamientos.id', '=', 'cuotas_financiamiento.financiamiento_id')
    ->where('financiamientos.sucursal_id', $user->sucursal_id)
    ->where('cuotas_financiamiento.estado', '!=', 'pagada')
    ->where('cuotas_financiamiento.vencimiento', '<', $corteMora60)
    ->distinct('financiamientos.cliente_id')
    ->count('financiamientos.cliente_id');

$porCobrar = (float) Financiamiento::query()
    ->where('sucursal_id', $user->sucursal_id)
    ->whereNotIn('estado', ['cancelado'])
    ->sum('balance');

$stockCritico = (int) StockProducto::query()
    ->join('almacenes', 'almacenes.id', '=', 'stock_productos.almacen_id')
    ->where('almacenes.sucursal_id', $user->sucursal_id)
    ->whereColumn('stock_productos.stock', '<=', 'stock_productos.stock_minimo')
    ->where('stock_productos.stock', '>', 0)
    ->count();

$productosAgotados = (int) StockProducto::query()
    ->join('almacenes', 'almacenes.id', '=', 'stock_productos.almacen_id')
    ->where('almacenes.sucursal_id', $user->sucursal_id)
    ->where('stock_productos.stock', '<=', 0)
    ->distinct('stock_productos.producto_id')
    ->count('stock_productos.producto_id');

$garantiasEnRevision = (int) Garantia::query()
    ->where('sucursal_id', $user->sucursal_id)
    ->whereIn('estado', ['abierta', 'en_proceso'])
    ->count();

$stPendientes = (int) ServicioTecnico::query()
    ->where('sucursal_id', $user->sucursal_id)
    ->whereNotIn('estado', ['entregado', 'cerrado'])
    ->count();

$cajaAbierta = Caja::query()
    ->where('sucursal_id', $user->sucursal_id)
    ->where('estado', 'abierta')
    ->orderByDesc('id')
    ->first();

$ventasPorCategoria = DB::table('detalle_ventas as dv')
    ->join('ventas as v', 'v.id', '=', 'dv.venta_id')
    ->join('productos as p', 'p.id', '=', 'dv.producto_id')
    ->leftJoin('categorias as c', 'c.id', '=', 'p.categoria_id')
    ->where('v.sucursal_id', $user->sucursal_id)
    ->where('v.estado', '!=', 'anulada')
    ->whereBetween('v.fecha', [$inicioSemana, $finSemana])
    ->selectRaw("COALESCE(c.nombre, 'Sin categoría') as categoria, COALESCE(SUM(dv.subtotal), 0) as total")
    ->groupBy('categoria')
    ->orderByDesc('total')
    ->limit(8)
    ->get()
    ->map(fn ($r) => ['categoria' => (string) $r->categoria, 'total' => round((float) $r->total, 2)])
    ->values();

echo "Dashboard snapshot fecha={$hoy} sucursal={$user->sucursal_id}\n\n";
echo "GANANCIAS DIA: "; print_r($ganancias($hoy, $hoy));
echo "GANANCIAS SEMANA (acum): "; print_r($ganancias($inicioSemana, $finSemana));
echo "GANANCIAS MES (acum): "; print_r($ganancias($inicioMes, $finMes));
echo "\n";

echo "KPIs:\n";
echo "  ventas_dia={$ventasDia}\n";
echo "  ventas_ayer={$ventasAyer}\n";
echo "  cobros_dia={$cobrosDia}\n";
echo "  cobros_ayer={$cobrosAyer}\n";
echo "  cuotas_vencidas={$cuotasVencidas}\n";
echo "  mora_alta_clientes={$moraAltaClientes}\n";
echo "  por_cobrar={$porCobrar}\n";
echo "  stock_critico={$stockCritico}\n";
echo "  productos_agotados={$productosAgotados}\n";
echo "  garantias_en_revision={$garantiasEnRevision}\n";
echo "  servicio_tecnico_pendientes={$stPendientes}\n";
echo "  caja_abierta=".(($cajaAbierta ? 1 : 0))."\n\n";

echo "VENTAS POR CATEGORIA (top 8, semana acum):\n";
foreach ($ventasPorCategoria as $r) {
    echo "  - {$r['categoria']}: {$r['total']}\n";
}

