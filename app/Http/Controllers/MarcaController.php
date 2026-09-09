<?php

namespace App\Http\Controllers;

use App\Models\Marca;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MarcaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $buscar = request()->string('buscar')->toString();

        $marcas = Marca::query()
            ->when($buscar !== '', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%"))
            ->orderBy('nombre')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Marcas/Index', [
            'marcas' => $marcas,
            'filtros' => ['buscar' => $buscar],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Marcas/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255', 'unique:marcas,nombre'],
            'activa' => ['required', 'boolean'],
        ]);

        Marca::create($data);

        return redirect()->route('marcas.index')
            ->with('success', 'Marca creada correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Marca $marca)
    {
        return redirect()->route('marcas.edit', $marca);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Marca $marca)
    {
        return Inertia::render('Marcas/Edit', [
            'marca' => $marca,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Marca $marca)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255', "unique:marcas,nombre,{$marca->id}"],
            'activa' => ['required', 'boolean'],
        ]);

        $marca->update($data);

        return redirect()->route('marcas.index')
            ->with('success', 'Marca actualizada correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Marca $marca)
    {
        $marca->delete();

        return redirect()->route('marcas.index')
            ->with('success', 'Marca eliminada correctamente.');
    }
}
