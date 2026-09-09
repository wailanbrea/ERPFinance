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
        Schema::create('cuotas_financiamiento', function (Blueprint $table) {
            $table->id();
            $table->foreignId('financiamiento_id')->constrained('financiamientos')->cascadeOnDelete();
            $table->unsignedInteger('numero');
            $table->date('vencimiento')->index();
            $table->decimal('monto', 12, 2)->default(0);
            $table->decimal('mora', 12, 2)->default(0);
            $table->decimal('pagado', 12, 2)->default(0);
            $table->string('estado')->default('pendiente')->index();
            $table->timestamps();

            $table->unique(['financiamiento_id', 'numero']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cuotas_financiamiento');
    }
};
