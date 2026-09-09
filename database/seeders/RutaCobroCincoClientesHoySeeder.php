<?php

namespace Database\Seeders;

use App\Models\Almacen;
use App\Models\Cliente;
use App\Models\ClienteRuta;
use App\Models\DetalleVenta;
use App\Models\DireccionCliente;
use App\Models\Producto;
use App\Models\RutaCobro;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\FinanciamientoService;
use App\Services\InventarioService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RutaCobroCincoClientesHoySeeder extends Seeder
{
    public function run(): void
    {
        $sucursal = Sucursal::query()->where('codigo', 'CENTRAL')->first();
        if (! $sucursal) {
            return;
        }

        $admin = User::query()->where('email', 'admin@erp-bsolutions.local')->first();
        if (! $admin) {
            return;
        }

        $almacen = Almacen::query()->where('sucursal_id', $sucursal->id)->orderBy('id')->first();
        if (! $almacen) {
            return;
        }

        $producto = Producto::query()->where('activo', true)->orderBy('id')->first();
        if (! $producto) {
            return;
        }

        $inventario = app(InventarioService::class);
        $finService = app(FinanciamientoService::class);

        $hoy = now()->toDateString();
        $fechaInicio = Carbon::parse($hoy)->subWeek(); // cuota #1 vence hoy (semanal)

        $ruta = RutaCobro::query()->firstOrCreate(
            ['sucursal_id' => $sucursal->id, 'nombre' => 'Ruta Cobro HOY - Demo (5 clientes)'],
            [
                'dia' => strtolower((string) now()->locale('es')->dayName),
                'sector' => 'Demo',
                'frecuencia' => 'semanal',
                'cobrador_id' => null,
                'activa' => true,
            ],
        );

        // 5 ubicaciones cercanas (Santo Domingo) para que se aprecie “más cerca”
        $coords = [
            [18.4908000, -69.9309000], // Centro
            [18.4979000, -69.9360000],
            [18.4837000, -69.9391000],
            [18.4766000, -69.9254000],
            [18.5061000, -69.9223000],
        ];

        for ($i = 1; $i <= 5; $i++) {
            $ced = "0090000000{$i}";
            $cli = Cliente::query()->firstOrCreate(
                ['cedula_rnc' => $ced],
                [
                    'sucursal_id' => $sucursal->id,
                    'nombre' => 'Cliente',
                    'apellido' => "Cobro {$i}",
                    'telefono' => '809-555-30'.str_pad((string) $i, 2, '0', STR_PAD_LEFT),
                    'whatsapp' => '809-555-30'.str_pad((string) $i, 2, '0', STR_PAD_LEFT),
                    'direccion' => "Dirección demo {$i}, Santo Domingo",
                    'referencias' => "Referencia demo {$i}",
                    'estado' => 'activo',
                ],
            );

            $dir = DireccionCliente::query()->firstOrCreate(
                ['cliente_id' => $cli->id, 'tipo' => 'principal'],
                [
                    'direccion' => (string) ($cli->direccion ?? ''),
                    'referencia' => $cli->referencias ? (string) $cli->referencias : null,
                    'principal' => true,
                ],
            );
            $dir->principal = true;
            $dir->lat = $coords[$i - 1][0];
            $dir->lng = $coords[$i - 1][1];
            $dir->geocode_source = 'import';
            $dir->geocode_updated_at = now();
            $dir->save();

            ClienteRuta::query()->firstOrCreate(['ruta_cobro_id' => $ruta->id, 'cliente_id' => $cli->id]);

            // Crear una venta financiada + financiamiento con 1ra cuota venciendo hoy
            $nota = "Venta financiada ruta hoy demo {$i}";
            if (\App\Models\Venta::query()->where('sucursal_id', $sucursal->id)->where('nota', $nota)->exists()) {
                continue;
            }

            DB::transaction(function () use ($sucursal, $almacen, $admin, $cli, $producto, $inventario, $finService, $nota, $hoy, $fechaInicio) {
                $venta = \App\Models\Venta::create([
                    'sucursal_id' => $sucursal->id,
                    'cliente_id' => $cli->id,
                    'usuario_id' => $admin->id,
                    'almacen_id' => $almacen->id,
                    'tipo' => 'financiada',
                    'fecha' => $hoy,
                    'subtotal' => 0,
                    'descuento' => 0,
                    'impuesto' => 0,
                    'total' => 0,
                    'estado' => 'registrada',
                    'nota' => $nota,
                ]);

                $precioFin = (float) ($producto->precio_financiado ?: $producto->precio_contado ?: $producto->costo ?: 10000);
                $sub = 1 * $precioFin;

                DetalleVenta::create([
                    'venta_id' => $venta->id,
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => $precioFin,
                    'subtotal' => $sub,
                ]);

                // Si no hay stock, esta salida podría fallar; en demo normalmente ya existe stock por seed.
                $inventario->salidaPorVenta($sucursal->id, $almacen->id, $producto->id, 1, $venta->id);

                $venta->subtotal = round($sub, 2);
                $venta->total = round($sub, 2);
                $venta->save();

                $finService->crearDesdeVenta(
                    $sucursal->id,
                    $venta->id,
                    $cli->id,
                    (float) $venta->total,
                    0,
                    0,
                    8,
                    'semanal',
                    $fechaInicio
                );
            });
        }
    }
}

