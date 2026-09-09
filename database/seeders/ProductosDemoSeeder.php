<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Marca;
use App\Models\Producto;
use App\Models\Sucursal;
use App\Support\PrecioMayorRd;
use Illuminate\Database\Seeder;

class ProductosDemoSeeder extends Seeder
{
    public function run(): void
    {
        $empresa = Empresa::query()->firstOrCreate(
            ['slug' => 'default'],
            [
                'nombre' => 'Empresa principal',
                'plan' => 'full',
                'licencia_activa' => true,
                'max_usuarios_empleados' => 50,
            ]
        );
        $empresaId = $empresa->id;

        Sucursal::query()->whereNull('empresa_id')->update(['empresa_id' => $empresaId]);

        $catElectro = Categoria::query()->firstOrCreate(['nombre' => 'Electrodomésticos'], ['activa' => true]);
        $catMotos = Categoria::query()->firstOrCreate(['nombre' => 'Motocicletas'], ['activa' => true]);
        $catHogar = Categoria::query()->firstOrCreate(['nombre' => 'Hogar'], ['activa' => true]);

        $marcaGenerica = Marca::query()->firstOrCreate(['nombre' => 'Genérica'], ['activa' => true]);
        $marcaBSolutions = Marca::query()->firstOrCreate(['nombre' => 'BSolutions'], ['activa' => true]);

        $items = [
            [
                'nombre' => 'Lavadora 18kg',
                'sku' => 'LAV-18',
                'codigo_barra' => '7400123456001',
                'precio_contado' => 25000,
                'precio_financiado' => 29000,
                'costo' => 18000,
                'garantia_meses' => 12,
                'categoria' => 'Electrodomésticos',
                'marca' => 'Genérica',
            ],
            [
                'nombre' => 'Nevera 14pc',
                'sku' => 'NEV-14',
                'codigo_barra' => '7400123456002',
                'precio_contado' => 32000,
                'precio_financiado' => 36500,
                'costo' => 24000,
                'garantia_meses' => 24,
                'categoria' => 'Electrodomésticos',
                'marca' => 'Genérica',
            ],
            [
                'nombre' => 'Moto CG150',
                'sku' => 'MOT-CG150',
                'codigo_barra' => '7890123456789',
                'modelo' => 'CG150',
                'precio_contado' => 95000,
                'precio_financiado' => 108000,
                'costo' => 72000,
                'garantia_meses' => 12,
                'categoria' => 'Motocicletas',
                'marca' => 'BSolutions',
            ],
            // ~20 adicionales
            ['nombre' => 'Televisor 50\" 4K', 'sku' => 'TV-50-4K', 'codigo_barra' => '7400123456003', 'precio_contado' => 26500, 'precio_financiado' => 30500, 'costo' => 19500, 'garantia_meses' => 12, 'categoria' => 'Electrodomésticos', 'marca' => 'Genérica'],
            ['nombre' => 'Televisor 55\" 4K', 'sku' => 'TV-55-4K', 'codigo_barra' => '7400123456004', 'precio_contado' => 29900, 'precio_financiado' => 34500, 'costo' => 22000, 'garantia_meses' => 12, 'categoria' => 'Electrodomésticos', 'marca' => 'Genérica'],
            ['nombre' => 'Abanico de pedestal 18\"', 'sku' => 'ABN-18', 'codigo_barra' => '7400123456005', 'precio_contado' => 1950, 'precio_financiado' => 2500, 'costo' => 1250, 'garantia_meses' => 3, 'categoria' => 'Hogar', 'marca' => 'Genérica'],
            ['nombre' => 'Microondas 1.1pc', 'sku' => 'MIC-11', 'codigo_barra' => '7400123456006', 'precio_contado' => 5900, 'precio_financiado' => 7200, 'costo' => 4100, 'garantia_meses' => 6, 'categoria' => 'Electrodomésticos', 'marca' => 'Genérica'],
            ['nombre' => 'Licuadora 2L', 'sku' => 'LIC-2L', 'codigo_barra' => '7400123456007', 'precio_contado' => 2450, 'precio_financiado' => 3200, 'costo' => 1650, 'garantia_meses' => 6, 'categoria' => 'Hogar', 'marca' => 'Genérica'],
            ['nombre' => 'Freidora de aire 5L', 'sku' => 'AIR-5L', 'codigo_barra' => '7400123456008', 'precio_contado' => 6900, 'precio_financiado' => 8500, 'costo' => 5000, 'garantia_meses' => 6, 'categoria' => 'Hogar', 'marca' => 'Genérica'],
            ['nombre' => 'Tanque de gas 100lb', 'sku' => 'GAS-100', 'codigo_barra' => '7400123456009', 'precio_contado' => 6300, 'precio_financiado' => 7800, 'costo' => 4600, 'garantia_meses' => 1, 'categoria' => 'Hogar', 'marca' => 'Genérica'],
            ['nombre' => 'Cama full (base + colchón)', 'sku' => 'CAM-FULL', 'codigo_barra' => '7400123456010', 'precio_contado' => 18500, 'precio_financiado' => 21500, 'costo' => 13500, 'garantia_meses' => 6, 'categoria' => 'Hogar', 'marca' => 'BSolutions'],
            ['nombre' => 'Juego de sala 3-2-1', 'sku' => 'SAL-321', 'codigo_barra' => '7400123456011', 'precio_contado' => 27900, 'precio_financiado' => 32500, 'costo' => 20500, 'garantia_meses' => 6, 'categoria' => 'Hogar', 'marca' => 'BSolutions'],
            ['nombre' => 'Estufa 4 hornillas', 'sku' => 'EST-4H', 'codigo_barra' => '7400123456012', 'precio_contado' => 15900, 'precio_financiado' => 18500, 'costo' => 11500, 'garantia_meses' => 12, 'categoria' => 'Electrodomésticos', 'marca' => 'Genérica'],
            ['nombre' => 'Cilindro de agua 5 gal', 'sku' => 'AGU-5G', 'codigo_barra' => '7400123456013', 'precio_contado' => 450, 'precio_financiado' => 650, 'costo' => 250, 'garantia_meses' => 0, 'categoria' => 'Hogar', 'marca' => 'Genérica'],
            ['nombre' => 'Moto AX125', 'sku' => 'MOT-AX125', 'codigo_barra' => '7890123456790', 'modelo' => 'AX125', 'precio_contado' => 82000, 'precio_financiado' => 94500, 'costo' => 62000, 'garantia_meses' => 12, 'categoria' => 'Motocicletas', 'marca' => 'BSolutions'],
            ['nombre' => 'Moto XR200', 'sku' => 'MOT-XR200', 'codigo_barra' => '7890123456791', 'modelo' => 'XR200', 'precio_contado' => 138000, 'precio_financiado' => 155000, 'costo' => 105000, 'garantia_meses' => 12, 'categoria' => 'Motocicletas', 'marca' => 'BSolutions'],
            ['nombre' => 'Casco certificado', 'sku' => 'ACC-CASCO', 'codigo_barra' => '7400123456014', 'precio_contado' => 1850, 'precio_financiado' => 2500, 'costo' => 1200, 'garantia_meses' => 0, 'categoria' => 'Motocicletas', 'marca' => 'Genérica'],
            ['nombre' => 'Guantes de protección', 'sku' => 'ACC-GUANTES', 'codigo_barra' => '7400123456015', 'precio_contado' => 650, 'precio_financiado' => 900, 'costo' => 350, 'garantia_meses' => 0, 'categoria' => 'Motocicletas', 'marca' => 'Genérica'],
            ['nombre' => 'Bocina bluetooth', 'sku' => 'BOC-BT', 'codigo_barra' => '7400123456016', 'precio_contado' => 2150, 'precio_financiado' => 2800, 'costo' => 1400, 'garantia_meses' => 3, 'categoria' => 'Electrodomésticos', 'marca' => 'Genérica'],
            ['nombre' => 'Laptop 15\" (8GB/256GB)', 'sku' => 'LAP-15', 'codigo_barra' => '7400123456017', 'precio_contado' => 33500, 'precio_financiado' => 38900, 'costo' => 26500, 'garantia_meses' => 12, 'categoria' => 'Electrodomésticos', 'marca' => 'BSolutions'],
            ['nombre' => 'Impresora multifunción', 'sku' => 'IMP-MULTI', 'codigo_barra' => '7400123456018', 'precio_contado' => 6900, 'precio_financiado' => 8500, 'costo' => 5100, 'garantia_meses' => 6, 'categoria' => 'Electrodomésticos', 'marca' => 'Genérica'],
            ['nombre' => 'Celular 128GB', 'sku' => 'CEL-128', 'codigo_barra' => '7400123456019', 'precio_contado' => 17900, 'precio_financiado' => 20900, 'costo' => 13900, 'garantia_meses' => 6, 'categoria' => 'Electrodomésticos', 'marca' => 'BSolutions'],
            ['nombre' => 'Tablet 10\"', 'sku' => 'TAB-10', 'codigo_barra' => '7400123456020', 'precio_contado' => 9900, 'precio_financiado' => 11800, 'costo' => 7300, 'garantia_meses' => 6, 'categoria' => 'Electrodomésticos', 'marca' => 'Genérica'],
            ['nombre' => 'Juego de comedor 6 sillas', 'sku' => 'COM-6', 'codigo_barra' => '7400123456021', 'precio_contado' => 24500, 'precio_financiado' => 28500, 'costo' => 18500, 'garantia_meses' => 6, 'categoria' => 'Hogar', 'marca' => 'BSolutions'],
            ['nombre' => 'Aire acondicionado 12k BTU', 'sku' => 'AC-12K', 'codigo_barra' => '7400123456022', 'precio_contado' => 28900, 'precio_financiado' => 33500, 'costo' => 22000, 'garantia_meses' => 12, 'categoria' => 'Electrodomésticos', 'marca' => 'Genérica'],
            // 10 más (para demo con stock)
            ['nombre' => 'Plancha de ropa', 'sku' => 'PLA-ROPA', 'codigo_barra' => '7400123456023', 'precio_contado' => 1250, 'precio_financiado' => 1650, 'costo' => 750, 'garantia_meses' => 3, 'categoria' => 'Hogar', 'marca' => 'Genérica'],
            ['nombre' => 'Batidora de mano', 'sku' => 'BAT-MANO', 'codigo_barra' => '7400123456024', 'precio_contado' => 1350, 'precio_financiado' => 1750, 'costo' => 850, 'garantia_meses' => 3, 'categoria' => 'Hogar', 'marca' => 'Genérica'],
            ['nombre' => 'Cafetera 12 tazas', 'sku' => 'CAF-12', 'codigo_barra' => '7400123456025', 'precio_contado' => 2150, 'precio_financiado' => 2750, 'costo' => 1450, 'garantia_meses' => 6, 'categoria' => 'Hogar', 'marca' => 'Genérica'],
            ['nombre' => 'Arrocera 1.8L', 'sku' => 'ARR-18', 'codigo_barra' => '7400123456026', 'precio_contado' => 1950, 'precio_financiado' => 2450, 'costo' => 1250, 'garantia_meses' => 6, 'categoria' => 'Hogar', 'marca' => 'Genérica'],
            ['nombre' => 'Bicicleta montaña 26\"', 'sku' => 'BIC-M26', 'codigo_barra' => '7400123456027', 'precio_contado' => 14500, 'precio_financiado' => 16900, 'costo' => 10500, 'garantia_meses' => 6, 'categoria' => 'Hogar', 'marca' => 'BSolutions'],
            ['nombre' => 'Combo bocina + micrófono', 'sku' => 'BOC-MIC', 'codigo_barra' => '7400123456028', 'precio_contado' => 5900, 'precio_financiado' => 7200, 'costo' => 4200, 'garantia_meses' => 3, 'categoria' => 'Electrodomésticos', 'marca' => 'BSolutions'],
            ['nombre' => 'Smartwatch', 'sku' => 'SWT-01', 'codigo_barra' => '7400123456029', 'precio_contado' => 2350, 'precio_financiado' => 3100, 'costo' => 1500, 'garantia_meses' => 3, 'categoria' => 'Electrodomésticos', 'marca' => 'Genérica'],
            ['nombre' => 'Router WiFi', 'sku' => 'WIFI-RT', 'codigo_barra' => '7400123456030', 'precio_contado' => 1850, 'precio_financiado' => 2450, 'costo' => 1150, 'garantia_meses' => 3, 'categoria' => 'Electrodomésticos', 'marca' => 'Genérica'],
            ['nombre' => 'Cargador universal', 'sku' => 'CARG-UNI', 'codigo_barra' => '7400123456031', 'precio_contado' => 350, 'precio_financiado' => 550, 'costo' => 150, 'garantia_meses' => 0, 'categoria' => 'Electrodomésticos', 'marca' => 'Genérica'],
            ['nombre' => 'Power bank 10,000mAh', 'sku' => 'PWR-10K', 'codigo_barra' => '7400123456032', 'precio_contado' => 950, 'precio_financiado' => 1350, 'costo' => 550, 'garantia_meses' => 0, 'categoria' => 'Electrodomésticos', 'marca' => 'Genérica'],
        ];

        foreach ($items as $p) {
            $catId = match ($p['categoria'] ?? 'Electrodomésticos') {
                'Motocicletas' => $catMotos->id,
                'Hogar' => $catHogar->id,
                default => $catElectro->id,
            };
            $marcaId = match ($p['marca'] ?? 'Genérica') {
                'BSolutions' => $marcaBSolutions->id,
                default => $marcaGenerica->id,
            };

            Producto::query()->updateOrCreate(
                ['sku' => $p['sku'], 'empresa_id' => $empresaId],
                [
                    'nombre' => $p['nombre'],
                    'categoria_id' => $catId,
                    'marca_id' => $marcaId,
                    'codigo_barra' => $p['codigo_barra'] ?? null,
                    'qr' => null,
                    'modelo' => $p['modelo'] ?? null,
                    'serial' => null,
                    'costo' => $p['costo'],
                    'precio_contado' => $p['precio_contado'],
                    'precio_financiado' => $p['precio_financiado'],
                    'precio_mayor' => PrecioMayorRd::sugerido((float) $p['precio_contado'], isset($p['costo']) ? (float) $p['costo'] : null),
                    'garantia_meses' => $p['garantia_meses'],
                    'activo' => true,
                ]
            );
        }
    }
}

