<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Garantia extends Model
{
    protected $table = 'garantias';

    protected $fillable = [
        'sucursal_id',
        'venta_id',
        'detalle_venta_id',
        'cliente_id',
        'producto_id',
        'usuario_id',
        'servicio_tecnico_id',
        'fecha_reclamo',
        'tipo',
        'estado',
        'motivo',
        'descripcion',
        'diagnostico',
        'resolucion',
        'fecha_cierre',
    ];

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'venta_id');
    }

    public function detalleVenta(): BelongsTo
    {
        return $this->belongsTo(DetalleVenta::class, 'detalle_venta_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function servicioTecnico(): BelongsTo
    {
        return $this->belongsTo(ServicioTecnico::class, 'servicio_tecnico_id');
    }
}
