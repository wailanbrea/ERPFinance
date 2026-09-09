@php
    /** Valores solo visuales cuando un campo fiscal está vacío en BD (no son válidos ante DGII). */
    $phRnc = '13187654321';
    $phDir = 'Av. Winston Churchill esq. 27 de Febrero, Torre Corporativa II, Piso 8, Santo Domingo, D.N. República Dominicana';
    $phTel = '(809) 555-0100 · (829) 555-0200';
    $phNcf = 'B0100000024 — Comprobante fiscal con derecho a crédito (B01) · Secuencia autorizada de ejemplo';
    $rncVacio = trim((string) ($empresaRnc ?? '')) === '';
    $dirVacio = trim((string) ($empresaDireccionFiscal ?? '')) === '';
    $telVacio = trim((string) ($empresaTelefonoFiscal ?? '')) === '';
    $ncfVacio = trim((string) ($empresaNcfEjemplo ?? '')) === '';
    $mostrarRnc = $rncVacio ? $phRnc : trim((string) $empresaRnc);
    $mostrarDir = $dirVacio ? $phDir : trim((string) $empresaDireccionFiscal);
    $mostrarTel = $telVacio ? $phTel : trim((string) $empresaTelefonoFiscal);
    $mostrarNcf = $ncfVacio ? $phNcf : trim((string) $empresaNcfEjemplo);
    $fiscalDbVacío = $rncVacio && $dirVacio && $telVacio && $ncfVacio;
@endphp
<!DOCTYPE html>
<html lang="es">
    <head>
        <meta charset="utf-8" />
        <style>
            * { font-family: DejaVu Sans, sans-serif; }
            body { font-size: 12px; color: #111827; }
            .muted { color: #6b7280; }
            .row { width: 100%; }
            .header { margin-bottom: 14px; }
            .title { font-size: 18px; font-weight: 700; margin: 0; }
            .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 6px; }
            th { background: #f9fafb; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; }
            .right { text-align: right; }
            .totals td { border: none; padding: 4px 6px; }
            .demo { font-style: italic; color: #9ca3af; }
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <p class="title">{{ $empresaNombre }}</p>
                <p class="muted" style="margin: 2px 0 0 0;">Factura / Recibo de venta</p>
                <div class="muted" style="margin-top:8px;font-size:11px;line-height:1.45;">
                    <div><strong>RNC emisor:</strong> {{ $mostrarRnc }}@if($rncVacio)<span class="demo"> (ejemplo)</span>@endif</div>
                    <div><strong>Dirección fiscal:</strong> {{ $mostrarDir }}@if($dirVacio)<span class="demo"> (ejemplo)</span>@endif</div>
                    <div><strong>Tel.:</strong> {{ $mostrarTel }}@if($telVacio)<span class="demo"> (ejemplo)</span>@endif</div>
                    <div><strong>NCF / e-CF (referencia):</strong> {{ $mostrarNcf }}@if($ncfVacio)<span class="demo"> (ejemplo)</span>@endif</div>
                </div>
                @if($fiscalDbVacío)
                    <div class="muted" style="margin-top:6px;font-size:9px;line-height:1.35;">
                        * Los cuatro datos anteriores son de demostración. Configúrelos en la empresa (SuperAdmin o administración) para datos reales ante DGII.
                    </div>
                @elseif($rncVacio || $dirVacio || $telVacio || $ncfVacio)
                    <div class="muted" style="margin-top:6px;font-size:9px;line-height:1.35;">
                        * Los ítems marcados «(ejemplo)» completan la vista previa; reemplácelos en la ficha fiscal de la empresa.
                    </div>
                @endif
            </div>
        </div>

        <div class="row" style="display:flex; gap: 10px;">
            <div class="box" style="flex:1;">
                <div class="muted" style="font-size: 10px; text-transform: uppercase; letter-spacing: .06em;">Factura</div>
                <div style="margin-top:6px;">
                    <div><strong>No.</strong> {{ $venta->numero_factura ?? ('FAC-'.str_pad((string)$venta->id, 6, '0', STR_PAD_LEFT)) }}</div>
                    <div><strong>Fecha</strong> {{ (string) $venta->fecha }}</div>
                    <div><strong>Tipo</strong> {{ (string) $venta->tipo }}</div>
                    <div><strong>Modalidad</strong> {{ ($venta->modalidad ?? 'detalle') === 'mayor' ? 'Al por mayor' : 'Al detalle (retail)' }}</div>
                    <div><strong>Estado</strong> {{ (string) $venta->estado }}</div>
                </div>
            </div>

            <div class="box" style="flex:1;">
                <div class="muted" style="font-size: 10px; text-transform: uppercase; letter-spacing: .06em;">Cliente</div>
                <div style="margin-top:6px;">
                    <div><strong>Nombre</strong> {{ $venta->cliente ? trim($venta->cliente->nombre.' '.$venta->cliente->apellido) : '—' }}</div>
                    <div><strong>Cédula/RNC</strong> {{ $venta->cliente?->cedula_rnc ?? '—' }}</div>
                    <div><strong>Tel.</strong> {{ $venta->cliente?->telefono ?? '—' }}</div>
                </div>
            </div>
        </div>

        <div style="height: 12px;"></div>

        <table>
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th class="right">Cant.</th>
                    <th class="right">Precio</th>
                    <th class="right">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @foreach($venta->detalles as $d)
                    <tr>
                        <td>{{ $d->producto?->nombre ?? '—' }}</td>
                        <td class="muted">{{ $d->producto?->sku ?? '—' }}</td>
                        <td class="right">{{ number_format((float)$d->cantidad, 2) }}</td>
                        <td class="right">RD$ {{ number_format((float)$d->precio_unitario, 2) }}</td>
                        <td class="right">RD$ {{ number_format((float)$d->subtotal, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div style="height: 10px;"></div>

        <table class="totals" style="width: 260px; margin-left: auto;">
            <tr>
                <td class="muted">Subtotal</td>
                <td class="right">RD$ {{ number_format((float)$venta->subtotal, 2) }}</td>
            </tr>
            <tr>
                <td class="muted">Descuento</td>
                <td class="right">RD$ {{ number_format((float)$venta->descuento, 2) }}</td>
            </tr>
            <tr>
                <td class="muted">Impuesto</td>
                <td class="right">RD$ {{ number_format((float)$venta->impuesto, 2) }}</td>
            </tr>
            <tr>
                <td><strong>Total</strong></td>
                <td class="right"><strong>RD$ {{ number_format((float)$venta->total, 2) }}</strong></td>
            </tr>
        </table>

        @if(!empty(trim((string) ($empresaNotaFiscal ?? ''))))
            <div class="muted" style="margin-top:14px;font-size:10px;line-height:1.45;">
                {!! nl2br(e($empresaNotaFiscal)) !!}
            </div>
        @else
            <div class="muted" style="margin-top:14px;font-size:10px;line-height:1.5;border-top:1px solid #e5e7eb;padding-top:10px;">
                <strong>Documento interno / comprobante de venta</strong> — Vista previa de pie fiscal para DGII (texto de demostración).<br /><br />
                <strong>ITBIS (18%):</strong> el desglose legal por tasa y base imponible se consolida en el comprobante fiscal electrónico (e-CF) oficial.<br />
                <strong>NCF / e-CF:</strong> secuencia autorizada por DGII (ej. B01, B02, E31…); cada comprobante lleva número único y QR según normativa vigente.<br />
                <strong>Responsable tributario:</strong> {{ $empresaNombre }} — RNC en documento oficial debe coincidir con el registrado ante DGII.<br />
                <strong>Consulta e-CF:</strong> https://ecf.dgii.gov.do (enlace informativo; el comprobante válido es el generado en el sistema certificado).<br /><br />
                Para producción: configure en la empresa los datos fiscales reales, la nota al pie legal y la integración con su proveedor / PSE para emisión de e-CF y secuencias NCF conforme a su régimen.
            </div>
        @endif
    </body>
</html>
