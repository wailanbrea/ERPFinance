<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Ajuste;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConfiguracionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $claves = [
            'empresa.nombre',
            'empresa.rnc',
            'ventas.itbis_porcentaje',
            'financiamiento.interes_porcentaje',
            'cobros.mora_diaria',
            'lector.activo',
            'lector.auto_agregar',
            'lector.auto_sumar',
            'lector.limpiar_al_agregar',
            'lector.usar_sku',
        ];

        $ajustes = Ajuste::query()
            ->where(function ($q) use ($user) {
                $q->whereNull('sucursal_id')->orWhere('sucursal_id', $user->sucursal_id);
            })
            ->whereIn('clave', $claves)
            ->get()
            ->keyBy('clave')
            ->map(fn ($a) => $a->valor)
            ->all();

        return Inertia::render('Configuracion/Index', [
            'ajustes' => $ajustes,
            'claves' => $claves,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'ajustes' => ['required', 'array'],
        ]);

        foreach ($data['ajustes'] as $clave => $valor) {
            Ajuste::query()->updateOrCreate(
                ['sucursal_id' => $user->sucursal_id, 'clave' => (string) $clave],
                ['valor' => is_scalar($valor) ? (string) $valor : json_encode($valor)]
            );
        }

        return back()->with('success', 'Configuración guardada.');
    }
}
