<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClienteRuta extends Model
{
    protected $table = 'clientes_rutas';

    protected $fillable = [
        'ruta_cobro_id',
        'cliente_id',
    ];
}
