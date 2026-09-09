<?php

namespace App\Services;

use App\Models\Venta;

class FacturaTicketService
{
    public function render(Venta $venta): string
    {
        $venta->loadMissing(['sucursal.empresa', 'cliente', 'detalles.producto']);
        $empresa = $venta->sucursal?->empresa;
        // Strip control bytes from stored text before sending it to an ESC/POS device.
        $clean = fn ($value) => preg_replace('/[\x00-\x1F\x7F]/u', ' ', (string) $value) ?? '';
        $money = fn ($value) => number_format((float) $value, 2, '.', ',');
        $lines = [$clean($empresa?->nombre ?? config('app.name')), 'RECIBO DE VENTA',
            'No. '.$clean($venta->numero_factura ?: $venta->id), 'Fecha: '.$clean($venta->fecha)];
        if ($empresa?->rnc) $lines[] = 'RNC: '.$clean($empresa->rnc);
        $lines[] = 'Cliente: '.$clean($venta->cliente ? trim($venta->cliente->nombre.' '.$venta->cliente->apellido) : 'Consumidor final');
        $lines[] = '--------------------------------';
        foreach ($venta->detalles as $detalle) {
            $lines[] = $clean($detalle->producto?->nombre ?? 'Producto');
            $lines[] = $clean($detalle->cantidad).' x '.$money($detalle->precio_unitario).' = '.$money($detalle->subtotal);
        }
        $lines = [...$lines, '--------------------------------', 'Subtotal: RD$ '.$money($venta->subtotal),
            'Descuento: RD$ '.$money($venta->descuento), 'Impuesto: RD$ '.$money($venta->impuesto),
            'TOTAL: RD$ '.$money($venta->total), 'Tipo: '.$clean($venta->tipo), 'Gracias por su compra.'];
        return implode("\n", $lines);
    }
}
