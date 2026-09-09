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
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales');

            $table->string('nombre');
            $table->string('apellido')->nullable();
            $table->string('cedula_rnc')->nullable()->index();
            $table->string('telefono')->nullable();
            $table->string('whatsapp')->nullable();
            $table->text('direccion')->nullable();
            $table->text('referencias')->nullable();
            $table->string('estado')->default('activo')->index();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};
