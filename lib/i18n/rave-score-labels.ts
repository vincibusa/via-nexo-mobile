/**
 * Traduzione in italiano delle label RaveScore che arrivano dal DB (in inglese).
 */

const PRESENCE_LABELS: Record<string, string> = {
  Regular: 'Regolare',
  Active: 'Attivo',
  Elite: 'Elite',
}

const TRUST_LABELS: Record<string, string> = {
  Reliable: 'Affidabile',
  Risk: 'A rischio',
  'No-Show': 'Assente',
}

const CREW_LABELS: Record<string, string> = {
  Connector: 'Connettore',
  Promoter: 'Promotore',
  Legend: 'Leggenda',
}

export function translatePresenceLabel(label: string): string {
  return PRESENCE_LABELS[label] ?? label
}

export function translateTrustLabel(label: string): string {
  return TRUST_LABELS[label] ?? label
}

export function translateCrewLabel(label: string): string {
  return CREW_LABELS[label] ?? label
}
