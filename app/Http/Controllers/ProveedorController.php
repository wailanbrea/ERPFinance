<?php

namespace App\Http\Controllers;

use App\Models\Proveedor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProveedorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = request()->user();
        $buscar = request()->string('buscar')->toString();

        $proveedores = Proveedor::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->when($buscar !== '', fn ($q) => $q->where('nombre', 'like', "%{$buscar}%"))
            ->orderBy('nombre')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Proveedores/Index', [
            'proveedores' => $proveedores,
            'filtros' => ['buscar' => $buscar],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Proveedores/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'rnc' => ['nullable', 'string', 'max:50'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'activo' => ['required', 'boolean'],
        ]);

        $data['sucursal_id'] = $request->user()->sucursal_id;

        Proveedor::create($data);

        return redirect()->route('proveedores.index')
            ->with('success', 'Proveedor creado correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Proveedor $proveedor)
    {
        return redirect()->route('proveedores.edit', $proveedor);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Proveedor $proveedor)
    {
        $this->abortIfNotFromSucursal($proveedor);

        return Inertia::render('Proveedores/Edit', [
            'proveedor' => $proveedor,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Proveedor $proveedor)
    {
        $this->abortIfNotFromSucursal($proveedor);

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'rnc' => ['nullable', 'string', 'max:50'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'activo' => ['required', 'boolean'],
        ]);

        $proveedor->update($data);

        return redirect()->route('proveedores.index')
            ->with('success', 'Proveedor actualizado correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Proveedor $proveedor)
    {
        $this->abortIfNotFromSucursal($proveedor);

        $proveedor->delete();

        return redirect()->route('proveedores.index')
            ->with('success', 'Proveedor eliminado correctamente.');
    }

    private function abortIfNotFromSucursal(Proveedor $proveedor): void
    {
        abort_unless($proveedor->sucursal_id === request()->user()->sucursal_id, 404);
    }
}
