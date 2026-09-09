<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\DetalleVenta;
use App\Models\Garantia;
use App\Models\Producto;
use App\Models\ServicioTecnico;
use App\Models\Venta;
use App\Services\NotificacionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GarantiaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $q = $request->string('q')->toString();

        $garantias = Garantia::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->when($q, fn ($qq) => $qq->where('id', $q))
            ->with([
                'cliente:id,nombre,apellido,cedula_rnc,telefono',
                'producto:id,nombre,modelo,sku,garantia_meses',
                'venta:id,sucursal_id,cliente_id,fecha,total,estado',
                'detalleVenta:id,venta_id,producto_id',
                'detalleVenta.venta:id,sucursal_id,cliente_id,fecha,total,estado',
                'servicioTecnico:id,numero,estado,fecha_ingreso',
            ])
            ->orderByDesc('id')
            ->paginate(12)
            ->withQueryString();

        $garantias->getCollection()->transform(function (Garantia $g) {
            $venta = $g->venta ?: $g->detalleVenta?->venta;
            $cliente = $g->cliente ?: $venta?->cliente;
            $producto = $g->producto ?: $g->detalleVenta?->producto;

            $calc = [
                'fecha_compra' => null,
                'fecha_vencimiento' => null,
                'en_garantia' => null,
            ];

            if ($venta && $venta->fecha && $producto) {
                try {
                    $compra = Carbon::parse($venta->fecha)->startOfDay();
                    $venc = $compra->copy()->addMonths((int) ($producto->garantia_meses ?? 0))->endOfDay();
                    $calc['fecha_compra'] = $compra->toDateString();
                    $calc['fecha_vencimiento'] = $venc->toDateString();
                    $calc['en_garantia'] = now()->endOfDay()->lte($venc);
                } catch (\Throwable) {
                    // noop
                }
            }

            return [
                'id' => $g->id,
                'fecha_reclamo' => $g->fecha_reclamo,
                'tipo' => $g->tipo,
                'estado' => $g->estado,
                'motivo' => $g->motivo,
                'cliente' => $cliente ? trim(($cliente->nombre ?? '').' '.($cliente->apellido ?? '')) : null,
                'producto' => $producto ? trim(($producto->nombre ?? '').($producto->modelo ? " ({$producto->modelo})" : '')) : null,
                'venta_id' => $venta?->id,
                'venta_fecha' => $venta?->fecha,
                'garantia_calc' => $calc,
                'servicio_tecnico' => $g->servicioTecnico ? [
                    'id' => $g->servicioTecnico->id,
                    'numero' => $g->servicioTecnico->numero,
                    'estado' => $g->servicioTecnico->estado,
                    'fecha_ingreso' => $g->servicioTecnico->fecha_ingreso,
                ] : null,
            ];
        });

        return Inertia::render('Garantias/Index', [
            'garantias' => $garantias,
            'filtros' => ['q' => $q],
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Garantias/Create', [
            'clientes' => Cliente::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->orderBy('nombre')
                ->limit(300)
                ->get(['id', 'nombre', 'apellido', 'cedula_rnc', 'telefono']),
            'productos' => Producto::query()
                ->forEmpresa($user->resolvedEmpresaId())
                ->where('activo', true)
                ->orderBy('nombre')
                ->limit(500)
                ->get(['id', 'nombre', 'sku']),
            'ventas' => Venta::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->orderByDesc('id')
                ->limit(200)
                ->get(['id', 'fecha', 'total']),
        ]);
    }

    public function detallesVenta(Request $request, Venta $venta)
    {
        $user = $request->user();
        abort_unless((int) $venta->sucursal_id === (int) $user->sucursal_id, 404);

        $rows = DB::table('detalle_ventas as dv')
            ->join('productos as p', 'p.id', '=', 'dv.producto_id')
            ->where('dv.venta_id', $venta->id)
            ->orderBy('dv.id')
            ->get([
                'dv.id',
                'dv.producto_id',
                'dv.cantidad',
                'dv.precio_unitario',
                'dv.subtotal',
                'p.nombre as producto_nombre',
                'p.modelo as producto_modelo',
                'p.sku as producto_sku',
                'p.garantia_meses as garantia_meses',
            ])
            ->map(fn ($r) => [
                'id' => (int) $r->id,
                'producto_id' => (int) $r->producto_id,
                'producto' => trim((string) $r->producto_nombre.(($r->producto_modelo ?? null) ? " ({$r->producto_modelo})" : '')),
                'sku' => $r->producto_sku,
                'garantia_meses' => (int) ($r->garantia_meses ?? 0),
                'cantidad' => (float) $r->cantidad,
                'precio_unitario' => (float) $r->precio_unitario,
                'subtotal' => (float) $r->subtotal,
            ])
            ->values();

        return response()->json([
            'venta' => [
                'id' => (int) $venta->id,
                'fecha' => $venta->fecha,
                'total' => (float) $venta->total,
                'cliente_id' => $venta->cliente_id ? (int) $venta->cliente_id : null,
            ],
            'detalles' => $rows,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'fecha_reclamo' => ['required', 'date'],
            'tipo' => ['required', 'in:fabricante,tienda'],
            'estado' => ['required', 'in:abierta,en_proceso,resuelta,rechazada,cerrada'],
            'venta_id' => ['nullable', 'exists:ventas,id'],
            'detalle_venta_id' => ['nullable', 'exists:detalle_ventas,id'],
            'cliente_id' => ['nullable', 'exists:clientes,id'],
            'producto_id' => ['required', 'exists:productos,id'],
            'motivo' => ['nullable', 'string', 'max:200'],
            'descripcion' => ['nullable', 'string'],
        ]);

        if (!empty($data['venta_id'])) {
            $venta = Venta::query()->findOrFail($data['venta_id']);
            abort_unless($venta->sucursal_id === $user->sucursal_id, 404);
        }

        if (!empty($data['detalle_venta_id'])) {
            $dv = DetalleVenta::query()->findOrFail($data['detalle_venta_id']);
            abort_unless((int) $dv->venta->sucursal_id === (int) $user->sucursal_id, 404);

            // Forzar coherencia: si viene detalle_venta_id, usar esa venta/producto (y cliente si no se eligió)
            $data['venta_id'] = (int) $dv->venta_id;
            $data['producto_id'] = (int) $dv->producto_id;
            if (empty($data['cliente_id']) && $dv->venta?->cliente_id) {
                $data['cliente_id'] = (int) $dv->venta->cliente_id;
            }
        }

        // Si vienen ambos, validar que correspondan (evita casos incoherentes en UI)
        if (!empty($data['venta_id']) && !empty($data['detalle_venta_id'])) {
            if ((int) $data['venta_id'] !== (int) $dv->venta_id) {
                abort(422, 'El detalle seleccionado no pertenece a la venta seleccionada.');
            }
        }

        $garantia = Garantia::create([
            'sucursal_id' => $user->sucursal_id,
            'usuario_id' => $user->id,
            ...$data,
        ]);

        app(NotificacionService::class)->paraEmpresa(
            $user,
            'Garantía registrada',
            'Se abrió la garantía #'.$garantia->id.'.'.($garantia->motivo ? ' '.$garantia->motivo : ''),
            [
                'tipo' => 'garantia',
                'nivel' => 'alerta',
                'entidad' => 'garantias',
                'entidad_id' => $garantia->id,
                'label' => 'Ver garantía',
                'url' => route('garantias.edit', $garantia->id),
            ]
        );

        return redirect()->route('garantias.index')->with('success', 'Garantía registrada.');
    }

    public function edit(Request $request, Garantia $garantia)
    {
        $user = $request->user();
        abort_unless($garantia->sucursal_id === $user->sucursal_id, 404);

        $garantia->load([
            'cliente:id,nombre,apellido,cedula_rnc,telefono,whatsapp',
            'producto:id,nombre,modelo,sku,garantia_meses,precio_contado,precio_financiado',
            'venta:id,sucursal_id,cliente_id,fecha,total,estado',
            'detalleVenta:id,venta_id,producto_id,cantidad,precio_unitario,subtotal',
            'detalleVenta.venta:id,sucursal_id,cliente_id,fecha,total,estado',
            'detalleVenta.producto:id,nombre,modelo,sku,garantia_meses',
            'usuario:id,name,email',
            'servicioTecnico:id,numero,estado,fecha_ingreso',
        ]);

        $venta = $garantia->venta ?: $garantia->detalleVenta?->venta;
        $producto = $garantia->producto ?: $garantia->detalleVenta?->producto;
        $cliente = $garantia->cliente ?: $venta?->cliente;

        $fechaCompra = null;
        $fechaVencimiento = null;
        $diasRestantes = null;
        $enGarantia = null;

        if ($venta && $venta->fecha && $producto) {
            try {
                $compra = Carbon::parse($venta->fecha)->startOfDay();
                $venc = $compra->copy()->addMonths((int) ($producto->garantia_meses ?? 0))->endOfDay();
                $hoy = now()->endOfDay();
                $fechaCompra = $compra->toDateString();
                $fechaVencimiento = $venc->toDateString();
                $enGarantia = $hoy->lte($venc);
                $diasRestantes = (int) $hoy->diffInDays($venc, false);
            } catch (\Throwable) {
                // dejar nulls
            }
        }

        return Inertia::render('Garantias/Edit', [
            'garantia' => $garantia,
            'detalle' => [
                'cliente' => $cliente ? [
                    'id' => $cliente->id,
                    'nombre' => trim(($cliente->nombre ?? '').' '.($cliente->apellido ?? '')),
                    'cedula_rnc' => $cliente->cedula_rnc,
                    'telefono' => $cliente->telefono,
                    'whatsapp' => $cliente->whatsapp,
                ] : null,
                'producto' => $producto ? [
                    'id' => $producto->id,
                    'nombre' => $producto->nombre,
                    'modelo' => $producto->modelo,
                    'sku' => $producto->sku,
                    'garantia_meses' => (int) ($producto->garantia_meses ?? 0),
                ] : null,
                'venta' => $venta ? [
                    'id' => $venta->id,
                    'fecha' => $venta->fecha,
                    'total' => (float) ($venta->total ?? 0),
                    'estado' => $venta->estado,
                ] : null,
                'servicio_tecnico' => $garantia->servicioTecnico ? [
                    'id' => $garantia->servicioTecnico->id,
                    'numero' => $garantia->servicioTecnico->numero,
                    'estado' => $garantia->servicioTecnico->estado,
                    'fecha_ingreso' => $garantia->servicioTecnico->fecha_ingreso,
                ] : null,
                'garantia_calc' => [
                    'fecha_compra' => $fechaCompra,
                    'fecha_vencimiento' => $fechaVencimiento,
                    'en_garantia' => $enGarantia,
                    'dias_restantes' => $diasRestantes,
                ],
            ],
        ]);
    }

    public function enviarAServicio(Request $request, Garantia $garantia)
    {
        $user = $request->user();
        abort_unless($garantia->sucursal_id === $user->sucursal_id, 404);

        if ($garantia->servicio_tecnico_id) {
            return redirect()->route('servicio-tecnico.edit', $garantia->servicio_tecnico_id);
        }

        $garantia->load(['venta', 'detalleVenta.venta', 'cliente', 'producto']);

        $venta = $garantia->venta ?: $garantia->detalleVenta?->venta;
        $clienteId = (int) ($garantia->cliente_id ?: $venta?->cliente_id ?: 0);
        $productoId = (int) (
            $garantia->producto_id
            ?: ($garantia->detalle_venta_id ? ($garantia->detalleVenta?->producto_id ?? 0) : 0)
        );

        if (! $productoId) {
            abort(422, 'La garantía no tiene producto asociado.');
        }

        $orden = null;
        DB::transaction(function () use ($user, $garantia, $venta, $clienteId, $productoId, &$orden) {
            $orden = ServicioTecnico::create([
                'sucursal_id' => $user->sucursal_id,
                'venta_id' => $garantia->venta_id ?: $garantia->detalleVenta?->venta_id,
                'detalle_venta_id' => $garantia->detalle_venta_id,
                'cliente_id' => $clienteId ?: null,
                'producto_id' => $productoId,
                'usuario_id' => $user->id,
                'numero' => null,
                'fecha_ingreso' => $garantia->fecha_reclamo ?: now()->toDateString(),
                'estado' => 'recibido',
                'falla_reportada' => $garantia->descripcion ?: $garantia->motivo ?: null,
                'costo' => 0,
                'adelanto' => 0,
            ]);

            $garantia->servicio_tecnico_id = $orden->id;
            if (in_array((string) $garantia->estado, ['abierta'], true)) {
                $garantia->estado = 'en_proceso';
            }
            $garantia->save();
        });

        return redirect()->route('servicio-tecnico.edit', $orden->id)->with('success', 'Garantía enviada a servicio técnico.');
    }

    public function update(Request $request, Garantia $garantia)
    {
        $user = $request->user();
        abort_unless($garantia->sucursal_id === $user->sucursal_id, 404);

        $data = $request->validate([
            'estado' => ['required', 'in:abierta,en_proceso,resuelta,rechazada,cerrada'],
            'diagnostico' => ['nullable', 'string'],
            'resolucion' => ['nullable', 'string'],
            'fecha_cierre' => ['nullable', 'date'],
        ]);

        $garantia->update($data);

        return back()->with('success', 'Garantía actualizada.');
    }
}
