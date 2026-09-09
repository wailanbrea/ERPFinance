<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Almacen extends Model
{
    protected $table = 'almacenes';

    protected $fillable = [
        'sucursal_id',
        'nombre',
        'tipo',
        'activo',
    ];
}
