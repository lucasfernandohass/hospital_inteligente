<?php

declare(strict_types=1);

use App\Services\VitalSignsGenerator;
use App\Services\VitalSignsSender;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Client\Request;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->useEnvironmentPath(sys_get_temp_dir())->loadEnvironmentFrom('hospital-qa-test-only.env');
$app->make(Kernel::class)->bootstrap();

function verificar(bool $condicao, string $mensagem): void
{
    if (!$condicao) {
        throw new RuntimeException($mensagem);
    }
}

$gerador = new VitalSignsGenerator();
$casos = [
    'seis sinais e cenarios distintos' => static function () use ($gerador): void {
        $estavel = $gerador->generate('estavel', 0);
        $tipos = ['TEMPERATURA', 'PRESSAO_SISTOLICA', 'PRESSAO_DIASTOLICA',
            'FREQUENCIA_CARDIACA', 'FREQUENCIA_RESPIRATORIA', 'SATURACAO_OXIGENIO'];
        verificar(array_keys($estavel) === $tipos, 'Tipos do lote incorretos');
        verificar($estavel['TEMPERATURA'] >= 36.7 && $estavel['TEMPERATURA'] <= 36.9, 'Temperatura estável fora do perfil');
        verificar($gerador->generate('febre', 0)['TEMPERATURA'] > 38, 'Cenário febre sem febre');
        verificar($gerador->generate('dessaturacao', 0)['SATURACAO_OXIGENIO'] < 92, 'Dessaturação não produzida');
        verificar($gerador->generate('hipertensao', 0)['PRESSAO_SISTOLICA'] > 140, 'Hipertensão não produzida');
        $inicio = $gerador->generate('deterioracao_recuperacao', 0);
        $pico = $gerador->generate('deterioracao_recuperacao', 30);
        $recuperado = $gerador->generate('deterioracao_recuperacao', 59);
        verificar($pico['SATURACAO_OXIGENIO'] < min($inicio['SATURACAO_OXIGENIO'], $recuperado['SATURACAO_OXIGENIO']),
            'Sem deterioração e recuperação da saturação');
    },
    'apresentacao comeca estavel e altera dois pacientes com sinais diferentes' => static function () use ($gerador): void {
        foreach ([0, 1, 2] as $paciente) {
            $inicio = $gerador->generate('apresentacao', 0, $paciente);
            verificar($inicio['TEMPERATURA'] < 37.5 && $inicio['SATURACAO_OXIGENIO'] >= 96, 'Apresentação não começa estável');
        }
        $febre = $gerador->generate('apresentacao', 20, 0);
        $dessaturacao = $gerador->generate('apresentacao', 20, 1);
        $outro = $gerador->generate('apresentacao', 20, 2);
        verificar($febre['TEMPERATURA'] > 39 && $febre['SATURACAO_OXIGENIO'] >= 96, 'Primeiro paciente sem febre isolada');
        verificar($dessaturacao['SATURACAO_OXIGENIO'] < 88 && $dessaturacao['TEMPERATURA'] < 37.5, 'Segundo paciente sem dessaturação isolada');
        verificar($outro['TEMPERATURA'] < 37.5 && $outro['SATURACAO_OXIGENIO'] >= 96, 'Terceiro paciente deveria seguir estável');
    },
    'rejeita cenario desconhecido' => static function () use ($gerador): void {
        try {
            $gerador->generate('fora-do-contrato', 0);
        } catch (InvalidArgumentException) {
            return;
        }
        throw new RuntimeException('Cenário inválido foi aceito');
    },
    'envia o contrato HTTP para Java e propaga rejeicao' => static function () use ($gerador): void {
        $url = 'http://simulador-qa.invalid/api/ingestao/sinais-vitais';
        $key = 'fixture-monitor-qa';
        config(['simulator.api_url' => 'http://simulador-qa.invalid', 'simulator.api_key' => $key]);
        Http::preventStrayRequests()->fake([$url => Http::sequence()
            ->push(['aceito' => true], 202)->push(['status' => 403], 403)]);
        $lote = $gerador->generate('febre', 0);
        $sender = new VitalSignsSender();
        verificar($sender->send(41, $lote) === ['aceito' => true], 'Resposta do Java não foi devolvida');
        $enviados = Http::recorded(static function (Request $request) use ($url, $key, $lote): bool {
            $body = $request->data();
            return $request->url() === $url && $request->method() === 'POST'
                && $request->hasHeader('X-Monitor-Api-Key', $key)
                && ($body['pacienteId'] ?? null) === 41
                && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/', $body['capturadoEm'] ?? '') === 1
                && array_column($body['medidas'] ?? [], 'valor', 'tipo') == $lote;
        });
        verificar($enviados->count() === 1, 'Contrato do lote HTTP divergente');
        try {
            $sender->send(41, $lote);
        } catch (RequestException $e) {
            verificar($e->response->status() === 403, 'Status da rejeição não foi preservado');
            verificar(Http::recorded()->count() === 2, 'Quantidade de requisições divergente');
            return;
        }
        throw new RuntimeException('Falha HTTP foi tratada como sucesso');
    },
];

$falhas = 0;
foreach ($casos as $nome => $executar) {
    try {
        $executar();
        fwrite(STDOUT, "PASS {$nome}\n");
    } catch (Throwable $e) {
        $falhas++;
        fwrite(STDERR, "FAIL {$nome}: {$e->getMessage()}\n");
    }
}
fwrite(STDOUT, sprintf("%d aprovados, %d reprovados\n", count($casos) - $falhas, $falhas));
exit($falhas === 0 ? 0 : 1);
