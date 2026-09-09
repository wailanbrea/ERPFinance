<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DireccionCliente extends Model
{
    protected $table = 'direcciones_clientes';

    protected $fillable = [
        'cliente_id',
        'tipo',
        'direccion',
        'referencia',
        'principal',
        'lat',
        'lng',
        'geocode_source',
        'geocode_updated_at',
    ];
}
