<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Caja extends Model
{
    protected $table = 'cajas';

    protected $fillable = [
        'sucursal_id',
        'usuario_apertura_id',
        'usuario_cierre_id',
        'apertura_en',
        'cierre_en',
        'monto_inicial',
        'monto_cierre',
        'diferencia',
        'estado',
        'nota',
    ];
}
