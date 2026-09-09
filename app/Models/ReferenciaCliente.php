<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferenciaCliente extends Model
{
    protected $table = 'referencias_clientes';

    protected $fillable = [
        'cliente_id',
        'nombre',
        'telefono',
        'parentesco',
        'nota',
    ];
}
