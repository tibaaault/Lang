/**
 * Mélange une liste sans la modifier (Fisher-Yates).
 *
 * Sert à l'ordre des options d'un choix multiple. Les listes du contenu sont
 * écrites à la main, la bonne réponse en tête : sans mélange, il suffisait de
 * choisir la première proposition pour avoir juste à tous les coups.
 *
 * Le mélange a lieu à chaque présentation, et non une fois pour toutes : un
 * ordre figé permettrait de retenir la position plutôt que la réponse.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
