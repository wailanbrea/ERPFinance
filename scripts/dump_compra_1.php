<?php

use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\MovimientoInventario;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$id = (int) ($argv[1] ?? 1);

$c = Compra::query()->find($id);
if (! $c) { echo "no compra\n"; exit(0); }

$det = DetalleCompra::query()->where('compra_id', $id)->get()->map(fn($d)=>[
  'id'=>$d->id,'producto_id'=>$d->producto_id,'cantidad'=>(float)$d->cantidad,'costo_unitario'=>(float)$d->costo_unitario,
  'costo_unitario_con_itbis'=>(float)($d->costo_unitario_con_itbis??0),'subtotal'=>(float)$d->subtotal
])->all();

$mov = MovimientoInventario::query()->where('referencia_tipo','compra')->orderBy('id')->get(['id','producto_id','cantidad','referencia_id'])->map(fn($m)=>[
  'id'=>$m->id,'producto_id'=>$m->producto_id,'cantidad'=>(float)$m->cantidad,'referencia_id'=>$m->referencia_id
])->all();

echo json_encode(['compra'=>['id'=>$c->id,'almacen_id'=>$c->almacen_id,'total'=>(float)$c->total],'detalles'=>$det,'movs'=>$mov], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)."\n";

