<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('compras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales');
            $table->unsignedBigInteger('proveedor_id')->nullable();
            $table->foreignId('almacen_id')->constrained('almacenes');

            $table->string('numero')->nullable()->index();
            $table->date('fecha')->index();
            $table->decimal('total', 12, 2)->default(0);
            $table->string('estado')->default('registrada')->index();
            $table->text('nota')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compras');
    }
};
