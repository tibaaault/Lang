// Conjuguer sans hésiter : des phrases à trou où l'on écrit le verbe à la
// bonne forme.
//
// L'hésitation vient rarement d'un temps mal connu. Elle vient de ne pas
// savoir, à l'instant de parler, QUI porte la marque — l'auxiliaire ou le
// verbe. « Did you tried » en est le symptôme. Chaque leçon isole donc une
// décision, la fait prendre des dizaines de fois, et explique l'erreur
// attendue au moment où elle est commise.

import type { ClozeExercise } from '../../types'
import { quiz, type LessonSource, type UnitSource } from '../path'

let count = 0

/** phrase, traduction, verbe de base, réponses admises, erreurs expliquées. */
const c = (
  sentence: string,
  fr: string,
  verb: string,
  accepted: string[],
  misses: [word: string, why: string][] = [],
): ClozeExercise => ({
  kind: 'cloze',
  id: `conj-${++count}`,
  lexemeId: '',
  sentence,
  fr,
  hint: verb,
  accepted,
  nearMisses: misses.map(([word, why]) => ({ word, why })),
})

const BASE = "Après do, does ou did, le verbe reste à sa forme de base : c'est l'auxiliaire qui porte le temps et la personne."
const NO_AUX = "Sans auxiliaire, c'est le verbe lui-même qui porte la marque."
const FINISHED = 'Un moment précis et terminé appelle le passé simple, pas « have » + participe.'
const LINKED = "Un lien avec le présent — une durée qui continue, « ever », « never », « already », « since » — appelle le present perfect."
const PARTICIPLE = 'Après « have », il faut le participe passé, pas le passé simple.'
const ING = 'Après « be », une action en cours se met en -ing.'
const MODAL = 'Après can, will, should ou must : le verbe tout nu, sans « to » et sans s.'
const PREP = 'Après une préposition, le verbe se met toujours en -ing.'

const afterDo: LessonSource = {
  title: 'Après did, does, do',
  words: [],
  phrases: [],
  clozes: [
    c('Did you ___ to negotiate?', 'As-tu essayé de négocier ?', 'try', ['try'], [['tried', BASE]]),
    c("She didn't ___ me yesterday.", "Elle ne m'a pas appelé hier.", 'call', ['call'], [['called', BASE]]),
    c('Does he ___ in Dublin?', 'Habite-t-il à Dublin ?', 'live', ['live'], [['lives', BASE]]),
    c("I didn't ___ the film.", "Je n'ai pas aimé le film.", 'like', ['like'], [['liked', BASE]]),
    c('Where did you ___ last night?', 'Où es-tu allé hier soir ?', 'go', ['go'], [['went', BASE]]),
    c("He doesn't ___ meat.", 'Il ne mange pas de viande.', 'eat', ['eat'], [['eats', BASE]]),
    c('Did they ___ the train?', 'Ont-ils eu le train ?', 'catch', ['catch'], [['caught', BASE]]),
    c('What did she ___?', "Qu'a-t-elle dit ?", 'say', ['say'], [['said', BASE]]),
    c("We didn't ___ anything.", "Nous n'avons rien acheté.", 'buy', ['buy'], [['bought', BASE]]),
    c('Does it ___ a lot here?', 'Est-ce qu\'il pleut beaucoup ici ?', 'rain', ['rain'], [['rains', BASE]]),
    c("Why didn't you ___ me?", "Pourquoi ne me l'as-tu pas dit ?", 'tell', ['tell'], [['told', BASE]]),
    c('I ___ to negotiate, but it didn\'t work.', "J'ai essayé de négocier, mais ça n'a pas marché.", 'try', ['tried'], [['try', NO_AUX]]),
    c('She ___ in Dublin now.', 'Elle habite à Dublin maintenant.', 'live', ['lives'], [['live', NO_AUX]]),
    c('He ___ to Sydney last month.', 'Il est allé à Sydney le mois dernier.', 'go', ['went'], [['go', NO_AUX], ['goed', '« Go » est irrégulier : went.']]),
  ],
  quizzes: [
    quiz('Laquelle est correcte ?', 'Did you find it?', ['Did you found it?', 'Found you it?'], BASE),
    quiz('Laquelle est correcte ?', "She doesn't know.", ["She doesn't knows.", "She don't knows."],
      "Le s de la troisième personne est déjà dans « does » : le verbe n'en reprend pas."),
    quiz("« Je n'ai pas compris », en parlant d'hier :", "I didn't understand.", ["I didn't understood.", 'I not understood.'], BASE),
    quiz('Dans « Did you go? », qu\'est-ce qui indique le passé ?', '« did », et lui seul', ['« go »', 'les deux mots'],
      "Le passé ne se marque qu'une fois par phrase. Une fois « did » posé, le verbe n'a plus rien à porter."),
  ],
}

const didOrHave: LessonSource = {
  title: 'Did ou have ?',
  words: [],
  phrases: [],
  clozes: [
    c('I ___ to Hanoi last year.', "Je suis allé à Hanoï l'année dernière.", 'go', ['went'], [['have been', FINISHED], ['have gone', FINISHED]]),
    c('___ you ever ___ pho?', 'As-tu déjà goûté le phở ?', 'try', ['have tried'], [['did try', LINKED]]),
    c('I ___ here for three weeks.', 'Je suis ici depuis trois semaines.', 'be', ['have been', "'ve been"], [['am', "Une situation commencée dans le passé et qui dure : present perfect, pas le présent."], ['was', LINKED]]),
    c('We ___ the temple yesterday.', 'Nous avons visité le temple hier.', 'visit', ['visited'], [['have visited', FINISHED]]),
    c('I ___ never ___ to Australia.', 'Je ne suis jamais allé en Australie.', 'be', ['have been'], [['did go', LINKED]]),
    c('When ___ you ___?', 'Quand es-tu arrivé ?', 'arrive', ['did arrive'], [['have arrived', '« When » demande un moment précis : passé simple.']]),
    c('I ___ him two days ago.', "Je l'ai vu il y a deux jours.", 'see', ['saw'], [['have seen', '« Ago » fixe un moment terminé : passé simple.'], ['seen', 'Il manque l\'auxiliaire — et de toute façon « ago » appelle le passé simple : saw.']]),
    c('I ___ already ___.', "J'ai déjà mangé.", 'eat', ['have eaten'], [['did eat', LINKED], ['have ate', PARTICIPLE]]),
    c('It ___ a lot since Monday.', 'Il a beaucoup plu depuis lundi.', 'rain', ['has rained'], [['rained', '« Since » relie le passé au présent : present perfect.']]),
    c('We ___ in 2019.', 'Nous nous sommes rencontrés en 2019.', 'meet', ['met'], [['have met', FINISHED]]),
    c('How long ___ you ___ here?', 'Depuis combien de temps habites-tu ici ?', 'live', ['have lived'], [['did live', "La personne y habite encore : present perfect. « How long did you live here? » supposerait qu'elle est partie."]]),
    c('She ___ me last night.', "Elle m'a appelé hier soir.", 'call', ['called'], [['has called', FINISHED]]),
  ],
  quizzes: [
    quiz("« J'ai mangé du phở hier » se dit :", 'I ate pho yesterday.', ['I have eaten pho yesterday.', 'I have ate pho yesterday.'],
      "Le passé composé français se traduit par le passé simple dès qu'un moment précis est donné : yesterday, last week, in 2020, two days ago."),
    quiz('« Tu es déjà allé en Irlande ? » se dit :', 'Have you ever been to Ireland?', ['Did you ever went to Ireland?', 'Were you ever to Ireland?'],
      "« Déjà », au sens de « une fois dans ta vie » : present perfect avec « ever »."),
    quiz('Lequel de ces mots appelle le present perfect ?', 'since', ['yesterday', 'ago'],
      "« Since » et « for » (avec une durée qui continue), « ever », « never », « already », « yet », « just » : present perfect. « Yesterday », « ago », « last… », « in 2019 » : passé simple."),
    quiz('« Je travaille ici depuis deux ans » se dit :', "I've worked here for two years.", ['I work here since two years.', 'I worked here since two years.'],
      "« Depuis » + durée = « for », avec le present perfect. « Since » ne va qu'avec un point de départ : since 2023."),
  ],
}

const forms: LessonSource = {
  title: 'Seen, gone, doing',
  words: [],
  phrases: [],
  clozes: [
    c('Have you ___ the new film?', 'As-tu vu le nouveau film ?', 'see', ['seen'], [['saw', PARTICIPLE]]),
    c('She has ___ to the market.', 'Elle est allée au marché.', 'go', ['gone'], [['went', PARTICIPLE]]),
    c("I've ___ my keys.", "J'ai oublié mes clés.", 'forget', ['forgotten'], [['forgot', PARTICIPLE]]),
    c('They have ___ all the beer.', 'Ils ont bu toute la bière.', 'drink', ['drunk'], [['drank', PARTICIPLE]]),
    c('I was ___ when you called.', 'Je dormais quand tu as appelé.', 'sleep', ['sleeping'], [['slept', ING], ['sleep', ING]]),
    c('What are you ___?', "Qu'est-ce que tu fais ?", 'do', ['doing'], [['do', ING]]),
    c('He has ___ me the address.', "Il m'a donné l'adresse.", 'give', ['given'], [['gave', PARTICIPLE]]),
    c('We were ___ for the bus.', 'Nous attendions le bus.', 'wait', ['waiting'], [['waited', ING], ['wait', ING]]),
    c('Have you ___ your ticket?', 'As-tu acheté ton billet ?', 'buy', ['bought'], [['buyed', '« Buy » est irrégulier : bought, au passé comme au participe.']]),
    c("I've never ___ a scooter.", "Je n'ai jamais conduit de scooter.", 'ride', ['ridden'], [['rode', PARTICIPLE]]),
    c('She has ___ a lot of photos.', 'Elle a pris beaucoup de photos.', 'take', ['taken'], [['took', PARTICIPLE]]),
    c("Look, it's ___.", 'Regarde, il pleut.', 'rain', ['raining'], [['rain', ING], ['rains', ING]]),
    c('I have ___ him twice.', "Je l'ai rencontré deux fois.", 'meet', ['met'], [['meeted', '« Meet » est irrégulier : met.']]),
  ],
  quizzes: [
    quiz('Laquelle est correcte ?', 'I have done it.', ['I have did it.', 'I have do it.'], PARTICIPLE),
    quiz('go → went → ?', 'gone', ['goed', 'went'],
      "Trois formes à connaître pour chaque verbe irrégulier : la base, le passé simple, le participe. Go, went, gone."),
    quiz('Laquelle est correcte ?', 'I was eating when he arrived.', ['I was eat when he arrived.', 'I was ate when he arrived.'], ING),
    quiz('Après « have », on met :', 'le participe passé : seen, gone, done', ['la forme de base : see, go, do', 'le passé simple : saw, went, did'],
      "Have + participe, be + -ing, do + base : chaque auxiliaire impose sa forme au verbe qui suit."),
  ],
}

const modals: LessonSource = {
  title: 'Can, to, -ing',
  words: [],
  phrases: [],
  clozes: [
    c('She can ___ three languages.', 'Elle sait parler trois langues.', 'speak', ['speak'], [['speaks', MODAL], ['to speak', MODAL]]),
    c('You should ___ the pho here.', 'Tu devrais goûter le phở ici.', 'try', ['try'], [['to try', MODAL], ['tried', MODAL]]),
    c('I want ___ ___ a scooter.', 'Je veux louer un scooter.', 'rent', ['to rent'], [['rent', "Entre « want » et le verbe, il faut « to »."]]),
    c('He must ___ now.', 'Il doit partir maintenant.', 'leave', ['leave'], [['leaves', MODAL], ['to leave', MODAL]]),
    c("I'm looking forward to ___ you.", "J'ai hâte de te voir.", 'see', ['seeing'], [['see', "Ici « to » est une préposition, pas la marque de l'infinitif : elle est suivie de -ing."]]),
    c("I'm used to ___ early.", "J'ai l'habitude de me lever tôt.", 'get up', ['getting up'], [['get up', "« Be used to » = avoir l'habitude de : suivi de -ing."]]),
    c('I used to ___ in Lille.', 'Avant, j\'habitais à Lille.', 'live', ['live'], [['living', "« Used to », sans « be » = autrefois : suivi de la base. C'est « be used to » qui prend -ing."]]),
    c('She will ___ tomorrow.', 'Elle viendra demain.', 'come', ['come'], [['comes', MODAL], ['to come', MODAL]]),
    c('Thanks for ___ me.', "Merci de m'avoir aidé.", 'help', ['helping'], [['help', PREP]]),
    c('I enjoy ___.', "J'aime bien voyager.", 'travel', ['travelling', 'traveling'], [['to travel', '« Enjoy » est suivi de -ing, jamais de « to ».'], ['travel', '« Enjoy » est suivi de -ing.']]),
    c('Would you like ___ ___?', 'Voudrais-tu danser ?', 'dance', ['to dance'], [['dance', "« Would like », comme « want », est suivi de « to »."]]),
    c("Let's ___ a drink.", 'Prenons un verre.', 'have', ['have'], [['having', "Après « let's », la forme de base."], ['to have', "Après « let's », la forme de base, sans « to »."]]),
    c('He made me ___.', "Il m'a fait rire.", 'laugh', ['laugh'], [['to laugh', '« Make someone do » : pas de « to ».'], ['laughing', '« Make someone do » : la forme de base.']]),
  ],
  quizzes: [
    quiz('Laquelle est correcte ?', 'She can swim.', ['She cans swim.', 'She can to swim.'], MODAL),
    quiz('Laquelle est correcte ?', 'I look forward to hearing from you.', ['I look forward to hear from you.', 'I look forward hearing from you.'],
      "Le « to » de « look forward to » est une préposition : -ing derrière. C'est la formule de fin de mail la plus souvent ratée."),
    quiz('« Autrefois je fumais » se dit :', 'I used to smoke.', ['I was used to smoke.', 'I used to smoking.'],
      "« Used to » + base = une habitude passée. « I'm used to smoking » voudrait dire : j'ai l'habitude de fumer."),
    quiz('Laquelle est correcte ?', 'Thanks for coming.', ['Thanks for come.', 'Thanks to come.'], PREP),
  ],
}

// La vraie épreuve : toutes les décisions à la fois, comme en conversation.
const mixed: LessonSource = {
  title: 'Tout mélangé',
  words: [],
  phrases: [],
  clozes: [afterDo, didOrHave, forms, modals].flatMap((l) =>
    l.clozes!.map((cloze) => ({ ...cloze, id: `${cloze.id}-m` })),
  ),
  quizzes: [afterDo, didOrHave, forms, modals].flatMap((l) => l.quizzes!),
}

export const conjugationUnit: UnitSource = {
  id: 'conjuguer',
  title: 'Conjuguer sans hésiter',
  subtitle: 'Qui porte la marque : l\'auxiliaire ou le verbe ?',
  tips: [
    "Une seule question à se poser : y a-t-il un auxiliaire ? S'il y en a un, c'est lui qui se conjugue, et il impose sa forme au verbe qui suit. S'il n'y en a pas, c'est le verbe qui porte tout.",
    "do / does / did + forme de base : Did you try? She doesn't know. — Le passé ne se marque qu'une fois : jamais « did you tried ».",
    "have + participe passé : Have you tried? I've seen it. — be + -ing : I was sleeping. — can, will, should, must + base, sans « to » : She can speak.",
    "Did ou have ? Un moment précis et terminé (yesterday, ago, last year, in 2019, when…?) : passé simple. Un lien avec le présent (for, since, ever, never, already) : present perfect.",
    "Dans ces leçons, le verbe est donné à l'infinitif : écrivez-le à la bonne forme. Quand il y a deux trous, écrivez les deux mots à la suite.",
  ],
  lessons: [afterDo, didOrHave, forms, modals, mixed],
}
