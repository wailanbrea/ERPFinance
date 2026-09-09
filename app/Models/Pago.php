<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    protected $table = 'pagos';

    protected $fillable = [
        'sucursal_id',
        'venta_id',
        'monto',
        'mora',
        'descuento',
        'metodo_pago',
        'fecha',
        'nota',
    ];
}
