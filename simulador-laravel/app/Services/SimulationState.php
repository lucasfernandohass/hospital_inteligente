<?php

namespace App\Services;

use Illuminate\Support\Carbon;

class SimulationState
{
    private string $path;

    public function __construct()
    {
        $this->path = storage_path('app/simulation-state.json');
    }

    /** @return array<string, mixed> */
    public function read(): array
    {
        if (!is_file($this->path)) {
            return ['running' => config('simulator.auto_start'), 'scenario' => config('simulator.scenario'), 'startedAt' => null, 'lastCycleAt' => null, 'lastError' => null];
        }

        $state = json_decode((string) file_get_contents($this->path), true);
        return is_array($state) ? $state : ['running' => false, 'scenario' => config('simulator.scenario'), 'startedAt' => null, 'lastCycleAt' => null, 'lastError' => 'Estado de simulação inválido.'];
    }

    /** @param array<string, mixed> $state */
    public function write(array $state): array
    {
        $directory = dirname($this->path);
        if (!is_dir($directory)) mkdir($directory, 0775, true);
        file_put_contents($this->path, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        return $state;
    }

    public function start(string $scenario): array
    {
        return $this->write([
            'running' => true,
            'scenario' => $scenario,
            'startedAt' => now()->toIso8601String(),
            'lastCycleAt' => null,
            'lastError' => null,
            'step' => 0,
        ]);
    }

    public function stop(): array
    {
        $state = $this->read();
        $state['running'] = false;
        $state['stoppedAt'] = now()->toIso8601String();
        return $this->write($state);
    }

    /** @param array<string, mixed> $state */
    public function isCycleDue(array $state): bool
    {
        $last = $state['lastCycleAt'] ?? null;
        return !$last || Carbon::parse($last)->addSeconds(config('simulator.interval_seconds'))->isPast();
    }
}
