<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pago extends Model
{
    protected $table = 'pagos';

    protected $fillable = [
        'sucursal_id',
        'venta_id',
        'apartado_id',
        'financiamiento_id',
        'cuota_id',
        'monto',
        'mora',
        'descuento',
        'metodo_pago',
        'fecha',
        'nota',
        'estado_visita',
    ];

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'venta_id');
    }

    public function apartado(): BelongsTo
    {
        return $this->belongsTo(Apartado::class, 'apartado_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }
}
