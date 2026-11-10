// Anglais à l'oral : un parcours pour qui lit couramment l'anglais mais
// cherche ses mots en parlant.
//
// Le vocabulaire n'est pas le problème à ce niveau. Ce qui manque, ce sont
// les tournures toutes faites qui laissent le temps de penser, les réflexes
// qui évitent les calques du français, la prononciation de mots connus
// seulement par l'écrit, et l'oreille pour les accents qui s'éloignent de
// l'anglais des manuels. Les leçons portent donc sur des expressions
// entières, et des questions rédigées expliquent le pourquoi.

import type { Course, Quiz } from '../../types'
import { buildPathUnits, type UnitSource } from '../path'

/** question, texte lu éventuel, bonne réponse, leurres, explication. */
const q = (
  prompt: string,
  answer: string,
  wrong: string[],
  why: string,
  speak?: string,
): Quiz => ({ prompt, speak, options: [answer, ...wrong], why })

export const PROPER_NOUNS = [
  'Dublin',
  'Sydney',
  'Ireland',
  'Australia',
  'English',
  'French',
  'Monday',
  'Friday',
  'Tom',
]

const units: UnitSource[] = [
  {
    id: 'temps',
    title: 'Gagner du temps',
    subtitle: 'Ne plus rester muet quand le mot ne vient pas',
    tips: [
      "Un natif ne parle pas sans pause : il les remplit. « Let me think », « the thing is », « how shall I put it » donnent deux secondes pour construire la suite, et font paraître plus à l'aise, pas moins.",
      "Quand un mot manque, ne vous arrêtez pas : décrivez. « It's a kind of… », « the thing you use to… ». L'autre vous souffle le mot, et la conversation continue.",
      "Faire répéter n'est pas un aveu de faiblesse. « Sorry, I didn't catch that » est ce que disent les natifs entre eux, dix fois par soirée.",
    ],
    lessons: [
      {
        title: 'Le temps de réfléchir',
        words: [
          ['let me think', 'laissez-moi réfléchir'],
          ['how shall I put it', 'comment dire', "Annonce qu'on cherche la formule juste — souvent pour dire une chose délicate."],
          ['the thing is', "le truc, c'est que", "Introduit l'objection ou le vrai fond du problème."],
          ['what I mean is', "ce que je veux dire, c'est que"],
          ['off the top of my head', 'comme ça, de tête', "Prévient que le chiffre ou le nom donné est approximatif."],
          ['bear with me', 'un instant, soyez patient'],
        ],
        phrases: [
          ['Let me think, it was about two years ago.', "Laissez-moi réfléchir, c'était il y a deux ans environ."],
          ["How shall I put it, he's a bit special.", 'Comment dire, il est un peu spécial.'],
          ["The thing is, I don't really have time.", "Le truc, c'est que je n'ai pas vraiment le temps."],
          ['What I mean is, we should wait.', "Ce que je veux dire, c'est qu'on devrait attendre."],
          ["Off the top of my head, I'd say twenty.", 'Comme ça, de tête, je dirais vingt.'],
          ["Bear with me, I'm looking for the word.", 'Un instant, je cherche le mot.'],
        ],
        quizzes: [
          q(
            "On vous pose une question difficile. Quelle réponse sonne le plus naturel ?",
            "Good question. Let me think…",
            ['Euh… wait… I search.', 'I am thinking to the answer.'],
            "Commenter la question puis annoncer qu'on réfléchit remplit le silence avec de l'anglais. « I search » et « thinking to » sont des calques : on dit « I'm looking for » et « thinking about ».",
          ),
          q(
            '« Off the top of my head » veut dire :',
            'sans vérifier, de mémoire',
            ['en criant très fort', "en y ayant longuement réfléchi"],
            "L'image est celle de ce qui sort du haut de la tête, sans creuser. On s'en sert pour donner un ordre de grandeur sans s'engager.",
          ),
          q(
            "Vous voulez corriger ce que vous venez de mal dire. Vous commencez par :",
            'What I mean is…',
            ['I want to say that…', 'My meaning is…'],
            "« I want to say » se comprend mais sent la traduction de « je veux dire ». « What I mean is » ou « I mean » est le réflexe natif.",
          ),
        ],
      },
      {
        title: 'Quand le mot manque',
        words: [
          ['what do you call it', "comment ça s'appelle, déjà"],
          ["it's on the tip of my tongue", "je l'ai sur le bout de la langue"],
          ["it's a kind of", "c'est une sorte de"],
          ['the thing you use to', 'le truc qui sert à'],
          ['it slipped my mind', "ça m'est sorti de la tête"],
          ['you know what I mean', 'tu vois ce que je veux dire'],
        ],
        phrases: [
          ['I need a, what do you call it, a corkscrew.', "J'ai besoin d'un, comment ça s'appelle, un tire-bouchon."],
          ["His name, it's on the tip of my tongue.", "Son nom, je l'ai sur le bout de la langue."],
          ["It's a kind of small boat.", "C'est une sorte de petit bateau."],
          ['Where is the thing you use to open bottles?', 'Où est le truc qui sert à ouvrir les bouteilles ?'],
          ['Sorry, it slipped my mind completely.', "Désolé, ça m'est complètement sorti de la tête."],
          ["It's a bit too much, you know what I mean?", "C'est un peu trop, tu vois ce que je veux dire ?"],
        ],
        quizzes: [
          q(
            'Vous avez oublié le mot « tire-bouchon ». Le mieux est de dire :',
            'The thing you use to open wine.',
            ["I don't know the word.", 'How do you say in English?'],
            "Décrire l'objet fait avancer la conversation : on vous donnera le mot. « How do you say in English » est en plus fautif : il manque le complément — « How do you say that in English? ».",
          ),
          q(
            "Vous avez oublié un rendez-vous. Comment s'excuser ?",
            "I'm so sorry, it completely slipped my mind.",
            ['Sorry, I have forgotten me.', 'Sorry, it went out of my head.'],
            "« It slipped my mind » est la formule consacrée, et « completely » la renforce. Les deux autres sont des traductions mot à mot.",
          ),
          q(
            '« Thingy », « thingamajig », « whatsit » servent à :',
            "désigner un objet dont on a oublié le nom",
            ['insulter gentiment quelqu\'un', 'parler d\'une petite quantité'],
            "L'anglais a ses « machin » et « bidule ». Les entendre dans la bouche d'un natif rappelle que chercher ses mots est normal.",
          ),
        ],
      },
      {
        title: 'Reformuler et faire répéter',
        words: [
          ['in other words', 'autrement dit'],
          ['let me rephrase that', 'je reformule'],
          ["I didn't catch that", "je n'ai pas saisi", "Plus naturel que « I didn't understand », qui laisse croire que c'est l'idée qui échappe, pas le son."],
          ['could you say that again', 'vous pouvez répéter'],
          ["so you're saying", 'donc vous dites que'],
          ['does that make sense', "est-ce que c'est clair"],
        ],
        phrases: [
          ["In other words, it's too expensive.", "Autrement dit, c'est trop cher."],
          ['Let me rephrase that, I was not clear.', "Je reformule, je n'étais pas clair."],
          ["Sorry, I didn't catch that.", "Pardon, je n'ai pas saisi."],
          ['Could you say that again, a bit slower?', 'Vous pouvez répéter, un peu plus lentement ?'],
          ["So you're saying we should leave now.", "Donc vous dites qu'on devrait partir maintenant."],
          ['Does that make sense to you?', "Est-ce que c'est clair pour vous ?"],
        ],
        quizzes: [
          q(
            "Dans un pub bruyant, vous n'avez pas entendu. Vous dites :",
            "Sorry, I didn't catch that.",
            ['Repeat, please.', "I don't understand you."],
            "« Repeat, please » sonne comme un ordre de professeur. « I don't understand you » accuse l'autre. « I didn't catch that » met la faute sur le bruit.",
          ),
          q(
            "Vous n'êtes pas sûr d'avoir compris. Pour vérifier :",
            "So you're saying it's closed on Mondays?",
            ['You say it is closed the Monday?', 'It is that it is closed Monday?'],
            "Reformuler avec « So you're saying… » vérifie sans faire répéter. Notez « on Mondays » : préposition « on », et pluriel pour l'habitude.",
          ),
          q(
            'Après une longue explication, « Does that make sense? » sert à :',
            "vérifier qu'on a été clair, sans mettre l'autre en cause",
            ["demander si l'autre est d'accord", "dire que c'est absurde"],
            "La formule porte sur votre explication, pas sur l'intelligence de l'autre : bien plus poli que « Do you understand? ».",
          ),
        ],
      },
    ],
  },
  {
    id: 'naturel',
    title: 'Sonner naturel',
    subtitle: 'Les calques du français, et le mot plus juste',
    tips: [
      "Les fautes qui trahissent un francophone sont presque toujours les mêmes : une préposition calquée (« depend of »), un verbe d'état (« I am agree »), un temps (« since three years »). Les corriger une fois pour toutes change tout.",
      "« Actually » ne veut pas dire « actuellement », et « eventually » pas « éventuellement ». Ces deux-là faussent le sens de la phrase entière.",
      "« Very » + adjectif est correct mais plat. L'anglais a un adjectif fort pour presque tout : very tired → exhausted, very hungry → starving. Attention : on ne dit pas « very exhausted », mais « absolutely exhausted ».",
    ],
    lessons: [
      {
        title: 'Calques à éviter',
        words: [
          ['I agree', "je suis d'accord", "Jamais « I am agree » : « agree » est un verbe, pas un adjectif."],
          ['it depends on', 'ça dépend de', "Toujours « on », jamais « of »."],
          ["I've been here for", 'je suis ici depuis (une durée)', "« For » + durée, « since » + point de départ. Et le present perfect, pas le présent."],
          ['explain it to me', 'explique-le-moi', "« Explain » exige « to » : jamais « explain me »."],
          ["I'm used to", "j'ai l'habitude de", "Suivi d'un nom ou d'un verbe en -ing : « I'm used to driving »."],
          ["I'm looking forward to", "j'ai hâte de", "Aussi suivi de -ing : « looking forward to seeing you »."],
        ],
        phrases: [
          ['I agree with you on that.', "Je suis d'accord avec toi là-dessus."],
          ['It depends on the weather.', 'Ça dépend du temps.'],
          ["I've been here for three weeks.", 'Je suis ici depuis trois semaines.'],
          ['Could you explain it to me again?', "Tu peux me l'expliquer encore ?"],
          ["I'm used to getting up early.", "J'ai l'habitude de me lever tôt."],
          ["I'm looking forward to seeing you.", "J'ai hâte de te voir."],
        ],
        quizzes: [
          q(
            'Laquelle est correcte ?',
            "I've been living in Ireland for two years.",
            ['I live in Ireland since two years.', 'I am living in Ireland since two years.'],
            "Une action commencée dans le passé et qui dure : present perfect. Et « for » devant une durée ; « since » irait avec un point de départ — « since 2023 ».",
          ),
          q(
            'Laquelle est correcte ?',
            "I'm looking forward to meeting them.",
            ["I'm looking forward to meet them.", 'I look forward meeting them.'],
            "Ici « to » est une préposition, pas la marque de l'infinitif : il est suivi d'un nom ou d'un verbe en -ing. Même piège avec « I'm used to ».",
          ),
          q(
            'Comment dit-on « on a fait la fête » ?',
            'We had a party.',
            ['We made a party.', 'We did the party.'],
            "On « has » ou « throws » a party. « Make » est un des calques les plus fréquents : on dit aussi « take a decision » ou « make a decision », mais « take a photo », « have a shower », « have a drink ».",
          ),
        ],
      },
      {
        title: 'Faux amis de conversation',
        words: [
          ['actually', 'en fait, à vrai dire', "Sert à corriger ou à nuancer. « Actuellement » se dit « currently »."],
          ['currently', 'actuellement, en ce moment'],
          ['eventually', 'finalement, à la longue', "Jamais « éventuellement », qui se dit « possibly »."],
          ['possibly', 'éventuellement, peut-être'],
          ['sensible', 'raisonnable, sensé'],
          ['sensitive', 'sensible, susceptible'],
        ],
        phrases: [
          ["Actually, I've never been to Sydney.", "En fait, je ne suis jamais allé à Sydney."],
          ["I'm currently looking for a job.", 'Je cherche actuellement un travail.'],
          ['We eventually found the hotel.', "On a fini par trouver l'hôtel."],
          ['Could you possibly help me?', 'Pourriez-vous éventuellement m\'aider ?'],
          ["That's a sensible idea.", "C'est une idée raisonnable."],
          ["He's very sensitive about his accent.", 'Il est très susceptible sur son accent.'],
        ],
        quizzes: [
          q(
            '« We eventually got there » veut dire :',
            'On a fini par y arriver.',
            ['On y est peut-être arrivés.', 'On y arrivait de temps en temps.'],
            "« Eventually » marque l'aboutissement après un délai ou des difficultés. Aucune idée d'incertitude.",
          ),
          q(
            'Comment dire « Actuellement, je travaille à Dublin » ?',
            "I'm currently working in Dublin.",
            ['Actually, I work in Dublin.', 'I work actually in Dublin.'],
            "« Actually, I work in Dublin » veut dire « en fait, je travaille à Dublin » : on corrige quelqu'un. Pour le moment présent : « currently » ou « at the moment ».",
          ),
          q(
            'On vous dit « Be sensible ». On vous demande :',
            "d'être raisonnable",
            ["d'être sensible", "d'être attentif aux autres"],
            "« Sensible » = sensé. La personne sensible est « sensitive ». Les deux mots existent, mais inversés par rapport au français.",
          ),
        ],
      },
      {
        title: 'Plus juste que « very »',
        words: [
          ['exhausted', 'épuisé'],
          ['starving', 'mort de faim'],
          ['freezing', 'glacial ; gelé'],
          ['gorgeous', 'magnifique'],
          ['hilarious', 'hilarant'],
          ['furious', 'furieux'],
          ['tiny', 'minuscule'],
        ],
        phrases: [
          ["I'm exhausted after that walk.", 'Je suis épuisé après cette marche.'],
          ["I'm starving, let's eat.", 'Je meurs de faim, mangeons.'],
          ["It's freezing in here.", 'Il fait glacial ici.'],
          ['The view is absolutely gorgeous.', 'La vue est absolument magnifique.'],
          ['That story was hilarious.', 'Cette histoire était hilarante.'],
          ['She was furious with him.', 'Elle était furieuse contre lui.'],
          ['Their flat is tiny.', 'Leur appartement est minuscule.'],
        ],
        quizzes: [
          q(
            'Laquelle sonne juste ?',
            "I'm absolutely exhausted.",
            ["I'm very exhausted.", "I'm a lot exhausted."],
            "Un adjectif déjà extrême ne prend pas « very » : on le renforce avec « absolutely », « completely » ou « utterly ». À l'inverse, on dit « very tired », pas « absolutely tired ».",
          ),
          q(
            'Pour dire qu\'un film était « très drôle », le plus naturel :',
            'It was hilarious.',
            ['It was very funny funny.', 'It was so much fun.'],
            "« Fun » veut dire amusant, agréable — une soirée est « fun ». Ce qui fait rire est « funny », et très drôle, « hilarious ».",
          ),
          q(
            '« I\'m starving » se dit :',
            'couramment, dès qu\'on a très faim',
            ['seulement en cas de vraie famine', 'uniquement à l\'écrit'],
            "L'anglais parlé adore l'exagération : « starving », « freezing », « dying for a coffee » n'ont rien de dramatique.",
          ),
        ],
      },
    ],
  },
  {
    id: 'prononcer',
    title: 'Prononciation',
    subtitle: 'Les mots qu\'on connaît par l\'écrit et qu\'on dit mal',
    tips: [
      "Qui lit beaucoup apprend les mots par l'œil, et les prononce comme ils s'écrivent. Or l'orthographe anglaise ment : lettres muettes, voyelles avalées, accent qui se déplace. Écoutez chaque mot, puis la version lente.",
      "L'accent tonique compte plus que la justesse des sons. Un mot bien articulé mais accentué au mauvais endroit n'est pas reconnu : « HO-tel » au lieu de « ho-TEL » fait répéter.",
      "Les syllabes non accentuées s'écrasent en un « eu » très bref. « Comfortable » n'a que trois syllabes, « vegetable » aussi. La prononciation approchée est notée sous chaque mot, la syllabe forte en capitales.",
    ],
    lessons: [
      {
        title: 'Lettres muettes',
        words: [
          ['receipt', 'reçu, ticket de caisse', 'Le « p » ne se prononce pas.', 'ri-SIIT'],
          ['debt', 'dette', 'Le « b » ne se prononce pas.', 'DÈT'],
          ['salmon', 'saumon', 'Le « l » ne se prononce pas.', 'SA-meun'],
          ['island', 'île', 'Le « s » ne se prononce pas.', 'AÏ-leund'],
          ['Wednesday', 'mercredi', 'Deux syllabes seulement : le premier « d » et le « e » disparaissent.', 'WÈNZ-dèï'],
          ['climb', 'grimper', 'Le « b » final ne se prononce pas, comme dans « lamb » ou « thumb ».', 'CLAÏM'],
          ['doubt', 'doute ; douter', 'Le « b » ne se prononce pas.', 'DAOUT'],
        ],
        phrases: [
          ['Could I have the receipt, please?', 'Je peux avoir le reçu, s\'il vous plaît ?'],
          ["He's finally out of debt.", "Il n'a enfin plus de dettes."],
          ["I'll have the salmon, please.", 'Je vais prendre le saumon, s\'il vous plaît.'],
          ['We spent a week on the island.', "On a passé une semaine sur l'île."],
          ['See you on Wednesday.', 'À mercredi.'],
          ['I doubt we can climb it today.', "Je doute qu'on puisse le grimper aujourd'hui."],
        ],
        quizzes: [
          q(
            'Écoutez « receipt ». Quelle lettre ne se prononce pas ?',
            'le p',
            ['le c', 'le t'],
            "On dit « ri-SIIT ». Même « p » muet dans « psychology » et « cupboard » (« KEU-beud »).",
            'receipt',
          ),
          q(
            'Écoutez. Combien de syllabes dans « Wednesday » ?',
            'deux',
            ['trois', 'quatre'],
            "« WÈNZ-dèï ». Le mot s'écrit en trois morceaux, mais personne ne les prononce.",
            'Wednesday',
          ),
          q(
            'Lequel de ces mots a aussi une lettre muette ?',
            'knife',
            ['kitchen', 'kettle'],
            "Le « k » devant « n » est toujours muet : knife, know, knee, knock. De même le « w » de « write » et de « answer ».",
            'knife',
          ),
        ],
      },
      {
        title: "L'accent tonique",
        words: [
          ['comfortable', 'confortable', 'Trois syllabes, accent sur la première.', 'KÕMF-teu-beul'],
          ['vegetable', 'légume', 'Trois syllabes, accent sur la première.', 'VÈDJ-teu-beul'],
          ['interesting', 'intéressant', 'Trois syllabes, accent sur la première.', 'IN-treu-sting'],
          ['photographer', 'photographe', "L'accent glisse : PHO-to-graph, mais pho-TO-grapher.", 'feu-TO-greu-feu'],
          ['develop', 'développer', 'Accent sur la deuxième syllabe.', 'di-VÈ-leup'],
          ['hotel', 'hôtel', 'Accent sur la fin, contrairement à ce qu\'on attend.', 'hô-TÈL'],
          ['event', 'événement', 'Accent sur la fin.', 'i-VÈNT'],
        ],
        phrases: [
          ['The bed is really comfortable.', 'Le lit est vraiment confortable.'],
          ['I only want the vegetable soup.', 'Je veux seulement la soupe de légumes.'],
          ["That's an interesting question.", "C'est une question intéressante."],
          ['She works as a photographer.', 'Elle travaille comme photographe.'],
          ['They want to develop the area.', 'Ils veulent développer le quartier.'],
          ['The hotel is hosting a big event.', "L'hôtel accueille un grand événement."],
        ],
        quizzes: [
          q(
            'Écoutez « comfortable ». Où tombe l\'accent ?',
            'sur la première syllabe : COMF-table',
            ['sur la deuxième : com-FOR-table', 'sur la dernière : comfor-TABLE'],
            "Et le mot n'a que trois syllabes : le « or » disparaît complètement.",
            'comfortable',
          ),
          q(
            'Écoutez « photograph » puis « photographer ». L\'accent :',
            'se déplace de la première à la deuxième syllabe',
            ['reste sur la première syllabe', 'tombe sur la dernière dans les deux'],
            "PHO-to-graph, pho-TO-grapher, pho-to-GRA-phic : l'accent bouge avec le suffixe, et les voyelles changent avec lui.",
            'photograph. photographer.',
          ),
          q(
            'Écoutez « hotel ». Où tombe l\'accent ?',
            'sur la fin : ho-TEL',
            ['sur le début : HO-tel', 'les deux syllabes sont égales'],
            "Comme « event », « police », « machine » : des mots d'origine française que l'anglais accentue encore à la fin.",
            'hotel',
          ),
        ],
      },
      {
        title: 'Les pièges de « ough » et compagnie',
        words: [
          ['clothes', 'vêtements', 'Une seule syllabe : presque comme « close ».', 'CLÔZ'],
          ['iron', 'fer ; fer à repasser', 'Le « r » ne s\'entend pas.', 'AÏ-eun'],
          ['recipe', 'recette', 'Trois syllabes : le « e » final se prononce.', 'RÈ-seu-pi'],
          ['thorough', 'minutieux, approfondi', undefined, 'THEU-reu'],
          ['though', 'pourtant, quand même', 'Rime avec « go ».', 'DZÔ'],
          ['tough', 'dur, coriace', 'Rime avec « stuff ».', 'TEUF'],
          ['through', 'à travers', 'Rime avec « too ».', 'THROU'],
        ],
        phrases: [
          ['I need to buy some warm clothes.', 'Je dois acheter des vêtements chauds.'],
          ['Is there an iron in the room?', 'Y a-t-il un fer à repasser dans la chambre ?'],
          ['Could you give me the recipe?', 'Tu peux me donner la recette ?'],
          ['They did a thorough check.', 'Ils ont fait une vérification minutieuse.'],
          ["It was fun, though.", "C'était sympa, quand même."],
          ['It was a tough walk through the forest.', "C'était une marche dure à travers la forêt."],
        ],
        quizzes: [
          q(
            'Écoutez. « Tough » rime avec :',
            'stuff',
            ['go', 'too'],
            "« ough » a au moins six prononciations : tough (euf), though (ô), through (ou), cough (of), thought (ôt), bough (aou). Il n'y a pas de règle : on les apprend mot par mot.",
            'tough',
          ),
          q(
            'Écoutez « clothes ». Combien de syllabes ?',
            'une',
            ['deux', 'trois'],
            "On dit presque « close ». « Clo-thes » en deux syllabes est une des erreurs les plus répandues.",
            'clothes',
          ),
          q(
            'Écoutez « recipe ». La fin se prononce :',
            '« pi », le e final s\'entend',
            ['« saïp », comme dans « pipe »', 'le e est muet'],
            "RÈ-seu-pi. Exception à la règle du « e » muet, comme « catastrophe » et « apostrophe ».",
            'recipe',
          ),
        ],
      },
    ],
  },
  {
    id: 'pub',
    title: 'Au pub',
    subtitle: 'Entamer la conversation, offrir un verre, prendre congé',
    tips: [
      "« How's it going? » et « How are you? » ne sont pas des questions : ce sont des salutations. On répond en une formule (« Not too bad, yourself? ») et l'on renvoie la balle.",
      "Dans un pub, on paie par tournées : chacun à son tour offre à tout le groupe. Dire « It's my round » au bon moment vaut mieux que n'importe quel accent.",
      "« Cheers » veut dire santé, mais aussi merci, et même au revoir.",
    ],
    lessons: [
      {
        title: 'Entamer la conversation',
        words: [
          ["how's it going", 'comment ça va (familier)'],
          ['not too bad', 'pas trop mal', "La réponse par défaut : positive, en fait."],
          ["can't complain", 'je ne me plains pas'],
          ['what have you been up to', "qu'est-ce que tu deviens"],
          ['long time no see', 'ça fait un bail'],
          ['how was your weekend', "c'était comment, ton week-end"],
        ],
        phrases: [
          ["Hi Tom, how's it going?", 'Salut Tom, comment ça va ?'],
          ['Not too bad, thanks. And you?', 'Pas trop mal, merci. Et toi ?'],
          ["Can't complain, the weather is nice.", 'Je ne me plains pas, il fait beau.'],
          ['So, what have you been up to?', "Alors, qu'est-ce que tu deviens ?"],
          ['Long time no see, how are things?', 'Ça fait un bail, comment ça va ?'],
          ['How was your weekend, did you go away?', "C'était comment, ton week-end, tu es parti ?"],
        ],
        quizzes: [
          q(
            'On vous lance « How\'s it going? ». La réponse attendue :',
            'Not too bad, yourself?',
            ['It is going to the pub.', 'I am going very well, thank you very much.'],
            "C'est une salutation, pas une vraie question : une formule courte, puis on renvoie avec « yourself? » ou « and you? ».",
          ),
          q(
            '« What have you been up to? » demande :',
            'ce que vous avez fait dernièrement',
            ['jusqu\'où vous êtes monté', 'ce que vous comptez faire'],
            "« To be up to something » = être occupé à quelque chose. Réponse type : « Not much, just working. You? »",
          ),
          q(
            'Pour relancer quelqu\'un qui vient de répondre, le plus simple :',
            'Oh really? How come?',
            ['Why this?', 'Explain me.'],
            "« How come? » est le « pourquoi » décontracté de la conversation. « Oh really? », « No way! », « Fair play » montrent qu'on écoute.",
          ),
        ],
      },
      {
        title: 'Boire un verre',
        words: [
          ['fancy a pint', 'ça te dit, une pinte', "« Fancy » + nom ou -ing : « Fancy going out? »"],
          ["it's my round", "c'est ma tournée"],
          ["I'm good", 'ça va pour moi (refus poli)', "Pour décliner : « I'm good, thanks »."],
          ['same again', 'la même chose'],
          ['cheers', 'santé ; merci (familier)'],
          ["I'd better get going", "je ferais mieux d'y aller"],
        ],
        phrases: [
          ['Fancy a pint after work?', 'Ça te dit, une pinte après le travail ?'],
          ["Sit down, it's my round.", "Assieds-toi, c'est ma tournée."],
          ["I'm good, thanks, I'm driving.", 'Ça va pour moi, merci, je conduis.'],
          ['Same again, please.', 'La même chose, s\'il vous plaît.'],
          ['Cheers, that was great.', "Merci, c'était super."],
          ["It's late, I'd better get going.", "Il est tard, je ferais mieux d'y aller."],
        ],
        quizzes: [
          q(
            'On vous propose un autre verre et vous n\'en voulez pas :',
            "I'm good, thanks.",
            ['No, I don\'t want.', 'I am well, thank you.'],
            "« I'm good » décline sans vexer. « I don't want » est abrupt, et incomplet : il faudrait « I don't want one ».",
          ),
          q(
            'Un ami pose une pinte devant vous. Vous dites :',
            'Cheers, mate. Next one\'s on me.',
            ['Thank you for the beer you bought to me.', 'How much I owe you?'],
            "« Cheers » sert de merci. « The next one's on me » annonce que la prochaine tournée est pour vous : proposer de rembourser serait déplacé.",
          ),
          q(
            'Pour partir sans paraître brusque :',
            "Right, I'd better get going.",
            ['I go now.', 'I must to leave.'],
            "« Right, … » annonce le départ, « I'd better » l'adoucit. « Must to » est fautif : « must » n'est jamais suivi de « to ».",
          ),
        ],
      },
    ],
  },
  {
    id: 'avis',
    title: 'Donner son avis',
    subtitle: 'Nuancer, objecter sans froisser, tenir une discussion',
    tips: [
      "L'anglais atténue. Un « I disagree » sec passe pour agressif ; on entend plutôt « I see your point, but… » ou « I'm not sure about that ».",
      "« Fair enough » est la formule qui clôt un désaccord sans céder : j'entends ton argument, restons-en là.",
      "« I think » répété lasse vite. Alternez : « I'd say », « I reckon », « to my mind », « as far as I know ».",
    ],
    lessons: [
      {
        title: 'Nuancer',
        words: [
          ["I'd say", 'je dirais'],
          ['to be fair', 'pour être juste'],
          ['I see your point', 'je vois ce que tu veux dire'],
          ['fair enough', 'soit, ça se tient'],
          ["I'm not convinced", 'je ne suis pas convaincu'],
          ["it's not my cup of tea", "ce n'est pas mon truc"],
        ],
        phrases: [
          ["I'd say it takes about an hour.", 'Je dirais que ça prend une heure environ.'],
          ['To be fair, he did warn us.', 'Pour être juste, il nous avait prévenus.'],
          ['I see your point, but I disagree.', "Je vois ce que tu veux dire, mais je ne suis pas d'accord."],
          ["Fair enough, we'll do it your way.", 'Soit, on fera à ta façon.'],
          ["I'm not convinced it will work.", 'Je ne suis pas convaincu que ça marchera.'],
          ["Camping? It's not my cup of tea.", "Le camping ? Ce n'est pas mon truc."],
        ],
        quizzes: [
          q(
            "Vous n'êtes pas d'accord avec un ami. Le plus naturel :",
            "I see your point, but I'm not sure that's true.",
            ['You are wrong.', 'I am not agree with you.'],
            "Reconnaître l'argument avant d'objecter est le réflexe anglais. « I am not agree » est le calque à bannir : « I don't agree ».",
          ),
          q(
            'On vous répond « Fair enough ». L\'autre :',
            'accepte votre argument, sans forcément le partager',
            ['trouve que c\'est assez juste payé', 'vous demande d\'arrêter'],
            "Une des expressions les plus utiles : elle met fin à un désaccord sans vainqueur.",
          ),
          q(
            'Pour dire poliment que vous n\'aimez pas le jazz :',
            "It's not really my cup of tea.",
            ['I hate the jazz.', 'The jazz is bad.'],
            "L'euphémisme est la politesse britannique. Notez aussi : pas d'article devant un genre musical — « I like jazz ».",
          ),
        ],
      },
      {
        title: 'Tenir une discussion',
        words: [
          ['on the other hand', "d'un autre côté"],
          ['that said', 'cela dit'],
          ['as far as I know', 'pour autant que je sache'],
          ["I couldn't agree more", 'je suis entièrement d\'accord'],
          ["I'm on the fence", 'je suis partagé', "Assis sur la clôture : ni d'un côté ni de l'autre."],
          ["let's agree to disagree", 'restons-en là, chacun son avis'],
        ],
        phrases: [
          ["It's cheap. On the other hand, it's far.", "C'est bon marché. D'un autre côté, c'est loin."],
          ['That said, I would go again.', "Cela dit, j'y retournerais."],
          ["As far as I know, it's still open.", "Pour autant que je sache, c'est encore ouvert."],
          ["I couldn't agree more with that.", "Je suis entièrement d'accord avec ça."],
          ["I'm on the fence about moving abroad.", "Je suis partagé sur le fait de partir à l'étranger."],
          ["Let's agree to disagree and have a drink.", 'Restons-en là et buvons un verre.'],
        ],
        quizzes: [
          q(
            '« I couldn\'t agree more » veut dire :',
            'je suis totalement d\'accord',
            ['je ne peux plus être d\'accord', 'je ne suis pas d\'accord du tout'],
            "Littéralement : je ne pourrais pas être plus d'accord. Même tournure dans « I couldn't care less », je m'en fiche complètement.",
          ),
          q(
            'Vous donnez une information dont vous n\'êtes pas certain :',
            "As far as I know, the last bus is at eleven.",
            ['For what I know, the last bus is at eleven.', 'At my knowledge, the last bus is at eleven.'],
            "« As far as I know » ou « as far as I'm aware ». Les deux autres calquent « pour ce que j'en sais » et « à ma connaissance ».",
          ),
          q(
            'Quelqu\'un est « on the fence ». Il est :',
            'indécis',
            ['en colère', 'hors sujet'],
            "Pour pousser quelqu'un à trancher, on dit « Come on, get off the fence ».",
          ),
        ],
      },
    ],
  },
  {
    id: 'irlande',
    title: "Décoder l'irlandais",
    subtitle: 'Les mots et les sons qui déroutent en Irlande',
    voice: 'en-IE',
    tips: [
      "Ce qui bloque avec l'accent irlandais tient moins à la vitesse qu'à trois choses : des mots qu'on ne trouve dans aucun manuel, des tournures héritées du gaélique, et quelques sons déplacés. Les connaître suffit souvent à raccrocher la phrase.",
      "Le « th » devient souvent « t » ou « d » : « three » s'entend « tree », « this » s'entend « dis », « thirty-three » « turty-tree ». Et un « eu » s'intercale dans certains groupes de consonnes : « film » s'entend « fillum ».",
      "« Grand » ne veut pas dire grandiose : c'est « ça va », « d'accord », « pas de souci ». C'est le mot le plus utile du pays.",
      "La voix de votre téléphone reste un accent neutre, loin d'un vrai pub de Galway : pour l'oreille, rien ne remplace une radio irlandaise ou un podcast. Cette unité donne les clés pour les décoder.",
    ],
    lessons: [
      {
        title: "Les mots d'Irlande",
        words: [
          ["what's the craic", 'quoi de neuf (Irlande)', "« Craic », prononcé « crack » : l'ambiance, les nouvelles, la bonne humeur.", 'wats de CRAK'],
          ['grand', 'bien, ça va (Irlande)'],
          ['your man', 'le type, ce gars-là (Irlande)', "Ne désigne personne que vous connaissez : juste « le type en question ». Au féminin : « your one »."],
          ['giving out', 'râler, engueuler (Irlande)'],
          ['thanks a million', 'merci mille fois (Irlande)'],
          ['eejit', 'idiot, andouille (Irlande)', 'Affectueux plus qu\'insultant.', 'II-djit'],
          ['wee', 'petit (Irlande du Nord, Écosse)'],
        ],
        phrases: [
          ["What's the craic? Any news?", 'Quoi de neuf ? Des nouvelles ?'],
          ["I'm grand, thanks.", 'Ça va bien, merci.'],
          ['Your man at the bar is giving out again.', 'Le type au bar est encore en train de râler.'],
          ['Thanks a million for the lift.', "Merci mille fois de m'avoir déposé."],
          ["Don't be such an eejit.", 'Ne fais pas l\'andouille.'],
          ['Would you like a wee cup of tea?', 'Tu veux une petite tasse de thé ?'],
        ],
        quizzes: [
          q(
            'On vous dit « You\'re grand ». Cela signifie :',
            'pas de souci, tout va bien',
            ['vous êtes grand', 'vous êtes formidable'],
            "« Grand » couvre « bien », « d'accord » et « ce n'est rien ». « Sorry! — You're grand » : pardon ! — pas de mal.",
          ),
          q(
            '« Your man said the bus is late. » Qui a parlé ?',
            'un type quelconque, que vous ne connaissez pas forcément',
            ['votre mari ou compagnon', 'votre patron'],
            "« Your man » veut seulement dire « le type ». Rien à voir avec vous.",
          ),
          q(
            'Un Irlandais demande « Any craic? ». Il veut savoir :',
            's\'il y a du nouveau, de l\'ambiance',
            ['si vous avez de la drogue', 'si quelque chose est cassé'],
            "Le mot s'écrit « craic » et n'a rien à voir avec « crack ». « It was great craic » = on s'est bien amusés.",
          ),
        ],
      },
      {
        title: 'Tournures et sons',
        words: [
          ["I'm after", 'je viens de (Irlande)', "Suivi de -ing : « I'm after eating » = je viens de manger. Calque du gaélique."],
          ['the jacks', 'les toilettes (Irlande)'],
          ['yoke', 'truc, machin (Irlande)'],
          ['deadly', 'génial (Irlande)', "Ailleurs, « deadly » veut dire mortel."],
          ['I will yeah', 'sûrement pas (ironique, Irlande)', "Dit sur un ton traînant, c'est un refus."],
          ['sláinte', 'santé ! (gaélique)', undefined, 'SLÔN-tcheu'],
          ['so it is', '(renforce la phrase, Irlande du Nord)'],
        ],
        phrases: [
          ["I'm after missing the last bus.", 'Je viens de rater le dernier bus.'],
          ['Where are the jacks?', 'Où sont les toilettes ?'],
          ['Pass me that yoke over there.', 'Passe-moi ce machin, là-bas.'],
          ['The gig last night was deadly.', "Le concert d'hier soir était génial."],
          ['Lend you fifty euro? I will yeah.', 'Te prêter cinquante euros ? Sûrement pas.'],
          ["Sláinte! It's a cold day, so it is.", 'Santé ! Il fait froid, ça oui.'],
        ],
        quizzes: [
          q(
            '« I\'m after losing my keys » veut dire :',
            'je viens de perdre mes clés',
            ['je cherche mes clés', 'je vais perdre mes clés'],
            "« To be after » + -ing remplace « have just » : une structure du gaélique passée dans l'anglais d'Irlande.",
          ),
          q(
            'Vous entendez « turty-tree ». C\'est :',
            'thirty-three',
            ['dirty tree', 'thirteen'],
            "Le « th » irlandais devient souvent « t » ou « d ». « Tanks » = thanks, « dis and dat » = this and that.",
            'thirty-three',
          ),
          q(
            'Un Irlandais parle d\'un « fillum ». Il s\'agit :',
            'd\'un film',
            ['d\'un plein d\'essence', 'd\'une pellicule photo'],
            "Une voyelle s'intercale entre certaines consonnes : film → fillum, arm → arum. Trait hérité du gaélique.",
          ),
        ],
      },
    ],
  },
  {
    id: 'australie',
    title: "Décoder l'australien",
    subtitle: 'Les raccourcis et les voyelles d\'Australie',
    voice: 'en-AU',
    tips: [
      "L'australien raccourcit tout et ajoute « -o » ou « -ie » : afternoon → arvo, breakfast → brekkie, service station → servo. Plus la personne est âgée ou rurale, plus il y en a.",
      "Les voyelles glissent : « day » tire vers « die », « mate » vers « mite », « no » vers « naow ». « G'day mate » s'entend presque « g'die mite ».",
      "Les phrases affirmatives montent souvent à la fin, comme des questions. Et les mots s'enchaînent sans articuler : « How are you going? » devient « Howyagoin? ».",
      "« Yeah nah » veut dire non, « nah yeah » veut dire oui : c'est le dernier mot qui compte.",
    ],
    lessons: [
      {
        title: 'Les raccourcis',
        words: [
          ['arvo', 'après-midi (Australie)'],
          ['brekkie', 'petit-déjeuner (Australie)'],
          ['servo', 'station-service (Australie)'],
          ['bottle-o', "magasin d'alcool (Australie)"],
          ['no worries', 'pas de souci, de rien'],
          ['heaps', 'plein, beaucoup (Australie)'],
          ['mate', "pote, l'ami"],
        ],
        phrases: [
          ['See you this arvo.', 'À cet après-midi.'],
          ["Let's grab some brekkie.", 'Allons prendre un petit-déjeuner.'],
          ["There's a servo down the road.", 'Il y a une station-service plus bas.'],
          ["I'll stop at the bottle-o on the way.", "Je m'arrêterai au magasin d'alcool en chemin."],
          ['No worries, mate.', "Pas de souci, l'ami."],
          ['Thanks heaps for your help.', 'Merci beaucoup pour ton aide.'],
        ],
        quizzes: [
          q(
            '« See you Sat arvo at the barbie. » Rendez-vous :',
            'samedi après-midi au barbecue',
            ['samedi soir chez Barbara', 'dimanche matin au bar'],
            "Arvo = afternoon, barbie = barbecue. Dans la même veine : sunnies (lunettes de soleil), mozzie (moustique), esky (glacière).",
          ),
          q(
            'Vous remerciez, on vous répond « No worries ». C\'est :',
            'de rien',
            ['ne t\'inquiète pas pour moi', 'je n\'ai pas le temps'],
            "La formule nationale : de rien, pas de souci, d'accord. On entend aussi « too easy » et « no dramas ».",
          ),
          q(
            '« There were heaps of people » veut dire :',
            'il y avait plein de monde',
            ['il y avait des gens entassés', 'il y avait peu de monde'],
            "« Heaps » remplace « lots » et « very » : « heaps good », « thanks heaps ».",
          ),
        ],
      },
      {
        title: 'Les expressions',
        words: [
          ['how ya going', 'comment ça va (Australie)', "Rien à voir avec un déplacement : c'est « how are you »."],
          ['I reckon', 'je pense, à mon avis'],
          ["she'll be right", 'ça va aller (Australie)', "« She » ne désigne personne : la situation, en général."],
          ['crook', 'malade, patraque (Australie)'],
          ['yeah nah', 'non (poli, Australie)'],
          ['ta', 'merci (familier)'],
          ['fair dinkum', 'vrai, pour de vrai (Australie)'],
        ],
        phrases: [
          ["G'day, how ya going?", 'Bonjour, comment ça va ?'],
          ["I reckon it'll rain this arvo.", "À mon avis, il va pleuvoir cet après-midi."],
          ["Don't stress, she'll be right.", 'Ne stresse pas, ça va aller.'],
          ["I'm feeling a bit crook today.", "Je me sens un peu patraque aujourd'hui."],
          ["Yeah nah, I'm not keen.", 'Non, ça ne me dit rien.'],
          ["Ta, mate. Fair dinkum, that's the best pie in town.", "Merci, l'ami. Pour de vrai, c'est la meilleure tourte de la ville."],
        ],
        quizzes: [
          q(
            'On vous demande « How ya going? ». Vous répondez :',
            'Good, thanks. You?',
            ['By bus.', "I'm going to Sydney."],
            "C'est « comment ça va », pas « comment y allez-vous ». La réponse australienne type : « Good, thanks » ou « Not bad ».",
          ),
          q(
            '« Yeah nah, I\'ll give it a miss. » La personne :',
            'refuse',
            ['accepte', 'hésite encore'],
            "Le « yeah » accuse réception, le « nah » répond. « Nah yeah » est donc un oui. « Give it a miss » = passer son tour.",
          ),
          q(
            'Vous entendez « g\'die mite ». C\'est :',
            "G'day, mate",
            ['Good night', 'Go and die, mate'],
            "Le son « ay » tire vers « aï » : day → die, today → to-die, mate → mite. Une fois qu'on le sait, la moitié du brouillard se lève.",
            "G'day mate",
          ),
        ],
      },
    ],
  },
]

export const englishFluency: Course = {
  id: 'en-oral',
  lang: 'en',
  voice: 'en-GB',
  title: "Anglais à l'oral",
  path: true,
  advanced: true,
  properNouns: PROPER_NOUNS,
  units: buildPathUnits('e', units),
}
