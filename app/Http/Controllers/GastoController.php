<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Caja;
use App\Models\Gasto;
use App\Services\NotificacionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GastoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $q = $request->string('q')->toString();

        $gastos = Gasto::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->when($q, fn ($qq) => $qq->where('concepto', 'like', "%{$q}%"))
            ->orderByDesc('id')
            ->paginate(12)
            ->withQueryString();

        $cajaAbierta = Caja::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->where('estado', 'abierta')
            ->orderByDesc('id')
            ->first();

        return Inertia::render('Gastos/Index', [
            'gastos' => $gastos,
            'cajaAbierta' => $cajaAbierta,
            'filtros' => ['q' => $q],
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user();

        $cajaAbierta = Caja::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->where('estado', 'abierta')
            ->orderByDesc('id')
            ->first();

        return Inertia::render('Gastos/Create', [
            'cajaAbierta' => $cajaAbierta,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'fecha' => ['required', 'date'],
            'categoria' => ['nullable', 'string', 'max:120'],
            'concepto' => ['required', 'string', 'max:200'],
            'monto' => ['required', 'numeric', 'min:0.01'],
            'nota' => ['nullable', 'string'],
            'usar_caja' => ['nullable', 'boolean'],
        ]);

        $cajaId = null;
        if ((bool) ($data['usar_caja'] ?? false)) {
            $caja = Caja::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->where('estado', 'abierta')
                ->orderByDesc('id')
                ->first();
            if (!$caja) {
                abort(422, 'No hay caja abierta para registrar el gasto.');
            }
            $cajaId = $caja->id;
        }

        $gasto = Gasto::create([
            'sucursal_id' => $user->sucursal_id,
            'usuario_id' => $user->id,
            'caja_id' => $cajaId,
            'fecha' => $data['fecha'],
            'categoria' => $data['categoria'] ?? null,
            'concepto' => $data['concepto'],
            'monto' => $data['monto'],
            'estado' => 'registrado',
            'nota' => $data['nota'] ?? null,
        ]);

        app(NotificacionService::class)->paraEmpresa(
            $user,
            'Gasto registrado',
            $gasto->concepto.' · RD$ '.number_format((float) $gasto->monto, 2),
            [
                'tipo' => 'gasto',
                'nivel' => 'alerta',
                'entidad' => 'gastos',
                'entidad_id' => $gasto->id,
                'label' => 'Ver gastos',
                'url' => route('gastos.index'),
            ]
        );

        return redirect()->route('gastos.index')->with('success', 'Gasto registrado.');
    }
}
