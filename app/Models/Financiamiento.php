<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Financiamiento extends Model
{
    protected $table = 'financiamientos';

    protected $fillable = [
        'sucursal_id',
        'venta_id',
        'cliente_id',
        'monto',
        'inicial',
        'balance',
        'interes',
        'cuotas',
        'frecuencia',
        'estado',
    ];

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'venta_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    /**
     * Cuotas del calendario (no confundir con el atributo escalar `cuotas` = cantidad de cuotas del contrato).
     */
    public function planCuotas(): HasMany
    {
        return $this->hasMany(CuotaFinanciamiento::class, 'financiamiento_id');
    }
}
