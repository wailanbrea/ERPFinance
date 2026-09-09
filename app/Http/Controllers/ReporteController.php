<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Gasto;
use App\Models\Pago;
use App\Models\Venta;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReporteController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $desde = $request->string('desde')->toString() ?: now()->startOfMonth()->toDateString();
        $hasta = $request->string('hasta')->toString() ?: now()->toDateString();

        $ventasTotal = (float) Venta::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->whereBetween('fecha', [$desde, $hasta])
            ->sum('total');

        $cobrosTotal = (float) Pago::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->whereBetween('fecha', [$desde, $hasta])
            ->sum('monto');

        $moraTotal = (float) Pago::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->whereBetween('fecha', [$desde, $hasta])
            ->sum('mora');

        $gastosTotal = (float) Gasto::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->whereBetween('fecha', [$desde, $hasta])
            ->sum('monto');

        return Inertia::render('Reportes/Index', [
            'filtros' => ['desde' => $desde, 'hasta' => $hasta],
            'resumen' => [
                'ventas_total' => round($ventasTotal, 2),
                'cobros_total' => round($cobrosTotal, 2),
                'mora_total' => round($moraTotal, 2),
                'gastos_total' => round($gastosTotal, 2),
            ],
        ]);
    }
}
