<?php

/**
 * Reglas sugeridas para precio al por mayor (RD).
 *
 * No existe en RD un porcentaje legal obligatorio entre PVP al contado y mayorista;
 * aquí se reflejan criterios habituales del comercio y distribución local:
 * - Descuento mayorista frente al precio al contado en un rango típico 10–15 % (punto medio 12 %).
 * - Piso sobre costo para no fijar un mayorista por debajo de un margen mínimo de sostenibilidad
 *   (coherente con prácticas de compra/venta y análisis de margen).
 * - Techo por debajo del contado para distinguir canal detalle vs mayorista.
 *
 * Los montos del ERP se interpretan como los mismos que uses en facturación (habitualmente
 * antes de discriminar ITBIS 18 %, según tu configuración de ventas).
 */
return [

    'rd' => [
        /** Descuento sobre precio_al_contado para obtener la base mayorista (0.12 = 12 %). */
        'descuento_sobre_contado' => (float) env('PRECIO_MAYOR_RD_DESCUENTO_SOBRE_CONTADO', 0.12),

        /** Margen mínimo sobre costo cuando hay costo registrado (0.03 = 3 %). */
        'margen_minimo_sobre_costo' => (float) env('PRECIO_MAYOR_RD_MARGEN_MIN_SOBRE_COSTO', 0.03),

        /**
         * Tope: precio mayorista no supera este ratio del contado (0.998 = hasta 99,8 % del contado).
         * Mantiene el mayorista estrictamente por debajo del detalle en catálogo.
         */
        'techo_ratio_contado' => (float) env('PRECIO_MAYOR_RD_TECHO_RATIO_CONTADO', 0.998),
    ],

];
