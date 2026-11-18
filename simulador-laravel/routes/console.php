<?php

use App\Services\SimulationRunner;
use Illuminate\Support\Facades\Schedule;

// schedule:work mantém o ciclo vivo; novos pacientes internados entram automaticamente.
Schedule::call(fn () => app(SimulationRunner::class)->runCycle())
    ->name('simulador-sinais-vitais')
    ->everySecond();
