param(
    [Parameter(Mandatory = $true)][string]$Jdk21,
    [Parameter(Mandatory = $true)][string]$PostgresBin,
    [Parameter(Mandatory = $true)][string]$MavenRepository,
    [ValidateSet('baseline', 'auth', 'stage2', 'stage3', 'stage3-scope', 'demo', 'verify')][string]$Suite = 'verify',
    [switch]$Offline
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$branch = git -C $root branch --show-current
if ($LASTEXITCODE -ne 0 -or $branch -ne 'testes/qualidade-hospital-inteligente') {
    throw 'Execute na branch testes/qualidade-hospital-inteligente.'
}

$java = Join-Path (Resolve-Path $Jdk21).Path 'bin/java.exe'
if ((& $java --version | Select-Object -First 1) -notmatch '^(openjdk|java) 21\.') {
    throw 'Informe o diretório de um JDK 21.'
}
$pg = (Resolve-Path $PostgresBin).Path
if ((& "$pg/postgres.exe" --version) -notmatch 'PostgreSQL\) 17\.') {
    throw 'Informe o diretório bin do PostgreSQL 17.'
}
$maven = (Get-Command mvn.cmd -ErrorAction Stop).Source
$qaRepository = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($MavenRepository)
$run = [guid]::NewGuid().ToString('N')
$sandbox = Join-Path ([IO.Path]::GetTempPath()) "hospital-qa-$run"
$cluster = Join-Path $sandbox 'cluster'
$passwordFile = Join-Path $sandbox 'initdb-password'
$server = $null
$settings = @{
    JAVA_HOME = (Resolve-Path $Jdk21).Path
    HOSPITAL_QA_RUN = $run
    HOSPITAL_QA_PASSWORD = [guid]::NewGuid().ToString('N')
    HOSPITAL_QA_JWT = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(
        [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')))
    HOSPITAL_QA_MONITOR_KEY = [guid]::NewGuid().ToString('N')
}
$previous = @{}
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
$listener.Start()
try { $port = $listener.LocalEndpoint.Port } finally { $listener.Stop() }
$settings.HOSPITAL_QA_PORT = [string]$port

New-Item -ItemType Directory -Path $sandbox | Out-Null
try {
    Set-Content -LiteralPath $passwordFile -Value $settings.HOSPITAL_QA_PASSWORD -Encoding Ascii
    try {
        & "$pg/initdb.exe" -D $cluster -U hospital_qa -A scram-sha-256 --pwfile=$passwordFile --no-locale -E UTF8
        if ($LASTEXITCODE -ne 0) { throw 'Falha ao inicializar o PostgreSQL descartável.' }
    } finally {
        Remove-Item -LiteralPath $passwordFile
    }

    $server = Start-Process "$pg/postgres.exe" -WindowStyle Hidden -PassThru `
        -ArgumentList @('-D', ('"{0}"' -f $cluster), '-h', '127.0.0.1', '-p', $port,
            '-c', "hospital.qa_run=$run") -RedirectStandardError (Join-Path $sandbox 'postgres.log')
    $pidFile = Join-Path $cluster 'postmaster.pid'
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        if ($server.HasExited) { break }
        if (Test-Path -LiteralPath $pidFile) {
            $lines = @(Get-Content -LiteralPath $pidFile)
            if ($lines.Count -ge 8 -and $lines[0] -eq [string]$server.Id -and
                $lines[3] -eq [string]$port -and $lines[7].Trim() -eq 'ready') {
                $ready = $true
                break
            }
        }
        Start-Sleep -Seconds 1
    }
    if (!$ready) { throw "PostgreSQL descartável indisponível. Log local em $sandbox." }

    foreach ($name in $settings.Keys) {
        $previous[$name] = [Environment]::GetEnvironmentVariable($name)
        [Environment]::SetEnvironmentVariable($name, $settings[$name])
    }
    $mavenArgs = @('-B', '-ntp', "-Dmaven.repo.local=$qaRepository",
        '-f', (Join-Path $root 'backend/hospital-api/pom.xml'), 'clean')
    if ($Offline) { $mavenArgs = @('-o') + $mavenArgs }
    if ($Suite -eq 'baseline') {
        $mavenArgs += @('-Dtest=HospitalApiApplicationTests,LimitesSinaisVitaisRequestTest#acceptsDefaultThresholdRanges+rejectsCriticalRangesInsideWarningRanges', 'test')
    } elseif ($Suite -eq 'auth') {
        $mavenArgs += @('-Dtest=NoUnitTestsForAuthRetest', '-Dsurefire.failIfNoSpecifiedTests=false',
            '-Dit.test=BackendP0IT#retorna401*', 'verify')
    } elseif ($Suite -eq 'stage2') {
        $mavenArgs += @('-Dtest=NoUnitTestsForStage2', '-Dsurefire.failIfNoSpecifiedTests=false',
            '-Dit.test=WebSocketStompIT,InternacaoLeitoIT', 'verify')
    } elseif ($Suite -eq 'stage3') {
        $mavenArgs += @('-Dtest=ApiAuthorizationTest', '-Dit.test=FluxosClinicosIT,AuditoriaPermissoesIT', 'verify')
    } elseif ($Suite -eq 'stage3-scope') {
        $mavenArgs += @('-Dtest=NoUnitTestsForScopeProbe', '-Dsurefire.failIfNoSpecifiedTests=false',
            '-Dit.test=EscopoAssistencialProbe', 'verify')
    } elseif ($Suite -eq 'demo') {
        $mavenArgs += @('-Dtest=NoUnitTestsForDemo', '-Dsurefire.failIfNoSpecifiedTests=false',
            '-Dit.test=DemonstracaoProbe', 'verify')
    } else {
        $mavenArgs += 'verify'
    }
    & $maven @mavenArgs
    $result = $LASTEXITCODE
} finally {
    foreach ($name in $previous.Keys) {
        [Environment]::SetEnvironmentVariable($name, $previous[$name])
    }
    if ($server -and !$server.HasExited -and (Test-Path -LiteralPath (Join-Path $cluster 'postmaster.pid'))) {
        $owner = Get-Content -LiteralPath (Join-Path $cluster 'postmaster.pid') -TotalCount 1
        if ($owner -eq [string]$server.Id) {
            & "$pg/pg_ctl.exe" -D $cluster -m fast -w stop
            if ($LASTEXITCODE -ne 0) { throw "Falha ao encerrar o cluster de QA em $sandbox." }
        }
    }
}
exit $result
