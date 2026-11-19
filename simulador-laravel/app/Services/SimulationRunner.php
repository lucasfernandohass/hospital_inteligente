<?php

namespace App\Services;

use Throwable;

class SimulationRunner
{
    public function runCycle(): void
    {
        $stateStore = app(SimulationState::class);
        $state = $stateStore->read();

        if (!($state['running'] ?? false) || !$stateStore->isCycleDue($state)) return;

        try {
            $patients = app(JavaApiClient::class)->pacientesInternados();
            usort($patients, fn (array $a, array $b) => $a['id'] <=> $b['id']);
            $step = (int) ($state['step'] ?? 0);
            $sentCount = 0;

            foreach ($patients as $index => $patient) {
                $values = app(VitalSignsGenerator::class)->generate($state['scenario'], $step, $index);
                app(VitalSignsSender::class)->send($patient['id'], $values);
                $sentCount++;
            }

            $state['step'] = $step + 1;
            $state['startedAt'] ??= now()->toIso8601String();
            $state['lastCycleAt'] = now()->toIso8601String();
            $state['lastError'] = null;
            $state['lastSentCount'] = $sentCount;
            $state['activePatients'] = count($patients);
            $stateStore->write($state);
        } catch (Throwable $exception) {
            $state['lastError'] = $exception->getMessage();
            $stateStore->write($state);
            report($exception);
        }
    }
}
