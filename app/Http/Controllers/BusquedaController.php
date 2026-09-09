<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Financiamiento;
use App\Models\Producto;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BusquedaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $q = $request->string('q')->trim()->toString();
        $empresaId = $user->resolvedEmpresaId();
        $sucursalId = $user->sucursal_id;

        $clientes = collect();
        $productos = collect();
        $financiamientos = collect();

        if (strlen($q) >= 2) {
            if ($user->can('clientes.ver')) {
                $clientes = Cliente::query()
                    ->where('sucursal_id', $sucursalId)
                    ->where(function ($w) use ($q) {
                        $w->where('nombre', 'like', "%{$q}%")
                            ->orWhere('apellido', 'like', "%{$q}%")
                            ->orWhere('cedula_rnc', 'like', "%{$q}%")
                            ->orWhere('telefono', 'like', "%{$q}%");
                    })
                    ->orderBy('nombre')
                    ->limit(12)
                    ->get(['id', 'nombre', 'apellido', 'cedula_rnc', 'telefono']);
            }

            if ($user->can('productos.ver')) {
                $productos = Producto::query()
                    ->forEmpresa($empresaId)
                    ->where('activo', true)
                    ->where(function ($w) use ($q) {
                        $w->where('nombre', 'like', "%{$q}%")
                            ->orWhere('sku', 'like', "%{$q}%")
                            ->orWhere('codigo_barra', 'like', "%{$q}%")
                            ->orWhere('qr', 'like', "%{$q}%");
                    })
                    ->orderBy('nombre')
                    ->limit(12)
                    ->get(['id', 'nombre', 'sku', 'codigo_barra']);
            }

            if ($user->can('financiamientos.ver')) {
                $financiamientos = Financiamiento::query()
                    ->where('sucursal_id', $sucursalId)
                    ->where(function ($w) use ($q) {
                        $w->whereHas('cliente', function ($c) use ($q) {
                            $c->where('nombre', 'like', "%{$q}%")
                                ->orWhere('apellido', 'like', "%{$q}%")
                                ->orWhere('telefono', 'like', "%{$q}%");
                        });
                        if (ctype_digit($q)) {
                            $w->orWhere('financiamientos.id', (int) $q);
                        }
                    })
                    ->with('cliente:id,nombre,apellido')
                    ->orderByDesc('id')
                    ->limit(12)
                    ->get(['id', 'cliente_id', 'balance', 'estado']);
            }
        }

        return Inertia::render('Busqueda/Index', [
            'q' => $q,
            'clientes' => $clientes,
            'productos' => $productos,
            'financiamientos' => $financiamientos,
        ]);
    }
}
