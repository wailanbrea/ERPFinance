<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\DireccionCliente;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClienteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = request()->user();
        $buscar = request()->string('buscar')->toString();

        $clientes = Cliente::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->when($buscar !== '', function ($q) use ($buscar) {
                $q->where(function ($q) use ($buscar) {
                    $q->where('nombre', 'like', "%{$buscar}%")
                        ->orWhere('apellido', 'like', "%{$buscar}%")
                        ->orWhere('cedula_rnc', 'like', "%{$buscar}%")
                        ->orWhere('telefono', 'like', "%{$buscar}%");
                });
            })
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Clientes/Index', [
            'clientes' => $clientes,
            'filtros' => [
                'buscar' => $buscar,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Clientes/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'apellido' => ['nullable', 'string', 'max:255'],
            'cedula_rnc' => ['nullable', 'string', 'max:50'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'whatsapp' => ['nullable', 'string', 'max:50'],
            'direccion' => ['nullable', 'string'],
            'referencias' => ['nullable', 'string'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            'estado' => ['required', 'string', 'max:50'],
        ]);

        $data['sucursal_id'] = $request->user()->sucursal_id;

        $cliente = Cliente::create($data);

        // Sincronizar dirección principal en tabla direcciones_clientes (para rutas/mapas)
        $this->upsertDireccionPrincipal($cliente, $data);

        return redirect()->route('clientes.index')
            ->with('success', 'Cliente creado correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Cliente $cliente)
    {
        return redirect()->route('clientes.edit', $cliente);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Cliente $cliente)
    {
        $this->abortIfNotFromSucursal($cliente);

        $dir = DireccionCliente::query()
            ->where('cliente_id', $cliente->id)
            ->where('principal', true)
            ->orderByDesc('id')
            ->first();

        return Inertia::render('Clientes/Edit', [
            'cliente' => $cliente,
            'direccionPrincipal' => $dir,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Cliente $cliente)
    {
        $this->abortIfNotFromSucursal($cliente);

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'apellido' => ['nullable', 'string', 'max:255'],
            'cedula_rnc' => ['nullable', 'string', 'max:50'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'whatsapp' => ['nullable', 'string', 'max:50'],
            'direccion' => ['nullable', 'string'],
            'referencias' => ['nullable', 'string'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            'estado' => ['required', 'string', 'max:50'],
        ]);

        $cliente->update($data);

        $this->upsertDireccionPrincipal($cliente, $data);

        return redirect()->route('clientes.index')
            ->with('success', 'Cliente actualizado correctamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Cliente $cliente)
    {
        $this->abortIfNotFromSucursal($cliente);

        $cliente->delete();

        return redirect()->route('clientes.index')
            ->with('success', 'Cliente eliminado correctamente.');
    }

    private function abortIfNotFromSucursal(Cliente $cliente): void
    {
        abort_unless($cliente->sucursal_id === request()->user()->sucursal_id, 404);
    }

    private function upsertDireccionPrincipal(Cliente $cliente, array $data): void
    {
        $dirTxt = trim((string) ($data['direccion'] ?? ''));
        $refTxt = trim((string) ($data['referencias'] ?? ''));

        if ($dirTxt === '' && $refTxt === '' && !array_key_exists('lat', $data) && !array_key_exists('lng', $data)) {
            return;
        }

        $lat = array_key_exists('lat', $data) ? ($data['lat'] !== null && $data['lat'] !== '' ? (float) $data['lat'] : null) : null;
        $lng = array_key_exists('lng', $data) ? ($data['lng'] !== null && $data['lng'] !== '' ? (float) $data['lng'] : null) : null;

        $dir = DireccionCliente::query()->firstOrCreate(
            ['cliente_id' => $cliente->id, 'tipo' => 'principal'],
            ['direccion' => $dirTxt ?: ($cliente->direccion ?? ''), 'referencia' => $refTxt ?: ($cliente->referencias ?? ''), 'principal' => true],
        );

        $dir->principal = true;
        if ($dirTxt !== '') {
            $dir->direccion = $dirTxt;
        }
        $dir->referencia = $refTxt !== '' ? $refTxt : null;

        if ($lat !== null && $lng !== null) {
            $dir->lat = $lat;
            $dir->lng = $lng;
            $dir->geocode_source = 'manual';
            $dir->geocode_updated_at = now();
        }

        $dir->save();
    }
}
