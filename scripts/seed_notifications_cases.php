<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::where('email', 'admin@erp-bsolutions.local')->first()
    ?: \App\Models\User::orderBy('id')->first();

if (! $user) {
    echo "No hay usuarios.\n";
    exit(1);
}

$make = function (string $titulo, string $mensaje, array $meta = []) {
    $caso = (string) ($meta['caso'] ?? 'sistema');
    $tipo = match (true) {
        str_contains($caso, 'venta') => 'venta',
        str_contains($caso, 'cobro'), str_contains($caso, 'cuota') => 'cobro',
        str_contains($caso, 'stock') => 'inventario',
        str_contains($caso, 'gasto') => 'gasto',
        str_contains($caso, 'garantia') => 'garantia',
        str_contains($caso, 'servicio') => 'servicio',
        default => 'sistema',
    };
    $nivel = in_array($tipo, ['inventario', 'gasto', 'garantia'], true) || str_contains($caso, 'vencida')
        ? 'alerta'
        : 'info';

    return new \App\Notifications\SistemaNotificacion(
        $titulo,
        $mensaje,
        ['tipo' => $tipo, 'nivel' => $nivel, ...$meta]
    );
};

$venta = \App\Models\Venta::query()->where('sucursal_id', $user->sucursal_id)->latest('id')->first();
$fin = \App\Models\Financiamiento::query()->where('sucursal_id', $user->sucursal_id)->latest('id')->first();
$cuota = $fin ? \App\Models\CuotaFinanciamiento::query()->where('financiamiento_id', $fin->id)->orderBy('numero')->first() : null;
$pago = \App\Models\Pago::query()->where('sucursal_id', $user->sucursal_id)->latest('id')->first();
$producto = \App\Models\Producto::query()->where('activo', true)->latest('id')->first();
$garantia = \App\Models\Garantia::query()->where('sucursal_id', $user->sucursal_id)->latest('id')->first();
$st = \App\Models\ServicioTecnico::query()->where('sucursal_id', $user->sucursal_id)->latest('id')->first();

$casos = [
    [
        'titulo' => 'Venta registrada',
        'mensaje' => 'Se registró una venta en el POS.',
        // No existe ventas.show; si hay financiamiento ligado, apuntar a ese contrato; si no, al POS.
        'meta' => $fin
            ? ['caso' => 'venta_registrada', 'entidad' => 'financiamientos', 'entidad_id' => $fin->id, 'label' => 'Ver financiamiento', 'url' => route('financiamientos.show', $fin->id)]
            : ['caso' => 'venta_registrada', 'entidad' => 'ventas', 'label' => 'Ver POS', 'url' => route('ventas.pos')],
    ],
    [
        'titulo' => 'Cobro registrado',
        'mensaje' => 'Se registró un cobro de cuota.',
        // No existe pagos.show; llevar al financiamiento relacionado si existe.
        'meta' => $pago && $pago->financiamiento_id
            ? ['caso' => 'cobro_registrado', 'entidad' => 'financiamientos', 'entidad_id' => $pago->financiamiento_id, 'label' => 'Ver financiamiento', 'url' => route('financiamientos.show', $pago->financiamiento_id)]
            : ['caso' => 'cobro_registrado', 'entidad' => 'cobros', 'label' => 'Ver cobros', 'url' => route('cobros.index')],
    ],
    [
        'titulo' => 'Cuota vencida',
        'mensaje' => 'Hay una cuota vencida pendiente de pago.',
        'meta' => $fin
            ? ['caso' => 'cuota_vencida', 'entidad' => 'financiamientos', 'entidad_id' => $fin->id, 'cuota_id' => $cuota?->id, 'label' => 'Ver contrato', 'url' => route('financiamientos.show', $fin->id)]
            : ['caso' => 'cuota_vencida', 'entidad' => 'financiamientos', 'label' => 'Ver financiamientos', 'url' => route('financiamientos.index')],
    ],
    [
        'titulo' => 'Stock agotado',
        'mensaje' => 'Un producto quedó sin stock en almacén Principal.',
        'meta' => $producto
            ? ['caso' => 'stock_agotado', 'entidad' => 'productos', 'entidad_id' => $producto->id, 'label' => 'Ver producto', 'url' => route('productos.edit', $producto->id)]
            : ['caso' => 'stock_agotado', 'entidad' => 'inventario', 'label' => 'Ver inventario', 'url' => route('inventario.index')],
    ],
    [
        'titulo' => 'Caja sin abrir',
        'mensaje' => 'La sucursal no tiene caja abierta para hoy.',
        'meta' => ['caso' => 'caja_sin_abrir', 'entidad' => 'caja', 'label' => 'Ver caja', 'url' => route('caja.index')],
    ],
    [
        'titulo' => 'Gasto registrado',
        'mensaje' => 'Se registró un gasto en la sucursal.',
        'meta' => ['caso' => 'gasto_registrado', 'entidad' => 'gastos', 'label' => 'Ver gastos', 'url' => route('gastos.index')],
    ],
    [
        'titulo' => 'Garantía creada',
        'mensaje' => 'Se creó una garantía asociada a una venta.',
        'meta' => $garantia
            ? ['caso' => 'garantia_creada', 'entidad' => 'garantias', 'entidad_id' => $garantia->id, 'label' => 'Ver garantía', 'url' => route('garantias.edit', $garantia->id)]
            : ['caso' => 'garantia_creada', 'entidad' => 'garantias', 'label' => 'Ver garantías', 'url' => route('garantias.index')],
    ],
    [
        'titulo' => 'Servicio técnico creado',
        'mensaje' => 'Se creó un ticket de servicio técnico.',
        'meta' => $st
            ? ['caso' => 'servicio_tecnico_creado', 'entidad' => 'servicio_tecnico', 'entidad_id' => $st->id, 'label' => 'Ver ticket', 'url' => route('servicio-tecnico.edit', $st->id)]
            : ['caso' => 'servicio_tecnico_creado', 'entidad' => 'servicio_tecnico', 'label' => 'Ver servicio técnico', 'url' => route('servicio-tecnico.index')],
    ],
];

foreach ($casos as $c) {
    $user->notify($make($c['titulo'], $c['mensaje'], $c['meta']));
}

echo "OK: ".count($casos)." notificaciones creadas para {$user->email}\n";

