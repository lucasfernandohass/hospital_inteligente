<?php

use App\Http\Controllers\SimulationController;
use Illuminate\Support\Facades\Route;

Route::prefix('simulacao')->group(function (): void {
    Route::get('/pacientes', [SimulationController::class, 'patients']);
    Route::post('/iniciar', [SimulationController::class, 'start']);
    Route::get('/status', [SimulationController::class, 'status']);
    Route::post('/parar', [SimulationController::class, 'stop']);
});
