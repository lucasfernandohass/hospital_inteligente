<?php

namespace App\Console\Commands;

use App\Services\VitalSignsGenerator;
use App\Services\VitalSignsSender;
use Illuminate\Console\Command;
use Throwable;

class SimulateVitalSigns extends Command
{
    protected $signature = 'simulator:vitals {--patient= : ID do paciente internado} {--scenario= : estavel, febre, dessaturacao, hipertensao ou deterioracao_recuperacao} {--interval= : intervalo em segundos} {--once : envia somente um lote}';
    protected $description = 'Gera e envia sinais vitais simulados para a API Java';

    public function handle(VitalSignsGenerator $generator, VitalSignsSender $sender): int
    {
        $patientId = (int) ($this->option('patient') ?: config('simulator.patient_id'));
        $scenario = (string) ($this->option('scenario') ?: config('simulator.scenario'));
        $interval = max(1, (int) ($this->option('interval') ?: config('simulator.interval_seconds')));

        if ($patientId < 1 || !config('simulator.api_key')) {
            $this->error('Configure MONITOR_API_KEY e um SIMULATOR_PATIENT_ID válido no .env.');
            return self::FAILURE;
        }

        $this->info("Simulando paciente {$patientId} no cenário {$scenario}; intervalo de {$interval}s.");
        $step = 0;
        do {
            try {
                $values = $generator->generate($scenario, $step++);
                $sender->send($patientId, $values);
                $this->line(now()->format('H:i:s').' sinais enviados: '.json_encode($values, JSON_UNESCAPED_UNICODE));
            } catch (Throwable $exception) {
                $this->error('Falha no envio: '.$exception->getMessage());
                if ($this->option('once')) return self::FAILURE;
            }

            if (!$this->option('once')) sleep($interval);
        } while (!$this->option('once'));

        return self::SUCCESS;
    }
}
