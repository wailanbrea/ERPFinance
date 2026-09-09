<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimientoCaja extends Model
{
    protected $table = 'movimientos_caja';

    protected $fillable = [
        'sucursal_id',
        'caja_id',
        'usuario_id',
        'fecha',
        'tipo',
        'concepto',
        'monto',
        'nota',
        'referencia_tipo',
        'referencia_id',
    ];
}
