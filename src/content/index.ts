// Catalogue des cours.
//
// Chaque unité est un fichier JSON séparé : ajouter du contenu revient à
// déposer un fichier et à l'importer ici. Le contenu est embarqué dans le
// build, donc disponible hors-ligne dès la première visite.

import type { Course, Unit } from '../types'

import enFalseFriends from './en/false-friends.json'
import enPhrasal from './en/phrasal.json'
import enNuance from './en/nuance.json'
import idPremiersMots from './id/premiers-mots.json'
import idMangerAcheter from './id/manger-acheter.json'

const english: Course = {
  id: 'en',
  lang: 'en',
  voice: 'en-GB',
  title: 'Anglais B2+',
  units: [enFalseFriends, enPhrasal, enNuance] as Unit[],
}

const indonesian: Course = {
  id: 'id',
  lang: 'id',
  voice: 'id-ID',
  title: 'Indonésien — kit de voyage',
  units: [idPremiersMots, idMangerAcheter] as Unit[],
}

export const courses: Course[] = [english, indonesian]

export function courseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id)
}
