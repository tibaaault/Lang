// Catalogue des cours.
//
// Chaque unité est un fichier JSON séparé : ajouter du contenu revient à
// déposer un fichier et à l'importer ici. Le contenu est embarqué dans le
// build, donc disponible hors-ligne dès la première visite.

import type { Course, Unit } from '../types'
import { asPath } from './adapt'

import enFalseFriends from './en/false-friends.json'
import enPhrasal from './en/phrasal.json'
import enNuance from './en/nuance.json'
import enWork from './en/work.json'
import enDebate from './en/debate.json'
import enTrends from './en/trends.json'
import enDaily from './en/daily.json'
import enCollocations from './en/collocations.json'
import enConnectors from './en/connectors.json'
import enVerbs from './en/verbs.json'
import enFeelings from './en/feelings.json'
import enTravel from './en/travel.json'
import enStay from './en/stay.json'
import enFood from './en/food.json'
import enMoney from './en/money.json'
import enHealth from './en/health.json'
import enTech from './en/tech.json'
import enMedia from './en/media.json'
import enSociety from './en/society.json'
import enIdioms1 from './en/idioms1.json'
import enIdioms2 from './en/idioms2.json'
import ebVerbes from './eb/verbes.json'
import ebQuestions from './eb/questions.json'
import ebQuotidien from './eb/quotidien.json'
import ebGens from './eb/gens.json'
import ebConversation from './eb/conversation.json'
import ebTemps from './eb/temps.json'
import { buildCapitalsUnit, type CapitalsData } from './geo/build'
import geoEurope from './geo/europe.json'
import geoAfrique from './geo/afrique.json'
import geoAsie from './geo/asie.json'
import geoAmeriqueNord from './geo/amerique-nord.json'
import geoAmeriqueSud from './geo/amerique-sud.json'
import geoOceanie from './geo/oceanie.json'
import { vietnamese } from './vi/path'
import { thai } from './th/path'
import { englishFluency } from './en/fluency'
import { steps, STEPS_PROPER_NOUNS } from './en/steps'
import { buildPathUnits } from './path'
import idPremiersMots from './id/premiers-mots.json'
import idMangerAcheter from './id/manger-acheter.json'
import idNombres from './id/nombres.json'
import idTransport from './id/transport.json'
import idRencontre from './id/rencontre.json'

const english: Course = asPath({
  id: 'en',
  lang: 'en',
  voice: 'en-GB',
  title: 'Anglais B2+',
  icon: '🇬🇧',
  units: [
    enFalseFriends,
    enPhrasal,
    enDaily,
    enCollocations,
    enWork,
    enVerbs,
    enDebate,
    enFeelings,
    enTrends,
    enConnectors,
    enNuance,
    // Vocabulaire de terrain : utile dès le prochain voyage.
    enTravel,
    enStay,
    enFood,
    enMoney,
    enHealth,
    enTech,
    // Presse et expressions : le palier vers le C1.
    enMedia,
    enSociety,
    enIdioms1,
    enIdioms2,
  ] as Unit[],
  },
  // Niveau avancé : on écoute et on produit, sans repasser par le français.
  { advanced: true },
)

const indonesian: Course = asPath({
  id: 'id',
  lang: 'id',
  voice: 'id-ID',
  title: 'Indonésien — kit de voyage',
  icon: '🇮🇩',
  units: [
    idPremiersMots,
    idNombres,
    idMangerAcheter,
    idTransport,
    idRencontre,
  ] as Unit[],
})

// Parcours débutant, distinct du parcours B2+ : les exercices de nuance du
// second n'ont aucun sens sans les bases, et voir un cours hors de portée
// décourage. Chaque compte choisit ce qu'il suit dans les réglages.
const formerBasics = asPath({
  id: 'en-basics',
  lang: 'en',
  voice: 'en-GB',
  title: 'Anglais — pas à pas',
  icon: '🌱',
  units: [
    ebVerbes,
    ebQuestions,
    ebQuotidien,
    ebConversation,
    ebGens,
    ebTemps,
  ] as Unit[],
})

// Le parcours écrit leçon par leçon vient d'abord ; les unités d'origine
// suivent, en vocabulaire d'approfondissement. Le cours garde son
// identifiant, et ces unités leurs mots : ce qui était appris le reste.
const englishBasics: Course = {
  ...formerBasics,
  properNouns: STEPS_PROPER_NOUNS,
  units: [...buildPathUnits('eb2', steps), ...formerBasics.units],
}

// Cours de connaissances plutôt que de langue : pas de synthèse vocale, et
// la possibilité de se limiter à un continent, les unités n'ayant pas ici
// d'ordre pédagogique.
const capitals: Course = asPath({
  id: 'geo-capitals',
  lang: 'fr',
  voice: 'fr-FR',
  silent: true,
  filterByUnit: true,
  title: 'Capitales du monde',
  icon: '🌍',
  // Les exercices sont dérivés des données au chargement : voir geo/build.ts.
  units: [
    geoEurope,
    geoAfrique,
    geoAsie,
    geoAmeriqueNord,
    geoAmeriqueSud,
    geoOceanie,
  ].map((data) => buildCapitalsUnit(data as CapitalsData)),
  },
  {
    labels: {
      meaning: 'De quel pays est-ce la capitale ?',
      term: 'Quelle est sa capitale ?',
      write: 'Écrivez sa capitale',
    },
  },
)

// Le vietnamien vient en tête : c'est le parcours guidé, celui que l'accueil
// ouvre par défaut.
export const courses: Course[] = [
  vietnamese,
  thai,
  englishFluency,
  english,
  englishBasics,
  indonesian,
  capitals,
]

export function courseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id)
}
