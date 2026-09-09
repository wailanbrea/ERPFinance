<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\CuotaFinanciamiento;
use App\Models\Financiamiento;
use App\Models\Gasto;
use App\Models\Garantia;
use App\Models\Pago;
use App\Models\ServicioTecnico;
use App\Models\StockProducto;
use App\Models\Venta;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        $empresaId = $user->resolvedEmpresaId();

        Carbon::setLocale('es');

        $ref = now()->copy()->startOfDay();
        $fechaQuery = $request->query('fecha');
        if (is_string($fechaQuery) && $fechaQuery !== '') {
            try {
                $parsed = Carbon::parse($fechaQuery)->startOfDay();
                if (! $parsed->isFuture()) {
                    $ref = $parsed;
                }
            } catch (\Throwable) {
                // mantener hoy
            }
        }

        $hoy = $ref->toDateString();
        $ayer = $ref->copy()->subDay()->toDateString();
        $corteMora60 = $ref->copy()->subDays(60)->toDateString();
        $inicioSemana = $ref->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
        // Importante: para evitar "semanas" que incluyan días futuros (o que crucen de mes),
        // calculamos Semana y Mes como acumulado hasta la fecha consultada.
        $finSemana = $ref->toDateString();
        $inicioMes = $ref->copy()->startOfMonth()->toDateString();
        $finMes = $ref->toDateString();
        $esFechaHoy = $ref->isSameDay(now());

        // Rango personalizado (para ganancias): desde/hasta
        $desde = $request->query('desde');
        $hasta = $request->query('hasta');
        $rangeDesde = $hoy;
        $rangeHasta = $hoy;
        if (is_string($desde) && $desde !== '' && is_string($hasta) && $hasta !== '') {
            try {
                $d = Carbon::parse($desde)->startOfDay();
                $h = Carbon::parse($hasta)->startOfDay();
                if ($d->isFuture()) {
                    $d = now()->startOfDay();
                }
                if ($h->isFuture()) {
                    $h = now()->startOfDay();
                }
                if ($d->gt($h)) {
                    [$d, $h] = [$h, $d];
                }
                $rangeDesde = $d->toDateString();
                $rangeHasta = $h->toDateString();
            } catch (\Throwable) {
                // usar hoy
            }
        }

        $sumVentas = function (string $from, string $to) use ($user): float {
            return (float) Venta::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->where('estado', '!=', 'anulada')
                ->whereBetween('fecha', [$from, $to])
                ->sum('total');
        };

        $sumCostoVentas = function (string $from, string $to) use ($user): float {
            // costo aproximado: cantidad * productos.costo
            // (si un producto no tiene costo, se toma 0 para evitar fallos)
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

        $gananciasPeriodo = function (string $from, string $to) use ($sumVentas, $sumCostoVentas, $sumGastos): array {
            $ventas = $sumVentas($from, $to);
            $costo = $sumCostoVentas($from, $to);
            $gastos = $sumGastos($from, $to);
            $ganancia = $ventas - $costo - $gastos;

            return [
                'ventas' => round($ventas, 2),
                'costo_ventas' => round($costo, 2),
                'gastos' => round($gastos, 2),
                'ganancia' => round($ganancia, 2),
            ];
        };

        $ventasDia = (float) Venta::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->where('fecha', $hoy)
            ->sum('total');

        $ventasAyer = (float) Venta::query()
            ->where('sucursal_id', $user->sucursal_id)
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

        $morosos = (int) CuotaFinanciamiento::query()
            ->join('financiamientos', 'financiamientos.id', '=', 'cuotas_financiamiento.financiamiento_id')
            ->where('financiamientos.sucursal_id', $user->sucursal_id)
            ->where('cuotas_financiamiento.vencimiento', '<', $hoy)
            ->where('cuotas_financiamiento.estado', '!=', 'pagada')
            ->distinct('financiamientos.cliente_id')
            ->count('financiamientos.cliente_id');

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
            ->join('productos', 'productos.id', '=', 'stock_productos.producto_id')
            ->where('almacenes.sucursal_id', $user->sucursal_id)
            ->when($empresaId, fn ($q) => $q->where('productos.empresa_id', $empresaId))
            ->whereColumn('stock_productos.stock', '<=', 'stock_productos.stock_minimo')
            ->where('stock_productos.stock', '>', 0)
            ->count();

        $productosAgotados = (int) StockProducto::query()
            ->join('almacenes', 'almacenes.id', '=', 'stock_productos.almacen_id')
            ->join('productos', 'productos.id', '=', 'stock_productos.producto_id')
            ->where('almacenes.sucursal_id', $user->sucursal_id)
            ->when($empresaId, fn ($q) => $q->where('productos.empresa_id', $empresaId))
            ->where('stock_productos.stock', '<=', 0)
            ->distinct('stock_productos.producto_id')
            ->count('stock_productos.producto_id');

        $productosAgotadosLista = StockProducto::query()
            ->join('almacenes', 'almacenes.id', '=', 'stock_productos.almacen_id')
            ->join('productos', 'productos.id', '=', 'stock_productos.producto_id')
            ->where('almacenes.sucursal_id', $user->sucursal_id)
            ->when($empresaId, fn ($q) => $q->where('productos.empresa_id', $empresaId))
            ->where('stock_productos.stock', '<=', 0)
            ->orderBy('productos.nombre')
            ->limit(4)
            ->get(['productos.nombre', 'productos.modelo', 'almacenes.nombre as almacen'])
            ->map(fn ($r) => [
                'nombre' => $r->nombre,
                'modelo' => $r->modelo,
                'almacen' => $r->almacen,
            ])
            ->values();

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

        $ventasSemana = Venta::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->where('estado', '!=', 'anulada')
            ->whereBetween('fecha', [$inicioSemana, $finSemana])
            ->selectRaw('DATE(fecha) as dia, SUM(total) as total')
            ->groupBy('dia')
            ->orderBy('dia')
            ->pluck('total', 'dia');

        $serieSemanal = [];
        $cursor = Carbon::parse($inicioSemana);
        // Para el gráfico semanal, mostramos la semana completa (lun-dom),
        // pero los totales se calculan solo hasta $finSemana (fecha consultada).
        $end = $ref->copy()->endOfWeek(Carbon::SUNDAY);
        while ($cursor->lte($end)) {
            $k = $cursor->toDateString();
            $serieSemanal[] = [
                'fecha' => $k,
                'label' => $cursor->translatedFormat('D'),
                'total' => round((float) ($ventasSemana[$k] ?? 0), 2),
            ];
            $cursor->addDay();
        }

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
            ->map(fn ($r) => [
                'categoria' => (string) $r->categoria,
                'total' => round((float) $r->total, 2),
            ])
            ->values();

        $ultimosFinanciamientos = Financiamiento::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->withExists([
                'planCuotas as tiene_cuota_vencida' => function ($q) use ($hoy) {
                    $q->where('cuotas_financiamiento.vencimiento', '<', $hoy)
                        ->where('cuotas_financiamiento.estado', '!=', 'pagada');
                },
            ])
            ->with(['cliente:id,nombre,apellido', 'venta.detalles.producto:id,nombre,modelo'])
            ->orderByDesc('id')
            ->limit(8)
            ->get()
            ->map(function (Financiamiento $f) {
                $det = $f->venta?->detalles?->first();
                $prod = $det?->producto;

                $estadoDb = (string) $f->estado;
                $enMora = (bool) ($f->tiene_cuota_vencida ?? false);

                $uiEstado = match (true) {
                    $estadoDb === 'cancelado' => 'cancelado',
                    $enMora => 'en_mora',
                    $estadoDb === 'pendiente' => 'nuevo',
                    default => 'al_dia',
                };

                return [
                    'id' => $f->id,
                    'cliente' => $f->cliente ? trim("{$f->cliente->nombre} {$f->cliente->apellido}") : '—',
                    'producto' => $prod ? trim("{$prod->nombre}".($prod->modelo ? " ({$prod->modelo})" : '')) : '—',
                    'monto' => (float) $f->monto,
                    'plan' => strtoupper((string) $f->frecuencia).' · '.(int) $f->cuotas.' cuotas',
                    'estado' => $estadoDb,
                    'ui_estado' => $uiEstado,
                ];
            });

        $pctCambio = function (float $hoyVal, float $ayerVal): ?float {
            if ($ayerVal <= 0) {
                return null;
            }

            return round((($hoyVal - $ayerVal) / $ayerVal) * 100, 1);
        };

        return Inertia::render('Dashboard', [
            'fecha_iso' => $hoy,
            'fecha_label' => $ref->translatedFormat('l, d \\d\\e F Y'),
            'es_fecha_hoy' => $esFechaHoy,
            'filtro_ganancias' => [
                'desde' => $rangeDesde,
                'hasta' => $rangeHasta,
            ],
            'ganancias' => [
                'dia' => $gananciasPeriodo($hoy, $hoy),
                'semana' => $gananciasPeriodo($inicioSemana, $finSemana),
                'mes' => $gananciasPeriodo($inicioMes, $finMes),
                'rango' => $gananciasPeriodo($rangeDesde, $rangeHasta),
            ],
            'kpis' => [
                'ventas_dia' => round($ventasDia, 2),
                'ventas_ayer' => round($ventasAyer, 2),
                'ventas_pct_vs_ayer' => $pctCambio($ventasDia, $ventasAyer),
                'cobros_dia' => round($cobrosDia, 2),
                'cobros_ayer' => round($cobrosAyer, 2),
                'cobros_pct_vs_ayer' => $pctCambio($cobrosDia, $cobrosAyer),
                'cuotas_vencidas' => $cuotasVencidas,
                'morosos' => $morosos,
                'mora_alta_clientes' => $moraAltaClientes,
                'por_cobrar' => round($porCobrar, 2),
                'stock_critico' => $stockCritico,
                'productos_agotados' => $productosAgotados,
                'garantias_en_revision' => $garantiasEnRevision,
                'servicio_tecnico_pendientes' => $stPendientes,
                'caja_abierta' => $cajaAbierta ? true : false,
            ],
            'serie_semanal' => $serieSemanal,
            'ventas_por_categoria' => $ventasPorCategoria,
            'productos_agotados_lista' => $productosAgotadosLista,
            'ultimos_financiamientos' => $ultimosFinanciamientos,
        ]);
    }
}

