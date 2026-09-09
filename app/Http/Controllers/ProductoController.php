<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use App\Models\Marca;
use App\Models\Producto;
use App\Models\StockProducto;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProductoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $buscar = request()->string('buscar')->toString();
        $rawCategorias = request()->input('categorias', []);
        if (is_string($rawCategorias)) {
            // Soportar "1,2,3" además de categorias[]=1&categorias[]=2
            $rawCategorias = array_filter(array_map('trim', explode(',', $rawCategorias)));
        }
        $categoriaIds = collect($rawCategorias)->filter()->map(fn ($v) => (int) $v)->values();
        $stock = request()->string('stock')->toString(); // en_stock | agotado | ''
        $normalizarPrecio = static function ($valor): ?float {
            if ($valor === null || $valor === '' || ! is_numeric($valor)) {
                return null;
            }

            return max(0, (float) $valor);
        };

        // precio_min/precio_max se mantienen como alias de enlaces anteriores.
        $precioFinanciadoDesde = $normalizarPrecio(request()->input('precio_financiado_desde', request()->input('precio_min')));
        $precioFinanciadoHasta = $normalizarPrecio(request()->input('precio_financiado_hasta', request()->input('precio_max')));
        $precioContadoDesde = $normalizarPrecio(request()->input('precio_contado_desde'));
        $precioContadoHasta = $normalizarPrecio(request()->input('precio_contado_hasta'));

        if ($precioFinanciadoDesde !== null && $precioFinanciadoHasta !== null && $precioFinanciadoDesde > $precioFinanciadoHasta) {
            [$precioFinanciadoDesde, $precioFinanciadoHasta] = [$precioFinanciadoHasta, $precioFinanciadoDesde];
        }
        if ($precioContadoDesde !== null && $precioContadoHasta !== null && $precioContadoDesde > $precioContadoHasta) {
            [$precioContadoDesde, $precioContadoHasta] = [$precioContadoHasta, $precioContadoDesde];
        }

        $user = request()->user();
        $empresaId = $user->resolvedEmpresaId();
        abort_unless($empresaId, 403, 'Sin empresa asignada.');

        $productos = Producto::query()
            ->forEmpresa($empresaId)
            ->with([
                'categoria:id,nombre',
                'marca:id,nombre',
                'imagenes:id,producto_id,path,orden',
            ])
            ->when($categoriaIds->isNotEmpty(), fn ($q) => $q->whereIn('categoria_id', $categoriaIds->all()))
            ->when($buscar !== '', function ($q) use ($buscar) {
                $q->where(function ($q) use ($buscar) {
                    $q->where('nombre', 'like', "%{$buscar}%")
                        ->orWhere('sku', 'like', "%{$buscar}%")
                        ->orWhere('codigo_barra', 'like', "%{$buscar}%")
                        ->orWhere('modelo', 'like', "%{$buscar}%")
                        ->orWhere('serial', 'like', "%{$buscar}%");
                });
            })
            ->when($precioFinanciadoDesde !== null, fn ($q) => $q->where('precio_financiado', '>=', $precioFinanciadoDesde))
            ->when($precioFinanciadoHasta !== null, fn ($q) => $q->where('precio_financiado', '<=', $precioFinanciadoHasta))
            ->when($precioContadoDesde !== null, fn ($q) => $q->where('precio_contado', '>=', $precioContadoDesde))
            ->when($precioContadoHasta !== null, fn ($q) => $q->where('precio_contado', '<=', $precioContadoHasta))
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        $ids = $productos->getCollection()->pluck('id')->all();
        $stockPorProducto = StockProducto::query()
            ->join('almacenes', 'almacenes.id', '=', 'stock_productos.almacen_id')
            ->where('almacenes.sucursal_id', $user->sucursal_id)
            ->whereIn('stock_productos.producto_id', $ids)
            ->groupBy('stock_productos.producto_id')
            ->selectRaw('stock_productos.producto_id as producto_id, SUM(stock_productos.stock) as stock_total')
            ->pluck('stock_total', 'producto_id');

        $almacenesPorProducto = StockProducto::query()
            ->join('almacenes', 'almacenes.id', '=', 'stock_productos.almacen_id')
            ->where('almacenes.sucursal_id', $user->sucursal_id)
            ->whereIn('stock_productos.producto_id', $ids)
            ->orderBy('almacenes.nombre')
            ->get([
                'stock_productos.producto_id',
                'almacenes.nombre as almacen_nombre',
                'stock_productos.stock',
            ])
            ->groupBy('producto_id')
            ->map(function ($rows) {
                return $rows->map(fn ($r) => [
                    'nombre' => $r->almacen_nombre,
                    'stock' => (float) $r->stock,
                ])->values()->all();
            });

        if ($stock === 'en_stock' || $stock === 'agotado') {
            $productos->setCollection(
                $productos->getCollection()->filter(function (Producto $p) use ($stockPorProducto, $stock) {
                    $st = (float) ($stockPorProducto[$p->id] ?? 0);
                    return $stock === 'en_stock' ? $st > 0 : $st <= 0;
                })->values()
            );
        }

        $productos->getCollection()->transform(function (Producto $p) use ($almacenesPorProducto) {
            $img = $p->imagenes->first();
            return [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'sku' => $p->sku,
                'modelo' => $p->modelo,
                'serial' => $p->serial,
                'precio_contado' => $p->precio_contado,
                'precio_financiado' => $p->precio_financiado,
                'precio_mayor' => $p->precio_mayor,
                'categoria' => $p->categoria,
                'marca' => $p->marca,
                'imagen_url' => $img ? asset($img->path) : null,
                'almacenes' => $almacenesPorProducto[$p->id] ?? [],
            ];
        });

        return Inertia::render('Productos/Index', [
            'productos' => $productos,
            'categorias' => Categoria::query()->where('activa', true)->orderBy('nombre')->get(['id', 'nombre']),
            'filtros' => [
                'buscar' => $buscar,
                'categorias' => $categoriaIds->all(),
                'stock' => $stock,
                'precio_financiado_desde' => $precioFinanciadoDesde,
                'precio_financiado_hasta' => $precioFinanciadoHasta,
                'precio_contado_desde' => $precioContadoDesde,
                'precio_contado_hasta' => $precioContadoHasta,
            ],
            'stock' => $stockPorProducto,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Productos/Create', [
            'categorias' => Categoria::query()->where('activa', true)->orderBy('nombre')->get(['id', 'nombre']),
            'marcas' => Marca::query()->where('activa', true)->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $empresaId = $request->user()->resolvedEmpresaId();
        abort_unless($empresaId, 403, 'Sin empresa asignada.');

        $data = $request->validate([
            'categoria_id' => ['nullable', 'exists:categorias,id'],
            'marca_id' => ['nullable', 'exists:marcas,id'],
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'sku' => ['nullable', 'string', 'max:100', Rule::unique('productos', 'sku')->where('empresa_id', $empresaId)],
            'codigo_barra' => ['nullable', 'string', 'max:100', Rule::unique('productos', 'codigo_barra')->where('empresa_id', $empresaId)],
            'qr' => ['nullable', 'string', 'max:100', Rule::unique('productos', 'qr')->where('empresa_id', $empresaId)],
            'modelo' => ['nullable', 'string', 'max:255'],
            'serial' => ['nullable', 'string', 'max:255'],
            'costo' => ['required', 'numeric', 'min:0'],
            'precio_contado' => ['required', 'numeric', 'min:0'],
            'precio_financiado' => ['required', 'numeric', 'min:0'],
            'precio_mayor' => ['nullable', 'numeric', 'min:0'],
            'garantia_meses' => ['required', 'integer', 'min:0'],
            'activo' => ['required', 'boolean'],
        ]);

        $data['empresa_id'] = $empresaId;
        if (array_key_exists('precio_mayor', $data) && ($data['precio_mayor'] === '' || $data['precio_mayor'] === null)) {
            $data['precio_mayor'] = null;
        }
        Producto::create($data);

        return redirect()->route('productos.index')
            ->with('success', 'Producto creado correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Producto $producto)
    {
        return redirect()->route('productos.edit', $producto);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Producto $producto)
    {
        $user = request()->user();
        $empresaId = $user->resolvedEmpresaId();
        abort_unless($empresaId && (int) $producto->empresa_id === $empresaId, 404);

        $stocks = StockProducto::query()
            ->join('almacenes', 'almacenes.id', '=', 'stock_productos.almacen_id')
            ->where('almacenes.sucursal_id', $user->sucursal_id)
            ->where('stock_productos.producto_id', $producto->id)
            ->orderBy('almacenes.nombre')
            ->get([
                'stock_productos.id',
                'stock_productos.almacen_id',
                'stock_productos.stock',
                'stock_productos.stock_minimo',
                'almacenes.nombre as almacen_nombre',
            ]);

        return Inertia::render('Productos/Edit', [
            'producto' => $producto,
            'categorias' => Categoria::query()->where('activa', true)->orderBy('nombre')->get(['id', 'nombre']),
            'marcas' => Marca::query()->where('activa', true)->orderBy('nombre')->get(['id', 'nombre']),
            'stocks' => $stocks,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Producto $producto)
    {
        $empresaId = $request->user()->resolvedEmpresaId();
        abort_unless($empresaId && (int) $producto->empresa_id === $empresaId, 404);

        $data = $request->validate([
            'categoria_id' => ['nullable', 'exists:categorias,id'],
            'marca_id' => ['nullable', 'exists:marcas,id'],
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'sku' => ['nullable', 'string', 'max:100', Rule::unique('productos', 'sku')->where('empresa_id', $empresaId)->ignore($producto->id)],
            'codigo_barra' => ['nullable', 'string', 'max:100', Rule::unique('productos', 'codigo_barra')->where('empresa_id', $empresaId)->ignore($producto->id)],
            'qr' => ['nullable', 'string', 'max:100', Rule::unique('productos', 'qr')->where('empresa_id', $empresaId)->ignore($producto->id)],
            'modelo' => ['nullable', 'string', 'max:255'],
            'serial' => ['nullable', 'string', 'max:255'],
            'costo' => ['required', 'numeric', 'min:0'],
            'precio_contado' => ['required', 'numeric', 'min:0'],
            'precio_financiado' => ['required', 'numeric', 'min:0'],
            'precio_mayor' => ['nullable', 'numeric', 'min:0'],
            'garantia_meses' => ['required', 'integer', 'min:0'],
            'activo' => ['required', 'boolean'],
        ]);

        if (array_key_exists('precio_mayor', $data) && ($data['precio_mayor'] === '' || $data['precio_mayor'] === null)) {
            $data['precio_mayor'] = null;
        }

        $producto->update($data);

        return redirect()->route('productos.index')
            ->with('success', 'Producto actualizado correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Producto $producto)
    {
        $empresaId = request()->user()->resolvedEmpresaId();
        abort_unless($empresaId && (int) $producto->empresa_id === $empresaId, 404);

        $producto->delete();

        return redirect()->route('productos.index')
            ->with('success', 'Producto eliminado correctamente.');
    }
}
