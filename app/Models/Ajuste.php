<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ajuste extends Model
{
    protected $table = 'ajustes';

    protected $fillable = [
        'sucursal_id',
        'clave',
        'valor',
    ];
}
