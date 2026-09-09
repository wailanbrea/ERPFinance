<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServicioTecnico extends Model
{
    protected $table = 'servicio_tecnicos';

    protected static function booted(): void
    {
        static::created(function (self $orden) {
            // Si no se provee un número, generarlo automáticamente a partir del ID.
            // Formato simple y estable: ST-000123
            if (! $orden->numero || trim((string) $orden->numero) === '') {
                $orden->numero = 'ST-'.str_pad((string) $orden->id, 6, '0', STR_PAD_LEFT);
                $orden->saveQuietly();
            }
        });
    }

    protected $fillable = [
        'sucursal_id',
        'venta_id',
        'detalle_venta_id',
        'cliente_id',
        'producto_id',
        'usuario_id',
        'numero',
        'fecha_ingreso',
        'estado',
        'falla_reportada',
        'diagnostico',
        'trabajo_realizado',
        'costo',
        'adelanto',
        'fecha_entrega',
    ];
}
