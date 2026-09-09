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
        Schema::table('direcciones_clientes', function (Blueprint $table) {
            $table->decimal('lat', 10, 7)->nullable()->after('referencia');
            $table->decimal('lng', 10, 7)->nullable()->after('lat');
            $table->string('geocode_source', 20)->nullable()->after('lng'); // manual/import
            $table->timestamp('geocode_updated_at')->nullable()->after('geocode_source');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('direcciones_clientes', function (Blueprint $table) {
            $table->dropColumn(['lat', 'lng', 'geocode_source', 'geocode_updated_at']);
        });
    }
};
