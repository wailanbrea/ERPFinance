<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoriaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $buscar = request()->string('buscar')->toString();

        $categorias = Categoria::query()
            ->when($buscar !== '', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%"))
            ->orderBy('nombre')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Categorias/Index', [
            'categorias' => $categorias,
            'filtros' => ['buscar' => $buscar],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Categorias/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255', 'unique:categorias,nombre'],
            'activa' => ['required', 'boolean'],
        ]);

        Categoria::create($data);

        return redirect()->route('productos.index')
            ->with('success', "Categoría {$data['nombre']} creada. Ya está disponible en los filtros y formularios de productos.");
    }

    /**
     * Display the specified resource.
     */
    public function show(Categoria $categoria)
    {
        return redirect()->route('categorias.edit', $categoria);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Categoria $categoria)
    {
        return Inertia::render('Categorias/Edit', [
            'categoria' => $categoria,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Categoria $categoria)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255', "unique:categorias,nombre,{$categoria->id}"],
            'activa' => ['required', 'boolean'],
        ]);

        $categoria->update($data);

        return redirect()->route('categorias.index')
            ->with('success', 'Categoría actualizada correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Categoria $categoria)
    {
        if ($categoria->productos()->exists()) {
            return redirect()->route('categorias.index')
                ->with('error', 'No se puede eliminar una categoría que tiene productos. Puedes marcarla como inactiva.');
        }

        $categoria->delete();

        return redirect()->route('categorias.index')
            ->with('success', 'Categoría eliminada correctamente.');
    }
}
