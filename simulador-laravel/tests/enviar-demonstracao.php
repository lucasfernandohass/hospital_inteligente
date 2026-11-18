<?php

declare(strict_types=1);

use App\Services\VitalSignsGenerator;
use App\Services\VitalSignsSender;
use Illuminate\Contracts\Console\Kernel;

$url = getenv('HOSPITAL_QA_DEMO_API');
$paciente = getenv('HOSPITAL_QA_DEMO_PATIENT');
$chave = getenv('HOSPITAL_QA_MONITOR_KEY');
if ($url === false || !preg_match('#^http://127\.0\.0\.1:[0-9]+$#D', $url)
    || $paciente === false || !ctype_digit($paciente) || $chave === false || $chave === '') {
    fwrite(STDERR, "O envio de QA exige o backend isolado e um paciente sintético.\n");
    exit(1);
}

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->useEnvironmentPath(sys_get_temp_dir())->loadEnvironmentFrom('hospital-qa-test-only.env');
$app->make(Kernel::class)->bootstrap();
config(['simulator.api_url' => $url, 'simulator.api_key' => $chave]);

$lote = (new VitalSignsGenerator())->generate('febre', 0);
$aceitos = (new VitalSignsSender())->send((int) $paciente, $lote);
echo json_encode($aceitos, JSON_THROW_ON_ERROR);
