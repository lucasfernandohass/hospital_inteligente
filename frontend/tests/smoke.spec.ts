import { expect, test, type Page } from "@playwright/test"

const nurse = {
  id: 7, nome: "Enfermeira QA", email: "enfermeira@qa.example.test",
  token: "fixture-browser", tipo: "Bearer", expiraEmSegundos: 3600, role: "ENFERMEIRA",
}

async function preencherLogin(page: Page, perfil = /Enfermeira/) {
  await page.goto("/login")
  await page.getByRole("radio", { name: perfil }).click()
  await page.getByLabel("E-mail").fill(nurse.email)
  await page.getByLabel("Senha", { exact: true }).fill("Fixture-Senha-QA")
  await page.getByRole("button", { name: /^Entrar/ }).click()
}

test("credenciais incorretas mantêm o usuário no login", async ({ page }) => {
  await page.route("**/api/auth/login", (route) => route.fulfill({
    status: 401, json: { status: 401, detail: "Credenciais inválidas" },
  }))
  await preencherLogin(page)
  await expect(page.getByText("Credenciais inválidas", { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => sessionStorage.getItem("inteliHosp-session"))).toBeNull()
})

test("login exige perfil compatível e protege a rota de administração", async ({ page }) => {
  await page.route("**/api/**", (route) => route.fulfill({
    json: route.request().url().endsWith("/auth/login") ? nurse : [],
  }))
  await preencherLogin(page, /Médico/)
  await expect(page.getByText(/diferente do perfil selecionado/)).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
  await preencherLogin(page)
  await expect(page).toHaveURL(/\/painel\/enfermagem\/internados$/)
  await page.goto("/painel/administrador/equipe")
  await expect(page).toHaveURL(/\/painel\/enfermagem\/internados$/)
})

test("monitoramento renderiza snapshot e sinal novo do tópico do paciente", async ({ page }) => {
  const agora = new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T")
  const sinal = (tipo: string, valor: number) => ({
    tipo, valor, capturadoEm: agora, pacienteId: 1, leitoId: 2, unidade: "bpm",
  })
  const limites = {
    fcAlertaMin: 50, fcAlertaMax: 110, fcCriticoMin: 40, fcCriticoMax: 130,
    spo2AlertaMin: 92, spo2CriticoMin: 88, frAlertaMax: 24, frCriticoMax: 30,
    temperaturaAlertaMax: 38, temperaturaCriticoMax: 39, paSistolicaAlertaMax: 140, paSistolicaCriticoMax: 180,
  }
  const respostas: Record<string, unknown> = {
    "/api/auth/login": nurse,
    "/api/pacientes": [{ id: 1, nome: "Paciente Sintético QA", cpf: "00000000021", dataNascimento: "1990-01-01", convenio: "Fixture" }],
    "/api/leitos": [{ id: 2, numero: "QA-2", andar: 1, quarto: "QA", tipo: "UTI", status: "Ocupado" }],
    "/api/internacoes": [{ id: 3, pacienteId: 1, leitoId: 2, medicoId: null, dataInternacao: "2026-01-01", dataAlta: null, status: "ATIVA", motivo: "Fixture" }],
    "/api/configuracoes/limites-sinais-vitais": { ...limites, personalizado: false },
    "/api/pacientes/1/limites-sinais-vitais": { ...limites, personalizado: false, pacienteId: 1 },
    "/api/pacientes/1/sinais-vitais/atuais": [
      sinal("FREQUENCIA_CARDIACA", 73), sinal("SATURACAO_OXIGENIO", 98),
      sinal("FREQUENCIA_RESPIRATORIA", 16), sinal("TEMPERATURA", 36.7),
    ],
  }
  await page.route("**/api/**", (route) => route.fulfill({
    json: respostas[new URL(route.request().url()).pathname] ?? [],
  }))
  let publicar: (() => void) | undefined
  await page.routeWebSocket(/\/ws$/, (socket) => {
    socket.onMessage((frame) => {
      if (typeof frame !== "string") return
      if (frame.startsWith("CONNECT\n")) {
        expect(frame).toContain("Authorization:Bearer fixture-browser")
        socket.send("CONNECTED\nversion:1.2\n\n\0")
      }
      if (frame.startsWith("SUBSCRIBE\n")) {
        expect(frame).toContain("/topic/pacientes/1/sinais-vitais")
        publicar = () => socket.send("MESSAGE\n\n" + JSON.stringify(sinal("FREQUENCIA_CARDIACA", 152)) + "\0")
      }
    })
  })

  await preencherLogin(page)
  await expect(page).toHaveURL(/\/painel\/enfermagem\/internados$/)
  await page.goto("/painel/enfermagem/monitoramento")
  await expect(page.getByText("Paciente Sintético QA", { exact: true }).first()).toBeVisible()
  await expect(page.getByLabel("Frequência cardíaca: 73 bpm")).toBeVisible()
  await expect.poll(() => typeof publicar).toBe("function")
  publicar?.()
  await expect(page.getByLabel("Frequência cardíaca: 152 bpm")).toBeVisible()
  await expect(page.getByText("CRÍTICO", { exact: true }).first()).toBeVisible()
})
