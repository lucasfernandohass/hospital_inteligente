import { execFile } from "node:child_process"
import { resolve } from "node:path"
import { promisify } from "node:util"
import { expect, test } from "@playwright/test"

const executar = promisify(execFile)

test("sinal sintético atravessa Laravel, Java, STOMP e o painel de enfermagem", async ({ page }) => {
  const { HOSPITAL_QA_DEMO_API: api, HOSPITAL_QA_DEMO_PHP: php, HOSPITAL_QA_DEMO_PATIENT: paciente,
    HOSPITAL_QA_DEMO_PASSWORD: senha, HOSPITAL_QA_DEMO_EMAIL: email } = process.env
  if (!api || !/^http:\/\/127\.0\.0\.1:\d+$/.test(api) || !php || !paciente || !senha || !email) {
    throw new Error("Execute o cenário somente pelo runner de demonstração isolado.")
  }

  let inscrito = false
  page.on("websocket", (socket) => {
    socket.on("framesent", ({ payload }) => {
      if (typeof payload === "string" && payload.startsWith("SUBSCRIBE\n")
          && payload.includes(`/topic/pacientes/${paciente}/sinais-vitais`)) inscrito = true
    })
  })
  await page.goto("/login")
  await page.getByRole("radio", { name: /Enfermeira/ }).click()
  await page.getByLabel("E-mail").fill(email)
  await page.getByLabel("Senha", { exact: true }).fill(senha)
  await page.getByRole("button", { name: /^Entrar/ }).click()
  await expect(page).toHaveURL(/\/painel\/enfermagem\/internados$/)
  await page.getByRole("button", { name: "Monitoramento", exact: true }).first().click()
  await expect(page).toHaveURL(/\/painel\/enfermagem\/monitoramento$/)
  await expect.poll(() => inscrito).toBe(true)

  const { stdout } = await executar(php, [resolve("../simulador-laravel/tests/enviar-demonstracao.php")],
    { timeout: 10_000 })
  const lote = JSON.parse(stdout) as { tipo: string; valor: number }[]
  const fc = lote.find((medida) => medida.tipo === "FREQUENCIA_CARDIACA")
  expect(lote).toHaveLength(6)
  expect(fc).toBeDefined()
  await expect(page.getByLabel(`Frequência cardíaca: ${fc?.valor} bpm`)).toBeVisible()
})
