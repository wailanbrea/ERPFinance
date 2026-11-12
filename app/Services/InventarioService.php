<?php

namespace App\Services;

use App\Models\MovimientoInventario;
use App\Models\StockProducto;
use Illuminate\Support\Facades\DB;

class InventarioService
{
    public function entradaDesdeCompra(
        int $sucursalId,
        int $almacenId,
        int $productoId,
        float $cantidad,
        int $compraId
    ): void {
        DB::transaction(function () use ($sucursalId, $almacenId, $productoId, $cantidad, $compraId) {
            $stock = StockProducto::query()->firstOrCreate(
                ['almacen_id' => $almacenId, 'producto_id' => $productoId],
                ['stock' => 0, 'stock_minimo' => 0],
            );

            $stock->stock = (float) $stock->stock + $cantidad;
            $stock->save();

            MovimientoInventario::create([
                'sucursal_id' => $sucursalId,
                'almacen_id' => $almacenId,
                'producto_id' => $productoId,
                'tipo' => 'entrada',
                'cantidad' => $cantidad,
                'saldo' => (float) $stock->stock,
                'referencia_tipo' => 'compra',
                'referencia_id' => $compraId,
            ]);
        });
    }

    public function salidaPorVenta(
        int $sucursalId,
        int $almacenId,
        int $productoId,
        float $cantidad,
        int $ventaId,
        bool $permitirStockNegativo = false
    ): void {
        DB::transaction(function () use ($sucursalId, $almacenId, $productoId, $cantidad, $ventaId, $permitirStockNegativo) {
            $stock = StockProducto::query()->firstOrCreate(
                ['almacen_id' => $almacenId, 'producto_id' => $productoId],
                ['stock' => 0, 'stock_minimo' => 0],
            );

            $nuevo = (float) $stock->stock - $cantidad;
            if (!$permitirStockNegativo && $nuevo < 0) {
                abort(422, 'Stock insuficiente para completar la venta.');
            }

            $stock->stock = $nuevo;
            $stock->save();

            MovimientoInventario::create([
                'sucursal_id' => $sucursalId,
                'almacen_id' => $almacenId,
                'producto_id' => $productoId,
                'tipo' => 'salida',
                'cantidad' => $cantidad,
                'saldo' => (float) $stock->stock,
                'referencia_tipo' => 'venta',
                'referencia_id' => $ventaId,
            ]);
        });
    }

    public function devolucionPorCancelacionVenta(
        int $sucursalId,
        int $almacenId,
        int $productoId,
        float $cantidad,
        int $ventaId,
        string $motivo = 'Cancelación de apartado'
    ): void {
        DB::transaction(function () use ($sucursalId, $almacenId, $productoId, $cantidad, $ventaId, $motivo) {
            $stock = StockProducto::query()->firstOrCreate(
                ['almacen_id' => $almacenId, 'producto_id' => $productoId],
                ['stock' => 0, 'stock_minimo' => 0],
            );

            $stock->stock = (float) $stock->stock + $cantidad;
            $stock->save();

            MovimientoInventario::create([
                'sucursal_id' => $sucursalId,
                'almacen_id' => $almacenId,
                'producto_id' => $productoId,
                'tipo' => 'entrada',
                'cantidad' => $cantidad,
                'saldo' => (float) $stock->stock,
                'referencia_tipo' => 'cancelacion_venta',
                'referencia_id' => $ventaId,
                'nota' => $motivo,
            ]);
        });
    }
}
