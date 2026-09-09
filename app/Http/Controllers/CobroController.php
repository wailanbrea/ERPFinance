<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CuotaFinanciamiento;
use App\Models\Financiamiento;
use App\Models\Pago;
use App\Models\RutaCobro;
use App\Services\NotificacionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CobroController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $rutaId = $request->integer('ruta_id') ?: null;
        $estado = $request->string('estado')->toString() ?: 'pendiente';

        $rutas = RutaCobro::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->where('activa', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        $cuotas = CuotaFinanciamiento::query()
            ->join('financiamientos', 'financiamientos.id', '=', 'cuotas_financiamiento.financiamiento_id')
            ->join('ventas', 'ventas.id', '=', 'financiamientos.venta_id')
            ->join('clientes', 'clientes.id', '=', 'financiamientos.cliente_id')
            ->when($rutaId, function ($q) use ($rutaId) {
                $q->join('clientes_rutas', 'clientes_rutas.cliente_id', '=', 'clientes.id')
                    ->where('clientes_rutas.ruta_cobro_id', $rutaId);
            })
            ->where('financiamientos.sucursal_id', $user->sucursal_id)
            ->when($estado === 'vencida', fn ($q) => $q->where('cuotas_financiamiento.vencimiento', '<', now()->toDateString())->where('cuotas_financiamiento.estado', '!=', 'pagada'))
            ->when($estado === 'pendiente', fn ($q) => $q->where('cuotas_financiamiento.estado', 'pendiente'))
            ->when($estado === 'pagada', fn ($q) => $q->where('cuotas_financiamiento.estado', 'pagada'))
            ->orderBy('clientes.nombre')
            ->orderBy('clientes.apellido')
            ->orderBy('cuotas_financiamiento.vencimiento')
            ->select([
                'cuotas_financiamiento.id',
                'cuotas_financiamiento.numero',
                'cuotas_financiamiento.vencimiento',
                'cuotas_financiamiento.monto',
                'cuotas_financiamiento.pagado',
                'cuotas_financiamiento.estado',
                'financiamientos.id as financiamiento_id',
                'clientes.id as cliente_id',
                'clientes.nombre',
                'clientes.apellido',
                'clientes.telefono',
                'ventas.id as venta_id',
                'ventas.fecha as venta_fecha',
                'ventas.total as venta_total',
            ])
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Cobros/Index', [
            'rutas' => $rutas,
            'cuotas' => $cuotas,
            'filtros' => [
                'ruta_id' => $rutaId,
                'estado' => $estado,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'cuota_id' => ['required', 'exists:cuotas_financiamiento,id'],
            'fecha' => ['required', 'date'],
            'monto' => ['nullable', 'numeric', 'min:0'],
            'mora' => ['nullable', 'numeric', 'min:0'],
            'descuento' => ['nullable', 'numeric', 'min:0'],
            'metodo_pago' => ['nullable', 'string', 'max:50'],
            'estado_visita' => ['required', 'in:pagado,promesa,no_pago,no_localizado'],
            'nota' => ['nullable', 'string'],
            'monto_promesa' => ['nullable', 'numeric', 'min:0'],
            'fecha_promesa' => ['nullable', 'date'],
        ]);

        $cuota = CuotaFinanciamiento::query()->findOrFail($data['cuota_id']);
        $fin = Financiamiento::query()->findOrFail($cuota->financiamiento_id);
        abort_unless($fin->sucursal_id === $user->sucursal_id, 404);

        $pago = null;
        DB::transaction(function () use ($data, $user, $cuota, $fin, &$pago) {
            $monto = (float) ($data['monto'] ?? 0);
            $mora = (float) ($data['mora'] ?? 0);
            $descuento = (float) ($data['descuento'] ?? 0);

            if ($data['estado_visita'] === 'pagado' && $monto <= 0) {
                abort(422, 'El monto del cobro debe ser mayor a 0.');
            }

            $pago = Pago::create([
                'sucursal_id' => $user->sucursal_id,
                'venta_id' => $fin->venta_id,
                'financiamiento_id' => $fin->id,
                'cuota_id' => $cuota->id,
                'monto' => $monto,
                'mora' => $mora,
                'descuento' => $descuento,
                'metodo_pago' => $data['metodo_pago'] ?? 'efectivo',
                'fecha' => $data['fecha'],
                'nota' => $data['nota'] ?? null,
                'estado_visita' => $data['estado_visita'],
            ]);

            if ($data['estado_visita'] === 'pagado') {
                $cuota->pagado = round(((float) $cuota->pagado) + $monto, 2);
                if ((float) $cuota->pagado >= (float) $cuota->monto) {
                    $cuota->estado = 'pagada';
                }
                $cuota->save();

                $fin->balance = max(0, (float) $fin->balance - $monto);
                if ((float) $fin->balance <= 0.01) {
                    $fin->estado = 'cerrado';
                }
                $fin->save();
            }
        });

        app(NotificacionService::class)->paraEmpresa(
            $user,
            $data['estado_visita'] === 'pagado' ? 'Cobro registrado' : 'Visita de cobro registrada',
            $data['estado_visita'] === 'pagado'
                ? 'Se recibieron RD$ '.number_format((float) $pago->monto, 2).' para el financiamiento #'.$fin->id.'.'
                : 'Resultado de la visita: '.str_replace('_', ' ', $data['estado_visita']).'.',
            [
                'tipo' => 'cobro',
                'nivel' => $data['estado_visita'] === 'pagado' ? 'exito' : 'info',
                'entidad' => 'financiamientos',
                'entidad_id' => $fin->id,
                'label' => 'Ver financiamiento',
                'url' => route('financiamientos.show', $fin->id),
            ]
        );

        return back()->with('success', 'Cobro registrado.');
    }
}
