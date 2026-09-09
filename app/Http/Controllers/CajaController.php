<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Caja;
use App\Models\MovimientoCaja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CajaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $cajaAbierta = Caja::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->where('estado', 'abierta')
            ->orderByDesc('id')
            ->first();

        $historial = Caja::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        $movimientos = $cajaAbierta
            ? MovimientoCaja::query()
                ->where('caja_id', $cajaAbierta->id)
                ->orderByDesc('id')
                ->limit(20)
                ->get()
            : collect();

        $balance = $cajaAbierta
            ? (float) $cajaAbierta->monto_inicial
                + (float) MovimientoCaja::query()->where('caja_id', $cajaAbierta->id)->where('tipo', 'entrada')->sum('monto')
                - (float) MovimientoCaja::query()->where('caja_id', $cajaAbierta->id)->where('tipo', 'salida')->sum('monto')
            : 0;

        return Inertia::render('Caja/Index', [
            'cajaAbierta' => $cajaAbierta,
            'historial' => $historial,
            'movimientos' => $movimientos,
            'balance' => round($balance, 2),
        ]);
    }

    public function abrir(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'monto_inicial' => ['required', 'numeric', 'min:0'],
            'nota' => ['nullable', 'string'],
        ]);

        $existe = Caja::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->where('estado', 'abierta')
            ->exists();
        if ($existe) {
            abort(422, 'Ya existe una caja abierta para esta sucursal.');
        }

        Caja::create([
            'sucursal_id' => $user->sucursal_id,
            'usuario_apertura_id' => $user->id,
            'apertura_en' => now(),
            'monto_inicial' => $data['monto_inicial'],
            'estado' => 'abierta',
            'nota' => $data['nota'] ?? null,
        ]);

        return back()->with('success', 'Caja abierta.');
    }

    public function movimiento(Request $request)
    {
        $user = $request->user();

        $caja = Caja::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->where('estado', 'abierta')
            ->orderByDesc('id')
            ->first();
        if (!$caja) {
            abort(422, 'No hay caja abierta.');
        }

        $data = $request->validate([
            'tipo' => ['required', 'in:entrada,salida'],
            'concepto' => ['nullable', 'string', 'max:200'],
            'monto' => ['required', 'numeric', 'min:0.01'],
            'nota' => ['nullable', 'string'],
        ]);

        MovimientoCaja::create([
            'sucursal_id' => $user->sucursal_id,
            'caja_id' => $caja->id,
            'usuario_id' => $user->id,
            'fecha' => now(),
            ...$data,
        ]);

        return back()->with('success', 'Movimiento registrado.');
    }

    public function cerrar(Request $request)
    {
        $user = $request->user();

        $caja = Caja::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->where('estado', 'abierta')
            ->orderByDesc('id')
            ->first();
        if (!$caja) {
            abort(422, 'No hay caja abierta.');
        }

        $data = $request->validate([
            'monto_cierre' => ['required', 'numeric', 'min:0'],
            'nota' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($caja, $user, $data) {
            $entradas = (float) MovimientoCaja::query()->where('caja_id', $caja->id)->where('tipo', 'entrada')->sum('monto');
            $salidas = (float) MovimientoCaja::query()->where('caja_id', $caja->id)->where('tipo', 'salida')->sum('monto');
            $esperado = (float) $caja->monto_inicial + $entradas - $salidas;

            $caja->update([
                'usuario_cierre_id' => $user->id,
                'cierre_en' => now(),
                'monto_cierre' => $data['monto_cierre'],
                'diferencia' => round(((float) $data['monto_cierre']) - $esperado, 2),
                'estado' => 'cerrada',
                'nota' => $data['nota'] ?? $caja->nota,
            ]);
        });

        return back()->with('success', 'Caja cerrada.');
    }
}
