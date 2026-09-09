<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\StockProducto;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AlmacenController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = request()->user();
        $buscar = request()->string('buscar')->toString();

        $almacenes = Almacen::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->select('almacenes.*')
            ->addSelect([
                'productos_count' => StockProducto::query()
                    ->selectRaw('COUNT(DISTINCT producto_id)')
                    ->whereColumn('almacen_id', 'almacenes.id'),
                'items_count' => StockProducto::query()
                    ->selectRaw('COUNT(*)')
                    ->whereColumn('almacen_id', 'almacenes.id'),
                'stock_total' => StockProducto::query()
                    ->selectRaw('COALESCE(SUM(stock),0)')
                    ->whereColumn('almacen_id', 'almacenes.id'),
            ])
            ->when($buscar !== '', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%"))
            ->orderBy('nombre')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Almacenes/Index', [
            'almacenes' => $almacenes,
            'filtros' => ['buscar' => $buscar],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Almacenes/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'tipo' => ['required', 'string', 'max:50'],
            'activo' => ['required', 'boolean'],
        ]);

        $data['sucursal_id'] = $request->user()->sucursal_id;

        Almacen::create($data);

        return redirect()->route('almacenes.index')
            ->with('success', 'Almacén creado correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Almacen $almacen)
    {
        $this->abortIfNotFromSucursal($almacen);

        $stock = StockProducto::query()
            ->where('almacen_id', $almacen->id)
            ->with(['producto:id,nombre,sku'])
            ->orderByDesc('id')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Almacenes/Show', [
            'almacen' => $almacen,
            'stock' => $stock,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Almacen $almacen)
    {
        $this->abortIfNotFromSucursal($almacen);

        return Inertia::render('Almacenes/Edit', [
            'almacen' => $almacen,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Almacen $almacen)
    {
        $this->abortIfNotFromSucursal($almacen);

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'tipo' => ['required', 'string', 'max:50'],
            'activo' => ['required', 'boolean'],
        ]);

        $almacen->update($data);

        return redirect()->route('almacenes.index')
            ->with('success', 'Almacén actualizado correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Almacen $almacen)
    {
        $this->abortIfNotFromSucursal($almacen);

        $almacen->delete();

        return redirect()->route('almacenes.index')
            ->with('success', 'Almacén eliminado correctamente.');
    }

    private function abortIfNotFromSucursal(Almacen $almacen): void
    {
        abort_unless($almacen->sucursal_id === request()->user()->sucursal_id, 404);
    }
}
