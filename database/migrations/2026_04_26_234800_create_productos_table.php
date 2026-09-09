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
        Schema::create('productos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categoria_id')->nullable()->constrained('categorias');
            $table->foreignId('marca_id')->nullable()->constrained('marcas');

            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->string('sku')->nullable()->unique();
            $table->string('codigo_barra')->nullable()->unique();
            $table->string('qr')->nullable()->unique();
            $table->string('modelo')->nullable();
            $table->string('serial')->nullable();

            $table->decimal('costo', 12, 2)->default(0);
            $table->decimal('precio_contado', 12, 2)->default(0);
            $table->decimal('precio_financiado', 12, 2)->default(0);
            $table->unsignedInteger('garantia_meses')->default(0);

            $table->boolean('activo')->default(true)->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};
