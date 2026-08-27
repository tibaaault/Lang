// Catalogue des cours.
//
// Chaque unité est un fichier JSON séparé : ajouter du contenu revient à
// déposer un fichier et à l'importer ici. Le contenu est embarqué dans le
// build, donc disponible hors-ligne dès la première visite.

import type { Course, Unit } from '../types'

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
import idPremiersMots from './id/premiers-mots.json'
import idMangerAcheter from './id/manger-acheter.json'
import idNombres from './id/nombres.json'
import idTransport from './id/transport.json'
import idRencontre from './id/rencontre.json'

const english: Course = {
  id: 'en',
  lang: 'en',
  voice: 'en-GB',
  title: 'Anglais B2+',
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
}

const indonesian: Course = {
  id: 'id',
  lang: 'id',
  voice: 'id-ID',
  title: 'Indonésien — kit de voyage',
  units: [
    idPremiersMots,
    idNombres,
    idMangerAcheter,
    idTransport,
    idRencontre,
  ] as Unit[],
}

export const courses: Course[] = [english, indonesian]

export function courseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id)
}
