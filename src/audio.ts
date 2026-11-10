// Synthèse vocale : gratuite, intégrée au navigateur, et disponible hors-ligne
// une fois les voix installées par le système.
//
// La qualité dépend de l'appareil. Sur iOS et macOS l'anglais, le japonais et
// l'arabe sont bons ; le vietnamien est inégal. On dégrade en silence plutôt
// que d'afficher une erreur : un bouton audio muet gêne moins qu'un message.

let cachedVoices: SpeechSynthesisVoice[] = []

function voices(): SpeechSynthesisVoice[] {
  if (!cachedVoices.length && 'speechSynthesis' in window) {
    cachedVoices = window.speechSynthesis.getVoices()
  }
  return cachedVoices
}

if ('speechSynthesis' in window) {
  // Sur Chrome la liste arrive de façon asynchrone après le premier appel.
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cachedVoices = window.speechSynthesis.getVoices()
  })
}

function bestVoice(lang: string): SpeechSynthesisVoice | undefined {
  const all = voices()
  const base = lang.split('-')[0]
  return (
    all.find((v) => v.lang.replace('_', '-') === lang) ??
    all.find((v) => v.lang.replace('_', '-').startsWith(base))
  )
}

export function canSpeak(lang: string): boolean {
  return 'speechSynthesis' in window && bestVoice(lang) !== undefined
}

export function speak(text: string, lang: string, rate = 0.95) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = rate
  const v = bestVoice(lang)
  if (v) u.voice = v
  window.speechSynthesis.speak(u)
}

/**
 * Lit plusieurs répliques à la suite. Le navigateur les met en file : chaque
 * voix peut avoir sa hauteur, ce qui suffit à distinguer deux personnages.
 */
export function speakAll(
  lines: { text: string; pitch?: number }[],
  lang: string,
  rate = 0.9,
) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const v = bestVoice(lang)
  for (const line of lines) {
    const u = new SpeechSynthesisUtterance(line.text)
    u.lang = lang
    u.rate = rate
    u.pitch = line.pitch ?? 1
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
  }
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

/**
 * Peut-on proposer un exercice d'écoute dans cette langue ?
 *
 * Plus permissif que `canSpeak` : sur Android, la liste des voix arrive
 * souvent vide alors que la lecture fonctionne. On ne renonce donc que si le
 * navigateur annonce des voix et qu'aucune ne convient. Dans le doute,
 * l'exercice offre de toute façon une sortie : « Je ne peux pas écouter ».
 */
export function mayListen(lang: string): boolean {
  if (!('speechSynthesis' in window)) return false
  return voices().length === 0 || bestVoice(lang) !== undefined
}
