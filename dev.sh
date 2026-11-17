#!/usr/bin/env bash
# Sobe o ambiente local completo com um comando só:
#   Postgres (docker) → backend Java → simulador Laravel (API + scheduler) → frontend.
# Ctrl+C encerra tudo.
#
# Variáveis opcionais: MONITOR_API_KEY (padrão: lida de simulador-laravel/.env),
# NODE_VERSION (padrão: 22).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT/backend/hospital-api"
SIM_DIR="$ROOT/simulador-laravel"
FRONT_DIR="$ROOT/frontend"
NODE_VERSION="${NODE_VERSION:-22}"

BACKEND_PORT=8080
SIM_PORT=8000
FRONT_PORT=8443

log() { printf '\033[1m[dev]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[dev]\033[0m %s\n' "$*" >&2; exit 1; }

# Prefixa cada linha de saída com o nome colorido do serviço.
prefix() {
  local name="$1" color="$2"
  awk -v p="$(printf '\033[%sm[%s]\033[0m ' "$color" "$name")" '{ print p $0; fflush() }'
}

cleanup() {
  trap - INT TERM EXIT
  echo
  log "Encerrando todos os serviços..."
  # Mata o grupo de processos inteiro (mvnw → java, artisan → php -S, npm → vite).
  kill 0 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

port_in_use() { lsof -iTCP:"$1" -sTCP:LISTEN -P -n >/dev/null 2>&1; }

for check in "$BACKEND_PORT:backend" "$SIM_PORT:simulador" "$FRONT_PORT:frontend"; do
  port="${check%%:*}"; name="${check#*:}"
  port_in_use "$port" && fail "Porta $port ($name) já está em uso. Pare o processo antes (lsof -iTCP:$port -sTCP:LISTEN)."
done

for cmd in docker php curl lsof; do
  command -v "$cmd" >/dev/null || fail "Comando '$cmd' não encontrado."
done

if [ -z "${MONITOR_API_KEY:-}" ]; then
  MONITOR_API_KEY="$(grep -E '^MONITOR_API_KEY=' "$SIM_DIR/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)"
fi
MONITOR_API_KEY="$(printf '%s' "$MONITOR_API_KEY" | tr -d '\r')"
[ -n "$MONITOR_API_KEY" ] || fail "MONITOR_API_KEY não definida (nem no ambiente nem em simulador-laravel/.env)."
export MONITOR_API_KEY

# 1. Postgres
log "Subindo Postgres..."
(cd "$ROOT" && docker compose up -d postgres) 2>&1 | prefix db 36
until (cd "$ROOT" && docker compose exec -T postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"') >/dev/null 2>&1; do
  sleep 1
done
log "Postgres pronto."

# 2. Backend
log "Iniciando backend (porta $BACKEND_PORT)..."
(cd "$BACKEND_DIR" && exec sh ./mvnw -q spring-boot:run) 2>&1 | prefix back 32 &
BACKEND_JOB=$!

log "Aguardando backend responder..."
for _ in $(seq 1 180); do
  curl -fs "http://localhost:$BACKEND_PORT/actuator/health" >/dev/null 2>&1 && break
  kill -0 "$BACKEND_JOB" 2>/dev/null || fail "Backend encerrou durante a inicialização (veja os logs [back] acima)."
  sleep 1
done
curl -fs "http://localhost:$BACKEND_PORT/actuator/health" >/dev/null 2>&1 || fail "Backend não respondeu em 180s."
log "Backend pronto."

# 3. Simulador: API + scheduler (é o scheduler que envia os sinais)
log "Iniciando simulador (porta $SIM_PORT) e scheduler..."
(cd "$SIM_DIR" && exec php artisan serve --host=127.0.0.1 --port="$SIM_PORT") 2>&1 | prefix sim 35 &
(cd "$SIM_DIR" && exec php artisan schedule:work) 2>&1 | prefix sched 33 &

# 4. Frontend
log "Iniciando frontend (porta $FRONT_PORT) com Node $NODE_VERSION..."
(
  cd "$FRONT_DIR"
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    set +u; . "$NVM_DIR/nvm.sh"; nvm use "$NODE_VERSION" >/dev/null; set -u
  fi
  [ -d node_modules ] || npm install
  exec npm run dev
) 2>&1 | prefix front 34 &

sleep 3
SIM_STATUS="$(curl -fs "http://127.0.0.1:$SIM_PORT/api/simulacao/status" 2>/dev/null || true)"
case "$SIM_STATUS" in
  *'"running":false'*) log "Atenção: simulação está PARADA. Para ligar: curl -X POST http://127.0.0.1:$SIM_PORT/api/simulacao/iniciar" ;;
esac

log "Tudo no ar:"
log "  Front:      http://localhost:$FRONT_PORT"
log "  Backend:    http://localhost:$BACKEND_PORT"
log "  Simulador:  http://127.0.0.1:$SIM_PORT/api/simulacao/status"
log "Ctrl+C para encerrar tudo."

wait
