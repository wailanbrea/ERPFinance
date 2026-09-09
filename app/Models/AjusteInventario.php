<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AjusteInventario extends Model
{
    protected $table = 'ajustes_inventario';

    protected $fillable = [
        'sucursal_id',
        'almacen_id',
        'motivo',
        'nota',
    ];
}
