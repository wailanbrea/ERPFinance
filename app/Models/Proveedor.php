<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    protected $table = 'proveedores';

    protected $fillable = [
        'sucursal_id',
        'nombre',
        'rnc',
        'telefono',
        'email',
        'direccion',
        'activo',
    ];
}
