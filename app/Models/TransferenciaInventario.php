<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransferenciaInventario extends Model
{
    protected $table = 'transferencias_inventario';

    protected $fillable = [
        'sucursal_id',
        'almacen_origen_id',
        'almacen_destino_id',
        'estado',
        'nota',
    ];
}
