<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\DetalleVenta;
use App\Models\Producto;
use App\Models\ServicioTecnico;
use App\Models\Venta;
use App\Services\NotificacionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServicioTecnicoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $q = $request->string('q')->toString();

        $ordenes = ServicioTecnico::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->when($q, fn ($qq) => $qq->where(function ($w) use ($q) {
                $w->where('numero', 'like', "%{$q}%")->orWhere('id', $q);
            }))
            ->orderByDesc('id')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('ServicioTecnico/Index', [
            'ordenes' => $ordenes,
            'filtros' => ['q' => $q],
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user();

        return Inertia::render('ServicioTecnico/Create', [
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

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'numero' => ['nullable', 'string', 'max:50'],
            'fecha_ingreso' => ['required', 'date'],
            'estado' => ['required', 'in:recibido,diagnostico,reparacion,listo,entregado,cancelado'],
            'venta_id' => ['nullable', 'exists:ventas,id'],
            'detalle_venta_id' => ['nullable', 'exists:detalle_ventas,id'],
            'cliente_id' => ['nullable', 'exists:clientes,id'],
            'producto_id' => ['required', 'exists:productos,id'],
            'falla_reportada' => ['nullable', 'string'],
            'costo' => ['nullable', 'numeric', 'min:0'],
            'adelanto' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (!empty($data['venta_id'])) {
            $venta = Venta::query()->findOrFail($data['venta_id']);
            abort_unless($venta->sucursal_id === $user->sucursal_id, 404);
        }

        if (!empty($data['detalle_venta_id'])) {
            $dv = DetalleVenta::query()->with('venta')->findOrFail($data['detalle_venta_id']);
            abort_unless((int) $dv->venta->sucursal_id === (int) $user->sucursal_id, 404);
        }

        $orden = ServicioTecnico::create([
            'sucursal_id' => $user->sucursal_id,
            'usuario_id' => $user->id,
            ...$data,
        ]);

        app(NotificacionService::class)->paraEmpresa(
            $user,
            'Orden de servicio creada',
            'Se registró la orden '.$orden->numero.'.',
            [
                'tipo' => 'servicio',
                'nivel' => 'info',
                'entidad' => 'servicio_tecnico',
                'entidad_id' => $orden->id,
                'label' => 'Ver orden',
                'url' => route('servicio-tecnico.edit', $orden->id),
            ]
        );

        return redirect()->route('servicio_tecnico.index')->with('success', 'Orden registrada.');
    }

    public function edit(Request $request, ServicioTecnico $servicioTecnico)
    {
        $user = $request->user();
        abort_unless($servicioTecnico->sucursal_id === $user->sucursal_id, 404);

        return Inertia::render('ServicioTecnico/Edit', [
            'orden' => $servicioTecnico,
        ]);
    }

    public function update(Request $request, ServicioTecnico $servicioTecnico)
    {
        $user = $request->user();
        abort_unless($servicioTecnico->sucursal_id === $user->sucursal_id, 404);

        $data = $request->validate([
            'estado' => ['required', 'in:recibido,diagnostico,reparacion,listo,entregado,cancelado'],
            'diagnostico' => ['nullable', 'string'],
            'trabajo_realizado' => ['nullable', 'string'],
            'costo' => ['nullable', 'numeric', 'min:0'],
            'adelanto' => ['nullable', 'numeric', 'min:0'],
            'fecha_entrega' => ['nullable', 'date'],
        ]);

        $servicioTecnico->update($data);

        return back()->with('success', 'Orden actualizada.');
    }
}
