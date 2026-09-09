<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RutaCobro extends Model
{
    protected $table = 'rutas_cobro';

    protected $fillable = [
        'sucursal_id',
        'nombre',
        'dia',
        'sector',
        'frecuencia',
        'cobrador_id',
        'activa',
    ];
}
