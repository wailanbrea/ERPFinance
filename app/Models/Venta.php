<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Venta extends Model
{
    protected $table = 'ventas';

    protected $fillable = [
        'sucursal_id',
        'cliente_id',
        'usuario_id',
        'almacen_id',
        'tipo',
        'modalidad',
        'numero_factura',
        'fecha',
        'subtotal',
        'descuento',
        'impuesto',
        'total',
        'estado',
        'nota',
    ];

    protected static function booted(): void
    {
        static::created(function (self $venta) {
            if (! $venta->numero_factura || trim((string) $venta->numero_factura) === '') {
                $venta->numero_factura = 'FAC-'.str_pad((string) $venta->id, 6, '0', STR_PAD_LEFT);
                $venta->saveQuietly();
            }
        });
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(DetalleVenta::class, 'venta_id');
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class, 'venta_id');
    }

    public function apartado(): HasOne
    {
        return $this->hasOne(Apartado::class, 'venta_id');
    }
}
