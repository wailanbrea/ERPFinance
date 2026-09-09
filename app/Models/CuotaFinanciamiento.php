<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class CuotaFinanciamiento extends Model
{
    protected $table = 'cuotas_financiamiento';

    protected $fillable = [
        'financiamiento_id',
        'numero',
        'vencimiento',
        'monto',
        'mora',
        'pagado',
        'estado',
    ];

    public function financiamiento(): BelongsTo
    {
        return $this->belongsTo(Financiamiento::class, 'financiamiento_id');
    }
}
