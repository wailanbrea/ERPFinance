<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\Cliente;
use App\Models\DetalleVenta;
use App\Models\Pago;
use App\Models\Producto;
use App\Models\StockProducto;
use App\Models\Venta;
use App\Services\FinanciamientoService;
use App\Services\InventarioService;
use App\Services\NotificacionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class VentaController extends Controller
{
    public function pos()
    {
        $user = request()->user();
        $empresaId = $user->resolvedEmpresaId();

        return Inertia::render('Ventas/Pos', [
            'clientes' => Cliente::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->orderBy('nombre')
                ->limit(200)
                ->get(['id', 'nombre', 'apellido', 'cedula_rnc', 'telefono']),
            'productos' => Producto::query()
                ->forEmpresa($empresaId)
                ->where('activo', true)
                ->orderBy('nombre')
                ->limit(500)
                ->get(['id', 'nombre', 'sku', 'codigo_barra', 'qr', 'precio_contado', 'precio_financiado', 'precio_mayor']),
            'almacenes' => Almacen::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']),
        ]);
    }

    public function mayor()
    {
        $user = request()->user();
        $empresaId = $user->resolvedEmpresaId();

        return Inertia::render('Ventas/Mayor', [
            'clientes' => Cliente::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->orderBy('nombre')
                ->limit(200)
                ->get(['id', 'nombre', 'apellido', 'cedula_rnc', 'telefono']),
            'productos' => Producto::query()
                ->forEmpresa($empresaId)
                ->where('activo', true)
                ->orderBy('nombre')
                ->limit(500)
                ->get(['id', 'nombre', 'sku', 'codigo_barra', 'qr', 'precio_contado', 'precio_financiado', 'precio_mayor']),
            'almacenes' => Almacen::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $empresaId = $user->resolvedEmpresaId();
        abort_unless($empresaId, 403, 'Sin empresa asignada.');

        $data = $request->validate([
            'modalidad' => ['nullable', 'in:detalle,mayor'],
            'tipo' => ['required', 'in:contado,financiada,apartado'],
            'cliente_id' => ['nullable', 'exists:clientes,id'],
            'almacen_id' => ['required', 'exists:almacenes,id'],
            'fecha' => ['required', 'date'],
            'descuento' => ['nullable', 'numeric', 'min:0'],
            'impuesto' => ['nullable', 'numeric', 'min:0'],
            'inicial' => ['nullable', 'numeric', 'min:0'],
            'interes' => ['nullable', 'numeric', 'min:0'],
            'cuotas' => ['nullable', 'integer', 'min:1'],
            'frecuencia' => ['nullable', 'in:semanal,quincenal,mensual'],
            'nota' => ['nullable', 'string'],
            'metodo_pago' => ['nullable', 'string', 'max:50'],
            'monto_pagado' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.producto_id' => [
                'required',
                Rule::exists('productos', 'id')->where('empresa_id', $empresaId),
            ],
            'items.*.cantidad' => ['required', 'numeric', 'min:0.01'],
            'items.*.precio_unitario' => ['required', 'numeric', 'min:0'],
        ]);

        if (($data['tipo'] ?? '') === 'financiada' && ! $user->can('financiamientos.ver')) {
            abort(403, 'El plan actual no incluye ventas financiadas. Usa contado o apartado, o asigna un rol con acceso a financiamientos (Plan Full).');
        }

        $almacen = Almacen::query()->whereKey((int) $data['almacen_id'])->first();
        abort_unless($almacen && (int) $almacen->sucursal_id === (int) $user->sucursal_id, 422, 'Almacén inválido para tu sucursal.');

        if (! empty($data['cliente_id'])) {
            $okCliente = Cliente::query()
                ->whereKey((int) $data['cliente_id'])
                ->where('sucursal_id', $user->sucursal_id)
                ->exists();
            abort_unless($okCliente, 422, 'Cliente inválido para tu sucursal.');
        }

        $modalidad = $data['modalidad'] ?? 'detalle';
        if (! in_array($modalidad, ['detalle', 'mayor'], true)) {
            $modalidad = 'detalle';
        }

        $inventario = app(InventarioService::class);

        $advertencias = [];
        $venta = null;

        DB::transaction(function () use ($data, $user, $inventario, &$advertencias, $modalidad, &$venta) {
            $productoIds = collect($data['items'])->pluck('producto_id')->map(fn ($id) => (int) $id)->unique()->values();
            $nombresProducto = Producto::query()
                ->whereIn('id', $productoIds)
                ->pluck('nombre', 'id');

            $subtotal = 0;
            foreach ($data['items'] as $it) {
                $subtotal += (float) $it['cantidad'] * (float) $it['precio_unitario'];
            }

            $descuento = (float) ($data['descuento'] ?? 0);
            $impuesto = (float) ($data['impuesto'] ?? 0);
            $total = max(0, $subtotal - $descuento + $impuesto);

            $venta = Venta::create([
                'sucursal_id' => $user->sucursal_id,
                'cliente_id' => $data['cliente_id'] ?? null,
                'usuario_id' => $user->id,
                'almacen_id' => $data['almacen_id'],
                'tipo' => $data['tipo'],
                'modalidad' => $modalidad,
                'fecha' => $data['fecha'],
                'subtotal' => $subtotal,
                'descuento' => $descuento,
                'impuesto' => $impuesto,
                'total' => $total,
                'estado' => 'registrada',
                'nota' => $data['nota'] ?? null,
            ]);

            foreach ($data['items'] as $it) {
                $sub = (float) $it['cantidad'] * (float) $it['precio_unitario'];

                $productoId = (int) $it['producto_id'];
                $cantidad = (float) $it['cantidad'];

                $stock = StockProducto::query()
                    ->where('almacen_id', (int) $data['almacen_id'])
                    ->where('producto_id', $productoId)
                    ->lockForUpdate()
                    ->first();

                $disponible = $stock ? (float) $stock->stock : 0.0;
                if ($disponible < $cantidad) {
                    $nombre = $nombresProducto[$productoId] ?? "Producto #{$productoId}";
                    abort(422, "{$nombre}: stock insuficiente (disponible {$disponible}, solicitado {$cantidad}).");
                }

                DetalleVenta::create([
                    'venta_id' => $venta->id,
                    'producto_id' => $it['producto_id'],
                    'cantidad' => $it['cantidad'],
                    'precio_unitario' => $it['precio_unitario'],
                    'subtotal' => $sub,
                ]);

                $inventario->salidaPorVenta(
                    $user->sucursal_id,
                    (int) $data['almacen_id'],
                    $productoId,
                    $cantidad,
                    $venta->id,
                    false
                );
            }

            if ($data['tipo'] === 'contado') {
                $monto = (float) ($data['monto_pagado'] ?? $total);
                Pago::create([
                    'sucursal_id' => $user->sucursal_id,
                    'venta_id' => $venta->id,
                    'monto' => $monto,
                    'metodo_pago' => $data['metodo_pago'] ?? 'efectivo',
                    'fecha' => $data['fecha'],
                ]);
            }

            if ($data['tipo'] === 'financiada') {
                $clienteId = (int) ($data['cliente_id'] ?? 0);
                if (!$clienteId) {
                    abort(422, 'Para financiar, debes seleccionar un cliente.');
                }

                $financiamientos = app(FinanciamientoService::class);
                $financiamientos->crearDesdeVenta(
                    $user->sucursal_id,
                    $venta->id,
                    $clienteId,
                    (float) $total,
                    (float) ($data['inicial'] ?? 0),
                    (float) ($data['interes'] ?? 0),
                    (int) ($data['cuotas'] ?? 12),
                    (string) ($data['frecuencia'] ?? 'mensual'),
                    Carbon::parse($data['fecha'])
                );
            }
        });

        if ($venta) {
            $notificaciones = app(NotificacionService::class);
            $notificaciones->paraEmpresa(
                $user,
                'Venta registrada',
                'Se registró la venta #'.$venta->id.' por RD$ '.number_format((float) $venta->total, 2),
                [
                    'tipo' => 'venta',
                    'nivel' => 'exito',
                    'entidad' => 'ventas',
                    'entidad_id' => $venta->id,
                    'label' => 'Ver facturas',
                    'url' => route('facturas.index'),
                ]
            );

            $productoIds = collect($data['items'])->pluck('producto_id')->map(fn ($id) => (int) $id)->unique();
            $stockCritico = StockProducto::query()
                ->with('producto:id,nombre')
                ->where('almacen_id', (int) $data['almacen_id'])
                ->whereIn('producto_id', $productoIds)
                ->whereColumn('stock', '<=', 'stock_minimo')
                ->get()
                ->pluck('producto.nombre')
                ->filter()
                ->values();

            if ($stockCritico->isNotEmpty()) {
                $notificaciones->paraEmpresa(
                    $user,
                    'Stock crítico',
                    'Reponer: '.$stockCritico->join(', '),
                    [
                        'tipo' => 'inventario',
                        'nivel' => 'alerta',
                        'label' => 'Revisar inventario',
                        'url' => route('inventario.index', ['estado' => 'bajo_minimo']),
                    ]
                );
            }
        }

        $ruta = $modalidad === 'mayor' ? 'ventas.mayor' : 'ventas.pos';
        $mensaje = $modalidad === 'mayor'
            ? 'Venta al por mayor registrada correctamente.'
            : 'Venta registrada correctamente.';

        return redirect()->route($ruta)->with('success', $mensaje);
    }
}
