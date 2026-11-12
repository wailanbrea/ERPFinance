<?php

namespace App\Http\Controllers;

use App\Models\Apartado;
use App\Services\ApartadoService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ApartadoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $empresaId = $user->resolvedEmpresaId();
        abort_unless($empresaId, 403, 'Sin empresa asignada.');

        $q = $request->string('q')->toString();
        $estado = $request->string('estado')->toString();

        $apartados = Apartado::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->with([
                'cliente:id,nombre,apellido,cedula_rnc,telefono,whatsapp',
                'venta.detalles.producto:id,nombre,sku',
                'cuotas',
                'pagos',
            ])
            ->when($estado !== '', function ($query) use ($estado) {
                $query->where('estado', $estado);
            })
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($w) use ($q) {
                    $w->whereHas('cliente', function ($c) use ($q) {
                        $c->where('nombre', 'like', "%{$q}%")
                            ->orWhere('apellido', 'like', "%{$q}%")
                            ->orWhere('cedula_rnc', 'like', "%{$q}%")
                            ->orWhere('telefono', 'like', "%{$q}%");
                    })
                    ->orWhereHas('venta', function ($v) use ($q) {
                        $v->where('numero_factura', 'like', "%{$q}%");
                    });

                    if (ctype_digit($q)) {
                        $w->orWhere('id', (int) $q)
                          ->orWhere('venta_id', (int) $q);
                    }
                });
            })
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Apartados/Index', [
            'apartados' => $apartados,
            'filtros' => [
                'q' => $q,
                'estado' => $estado,
            ],
        ]);
    }

    public function abonar(Request $request, Apartado $apartado, ApartadoService $apartadoService)
    {
        $user = $request->user();
        abort_unless((int) $apartado->sucursal_id === (int) $user->sucursal_id, 403);

        $data = $request->validate([
            'monto' => ['required', 'numeric', 'min:0.01'],
            'metodo_pago' => ['required', 'string', 'in:efectivo,transferencia,tarjeta,deposito'],
            'fecha' => ['nullable', 'date'],
            'nota' => ['nullable', 'string', 'max:500'],
        ]);

        $apartadoService->registrarAbono(
            $apartado,
            (float) $data['monto'],
            (string) $data['metodo_pago'],
            $data['fecha'] ?? null,
            $data['nota'] ?? null
        );

        return back()->with('success', 'Abono registrado correctamente.');
    }

    public function cancelar(Request $request, Apartado $apartado, ApartadoService $apartadoService)
    {
        $user = $request->user();
        abort_unless((int) $apartado->sucursal_id === (int) $user->sucursal_id, 403);

        $data = $request->validate([
            'motivo' => ['nullable', 'string', 'max:500'],
        ]);

        $apartadoService->cancelarApartado(
            $apartado,
            $data['motivo'] ?? 'Cancelación de apartado solicitada por el cliente'
        );

        return back()->with('success', 'Apartado cancelado exitosamente. Los productos han sido reincorporados al inventario.');
    }
}
