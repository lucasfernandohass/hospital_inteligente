import { expect, test, type Page, type TestInfo } from "@playwright/test"

test.use({ reducedMotion: "reduce" })

const perfis = [
  { role: "RECEPCIONISTA", label: "Recepcionista", secao: "recepcao", inicial: "recepcao", id: 4,
    abas: [["Cadastrar Paciente", "cadastro-paciente"], ["Consultar Paciente", "consulta-paciente"], ["Mapa de Leitos", "mapa-leitos"], ["Internação", "internacao"], ["Cadastrar Leito", "cadastro-leito"], ["Agendamento", "agendamento"], ["Ficha de Atendimento", "ficha"], ["Registro de Atividades", "atividades"]] },
  { role: "MEDICO", label: "Médico", secao: "medico", inicial: "overview", id: 8,
    abas: [["Pacientes", "atendimento"], ["Monitoramento", "monitoramento"], ["Alertas", "alertas"], ["Prescrições", "prescricao"], ["Exames", "exames"], ["Agenda Médica", "agenda"], ["Internações", "internacao"], ["Registro de Atividades", "atividades"]] },
  { role: "ENFERMEIRA", label: "Enfermeira", secao: "enfermagem", inicial: "internados", id: 7,
    abas: [["Monitoramento", "monitoramento"], ["Alertas", "alertas"], ["Prescrições", "prescricao"], ["Administração", "administracao"], ["Evolução Clínica", "evolucao"], ["Registro de Atividades", "atividades"]] },
  { role: "ADMINISTRADOR", label: "Administrador", secao: "administrador", inicial: "equipe", id: 6,
    abas: [["Registro de Atividades", "atividades"]] },
]
type Perfil = typeof perfis[number]
const nomes = { paciente: "Paciente Sintético QA", novo: "Paciente Demonstração QA", medico: "Médico Sintético QA" }
const data = "2026-01-12"
const senha = "Fixture-Senha-QA"
const falha = "Não foi possível conectar à API. Confira se o backend está em execução."

function cpf(base: string) {
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    const soma = [...base].reduce((total, digito, i) => total + Number(digito) * (tamanho + 1 - i), 0)
    base += soma * 10 % 11 % 10
  }
  return base
}

async function ambiente(page: Page, perfil: Perfil) {
  const agora = new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T")
  const medico = { id: 8, nome: nomes.medico, role: "MEDICO", email: "medico@qa.example.test", matricula: "QA-08", cpf: cpf("910000008"), dataNascimento: "1990-01-01", dataAdmissao: data, crm: "QA-8", especialidade: "Clínica Médica" }
  const limites = { fcAlertaMin: 50, fcAlertaMax: 110, fcCriticoMin: 40, fcCriticoMax: 130,
    spo2AlertaMin: 92, spo2CriticoMin: 88, frAlertaMax: 24, frCriticoMax: 30,
    temperaturaAlertaMax: 38, temperaturaCriticoMax: 39, paSistolicaAlertaMax: 140, paSistolicaCriticoMax: 180 }
  const listas: Record<string, object[]> = {
    pacientes: [{ id: 1, nome: nomes.paciente, cpf: cpf("910000001"), dataNascimento: "1990-01-01", sexo: "F", convenio: "SUS" }],
    leitos: [2, 3].map((id) => ({ id, numero: String(id), andar: 1, quarto: "QA", setor: "UTI", tipo: "UTI", status: id === 2 ? "Ocupado" : "Disponível" })),
    internacoes: [{ id: 11, pacienteId: 1, leitoId: 2, medicoId: 8, dataInternacao: data, dataAlta: null, status: "ATIVA", motivo: "Cuidado sintético" }],
    medicos: [medico], funcionarios: [medico],
    alertas: [{ id: 71, pacienteId: 1, tipo: "Alerta QA", mensagem: "Leitura sintética", nivel: "CRITICO", dataHora: agora, ativo: true }],
  }
  const snapshot = [["FREQUENCIA_CARDIACA", 152, "bpm"], ["SATURACAO_OXIGENIO", 97, "%"],
    ["FREQUENCIA_RESPIRATORIA", 16, "irpm"], ["TEMPERATURA", 36.7, "°C"]].map(([tipo, valor, unidade]) =>
      ({ tipo, valor, unidade, pacienteId: 1, leitoId: 2, capturadoEm: agora }))
  const auth = { id: perfil.id, nome: perfil.label + " QA", email: "conta@qa.example.test",
    token: "fixture-" + perfil.role, tipo: "Bearer", expiraEmSegundos: 3600, role: perfil.role }
  const estado = { indisponivel: false, recusarGravacao: false, gravacoes: [] as { caminho: string; dados: Record<string, unknown> }[] }
  await page.route("**/api/**", async (route) => {
    const req = route.request()
    const caminho = new URL(req.url()).pathname.replace("/api/", "")
    if (estado.indisponivel && req.method() === "GET" && ["pacientes", "funcionarios", "atividades"].includes(caminho)) {
      await route.abort("connectionrefused")
      return
    }
    if (caminho === "auth/login") { await route.fulfill({ json: auth }); return }
    if (req.method() === "GET") {
      const json = caminho.endsWith("/atuais") ? snapshot : caminho.endsWith("limites-sinais-vitais")
        ? { ...limites, personalizado: false } : listas[caminho] ?? []
      await route.fulfill({ json })
      return
    }
    const dados = req.postDataJSON() as Record<string, unknown>
    if (estado.recusarGravacao && caminho !== "atividades") {
      await route.fulfill({ status: 409, json: { detail: "Conflito sintético de QA" } })
      return
    }
    estado.gravacoes.push({ caminho, dados })
    if (req.method() === "PUT") {
      const [recurso, id] = caminho.split("/")
      const item = { ...dados, id: Number(id) }
      listas[recurso] = (listas[recurso] ?? []).map((original) =>
        "id" in original && original.id === item.id ? { ...original, ...item } : original)
      await route.fulfill({ status: 200, json: item })
    } else {
      const item = { ...dados, id: caminho === "pacientes" ? 5 : 41 }
      listas[caminho]?.push(item)
      await route.fulfill({ status: 201, json: item })
    }
  })
  await page.routeWebSocket(/\/ws$/, (socket) => socket.onMessage((frame) => {
    if (typeof frame === "string" && frame.startsWith("CONNECT\n")) socket.send("CONNECTED\nversion:1.2\n\n\0")
  }))
  return estado
}

async function login(page: Page, perfil: Perfil) {
  await page.goto("/login")
  await page.getByRole("radio", { name: new RegExp(perfil.label) }).click()
  await page.getByLabel("E-mail").fill("conta@qa.example.test")
  await page.getByLabel("Senha", { exact: true }).fill(senha)
  await page.getByRole("button", { name: /^Entrar/ }).click()
  await expect(page).toHaveURL(new RegExp(`/painel/${perfil.secao}/${perfil.inicial}$`))
}

async function abrir(page: Page, perfil: Perfil, aba: string, rota: string) {
  const menu = page.getByRole("button", { name: "Abrir menu" })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole("navigation", { name: "Seções do painel" })
    .getByRole("button", { name: new RegExp(`^${aba}(?: \\d+ pendentes)?$`) }).click()
  await expect(page).toHaveURL(new RegExp(`/painel/${perfil.secao}/${rota}$`))
  await expect(page.getByRole("main").getByRole("heading").first()).toBeVisible()
}

async function evidencia(page: Page, info: TestInfo, nome: string) {
  const titulo = page.getByRole("main").getByRole("heading").first()
  await expect(titulo).toBeVisible()
  const largura = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(largura, `Overflow horizontal em ${nome}`).toBeLessThanOrEqual(2)
  const caminho = info.outputPath(nome + ".png")
  await page.screenshot({ path: caminho, animations: "disabled" })
  await info.attach(nome, { path: caminho, contentType: "image/png" })
}

async function cadastroEInternacao(page: Page, perfil: Perfil, info: TestInfo, estado: Awaited<ReturnType<typeof ambiente>>) {
  await abrir(page, perfil, "Cadastrar Paciente", "cadastro-paciente")
  const formulario = page.getByRole("main").locator("form")
  const salvar = formulario.getByRole("button", { name: "Cadastrar paciente" })
  await expect(salvar).toBeDisabled()
  await formulario.getByLabel(/Nome completo/).fill(nomes.novo)
  await formulario.getByLabel(/^CPF/).fill(cpf("910000005"))
  await formulario.getByLabel(/Data de nascimento/).fill("01011990")
  await formulario.getByLabel(/Telefone/).fill("11900000000")
  await formulario.getByLabel(/Sexo/).selectOption("F")
  await formulario.getByLabel(/Convênio/).selectOption("SUS")
  estado.recusarGravacao = true
  await salvar.click()
  await expect(page.getByText("Conflito sintético de QA", { exact: true })).toBeVisible()
  estado.recusarGravacao = false
  await salvar.click()
  await expect(page.getByText("Paciente cadastrado", { exact: true })).toBeVisible()
  expect(estado.gravacoes.find((g) => g.caminho === "pacientes")?.dados).toMatchObject({ nome: nomes.novo, cpf: cpf("910000005") })

  await abrir(page, perfil, "Consultar Paciente", "consulta-paciente")
  await page.getByRole("textbox", { name: "CPF ou nome do paciente" }).fill(nomes.novo)
  await page.getByRole("button", { name: "Buscar", exact: true }).click()
  await expect(page.getByRole("region", { name: "Dados cadastrais" }).getByText(nomes.novo)).toBeVisible()
  await abrir(page, perfil, "Internação", "internacao")
  await page.getByRole("combobox", { name: /^Paciente/ }).selectOption("5")
  await page.getByRole("combobox", { name: /Leito disponível/ }).selectOption("3")
  await page.getByRole("combobox", { name: /Médico responsável/ }).selectOption("8")
  await page.getByLabel(/Motivo da internação/).fill("Internação sintética")
  await page.getByRole("button", { name: "Confirmar internação" }).click()
  await expect(page.getByText("Internação registrada", { exact: true })).toBeVisible()
  expect(estado.gravacoes.find((g) => g.caminho === "internacoes")?.dados).toMatchObject({ pacienteId: 5, leitoId: 3, medicoId: 8 })
  await abrir(page, perfil, "Mapa de Leitos", "mapa-leitos")
  await expect(page.getByText(/Ocupado/).first()).toBeVisible()
  await evidencia(page, info, "mapa-leitos")
}

for (const perfil of perfis) {
  test(`${perfil.label} · navegação desktop, interações e logout`, async ({ page }, info) => {
    const erros: string[] = []
    page.on("pageerror", (erro) => erros.push(erro.message))
    page.on("console", (msg) => { if (msg.type() === "error" && !msg.text().includes("409 (Conflict)")) erros.push(msg.text()) })
    await page.setViewportSize({ width: 1440, height: 900 })
    const estado = await ambiente(page, perfil)
    await login(page, perfil)
    await esperarCarregamento(page, perfil)
    await evidencia(page, info, "desktop")
    for (const [aba, rota] of perfil.abas) await abrir(page, perfil, aba, rota)

    if (perfil.role === "RECEPCIONISTA") await cadastroEInternacao(page, perfil, info, estado)
    if (perfil.role === "MEDICO" || perfil.role === "ENFERMEIRA") {
      await abrir(page, perfil, "Monitoramento", "monitoramento")
      await expect(page.getByLabel("Frequência cardíaca: 152 bpm")).toBeVisible()
      await expect(page.getByText("CRÍTICO", { exact: true }).first()).toBeVisible()
      await expect(page.getByRole("complementary", { name: `Notificações de ${perfil.role === "MEDICO" ? "Médico" : "Enfermagem"}` })
        .getByText("Dispositivo sem comunicação", { exact: true })).toHaveCount(0)
      await evidencia(page, info, "monitoramento-critico")
      if (perfil.role === "MEDICO") {
        await abrir(page, perfil, "Pacientes", "atendimento")
        await page.getByRole("main").getByRole("button", { name: new RegExp(nomes.paciente) }).first().click()
        await page.getByRole("button", { name: "Nova evolução" }).click()
        await page.getByPlaceholder(/Registre a avaliação/).fill("Evolução médica sintética")
        await page.getByRole("button", { name: "Salvar evolução" }).click()
        await expect(page.getByText("Evolução médica sintética", { exact: true })).toBeVisible()
      } else {
        await abrir(page, perfil, "Evolução Clínica", "evolucao")
        await page.getByRole("main").getByRole("button", { name: new RegExp(nomes.paciente) }).first().click()
        await page.getByLabel("Descrição da evolução").fill("Evolução de enfermagem sintética")
        await page.getByRole("button", { name: "Enviar evolução" }).click()
        await expect(page.getByText("Evolução de enfermagem sintética", { exact: true })).toBeVisible()
        await abrir(page, perfil, "Alertas", "alertas")
        const alerta = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Alerta QA" }) })
        await alerta.getByRole("button", { name: "Reconhecer alerta" }).click()
        await expect(alerta).toHaveCount(0)
        expect(estado.gravacoes.find((g) => g.caminho === "alertas/71")?.dados).toMatchObject({ ativo: false, pacienteId: 1 })
      }
    }
    if (perfil.role === "ADMINISTRADOR") {
      await abrir(page, perfil, "Equipe e acessos", "equipe")
      await page.getByRole("button", { name: "Editar", exact: true }).first().click()
      await page.getByLabel(/^Nome completo/).fill("Médico Atualizado QA")
      await page.getByRole("button", { name: "Salvar alterações" }).click()
      await expect(page.getByText("Cadastro atualizado. A senha atual foi mantida.")).toBeVisible()
      await expect(page.getByRole("heading", { name: "Médico Atualizado QA" })).toBeVisible()
    }
    await page.getByRole("button", { name: "Sair da conta" }).click()
    await expect(page).toHaveURL(/\/login$/)
    expect(await page.evaluate(() => sessionStorage.getItem("inteliHosp-session"))).toBeNull()
    expect(erros).toEqual([])
  })

  test(`${perfil.label} · tablet e celular, menu e falha de rede`, async ({ page }, info) => {
    const erros: string[] = []
    page.on("pageerror", (erro) => erros.push(erro.message))
    const estado = await ambiente(page, perfil)
    await page.setViewportSize({ width: 820, height: 1180 })
    await login(page, perfil)
    await esperarCarregamento(page, perfil)
    await evidencia(page, info, "tablet")
    await page.setViewportSize({ width: 390, height: 844 })
    const [aba, rota] = perfil.abas[0]
    await abrir(page, perfil, aba, rota)
    await evidencia(page, info, "celular")
    estado.indisponivel = true
    await page.reload()
    await expect(page.getByRole("main").getByRole("alert").filter({ hasText: falha })).toBeVisible()
    if (perfil.role === "ADMINISTRADOR") {
      await abrir(page, perfil, "Equipe e acessos", "equipe")
      await expect(page.getByRole("main").getByRole("alert").filter({ hasText: falha })).toBeVisible()
    }
    expect(erros).toEqual([])
  })
}

async function esperarCarregamento(page: Page, perfil: Perfil) {
  if (perfil.role === "ADMINISTRADOR") {
    await expect(page.getByRole("heading", { name: nomes.medico })).toBeVisible()
  } else {
    await expect(page.getByText(/Carregando dados da API/)).toHaveCount(0)
  }
}

test("login libera o formulário quando a API permanece sem resposta", async ({ page }) => {
  await page.clock.install()
  await page.route("**/api/auth/login", () => {
    // Intercepta a requisição sem entregar resposta nem recusar a conexão.
  })
  await page.goto("/login")
  await page.getByRole("radio", { name: /Enfermeira/ }).click()
  await page.getByLabel("E-mail").fill("conta@qa.example.test")
  await page.getByLabel("Senha", { exact: true }).fill(senha)
  await Promise.all([
    page.waitForRequest("**/api/auth/login"),
    page.getByRole("button", { name: /^Entrar/ }).click(),
  ])
  await page.clock.fastForward(20_000)
  await expect(page.getByText(/Não foi possível conectar à API/)).toBeVisible()
  await expect(page.getByRole("button", { name: /^Entrar/ })).toBeEnabled()
})
