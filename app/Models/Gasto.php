<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gasto extends Model
{
    protected $table = 'gastos';

    protected $fillable = [
        'sucursal_id',
        'usuario_id',
        'caja_id',
        'fecha',
        'categoria',
        'concepto',
        'monto',
        'estado',
        'nota',
    ];
}
