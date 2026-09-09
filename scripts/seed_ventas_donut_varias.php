<?php

/**
 * Seed de ventas variadas para que el donut (ventas por categoría) se vea diverso.
 *
 * Uso:
 *   php scripts/seed_ventas_donut_varias.php
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Almacen;
use App\Models\Cliente;
use App\Models\DetalleVenta;
use App\Models\Producto;
use App\Models\Sucursal;
use App\Models\User;
use App\Models\Venta;
use App\Services\InventarioService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

$sucursal = Sucursal::query()->where('codigo', 'CENTRAL')->first();
if (! $sucursal) {
    echo "No existe sucursal CENTRAL.\n";
    exit(0);
}

$admin = User::query()->where('email', 'admin@erp-bsolutions.local')->first();
if (! $admin) {
    echo "No existe usuario admin@erp-bsolutions.local.\n";
    exit(0);
}

$almacen = Almacen::query()->where('sucursal_id', $sucursal->id)->orderBy('id')->first();
if (! $almacen) {
    echo "No existe almacén en sucursal CENTRAL.\n";
    exit(0);
}

// Asegurar algunos clientes demo
$clientes = Cliente::query()->where('sucursal_id', $sucursal->id)->limit(20)->get();
if ($clientes->isEmpty()) {
    for ($i = 1; $i <= 5; $i++) {
        Cliente::query()->firstOrCreate(
            ['cedula_rnc' => "090000000{$i}"],
            [
                'sucursal_id' => $sucursal->id,
                'nombre' => 'Cliente',
                'apellido' => "Venta {$i}",
                'telefono' => '809-555-40'.str_pad((string) $i, 2, '0', STR_PAD_LEFT),
                'whatsapp' => '809-555-40'.str_pad((string) $i, 2, '0', STR_PAD_LEFT),
                'direccion' => "Dirección demo ventas {$i}",
                'referencias' => "Referencia demo ventas {$i}",
                'estado' => 'activo',
            ]
        );
    }
    $clientes = Cliente::query()->where('sucursal_id', $sucursal->id)->limit(20)->get();
}

$productos = Producto::query()
    ->where('activo', true)
    ->orderBy('id')
    ->get(['id', 'nombre', 'categoria_id', 'costo', 'precio_contado', 'garantia_meses']);

if ($productos->isEmpty()) {
    echo "No existen productos activos.\n";
    exit(0);
}

// Agrupar por categoría para repartir el donut.
$byCat = $productos
    ->groupBy(fn ($p) => $p->categoria_id ?: 0)
    ->filter(fn ($grp) => $grp->count() > 0)
    ->values();

if ($byCat->count() < 2) {
    echo "Hay muy pocas categorías para variar (categorías encontradas: {$byCat->count()}).\n";
}

$inventario = app(InventarioService::class);

$inicioSemana = now()->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
$finSemana = now()->copy()->endOfWeek(Carbon::SUNDAY)->startOfDay();

// Crear N ventas repartidas por días de la semana actual.
$N = 28; // 4 por día aprox
$creadas = 0;
$omitidas = 0;

for ($i = 1; $i <= $N; $i++) {
    $dayOffset = ($i - 1) % 7;
    $fecha = $inicioSemana->copy()->addDays($dayOffset)->toDateString();
    if (Carbon::parse($fecha)->gt($finSemana)) {
        $fecha = now()->toDateString();
    }

    $nota = "DONUT-DEMO {$inicioSemana->toDateString()} #{$i}";
    if (Venta::query()->where('sucursal_id', $sucursal->id)->where('nota', $nota)->exists()) {
        $omitidas++;
        continue;
    }

    $cliente = $clientes->get(($i - 1) % max(1, $clientes->count()));

    // Seleccionar 2-3 categorías distintas (si se puede)
    $cats = [];
    $takeCats = min(3, max(1, $byCat->count()));
    for ($k = 0; $k < $takeCats; $k++) {
        $cats[] = $byCat->get(($i + $k) % $byCat->count());
    }

    // Armar items (1 producto por categoría) con cantidades pequeñas
    $items = [];
    foreach ($cats as $idx => $grp) {
        $p = $grp->get(($i + $idx * 3) % $grp->count());
        if (! $p) {
            continue;
        }
        $cant = 1 + (($i + $idx) % 2); // 1-2
        $precio = (float) ($p->precio_contado ?: ($p->costo ? ($p->costo * 1.35) : 1000));
        $items[] = ['producto' => $p, 'cantidad' => $cant, 'precio' => round($precio, 2)];
    }

    if ($items === []) {
        $omitidas++;
        continue;
    }

    DB::transaction(function () use ($sucursal, $almacen, $admin, $cliente, $fecha, $nota, $items, $inventario, &$creadas) {
        $venta = Venta::create([
            'sucursal_id' => $sucursal->id,
            'cliente_id' => $cliente?->id,
            'usuario_id' => $admin->id,
            'almacen_id' => $almacen->id,
            'tipo' => 'contado',
            'fecha' => $fecha,
            'subtotal' => 0,
            'descuento' => 0,
            'impuesto' => 0,
            'total' => 0,
            'estado' => 'registrada',
            'nota' => $nota,
        ]);

        $subtotal = 0.0;
        foreach ($items as $it) {
            // No permitir stock negativo: vender solo hasta lo disponible.
            $sp = \App\Models\StockProducto::query()
                ->where('almacen_id', (int) $almacen->id)
                ->where('producto_id', (int) $it['producto']->id)
                ->first();
            $disponible = $sp ? (float) $sp->stock : 0.0;
            $cant = min((float) $it['cantidad'], max(0.0, $disponible));
            if ($cant <= 0) {
                continue;
            }

            $sub = (float) $cant * (float) $it['precio'];
            $subtotal += $sub;

            DetalleVenta::create([
                'venta_id' => $venta->id,
                'producto_id' => $it['producto']->id,
                'cantidad' => $cant,
                'precio_unitario' => $it['precio'],
                'subtotal' => $sub,
            ]);

            $inventario->salidaPorVenta(
                (int) $sucursal->id,
                (int) $almacen->id,
                (int) $it['producto']->id,
                (float) $cant,
                (int) $venta->id,
                false
            );
        }

        if ($subtotal <= 0) {
            // Si no se pudo vender nada (sin stock), eliminar la venta vacía.
            $venta->delete();
        } else {
            $venta->subtotal = round($subtotal, 2);
            $venta->total = round($subtotal, 2);
            $venta->save();
            $creadas++;
        }

    });
}

echo "Ventas donut demo: creadas={$creadas}, omitidas={$omitidas}\n";

