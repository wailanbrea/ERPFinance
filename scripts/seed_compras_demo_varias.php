<?php

// Crea compras demo con muchos productos para poblar el módulo y dejar todo conectado:
// - compras + detalle_compras (con ITBIS)
// - inventario: stock_productos + movimientos_inventario (referencia_id = compra.id)
// - actualiza costo/precios del producto (opcional)
//
// Idempotente por "nota" única.

use App\Models\Almacen;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\Sucursal;
use App\Services\InventarioService;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$N = (int) ($argv[1] ?? 8);          // compras
$itemsPer = (int) ($argv[2] ?? 6);   // items por compra
$itbisTasa = 18.0;

$sucursal = Sucursal::query()->orderBy('id')->first();
if (! $sucursal) { fwrite(STDERR, "No hay sucursales.\n"); exit(1); }

$almacen = Almacen::query()
    ->where('sucursal_id', $sucursal->id)
    ->where('activo', true)
    ->orderBy('id')
    ->first();
if (! $almacen) { fwrite(STDERR, "No hay almacenes activos.\n"); exit(1); }

$proveedor = Proveedor::query()
    ->where('sucursal_id', $sucursal->id)
    ->orderBy('id')
    ->first();

$productos = Producto::query()->where('activo', true)->orderBy('id')->get(['id', 'costo', 'precio_contado', 'precio_financiado']);
if ($productos->count() < 1) { fwrite(STDERR, "No hay productos.\n"); exit(1); }

$inventario = app(InventarioService::class);

$creadas = 0;
$omitidas = 0;

for ($i = 1; $i <= $N; $i++) {
    $nota = "SEED_COMPRA_DEMO_{$i}";
    $existe = Compra::query()->where('nota', $nota)->exists();
    if ($existe) { $omitidas++; continue; }

    $fecha = now()->subDays(max(0, $N - $i))->toDateString();

    DB::transaction(function () use (
        $sucursal, $almacen, $proveedor, $productos, $inventario,
        $nota, $fecha, $itemsPer, $itbisTasa, &$creadas
    ) {
        $compra = Compra::create([
            'sucursal_id' => $sucursal->id,
            'proveedor_id' => $proveedor?->id,
            'almacen_id' => $almacen->id,
            'fecha' => $fecha,
            'estado' => 'registrada',
            'nota' => $nota,
            'total' => 0,
        ]);

        $total = 0.0;

        // Seleccionar itemsPer productos distintos (si hay suficientes)
        $pool = $productos->shuffle()->take(min($itemsPer, $productos->count()));

        foreach ($pool as $p) {
            $cantidad = (float) (1 + ($p->id % 4)); // 1..4
            $costoBase = (float) ($p->costo > 0 ? $p->costo : (500 + ($p->id % 10) * 150));
            $itbisAplica = true;
            $costoCon = $itbisAplica ? round($costoBase * (1 + $itbisTasa / 100), 2) : round($costoBase, 2);
            $subtotal = round($cantidad * $costoCon, 2);

            DetalleCompra::create([
                'compra_id' => $compra->id,
                'producto_id' => $p->id,
                'cantidad' => $cantidad,
                'costo_unitario' => $costoBase,
                'itbis_aplica' => $itbisAplica,
                'itbis_tasa' => $itbisTasa,
                'costo_unitario_con_itbis' => $costoCon,
                'subtotal' => $subtotal,
            ]);

            // Actualizar producto (costo ya con ITBIS) y precios sugeridos si están en 0.
            $prod = Producto::query()->lockForUpdate()->find($p->id);
            if ($prod) {
                $prod->costo = $costoCon;
                if ((float) $prod->precio_contado <= 0) $prod->precio_contado = round($costoCon * 1.35, 2);
                if ((float) $prod->precio_financiado <= 0) $prod->precio_financiado = round($costoCon * 1.65, 2);
                $prod->save();
            }

            $inventario->entradaDesdeCompra(
                (int) $sucursal->id,
                (int) $almacen->id,
                (int) $p->id,
                (float) $cantidad,
                (int) $compra->id
            );

            $total += $subtotal;
        }

        $compra->total = round($total, 2);
        $compra->save();

        $creadas++;
    });
}

echo "OK: compras_creadas={$creadas}, omitidas={$omitidas}\n";

