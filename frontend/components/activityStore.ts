import { api } from "../services/api"

/** Registra a ação com a identidade obtida do token no backend. */
export function logActivity(_profile: string, action: string, entity: string, details: string) {
  try {
    const raw = sessionStorage.getItem("inteliHosp-session")
    const token = raw ? (JSON.parse(raw) as { token?: string }).token : undefined
    if (!token) return
    void api.createActivity({ acao: action, entidade: entity, detalhes: details }, token)
      .catch((error) => console.warn("Não foi possível persistir o registro de atividade.", error))
  } catch (error) {
    console.warn("Não foi possível ler a sessão para registrar a atividade.", error)
  }
}
