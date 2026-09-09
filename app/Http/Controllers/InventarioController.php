<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\MovimientoInventario;
use App\Models\StockProducto;
use Inertia\Inertia;

class InventarioController extends Controller
{
    public function index()
    {
        $user = request()->user();
        $empresaId = $user->resolvedEmpresaId();
        $almacenId = request()->integer('almacen_id');
        $tab = request()->string('tab')->toString() ?: 'stock'; // stock | kardex
        $buscar = request()->string('buscar')->toString();
        $estado = request()->string('estado')->toString(); // bajo_minimo | con_stock | agotado | ''

        $almacenes = Almacen::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        if (! $almacenId) {
            $almacenConStock = StockProducto::query()
                ->whereIn('almacen_id', $almacenes->pluck('id'))
                ->select('almacen_id')
                ->groupBy('almacen_id')
                ->orderByRaw('COUNT(*) DESC')
                ->value('almacen_id');

            $almacenId = $almacenConStock ?: ($almacenes->first()->id ?? null);
        }

        $stock = null;
        $kardex = null;

        if ($almacenId && ($tab === 'stock' || $tab === '')) {
            $stock = StockProducto::query()
                ->join('productos', 'productos.id', '=', 'stock_productos.producto_id')
                ->join('almacenes', 'almacenes.id', '=', 'stock_productos.almacen_id')
                ->when($empresaId, fn ($q) => $q->where('productos.empresa_id', $empresaId))
                ->where('stock_productos.almacen_id', $almacenId)
                ->when($buscar !== '', function ($q) use ($buscar) {
                    $q->where(function ($q) use ($buscar) {
                        $q->where('productos.nombre', 'like', "%{$buscar}%")
                            ->orWhere('productos.sku', 'like', "%{$buscar}%")
                            ->orWhere('productos.codigo_barra', 'like', "%{$buscar}%")
                            ->orWhere('productos.qr', 'like', "%{$buscar}%");
                    });
                })
                ->when($estado === 'bajo_minimo', fn ($q) => $q->whereColumn('stock_productos.stock', '<=', 'stock_productos.stock_minimo'))
                ->when($estado === 'con_stock', fn ($q) => $q->where('stock_productos.stock', '>', 0))
                ->when($estado === 'agotado', fn ($q) => $q->where('stock_productos.stock', '<=', 0))
                ->orderBy('productos.nombre')
                ->select([
                    'stock_productos.id',
                    'stock_productos.producto_id',
                    'stock_productos.stock',
                    'stock_productos.stock_minimo',
                    'stock_productos.almacen_id',
                    'almacenes.nombre as almacen_nombre',
                    'productos.nombre as producto_nombre',
                    'productos.sku as producto_sku',
                    'productos.codigo_barra as producto_codigo_barra',
                    'productos.qr as producto_qr',
                    'productos.costo as producto_costo',
                    'productos.precio_contado as producto_precio_contado',
                    'productos.precio_mayor as producto_precio_mayor',
                ])
                ->paginate(25)
                ->withQueryString();
        }

        if ($almacenId && $tab === 'kardex') {
            $kardex = MovimientoInventario::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->where('almacen_id', $almacenId)
                ->join('productos', 'productos.id', '=', 'movimientos_inventario.producto_id')
                ->join('almacenes', 'almacenes.id', '=', 'movimientos_inventario.almacen_id')
                ->when($empresaId, fn ($q) => $q->where('productos.empresa_id', $empresaId))
                ->when($buscar !== '', function ($q) use ($buscar) {
                    $q->where(function ($q) use ($buscar) {
                        $q->where('productos.nombre', 'like', "%{$buscar}%")
                            ->orWhere('productos.sku', 'like', "%{$buscar}%")
                            ->orWhere('productos.codigo_barra', 'like', "%{$buscar}%")
                            ->orWhere('productos.qr', 'like', "%{$buscar}%")
                            ->orWhere('movimientos_inventario.referencia_tipo', 'like', "%{$buscar}%")
                            ->orWhere('movimientos_inventario.referencia_id', $buscar);
                    });
                })
                ->orderByDesc('movimientos_inventario.id')
                ->select([
                    'movimientos_inventario.id',
                    'movimientos_inventario.tipo',
                    'movimientos_inventario.cantidad',
                    'movimientos_inventario.saldo',
                    'movimientos_inventario.almacen_id',
                    'almacenes.nombre as almacen_nombre',
                    'movimientos_inventario.referencia_tipo',
                    'movimientos_inventario.referencia_id',
                    'movimientos_inventario.nota',
                    'movimientos_inventario.created_at',
                    'productos.nombre as producto_nombre',
                    'productos.sku as producto_sku',
                ])
                ->paginate(30)
                ->withQueryString();
        }

        return Inertia::render('Inventario/Index', [
            'almacenes' => $almacenes,
            'almacen_id' => $almacenId,
            'stock' => $stock,
            'kardex' => $kardex,
            'filtros' => [
                'tab' => $tab,
                'buscar' => $buscar,
                'estado' => $estado,
            ],
        ]);
    }
}
