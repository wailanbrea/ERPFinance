<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;

class FacturaController extends Controller
{
    public function ticket(Request $request, Venta $venta, \App\Services\FacturaTicketService $tickets)
    {
        $user = $request->user();
        $empresaId = $user->resolvedEmpresaId();
        abort_unless($empresaId && $user->sucursal_id
            && (int) $venta->sucursal_id === (int) $user->sucursal_id
            && (int) $venta->sucursal?->empresa_id === $empresaId, 404);

        return response()->json(['content' => $tickets->render($venta)])
            ->header('Cache-Control', 'no-store');
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $empresaId = $user->resolvedEmpresaId();

        $q = $request->string('q')->toString();

        $ventas = Venta::query()
            ->where('sucursal_id', $user->sucursal_id)
            ->when($empresaId, function (Builder $qq) use ($empresaId) {
                $qq->whereHas('sucursal', fn (Builder $s) => $s->where('empresa_id', $empresaId));
            })
            ->with([
                'cliente:id,nombre,apellido,cedula_rnc,telefono',
                'detalles.producto:id,nombre,sku',
            ])
            ->when($q !== '', function (Builder $qq) use ($q) {
                $qq->where(function (Builder $w) use ($q) {
                    $w->where('ventas.numero_factura', 'like', "%{$q}%")
                        ->orWhereHas('cliente', function (Builder $c) use ($q) {
                            $c->where('nombre', 'like', "%{$q}%")
                                ->orWhere('apellido', 'like', "%{$q}%")
                                ->orWhere('cedula_rnc', 'like', "%{$q}%");
                        });
                    if (ctype_digit($q)) {
                        $w->orWhere('ventas.id', (int) $q);
                    }
                });
            })
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $ventas->getCollection()->transform(function (Venta $v) {
            return [
                'id' => $v->id,
                'numero_factura' => $v->numero_factura,
                'fecha' => $v->fecha,
                'tipo' => $v->tipo,
                'modalidad' => $v->modalidad ?? 'detalle',
                'subtotal' => (float) $v->subtotal,
                'descuento' => (float) $v->descuento,
                'impuesto' => (float) $v->impuesto,
                'total' => (float) $v->total,
                'estado' => $v->estado,
                'cliente' => $v->cliente ? [
                    'id' => $v->cliente->id,
                    'nombre' => trim($v->cliente->nombre.' '.$v->cliente->apellido),
                    'cedula_rnc' => $v->cliente->cedula_rnc,
                ] : null,
                'detalles' => $v->detalles->map(fn ($d) => [
                    'id' => $d->id,
                    'producto' => $d->producto ? [
                        'id' => $d->producto->id,
                        'nombre' => $d->producto->nombre,
                        'sku' => $d->producto->sku,
                    ] : null,
                    'cantidad' => (float) $d->cantidad,
                    'precio_unitario' => (float) $d->precio_unitario,
                    'subtotal' => (float) $d->subtotal,
                ])->values(),
            ];
        });

        return Inertia::render('Facturas/Index', [
            'ventas' => $ventas,
            'filtros' => ['q' => $q],
        ]);
    }

    public function pdf(Request $request, Venta $venta)
    {
        $user = $request->user();
        abort_unless((int) $venta->sucursal_id === (int) $user->sucursal_id, 404);

        $empresaId = $user->resolvedEmpresaId();
        if ($empresaId && (int) ($venta->sucursal?->empresa_id ?? 0) !== $empresaId) {
            abort(404);
        }

        $venta->load([
            'sucursal:id,empresa_id',
            'cliente:id,nombre,apellido,cedula_rnc,telefono,whatsapp',
            'detalles.producto:id,nombre,sku',
        ]);

        $empresaModel = $user->empresa ?: ($user->sucursal?->empresa);
        $empresaNombre = $empresaModel?->nombre ?? config('app.name', 'ERP Bsolutions Finanzas');

        $pdf = Pdf::loadView('pdf.factura', [
            'empresaNombre' => $empresaNombre,
            'empresaRnc' => $empresaModel?->rnc,
            'empresaDireccionFiscal' => $empresaModel?->direccion_fiscal,
            'empresaTelefonoFiscal' => $empresaModel?->telefono_fiscal,
            'empresaNcfEjemplo' => $empresaModel?->ncf_ejemplo,
            'empresaNotaFiscal' => $empresaModel?->nota_fiscal_pdf,
            'venta' => $venta,
        ])->setPaper('letter');

        $filename = ($venta->numero_factura ? $venta->numero_factura : 'FACTURA-'.$venta->id).'.pdf';

        return $pdf->stream($filename);
    }
}

