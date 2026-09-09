<?php

namespace Database\Seeders;

use App\Models\Almacen;
use App\Models\Cliente;
use App\Models\DetalleCompra;
use App\Models\DetalleVenta;
use App\Models\DireccionCliente;
use App\Models\Gasto;
use App\Models\Garantia;
use App\Models\Ajuste;
use App\Models\ClienteRuta;
use App\Models\ImagenProducto;
use App\Models\Marca;
use App\Models\MovimientoCaja;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\ReferenciaCliente;
use App\Models\RutaCobro;
use App\Models\ServicioTecnico;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\FinanciamientoService;
use App\Services\InventarioService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class DemoCompletoSeeder extends Seeder
{
    public function run(): void
    {
        $sucursal = Sucursal::query()->where('codigo', 'CENTRAL')->first();
        if (!$sucursal) {
            return;
        }

        $admin = User::query()->where('email', 'admin@erp-bsolutions.local')->first();
        if (!$admin) {
            return;
        }

        // Ajustes de configuración por sucursal (demo)
        Ajuste::query()->updateOrCreate(
            ['sucursal_id' => $sucursal->id, 'clave' => 'empresa.nombre'],
            ['valor' => 'ERP Bsolutions Finanzas']
        );
        Ajuste::query()->updateOrCreate(
            ['sucursal_id' => $sucursal->id, 'clave' => 'empresa.rnc'],
            ['valor' => '1-01-99999-9']
        );
        Ajuste::query()->updateOrCreate(
            ['sucursal_id' => $sucursal->id, 'clave' => 'ventas.itbis_porcentaje'],
            ['valor' => '18']
        );
        Ajuste::query()->updateOrCreate(
            ['sucursal_id' => $sucursal->id, 'clave' => 'financiamiento.interes_porcentaje'],
            ['valor' => '10']
        );
        Ajuste::query()->updateOrCreate(
            ['sucursal_id' => $sucursal->id, 'clave' => 'cobros.mora_diaria'],
            ['valor' => '50']
        );

        $almacen = Almacen::query()
            ->where('sucursal_id', $sucursal->id)
            ->orderBy('id')
            ->first();
        if (!$almacen) {
            return;
        }

        // 2 casos reales/coherentes (clientes + dirección + referencias)
        $cliente1 = Cliente::query()->firstOrCreate(
            ['cedula_rnc' => '00112345678'],
            [
                'sucursal_id' => $sucursal->id,
                'nombre' => 'Juan',
                'apellido' => 'Pérez',
                'telefono' => '809-555-0101',
                'whatsapp' => '809-555-0101',
                'direccion' => 'C/ Duarte #123, Santiago',
                'referencias' => 'Frente al colmado La Esquina',
                'estado' => 'activo',
            ]
        );

        $cliente2 = Cliente::query()->firstOrCreate(
            ['cedula_rnc' => '00298765432'],
            [
                'sucursal_id' => $sucursal->id,
                'nombre' => 'María',
                'apellido' => 'Gómez',
                'telefono' => '829-555-0202',
                'whatsapp' => '829-555-0202',
                'direccion' => 'Av. Las Américas #45, Santo Domingo Este',
                'referencias' => 'Residencial Palmeras, torre B',
                'estado' => 'activo',
            ]
        );

        DireccionCliente::query()->firstOrCreate(
            ['cliente_id' => $cliente1->id, 'tipo' => 'principal'],
            ['direccion' => $cliente1->direccion, 'referencia' => $cliente1->referencias, 'principal' => true]
        );
        DireccionCliente::query()->firstOrCreate(
            ['cliente_id' => $cliente2->id, 'tipo' => 'principal'],
            ['direccion' => $cliente2->direccion, 'referencia' => $cliente2->referencias, 'principal' => true]
        );

        ReferenciaCliente::query()->firstOrCreate(
            ['cliente_id' => $cliente1->id, 'nombre' => 'Pedro Pérez'],
            ['telefono' => '809-555-1100', 'parentesco' => 'Hermano', 'nota' => 'Referencia familiar']
        );
        ReferenciaCliente::query()->firstOrCreate(
            ['cliente_id' => $cliente2->id, 'nombre' => 'Ana Gómez'],
            ['telefono' => '829-555-2200', 'parentesco' => 'Madre', 'nota' => 'Referencia familiar']
        );

        // Usuarios demo (roles)
        $vendedor = User::query()->firstOrCreate(
            ['email' => 'vendedor@erp-bsolutions.local'],
            ['name' => 'Vendedor Demo', 'password' => bcrypt('password'), 'sucursal_id' => $sucursal->id]
        );
        $cobrador = User::query()->firstOrCreate(
            ['email' => 'cobrador@erp-bsolutions.local'],
            ['name' => 'Cobrador Demo', 'password' => bcrypt('password'), 'sucursal_id' => $sucursal->id]
        );
        $tecnico = User::query()->firstOrCreate(
            ['email' => 'tecnico@erp-bsolutions.local'],
            ['name' => 'Técnico Demo', 'password' => bcrypt('password'), 'sucursal_id' => $sucursal->id]
        );
        $vendedor->syncRoles([Role::firstOrCreate(['name' => 'Vendedor'])->name]);
        $cobrador->syncRoles([Role::firstOrCreate(['name' => 'Cobrador'])->name]);
        $tecnico->syncRoles([Role::firstOrCreate(['name' => 'Técnico'])->name]);

        // Proveedores demo (por RNC)
        for ($i = 1; $i <= 5; $i++) {
            Proveedor::query()->firstOrCreate(
                ['rnc' => "1010000{$i}"],
                [
                    'sucursal_id' => $sucursal->id,
                    'nombre' => "Proveedor Demo {$i}",
                    'telefono' => "829555".str_pad((string) $i, 4, '0', STR_PAD_LEFT),
                    'email' => "proveedor{$i}@demo.local",
                    'direccion' => "Dirección proveedor {$i}",
                    'activo' => true,
                ]
            );
        }

        $inventario = app(InventarioService::class);
        $finService = app(FinanciamientoService::class);

        $clientes = collect([$cliente1, $cliente2]);
        $proveedor = Proveedor::query()->where('sucursal_id', $sucursal->id)->first();
        $productos = Producto::query()->where('activo', true)->limit(10)->get();
        if (!$proveedor || $productos->isEmpty() || $clientes->isEmpty()) {
            return;
        }

        // Fotos de productos (sin hardcode en UI: se usan registros imagenes_productos)
        foreach ($productos as $idx => $p) {
            ImagenProducto::query()->firstOrCreate(
                ['producto_id' => $p->id, 'orden' => 0],
                ['path' => 'demo/producto-placeholder.svg']
            );
        }

        // Comprar stock para que el POS tenga inventario
        DB::transaction(function () use ($sucursal, $proveedor, $almacen, $admin, $productos, $inventario) {
            $fecha = now()->toDateString();

            $compra = \App\Models\Compra::create([
                'sucursal_id' => $sucursal->id,
                'proveedor_id' => $proveedor->id,
                'almacen_id' => $almacen->id,
                'numero' => 'COMPRA-DEMO-1',
                'fecha' => $fecha,
                'total' => 0,
                'estado' => 'registrada',
                'nota' => 'Compra demo para pruebas',
            ]);

            $total = 0;
            foreach ($productos as $idx => $p) {
                $cant = 5 + $idx;
                $costo = max(1, (float) $p->costo);
                $sub = $cant * $costo;
                $total += $sub;

                DetalleCompra::create([
                    'compra_id' => $compra->id,
                    'producto_id' => $p->id,
                    'cantidad' => $cant,
                    'costo_unitario' => $costo,
                    'subtotal' => $sub,
                ]);

                $inventario->entradaDesdeCompra($sucursal->id, $almacen->id, $p->id, $cant, $costo, $compra->id);
            }

            $compra->total = round($total, 2);
            $compra->save();
        });

        // Ventas demo: 1 contado + 1 financiada (genera cuotas)
        $clienteContado = $cliente1;
        $clienteFin = $cliente2;

        DB::transaction(function () use ($sucursal, $almacen, $admin, $productos, $clienteContado, $clienteFin, $inventario, $finService) {
            $hoy = now()->toDateString();
            $p1 = $productos->first();
            $p2 = $productos->skip(1)->first();

            // Contado
            $venta1 = \App\Models\Venta::create([
                'sucursal_id' => $sucursal->id,
                'cliente_id' => $clienteContado->id,
                'usuario_id' => $admin->id,
                'almacen_id' => $almacen->id,
                'tipo' => 'contado',
                'fecha' => $hoy,
                'subtotal' => 0,
                'descuento' => 0,
                'impuesto' => 0,
                'total' => 0,
                'estado' => 'registrada',
                'nota' => 'Venta contado demo',
            ]);

            $items1 = [
                ['p' => $p1, 'cant' => 1],
                ['p' => $p2, 'cant' => 1],
            ];
            $sub1 = 0;
            foreach ($items1 as $it) {
                $precio = (float) $it['p']->precio_contado;
                $sub = $it['cant'] * $precio;
                $sub1 += $sub;

                DetalleVenta::create([
                    'venta_id' => $venta1->id,
                    'producto_id' => $it['p']->id,
                    'cantidad' => $it['cant'],
                    'precio_unitario' => $precio,
                    'subtotal' => $sub,
                ]);

                $inventario->salidaPorVenta($sucursal->id, $almacen->id, $it['p']->id, $it['cant'], $venta1->id);
            }
            $venta1->subtotal = round($sub1, 2);
            $venta1->total = round($sub1, 2);
            $venta1->save();

            \App\Models\Pago::create([
                'sucursal_id' => $sucursal->id,
                'venta_id' => $venta1->id,
                'monto' => $venta1->total,
                'metodo_pago' => 'efectivo',
                'fecha' => $hoy,
                'estado_visita' => 'pagado',
            ]);

            // Financiada
            $venta2 = \App\Models\Venta::create([
                'sucursal_id' => $sucursal->id,
                'cliente_id' => $clienteFin->id,
                'usuario_id' => $admin->id,
                'almacen_id' => $almacen->id,
                'tipo' => 'financiada',
                'fecha' => $hoy,
                'subtotal' => 0,
                'descuento' => 0,
                'impuesto' => 0,
                'total' => 0,
                'estado' => 'registrada',
                'nota' => 'Venta financiada demo',
            ]);

            $precioFin = (float) $p1->precio_financiado;
            $sub2 = 1 * $precioFin;
            DetalleVenta::create([
                'venta_id' => $venta2->id,
                'producto_id' => $p1->id,
                'cantidad' => 1,
                'precio_unitario' => $precioFin,
                'subtotal' => $sub2,
            ]);
            $inventario->salidaPorVenta($sucursal->id, $almacen->id, $p1->id, 1, $venta2->id);

            $venta2->subtotal = round($sub2, 2);
            $venta2->total = round($sub2, 2);
            $venta2->save();

            $fin = $finService->crearDesdeVenta(
                $sucursal->id,
                $venta2->id,
                $clienteFin->id,
                (float) $venta2->total,
                2000,
                0,
                6,
                'mensual',
                Carbon::parse($hoy)
            );

            // Registrar un abono parcial de la primera cuota para que se vea el flujo
            $cuota1 = \App\Models\CuotaFinanciamiento::query()
                ->where('financiamiento_id', $fin->id)
                ->orderBy('numero')
                ->first();
            if ($cuota1) {
                $montoAbono = round(((float) $cuota1->monto) / 2, 2);
                \App\Models\Pago::create([
                    'sucursal_id' => $sucursal->id,
                    'venta_id' => $venta2->id,
                    'financiamiento_id' => $fin->id,
                    'cuota_id' => $cuota1->id,
                    'monto' => $montoAbono,
                    'metodo_pago' => 'transferencia',
                    'fecha' => $hoy,
                    'estado_visita' => 'pagado',
                    'nota' => 'Abono demo',
                ]);

                $cuota1->pagado = $montoAbono;
                $cuota1->save();
                $fin->balance = max(0, (float) $fin->balance - $montoAbono);
                $fin->save();
            }
        });

        // Segundo financiamiento demo: 10% de interés sobre capital (plan completo sin abonos)
        if (! \App\Models\Venta::query()
            ->where('sucursal_id', $sucursal->id)
            ->where('nota', 'Venta financiada demo 10% interés')
            ->exists()) {
            DB::transaction(function () use ($sucursal, $almacen, $admin, $productos, $cliente1, $inventario, $finService) {
                $hoy = now()->toDateString();
                $p = $productos->skip(2)->first() ?? $productos->first();

                $ventaInteres = \App\Models\Venta::create([
                    'sucursal_id' => $sucursal->id,
                    'cliente_id' => $cliente1->id,
                    'usuario_id' => $admin->id,
                    'almacen_id' => $almacen->id,
                    'tipo' => 'financiada',
                    'fecha' => $hoy,
                    'subtotal' => 0,
                    'descuento' => 0,
                    'impuesto' => 0,
                    'total' => 0,
                    'estado' => 'registrada',
                    'nota' => 'Venta financiada demo 10% interés',
                ]);

                $precioFin = (float) $p->precio_financiado;
                $sub = 1 * $precioFin;
                DetalleVenta::create([
                    'venta_id' => $ventaInteres->id,
                    'producto_id' => $p->id,
                    'cantidad' => 1,
                    'precio_unitario' => $precioFin,
                    'subtotal' => $sub,
                ]);
                $inventario->salidaPorVenta($sucursal->id, $almacen->id, $p->id, 1, $ventaInteres->id);

                $ventaInteres->subtotal = round($sub, 2);
                $ventaInteres->total = round($sub, 2);
                $ventaInteres->save();

                $finService->crearDesdeVenta(
                    $sucursal->id,
                    $ventaInteres->id,
                    $cliente1->id,
                    (float) $ventaInteres->total,
                    3000,
                    10.0,
                    8,
                    'mensual',
                    Carbon::parse($hoy)
                );
            });
        }

        // Rutas de cobro + asignación de clientes
        $ruta1 = RutaCobro::query()->firstOrCreate(
            ['sucursal_id' => $sucursal->id, 'nombre' => 'Ruta Norte - Lunes'],
            [
                'dia' => 'lunes',
                'sector' => 'Zona Norte',
                'frecuencia' => 'semanal',
                'cobrador_id' => $cobrador->id,
                'activa' => true,
            ]
        );
        $ruta2 = RutaCobro::query()->firstOrCreate(
            ['sucursal_id' => $sucursal->id, 'nombre' => 'Ruta Este - Miércoles'],
            [
                'dia' => 'miercoles',
                'sector' => 'Zona Este',
                'frecuencia' => 'semanal',
                'cobrador_id' => $cobrador->id,
                'activa' => true,
            ]
        );
        ClienteRuta::query()->firstOrCreate(['ruta_cobro_id' => $ruta1->id, 'cliente_id' => $cliente1->id]);
        ClienteRuta::query()->firstOrCreate(['ruta_cobro_id' => $ruta2->id, 'cliente_id' => $cliente2->id]);

        // Garantía (sobre la venta contado)
        $ventaContado = \App\Models\Venta::query()->where('tipo', 'contado')->where('sucursal_id', $sucursal->id)->latest('id')->first();
        if ($ventaContado) {
            $detalle = \App\Models\DetalleVenta::query()->where('venta_id', $ventaContado->id)->first();
            if ($detalle) {
                Garantia::query()->firstOrCreate(
                    ['venta_id' => $ventaContado->id, 'producto_id' => $detalle->producto_id],
                    [
                        'sucursal_id' => $sucursal->id,
                        'detalle_venta_id' => $detalle->id,
                        'cliente_id' => $ventaContado->cliente_id,
                        'usuario_id' => $admin->id,
                        'fecha_reclamo' => now()->toDateString(),
                        'tipo' => 'tienda',
                        'estado' => 'en_proceso',
                        'motivo' => 'No enciende',
                        'descripcion' => 'El equipo no enciende luego de 2 días de uso.',
                        'diagnostico' => 'Revisión inicial pendiente.',
                    ]
                );
            }
        }

        // Servicio técnico (caso 2: equipo trae para diagnóstico, ligado a cliente2)
        $productoST = $productos->first();
        ServicioTecnico::query()->firstOrCreate(
            ['numero' => 'ST-DEMO-0001'],
            [
                'sucursal_id' => $sucursal->id,
                'venta_id' => null,
                'detalle_venta_id' => null,
                'cliente_id' => $cliente2->id,
                'producto_id' => $productoST->id,
                'usuario_id' => $admin->id,
                'fecha_ingreso' => now()->toDateString(),
                'estado' => 'diagnostico',
                'falla_reportada' => 'Ruido excesivo y no enfría.',
                'diagnostico' => 'Se detecta problema en ventilador.',
                'trabajo_realizado' => null,
                'costo' => 1500,
                'adelanto' => 500,
            ]
        );

        // Caja abierta + movimientos + gasto contra caja
        $caja = \App\Models\Caja::query()->firstOrCreate(
            ['sucursal_id' => $sucursal->id, 'estado' => 'abierta'],
            [
                'usuario_apertura_id' => $admin->id,
                'apertura_en' => now()->subHours(2),
                'monto_inicial' => 5000,
                'monto_cierre' => 0,
                'diferencia' => 0,
                'nota' => 'Caja demo abierta',
            ]
        );

        MovimientoCaja::query()->firstOrCreate(
            ['caja_id' => $caja->id, 'tipo' => 'entrada', 'concepto' => 'Ingreso por cobro demo'],
            [
                'sucursal_id' => $sucursal->id,
                'usuario_id' => $admin->id,
                'fecha' => now()->subHour(),
                'monto' => 1200,
                'nota' => 'Entrada demo',
                'referencia_tipo' => 'pago',
                'referencia_id' => null,
            ]
        );

        $gastoCaja = Gasto::query()->firstOrCreate(
            ['concepto' => 'Compra de materiales (demo)', 'fecha' => now()->toDateString()],
            [
                'sucursal_id' => $sucursal->id,
                'usuario_id' => $admin->id,
                'caja_id' => $caja->id,
                'categoria' => 'Operación',
                'monto' => 350,
                'estado' => 'registrado',
                'nota' => 'Gasto demo contra caja',
            ]
        );

        // Gastos demo
        Gasto::query()->firstOrCreate(
            ['concepto' => 'Pago de transporte (demo)', 'fecha' => now()->toDateString()],
            [
                'sucursal_id' => $sucursal->id,
                'usuario_id' => $admin->id,
                'caja_id' => null,
                'categoria' => 'Transporte',
                'monto' => 500,
                'estado' => 'registrado',
                'nota' => 'Gasto demo',
            ]
        );
    }
}

