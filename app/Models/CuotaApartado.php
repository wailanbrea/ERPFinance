<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CuotaApartado extends Model
{
    protected $table = 'cuotas_apartado';

    protected $fillable = [
        'apartado_id',
        'numero',
        'vencimiento',
        'monto',
        'pagado',
        'estado',
    ];

    public function apartado(): BelongsTo
    {
        return $this->belongsTo(Apartado::class, 'apartado_id');
    }
}
