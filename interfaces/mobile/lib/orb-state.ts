/**
 * Tipo Compartilhado para a Máquina de Estados da Luci.
 * Conforme docs/01_ARCHITECTURE/STATE_MACHINE.md:
 * Externamente existem exatamente 4 estados visíveis:
 * - "idle": Em espera / repouso / aguardando estímulos ou Wake Word.
 * - "listening": Captura ativa de voz / escuta contínua.
 * - "processing": Processamento cognitivo / inferência / roteamento.
 * - "speaking": Síntese de fala ativa / resposta por voz da Luci.
 */

export type OrbState = "idle" | "listening" | "processing" | "speaking"

export function getOrbState(loading: boolean, speaking: boolean, listening: boolean): OrbState {
  if (loading) return "processing"
  if (speaking) return "speaking"
  if (listening) return "listening"
  return "idle"
}
