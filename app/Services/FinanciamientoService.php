<?php

namespace App\Services;

use App\Models\CuotaFinanciamiento;
use App\Models\Financiamiento;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinanciamientoService
{
    public function crearDesdeVenta(
        int $sucursalId,
        int $ventaId,
        int $clienteId,
        float $montoTotal,
        float $inicial,
        float $interesPorciento,
        int $cuotas,
        string $frecuencia,
        Carbon $fechaInicio
    ): Financiamiento {
        return DB::transaction(function () use ($sucursalId, $ventaId, $clienteId, $montoTotal, $inicial, $interesPorciento, $cuotas, $frecuencia, $fechaInicio) {
            $balance = max(0, $montoTotal - $inicial);
            $factorInteres = 1 + ($interesPorciento / 100);
            $balanceConInteres = $balance * $factorInteres;
            $montoCuota = $cuotas > 0 ? round($balanceConInteres / $cuotas, 2) : 0;

            $fin = Financiamiento::create([
                'sucursal_id' => $sucursalId,
                'venta_id' => $ventaId,
                'cliente_id' => $clienteId,
                'monto' => $montoTotal,
                'inicial' => $inicial,
                'balance' => $balanceConInteres,
                'interes' => $interesPorciento,
                'cuotas' => $cuotas,
                'frecuencia' => $frecuencia,
                'estado' => 'activo',
            ]);

            for ($i = 1; $i <= $cuotas; $i++) {
                $venc = $this->calcularVencimiento($fechaInicio, $frecuencia, $i);
                CuotaFinanciamiento::create([
                    'financiamiento_id' => $fin->id,
                    'numero' => $i,
                    'vencimiento' => $venc->toDateString(),
                    'monto' => $montoCuota,
                    'mora' => 0,
                    'pagado' => 0,
                    'estado' => 'pendiente',
                ]);
            }

            return $fin;
        });
    }

    private function calcularVencimiento(Carbon $fechaInicio, string $frecuencia, int $n): Carbon
    {
        return match ($frecuencia) {
            'semanal' => $fechaInicio->copy()->addWeeks($n),
            'quincenal' => $fechaInicio->copy()->addWeeks(2 * $n),
            default => $fechaInicio->copy()->addMonths($n),
        };
    }
}

