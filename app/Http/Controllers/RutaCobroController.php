<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\ClienteRuta;
use App\Models\RutaCobro;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RutaCobroController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $q = $request->string('q')->toString();

        $rutas = RutaCobro::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->when($q, fn ($qq) => $qq->where('nombre', 'like', "%{$q}%"))
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('RutasCobro/Index', [
            'rutas' => $rutas,
            'filtros' => ['q' => $q],
        ]);
    }

    public function create(Request $request)
    {
        $user = $request->user();

        return Inertia::render('RutasCobro/Create', [
            'cobradores' => User::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:200'],
            'dia' => ['nullable', 'string', 'max:20'],
            'sector' => ['nullable', 'string', 'max:120'],
            'frecuencia' => ['nullable', 'in:semanal,quincenal,mensual'],
            'cobrador_id' => ['nullable', 'exists:users,id'],
            'activa' => ['nullable', 'boolean'],
        ]);

        RutaCobro::create([
            'sucursal_id' => $user->sucursal_id,
            'nombre' => $data['nombre'],
            'dia' => $data['dia'] ?? null,
            'sector' => $data['sector'] ?? null,
            'frecuencia' => $data['frecuencia'] ?? null,
            'cobrador_id' => $data['cobrador_id'] ?? null,
            'activa' => (bool) ($data['activa'] ?? true),
        ]);

        return redirect()->route('rutas_cobro.index')->with('success', 'Ruta creada.');
    }

    public function edit(Request $request, RutaCobro $rutaCobro)
    {
        $user = $request->user();
        abort_unless($rutaCobro->sucursal_id === $user->sucursal_id, 404);

        $paradas = ClienteRuta::query()
            ->join('clientes', 'clientes.id', '=', 'clientes_rutas.cliente_id')
            ->leftJoin('direcciones_clientes as dc', function ($j) {
                $j->on('dc.cliente_id', '=', 'clientes.id')
                    ->where('dc.principal', '=', 1);
            })
            ->where('clientes_rutas.ruta_cobro_id', $rutaCobro->id)
            ->orderByRaw('clientes_rutas.orden is null')
            ->orderBy('clientes_rutas.orden')
            ->orderBy('clientes.nombre')
            ->get([
                'clientes_rutas.cliente_id',
                'clientes_rutas.orden',
                'clientes.nombre',
                'clientes.apellido',
                'clientes.telefono',
                'clientes.cedula_rnc',
                'dc.direccion as direccion',
                'dc.referencia as referencia',
                'dc.lat as lat',
                'dc.lng as lng',
            ])
            ->map(fn ($r) => [
                'cliente_id' => (int) $r->cliente_id,
                'orden' => $r->orden === null ? null : (int) $r->orden,
                'nombre' => $r->nombre,
                'apellido' => $r->apellido,
                'telefono' => $r->telefono,
                'cedula_rnc' => $r->cedula_rnc,
                'direccion' => $r->direccion,
                'referencia' => $r->referencia,
                'lat' => $r->lat === null ? null : (float) $r->lat,
                'lng' => $r->lng === null ? null : (float) $r->lng,
            ])
            ->values();

        return Inertia::render('RutasCobro/Edit', [
            'ruta' => $rutaCobro,
            'cobradores' => User::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
            'clientes' => Cliente::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->orderBy('nombre')
                ->limit(500)
                ->get(['id', 'nombre', 'apellido', 'cedula_rnc', 'telefono']),
            'clientesAsignados' => ClienteRuta::query()
                ->where('ruta_cobro_id', $rutaCobro->id)
                ->pluck('cliente_id'),
            'paradas' => $paradas,
        ]);
    }

    public function update(Request $request, RutaCobro $rutaCobro)
    {
        $user = $request->user();
        abort_unless($rutaCobro->sucursal_id === $user->sucursal_id, 404);

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:200'],
            'dia' => ['nullable', 'string', 'max:20'],
            'sector' => ['nullable', 'string', 'max:120'],
            'frecuencia' => ['nullable', 'in:semanal,quincenal,mensual'],
            'cobrador_id' => ['nullable', 'exists:users,id'],
            'activa' => ['nullable', 'boolean'],
            'clientes' => ['nullable', 'array'],
            'clientes.*' => ['integer', 'exists:clientes,id'],
        ]);

        $rutaCobro->update([
            'nombre' => $data['nombre'],
            'dia' => $data['dia'] ?? null,
            'sector' => $data['sector'] ?? null,
            'frecuencia' => $data['frecuencia'] ?? null,
            'cobrador_id' => $data['cobrador_id'] ?? null,
            'activa' => (bool) ($data['activa'] ?? true),
        ]);

        if (array_key_exists('clientes', $data)) {
            ClienteRuta::query()->where('ruta_cobro_id', $rutaCobro->id)->delete();
            foreach (($data['clientes'] ?? []) as $clienteId) {
                ClienteRuta::create([
                    'ruta_cobro_id' => $rutaCobro->id,
                    'cliente_id' => $clienteId,
                ]);
            }
        }

        return redirect()->route('rutas_cobro.index')->with('success', 'Ruta actualizada.');
    }

    public function guardarOrden(Request $request, RutaCobro $rutaCobro)
    {
        $user = $request->user();
        abort_unless($rutaCobro->sucursal_id === $user->sucursal_id, 404);

        $data = $request->validate([
            'cliente_ids' => ['required', 'array', 'min:1'],
            'cliente_ids.*' => ['integer', 'exists:clientes,id'],
        ]);

        $ids = array_values(array_unique(array_map('intval', $data['cliente_ids'])));

        $asignados = ClienteRuta::query()
            ->where('ruta_cobro_id', $rutaCobro->id)
            ->whereIn('cliente_id', $ids)
            ->pluck('cliente_id')
            ->map(fn ($v) => (int) $v)
            ->all();

        $setAsignados = array_flip($asignados);
        $orden = 1;
        foreach ($ids as $cid) {
            if (!isset($setAsignados[$cid])) {
                continue;
            }
            ClienteRuta::query()
                ->where('ruta_cobro_id', $rutaCobro->id)
                ->where('cliente_id', $cid)
                ->update(['orden' => $orden]);
            $orden++;
        }

        return back()->with('success', 'Orden guardado.');
    }

    public function destroy(Request $request, RutaCobro $rutaCobro)
    {
        $user = $request->user();
        abort_unless($rutaCobro->sucursal_id === $user->sucursal_id, 404);

        $rutaCobro->delete();

        return back()->with('success', 'Ruta eliminada.');
    }
}
