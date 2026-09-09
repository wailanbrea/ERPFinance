<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Financiamiento;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FinanciamientoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $q = $request->string('q')->trim()->toString();

        $fin = Financiamiento::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->with(['venta:id,fecha,total', 'cliente:id,nombre,apellido,telefono'])
            ->withExists([
                'planCuotas as tiene_cuota_vencida' => function ($qCuotas) {
                    $hoy = now()->toDateString();
                    $qCuotas->where('cuotas_financiamiento.vencimiento', '<', $hoy)
                        ->where('cuotas_financiamiento.estado', '!=', 'pagada');
                },
            ])
            ->when($q, function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->whereHas('cliente', function ($c) use ($q) {
                        $c->where('nombre', 'like', '%'.$q.'%')
                            ->orWhere('apellido', 'like', '%'.$q.'%')
                            ->orWhere('telefono', 'like', '%'.$q.'%');
                    });
                    if (ctype_digit($q)) {
                        $w->orWhere('financiamientos.id', (int) $q);
                    }
                });
            })
            ->orderByDesc('id')
            ->paginate(12)
            ->withQueryString();

        $fin->getCollection()->transform(function (Financiamiento $f) {
            $f->setAttribute('resumen_pago', $this->resumenPagoCuotas($f));

            return $f;
        });

        return Inertia::render('Financiamientos/Index', [
            'financiamientos' => $fin,
            'filtros' => ['q' => $q],
        ]);
    }

    public function show(Request $request, Financiamiento $financiamiento)
    {
        $user = $request->user();
        abort_unless($financiamiento->sucursal_id === $user->sucursal_id, 404);

        Carbon::setLocale('es');

        $fin = Financiamiento::query()
            ->whereKey($financiamiento->id)
            ->with([
                'cliente:id,nombre,apellido,telefono',
                'venta:id,fecha,total,numero_factura,modalidad',
                'venta.detalles' => fn ($q) => $q->with([
                    'producto' => fn ($pq) => $pq->select('id', 'nombre', 'modelo', 'sku', 'codigo_barra', 'garantia_meses')
                        ->with(['imagenes' => fn ($iq) => $iq->select('id', 'producto_id', 'path', 'orden')->orderBy('orden')]),
                ]),
                'planCuotas' => fn ($q) => $q->orderBy('numero'),
            ])
            ->firstOrFail();

        $hoy = now()->startOfDay();
        $cuotasPayload = [];
        $vencidasSinPagar = 0;
        $pagadas = 0;

        $nCuotas = $fin->planCuotas->count();
        $capitalFinanciado = max(0, (float) $fin->monto - (float) $fin->inicial);
        $tasaInteres = max(0, (float) $fin->interes);
        $interesTotalContrato = round($capitalFinanciado * ($tasaInteres / 100), 2);
        $capitalPorCuota = $nCuotas > 0 ? round($capitalFinanciado / $nCuotas, 2) : 0;

        foreach ($fin->planCuotas as $c) {
            $venc = Carbon::parse($c->vencimiento)->startOfDay();
            $esPagada = $c->estado === 'pagada';
            if ($esPagada) {
                $pagadas++;
            } elseif ($venc->lt($hoy)) {
                $vencidasSinPagar++;
            }

            if ($esPagada) {
                $situacion = 'pagada';
                $etiquetaPlazo = 'Cuota saldada';
            } elseif ($venc->lt($hoy)) {
                $situacion = 'vencida';
                $etiquetaPlazo = 'Vencida hace '.$venc->diffInDays($hoy).' '.($venc->diffInDays($hoy) === 1 ? 'día' : 'días');
            } elseif ($venc->equalTo($hoy)) {
                $situacion = 'vence_hoy';
                $etiquetaPlazo = 'Vence hoy';
            } else {
                $situacion = 'futura';
                $etiquetaPlazo = 'Vence en '.$hoy->diffInDays($venc).' '.($hoy->diffInDays($venc) === 1 ? 'día' : 'días');
            }

            $parcial = ! $esPagada && (float) $c->pagado > 0.009;

            $montoCuota = round((float) $c->monto, 2);
            $interesCuota = round(max(0, $montoCuota - $capitalPorCuota), 2);
            $capitalCuota = round($montoCuota - $interesCuota, 2);

            $cuotasPayload[] = [
                'id' => $c->id,
                'numero' => (int) $c->numero,
                'vencimiento' => $c->vencimiento,
                'vencimiento_label' => $venc->translatedFormat('D, d \\d\\e F Y'),
                'capital_cuota' => $capitalCuota,
                'interes_cuota' => $interesCuota,
                'monto' => $montoCuota,
                'pagado' => round((float) $c->pagado, 2),
                'mora_registrada' => round((float) $c->mora, 2),
                'estado' => (string) $c->estado,
                'situacion' => $situacion,
                'etiqueta_plazo' => $etiquetaPlazo,
                'pago_parcial' => $parcial,
                'saldo_cuota' => round(max(0, (float) $c->monto - (float) $c->pagado), 2),
            ];
        }

        $estadoContrato = match (true) {
            $fin->estado === 'cancelado' => 'cancelado',
            $fin->estado === 'cerrado' || (float) $fin->balance <= 0.01 => 'liquidado',
            $vencidasSinPagar > 0 => 'en_mora',
            default => 'al_dia',
        };

        $proxima = collect($cuotasPayload)->first(fn ($row) => $row['estado'] !== 'pagada');

        $productosVenta = collect($fin->venta?->detalles ?? [])->map(function ($det) {
            $p = $det->producto;
            if (! $p) {
                return null;
            }
            $img = $p->imagenes->first();

            return [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'modelo' => $p->modelo,
                'sku' => $p->sku,
                'codigo_barra' => $p->codigo_barra,
                'imagen_url' => $img ? asset($img->path) : null,
                'garantia_meses' => (int) $p->garantia_meses,
                'garantia_texto' => $this->textoGarantiaMeses((int) $p->garantia_meses),
                'cantidad' => (int) $det->cantidad,
                'linea_subtotal' => round((float) $det->subtotal, 2),
            ];
        })->filter()->values()->all();

        $firstPv = $productosVenta[0] ?? null;
        $productoLabel = $firstPv
            ? trim($firstPv['nombre'].($firstPv['modelo'] ? ' ('.$firstPv['modelo'].')' : ''))
            : null;

        return Inertia::render('Financiamientos/Show', [
            'fin' => [
                'id' => $fin->id,
                'monto' => round((float) $fin->monto, 2),
                'inicial' => round((float) $fin->inicial, 2),
                'balance' => round((float) $fin->balance, 2),
                'interes' => round((float) $fin->interes, 2),
                'cuotas_total' => (int) $fin->cuotas,
                'frecuencia' => (string) $fin->frecuencia,
                'estado' => (string) $fin->estado,
                'estado_pago' => $estadoContrato,
                'cliente' => $fin->cliente ? [
                    'nombre' => trim($fin->cliente->nombre.' '.$fin->cliente->apellido),
                    'telefono' => $fin->cliente->telefono,
                ] : null,
                'venta' => $fin->venta ? [
                    'id' => $fin->venta->id,
                    'fecha' => $fin->venta->fecha,
                    'total' => round((float) $fin->venta->total, 2),
                    'numero_factura' => $fin->venta->numero_factura,
                ] : null,
                'producto' => $productoLabel,
            ],
            'productos_venta' => $productosVenta,
            'resumen' => [
                'cuotas_pagadas' => $pagadas,
                'cuotas_pendientes' => count($cuotasPayload) - $pagadas,
                'cuotas_vencidas_sin_pagar' => $vencidasSinPagar,
                'proxima_cuota' => $proxima,
                'capital_financiado' => round($capitalFinanciado, 2),
                'interes_total_contrato' => $interesTotalContrato,
                'interes_porcentaje' => round($tasaInteres, 2),
                'suma_interes_cuotas' => round(collect($cuotasPayload)->sum('interes_cuota'), 2),
            ],
            'cuotas' => $cuotasPayload,
            'hoy_iso' => $hoy->toDateString(),
        ]);
    }

    private function resumenPagoCuotas(Financiamiento $f): string
    {
        if ($f->estado === 'cancelado') {
            return 'cancelado';
        }
        if ($f->estado === 'cerrado' || (float) $f->balance <= 0.01) {
            return 'liquidado';
        }
        if ($f->tiene_cuota_vencida ?? false) {
            return 'en_mora';
        }

        return 'al_dia';
    }

    /**
     * Texto legible de garantía comercial según meses en ficha del producto (catálogo).
     */
    private function textoGarantiaMeses(int $meses): string
    {
        if ($meses <= 0) {
            return 'Sin meses de garantía indicados en el producto';
        }
        if ($meses === 12) {
            return '12 meses (1 año) de garantía comercial';
        }
        if ($meses === 24) {
            return '24 meses (2 años) de garantía comercial';
        }
        if ($meses % 12 === 0) {
            $anios = (int) ($meses / 12);

            return "{$meses} meses ({$anios} años) de garantía comercial";
        }

        return "{$meses} meses de garantía comercial";
    }
}
