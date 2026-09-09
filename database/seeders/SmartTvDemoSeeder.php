<?php

namespace Database\Seeders;

use App\Models\Almacen;
use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\ImagenProducto;
use App\Models\Marca;
use App\Models\Producto;
use App\Models\StockProducto;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SmartTvDemoSeeder extends Seeder
{
    public function run(): void
    {
        $empresaId = Empresa::query()->orderBy('id')->value('id');
        $sucursalId = Sucursal::query()->where('codigo', 'CENTRAL')->value('id');
        $almacenId = Almacen::query()
            ->where('sucursal_id', $sucursalId)
            ->where('nombre', 'Principal')
            ->value('id');

        if (! $empresaId || ! $almacenId) {
            return;
        }

        $categoria = Categoria::query()->firstOrCreate(
            ['nombre' => 'Televisores'],
            ['activa' => true]
        );

        $televisores = [
            [
                'marca' => 'Samsung',
                'nombre' => 'Smart TV Crystal UHD 4K de 43 pulgadas',
                'descripcion' => 'Televisor inteligente 4K UHD con HDR, Wi-Fi, Bluetooth, asistentes de voz y aplicaciones de streaming.',
                'sku' => 'TV-SAM-CU43-001',
                'codigo_barra' => '7460014300018',
                'qr' => 'ERP-TV-SAM-CU43-001',
                'modelo' => 'UN43CU7000',
                'serial' => 'SAM43CU26RD0001',
                'costo' => 21800,
                'precio_contado' => 27995,
                'precio_financiado' => 32995,
                'precio_mayor' => 26495,
                'garantia_meses' => 12,
                'stock' => 6,
                'stock_minimo' => 2,
                'imagen' => 'images/productos/smart-tv/smart-tv-43-crystal.png',
            ],
            [
                'marca' => 'LG',
                'nombre' => 'Smart TV QNED 4K de 55 pulgadas',
                'descripcion' => 'Pantalla QNED 4K con HDR, control por voz, Wi-Fi, Bluetooth y sistema inteligente para entretenimiento.',
                'sku' => 'TV-LG-QN55-001',
                'codigo_barra' => '7460015500011',
                'qr' => 'ERP-TV-LG-QN55-001',
                'modelo' => '55QNED80',
                'serial' => 'LG55QN26RD0001',
                'costo' => 36500,
                'precio_contado' => 45995,
                'precio_financiado' => 53995,
                'precio_mayor' => 43995,
                'garantia_meses' => 12,
                'stock' => 4,
                'stock_minimo' => 2,
                'imagen' => 'images/productos/smart-tv/smart-tv-55-qled.png',
            ],
            [
                'marca' => 'TCL',
                'nombre' => 'Smart TV Mini LED 4K de 65 pulgadas',
                'descripcion' => 'Televisor Mini LED 4K de gran formato con Dolby Vision, Wi-Fi, Bluetooth y plataforma de contenido inteligente.',
                'sku' => 'TV-TCL-ML65-001',
                'codigo_barra' => '7460016500010',
                'qr' => 'ERP-TV-TCL-ML65-001',
                'modelo' => '65C755',
                'serial' => 'TCL65ML26RD0001',
                'costo' => 54800,
                'precio_contado' => 68995,
                'precio_financiado' => 79995,
                'precio_mayor' => 65995,
                'garantia_meses' => 18,
                'stock' => 3,
                'stock_minimo' => 1,
                'imagen' => 'images/productos/smart-tv/smart-tv-65-miniled.png',
            ],
        ];

        DB::transaction(function () use ($televisores, $empresaId, $categoria, $almacenId) {
            foreach ($televisores as $data) {
                $marca = Marca::query()->firstOrCreate(
                    ['nombre' => $data['marca']],
                    ['activa' => true]
                );

                $producto = Producto::query()->updateOrCreate(
                    ['empresa_id' => $empresaId, 'sku' => $data['sku']],
                    [
                        'categoria_id' => $categoria->id,
                        'marca_id' => $marca->id,
                        'nombre' => $data['nombre'],
                        'descripcion' => $data['descripcion'],
                        'codigo_barra' => $data['codigo_barra'],
                        'qr' => $data['qr'],
                        'modelo' => $data['modelo'],
                        'serial' => $data['serial'],
                        'costo' => $data['costo'],
                        'precio_contado' => $data['precio_contado'],
                        'precio_financiado' => $data['precio_financiado'],
                        'precio_mayor' => $data['precio_mayor'],
                        'garantia_meses' => $data['garantia_meses'],
                        'activo' => true,
                    ]
                );

                ImagenProducto::query()->updateOrCreate(
                    ['producto_id' => $producto->id, 'orden' => 0],
                    ['path' => $data['imagen']]
                );

                StockProducto::query()->updateOrCreate(
                    ['almacen_id' => $almacenId, 'producto_id' => $producto->id],
                    ['stock' => $data['stock'], 'stock_minimo' => $data['stock_minimo']]
                );
            }
        });
    }
}
