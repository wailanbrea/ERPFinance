<?php

namespace App\Services;

use App\Models\Apartado;
use App\Models\CuotaApartado;
use App\Models\Pago;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ApartadoService
{
    public function crearDesdeVenta(
        int $sucursalId,
        int $ventaId,
        int $clienteId,
        int $usuarioId,
        float $montoTotal,
        float $abonoInicial,
        int $cuotasSemanales,
        Carbon $fechaInicio,
        string $metodoPago = 'efectivo',
        ?string $nota = null
    ): Apartado {
        return DB::transaction(function () use (
            $sucursalId,
            $ventaId,
            $clienteId,
            $usuarioId,
            $montoTotal,
            $abonoInicial,
            $cuotasSemanales,
            $fechaInicio,
            $metodoPago,
            $nota
        ) {
            $cuotasSemanales = max(1, $cuotasSemanales);
            $abonoInicial = min($montoTotal, max(0, $abonoInicial));
            $saldoPendiente = max(0, $montoTotal - $abonoInicial);
            $fechaLimite = $fechaInicio->copy()->addWeeks($cuotasSemanales);

            $apartado = Apartado::create([
                'sucursal_id' => $sucursalId,
                'venta_id' => $ventaId,
                'cliente_id' => $clienteId,
                'usuario_id' => $usuarioId,
                'monto_total' => $montoTotal,
                'abono_inicial' => $abonoInicial,
                'total_abonado' => $abonoInicial,
                'saldo_pendiente' => $saldoPendiente,
                'cuotas_semanales' => $cuotasSemanales,
                'fecha_apartado' => $fechaInicio->toDateString(),
                'fecha_limite' => $fechaLimite->toDateString(),
                'estado' => $saldoPendiente <= 0 ? 'liquidado' : 'pendiente',
                'nota' => $nota,
            ]);

            // Generar cuotas semanales para el saldo restante
            $montoCuota = $cuotasSemanales > 0 ? round($saldoPendiente / $cuotasSemanales, 2) : 0;
            for ($i = 1; $i <= $cuotasSemanales; $i++) {
                $venc = $fechaInicio->copy()->addWeeks($i);
                CuotaApartado::create([
                    'apartado_id' => $apartado->id,
                    'numero' => $i,
                    'vencimiento' => $venc->toDateString(),
                    'monto' => $montoCuota,
                    'pagado' => 0,
                    'estado' => $saldoPendiente <= 0 ? 'pagada' : 'pendiente',
                ]);
            }

            // Registrar abono inicial en la tabla de pagos si fue mayor a 0
            if ($abonoInicial > 0) {
                Pago::create([
                    'sucursal_id' => $sucursalId,
                    'venta_id' => $ventaId,
                    'apartado_id' => $apartado->id,
                    'monto' => $abonoInicial,
                    'metodo_pago' => $metodoPago,
                    'fecha' => $fechaInicio->toDateString(),
                    'nota' => 'Abono inicial de apartado',
                ]);
            }

            return $apartado;
        });
    }

    public function registrarAbono(
        Apartado $apartado,
        float $monto,
        string $metodoPago = 'efectivo',
        ?string $fecha = null,
        ?string $nota = null
    ): Pago {
        return DB::transaction(function () use ($apartado, $monto, $metodoPago, $fecha, $nota) {
            abort_if($apartado->estado === 'cancelado', 422, 'No se pueden registrar abonos a un apartado cancelado.');
            abort_if($apartado->estado === 'liquidado' || $apartado->estado === 'entregado', 422, 'Este apartado ya se encuentra totalmente liquidado.');

            $fechaPago = $fecha ?: now()->toDateString();
            $montoAplicar = min((float) $apartado->saldo_pendiente, max(0.01, $monto));

            $pago = Pago::create([
                'sucursal_id' => $apartado->sucursal_id,
                'venta_id' => $apartado->venta_id,
                'apartado_id' => $apartado->id,
                'monto' => $montoAplicar,
                'metodo_pago' => $metodoPago,
                'fecha' => $fechaPago,
                'nota' => $nota ?: 'Abono a apartado',
            ]);

            $nuevoTotalAbonado = (float) $apartado->total_abonado + $montoAplicar;
            $nuevoSaldo = max(0, (float) $apartado->monto_total - $nuevoTotalAbonado);

            $apartado->total_abonado = $nuevoTotalAbonado;
            $apartado->saldo_pendiente = $nuevoSaldo;
            if ($nuevoSaldo <= 0) {
                $apartado->estado = 'liquidado';
                $apartado->venta()->update(['estado' => 'pagada']);
            }
            $apartado->save();

            // Distribuir el abono en las cuotas pendientes
            $remanente = $montoAplicar;
            foreach ($apartado->cuotas()->where('estado', '!=', 'pagada')->get() as $cuota) {
                if ($remanente <= 0) break;
                $faltaCuota = (float) $cuota->monto - (float) $cuota->pagado;
                if ($faltaCuota <= 0) {
                    $cuota->update(['estado' => 'pagada']);
                    continue;
                }

                $aplicarACuota = min($faltaCuota, $remanente);
                $cuota->pagado = (float) $cuota->pagado + $aplicarACuota;
                $cuota->estado = $cuota->pagado >= (float) $cuota->monto ? 'pagada' : 'parcial';
                $cuota->save();
                $remanente -= $aplicarACuota;
            }

            return $pago;
        });
    }

    public function cancelarApartado(Apartado $apartado, string $motivo = 'Cancelación solicitada por cliente'): void
    {
        DB::transaction(function () use ($apartado, $motivo) {
            abort_if($apartado->estado === 'cancelado', 422, 'El apartado ya está cancelado.');
            abort_if($apartado->estado === 'entregado', 422, 'No se puede cancelar un apartado cuyos productos ya fueron entregados.');

            $inventario = app(InventarioService::class);
            $venta = $apartado->venta()->with('detalles')->firstOrFail();

            // Reingresar cada producto al almacén correspondiente
            foreach ($venta->detalles as $detalle) {
                $inventario->devolucionPorCancelacionVenta(
                    (int) $venta->sucursal_id,
                    (int) $venta->almacen_id,
                    (int) $detalle->producto_id,
                    (float) $detalle->cantidad,
                    (int) $venta->id,
                    $motivo
                );
            }

            $apartado->update([
                'estado' => 'cancelado',
                'nota' => trim($apartado->nota . "\n[Cancelado el " . now()->format('d/m/Y H:i') . "]: " . $motivo),
            ]);

            $venta->update(['estado' => 'cancelada']);
        });
    }
}
