<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\Producto;
use App\Models\Proveedor;
use Illuminate\Http\Request;
use App\Services\InventarioService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CompraController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = request()->user();

        $compras = Compra::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->with(['proveedor:id,nombre', 'almacen:id,nombre', 'detalles.producto:id,nombre'])
            ->withCount('detalles')
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Hacer el payload útil para expandir detalle en el listado
        $compras->getCollection()->transform(function (Compra $c) {
            return [
                'id' => $c->id,
                'fecha' => $c->fecha,
                'total' => (float) $c->total,
                'estado' => $c->estado,
                'detalles_count' => (int) ($c->detalles_count ?? $c->detalles?->count() ?? 0),
                'proveedor' => $c->proveedor ? ['id' => $c->proveedor->id, 'nombre' => $c->proveedor->nombre] : null,
                'almacen' => $c->almacen ? ['id' => $c->almacen->id, 'nombre' => $c->almacen->nombre] : null,
                'detalles' => ($c->detalles ?? collect())->map(fn ($d) => [
                    'id' => $d->id,
                    'producto' => $d->producto ? ['id' => $d->producto->id, 'nombre' => $d->producto->nombre] : null,
                    'cantidad' => (float) $d->cantidad,
                    'costo_unitario' => (float) $d->costo_unitario,
                    'itbis_aplica' => (bool) ($d->itbis_aplica ?? true),
                    'itbis_tasa' => (float) ($d->itbis_tasa ?? 18),
                    'costo_unitario_con_itbis' => (float) ($d->costo_unitario_con_itbis ?? $d->costo_unitario),
                    'subtotal' => (float) $d->subtotal,
                ])->values(),
            ];
        });

        return Inertia::render('Compras/Index', [
            'compras' => $compras,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $user = request()->user();

        return Inertia::render('Compras/Create', [
            'proveedores' => Proveedor::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']),
            'almacenes' => Almacen::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']),
            'productos' => Producto::query()
                ->forEmpresa($user->resolvedEmpresaId())
                ->where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'descripcion', 'sku', 'codigo_barra', 'qr', 'costo', 'precio_contado', 'precio_financiado']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $empresaId = $user->resolvedEmpresaId();
        abort_unless($empresaId, 403, 'Sin empresa asignada.');

        $data = $request->validate([
            'proveedor_id' => ['nullable', 'exists:proveedores,id'],
            'almacen_id' => ['required', 'exists:almacenes,id'],
            'fecha' => ['required', 'date'],
            'nota' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.producto_id' => [
                'required',
                Rule::exists('productos', 'id')->where('empresa_id', $empresaId),
            ],
            'items.*.cantidad' => ['required', 'numeric', 'min:0.01'],
            'items.*.costo_unitario' => ['required', 'numeric', 'min:0'],
            'items.*.precio_contado' => ['nullable', 'numeric', 'min:0'],
            'items.*.precio_financiado' => ['nullable', 'numeric', 'min:0'],
            'items.*.actualizar_producto' => ['nullable', 'boolean'],
            'items.*.itbis_aplica' => ['nullable', 'boolean'],
            'items.*.itbis_tasa' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $almacen = Almacen::query()->whereKey((int) $data['almacen_id'])->first();
        abort_unless($almacen && (int) $almacen->sucursal_id === (int) $user->sucursal_id, 422, 'Almacén inválido para tu sucursal.');

        $inventario = app(InventarioService::class);

        DB::transaction(function () use ($data, $user, $inventario) {
            $compra = Compra::create([
                'sucursal_id' => $user->sucursal_id,
                'proveedor_id' => $data['proveedor_id'] ?? null,
                'almacen_id' => $data['almacen_id'],
                'fecha' => $data['fecha'],
                'estado' => 'registrada',
                'nota' => $data['nota'] ?? null,
                'total' => 0,
            ]);

            $total = 0;

            foreach ($data['items'] as $item) {
                $costoUnit = (float) $item['costo_unitario'];
                $itbisAplica = array_key_exists('itbis_aplica', $item) ? (bool) $item['itbis_aplica'] : true;
                $itbisTasa = array_key_exists('itbis_tasa', $item) && $item['itbis_tasa'] !== null && $item['itbis_tasa'] !== ''
                    ? (float) $item['itbis_tasa']
                    : 18.0;
                $costoConItbis = $itbisAplica ? round($costoUnit * (1.0 + ($itbisTasa / 100.0)), 2) : round($costoUnit, 2);

                $subtotal = (float) $item['cantidad'] * (float) $costoConItbis;
                $total += $subtotal;

                DetalleCompra::create([
                    'compra_id' => $compra->id,
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $item['cantidad'],
                    'costo_unitario' => $costoUnit,
                    'itbis_aplica' => $itbisAplica,
                    'itbis_tasa' => $itbisTasa,
                    'costo_unitario_con_itbis' => $costoConItbis,
                    'subtotal' => $subtotal,
                ]);

                // Opcional: actualizar costos/precios del producto (lo que tendrá en tienda).
                $actualizar = array_key_exists('actualizar_producto', $item) ? (bool) $item['actualizar_producto'] : true;
                if ($actualizar) {
                    $producto = Producto::query()->lockForUpdate()->find((int) $item['producto_id']);
                    if ($producto) {
                        // El costo en tienda debe incluir ITBIS si aplica.
                        $producto->costo = (float) $costoConItbis;
                        if (array_key_exists('precio_contado', $item) && $item['precio_contado'] !== null && $item['precio_contado'] !== '') {
                            $producto->precio_contado = (float) $item['precio_contado'];
                        }
                        if (array_key_exists('precio_financiado', $item) && $item['precio_financiado'] !== null && $item['precio_financiado'] !== '') {
                            $producto->precio_financiado = (float) $item['precio_financiado'];
                        }
                        $producto->save();
                    }
                }

                $inventario->entradaDesdeCompra(
                    $user->sucursal_id,
                    (int) $data['almacen_id'],
                    (int) $item['producto_id'],
                    (float) $item['cantidad'],
                    $compra->id
                );
            }

            $compra->update(['total' => $total]);
        });

        return redirect()->route('compras.index')
            ->with('success', 'Compra registrada y stock actualizado.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Compra $compra)
    {
        $user = request()->user();

        abort_unless((int) $compra->sucursal_id === (int) $user->sucursal_id, 404);

        $compra->load([
            'proveedor:id,nombre',
            'almacen:id,nombre',
            'detalles.producto:id,nombre',
        ]);

        return Inertia::render('Compras/Show', [
            'compra' => [
                'id' => $compra->id,
                'numero' => $compra->numero,
                'fecha' => $compra->fecha,
                'total' => (float) $compra->total,
                'estado' => $compra->estado,
                'nota' => $compra->nota,
                'proveedor' => $compra->proveedor ? [
                    'id' => $compra->proveedor->id,
                    'nombre' => $compra->proveedor->nombre,
                ] : null,
                'almacen' => $compra->almacen ? [
                    'id' => $compra->almacen->id,
                    'nombre' => $compra->almacen->nombre,
                ] : null,
                'detalles' => $compra->detalles->map(fn ($d) => [
                    'id' => $d->id,
                    'producto' => $d->producto ? [
                        'id' => $d->producto->id,
                        'nombre' => $d->producto->nombre,
                    ] : null,
                    'cantidad' => (float) $d->cantidad,
                    'costo_unitario' => (float) $d->costo_unitario,
                    'itbis_aplica' => (bool) ($d->itbis_aplica ?? true),
                    'itbis_tasa' => (float) ($d->itbis_tasa ?? 18),
                    'costo_unitario_con_itbis' => (float) ($d->costo_unitario_con_itbis ?? $d->costo_unitario),
                    'subtotal' => (float) $d->subtotal,
                ])->values(),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Compra $compra)
    {
        return redirect()->route('compras.index');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Compra $compra)
    {
        return redirect()->route('compras.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Compra $compra)
    {
        return redirect()->route('compras.index');
    }
}
