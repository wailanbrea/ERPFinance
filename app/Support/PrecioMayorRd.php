<?php

namespace App\Support;

/**
 * Cálculo de precio al por mayor según reglas configuradas para RD (ver config/precios_mayor.php).
 */
final class PrecioMayorRd
{
    /**
     * @param  float|null  $costo  Costo unitario; null o ≤0 se ignora para el piso.
     */
    public static function sugerido(float $precioContado, ?float $costo): ?float
    {
        if ($precioContado <= 0) {
            return null;
        }

        $cfg = config('precios_mayor.rd', []);
        $desc = (float) ($cfg['descuento_sobre_contado'] ?? 0.12);
        $margenCosto = (float) ($cfg['margen_minimo_sobre_costo'] ?? 0.03);
        $techoRatio = (float) ($cfg['techo_ratio_contado'] ?? 0.998);

        $desc = max(0.0, min(0.5, $desc));
        $margenCosto = max(0.0, min(0.5, $margenCosto));
        $techoRatio = max(0.5, min(1.0, $techoRatio));

        $base = round($precioContado * (1 - $desc), 2);

        $pisoCosto = 0.0;
        if ($costo !== null && $costo > 0) {
            $pisoCosto = round($costo * (1 + $margenCosto), 2);
        }

        $combinado = round(max($base, $pisoCosto), 2);
        $techo = round($precioContado * $techoRatio, 2);

        return round(min($combinado, $techo), 2);
    }
}
