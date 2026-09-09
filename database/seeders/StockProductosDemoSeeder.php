<?php

namespace Database\Seeders;

use App\Models\Almacen;
use App\Models\Producto;
use App\Models\StockProducto;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;

class StockProductosDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sucursalId = Sucursal::query()->where('codigo', 'CENTRAL')->value('id');
        if (! $sucursalId) {
            return;
        }

        $almacenId = Almacen::query()
            ->where('sucursal_id', $sucursalId)
            ->where('nombre', 'Principal')
            ->value('id');
        if (! $almacenId) {
            return;
        }

        // Asegurar stock para TODOS los productos (si no existe el registro en almacén Principal, lo crea con stock).
        $productos = Producto::query()->get(['id']);
        foreach ($productos as $p) {
            StockProducto::query()->firstOrCreate(
                ['almacen_id' => $almacenId, 'producto_id' => $p->id],
                ['stock' => 10, 'stock_minimo' => 1]
            );
        }

        // Para los 10 productos más recientes, subir más stock para que se note en demo.
        $ultimos = Producto::query()->orderByDesc('id')->limit(10)->get(['id']);
        foreach ($ultimos as $p) {
            $sp = StockProducto::query()->firstOrCreate(
                ['almacen_id' => $almacenId, 'producto_id' => $p->id],
                ['stock' => 0, 'stock_minimo' => 1]
            );

            $sp->stock = max((float) $sp->stock, 25);
            $sp->stock_minimo = max((float) $sp->stock_minimo, 2);
            $sp->save();
        }

        // Dejar algunos productos SIN STOCK para probar filtros (agotados).
        // Nota: siempre en almacén Principal de CENTRAL.
        $skusAgotados = [
            'GAS-100',
            'AGU-5G',
            'ACC-GUANTES',
            'CARG-UNI',
            'PLA-ROPA',
        ];

        $agotados = Producto::query()
            ->whereIn('sku', $skusAgotados)
            ->get(['id']);

        foreach ($agotados as $p) {
            $sp = StockProducto::query()->firstOrCreate(
                ['almacen_id' => $almacenId, 'producto_id' => $p->id],
                ['stock' => 0, 'stock_minimo' => 1]
            );

            $sp->stock = 0;
            $sp->stock_minimo = max((float) $sp->stock_minimo, 1);
            $sp->save();
        }
    }
}
