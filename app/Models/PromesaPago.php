<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromesaPago extends Model
{
    protected $table = 'promesas_pago';

    protected $fillable = [
        'sucursal_id',
        'financiamiento_id',
        'fecha_promesa',
        'monto',
        'nota',
        'usuario_id',
    ];
}
