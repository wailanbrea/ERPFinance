<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimientoInventario extends Model
{
    protected $table = 'movimientos_inventario';

    protected $fillable = [
        'sucursal_id',
        'almacen_id',
        'producto_id',
        'tipo',
        'cantidad',
        'saldo',
        'referencia_tipo',
        'referencia_id',
        'nota',
    ];
}
