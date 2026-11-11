// Dialogues du parcours d'anglais à l'oral : les tournures de chaque unité
// entendues en situation, avant d'être relues. Ceux d'Irlande et d'Australie
// font entendre les mots locaux dans la bouche de quelqu'un du pays, face à
// un voyageur qui parle l'anglais des manuels.

import type { DialogueLine } from '../../types'
import { quiz, type LessonSource } from '../path'

const A = (text: string, fr: string): DialogueLine => ({ who: 'A', text, fr })
const B = (text: string, fr: string): DialogueLine => ({ who: 'B', text, fr })

export const missingWordDialogue: LessonSource = {
  title: 'Dialogue : le mot qui manque',
  words: [],
  phrases: [],
  dialogue: [
    A('Hi there, can I help you?', 'Bonjour, je peux vous aider ?'),
    B("Yes, I'm looking for a, what do you call it, the thing you use to open wine.", "Oui, je cherche un, comment ça s'appelle, le truc qui sert à ouvrir le vin."),
    A('A corkscrew?', 'Un tire-bouchon ?'),
    B("That's it! It was on the tip of my tongue.", "C'est ça ! Je l'avais sur le bout de la langue."),
    A("They're at the back, next to the glasses.", 'Ils sont au fond, à côté des verres.'),
    B("Sorry, I didn't catch that. Could you say that again?", "Pardon, je n'ai pas saisi. Vous pouvez répéter ?"),
    A('At the back of the shop, on the left.', 'Au fond du magasin, à gauche.'),
    B('Got it, thanks a lot.', 'Compris, merci beaucoup.'),
  ],
  quizzes: [
    quiz('Que cherche le client ?', 'un tire-bouchon', ['un verre à vin', 'une bouteille de vin'],
      'Il ne connaît pas le mot « corkscrew » et le décrit : « the thing you use to open wine ».'),
    quiz("Comment s'en sort-il sans connaître le mot ?", "il décrit à quoi sert l'objet", ['il le dit en français', 'il renonce et sort'],
      '« What do you call it » gagne du temps, puis « the thing you use to… » décrit. Le vendeur trouve le mot à sa place.'),
    quiz('Où sont les tire-bouchons ?', 'au fond du magasin, à gauche', ["à l'entrée, à droite", 'à la caisse'],
      '« At the back of the shop, on the left ». « At the back » = au fond ; « at the front » = à l\'entrée.'),
    quiz('Pourquoi fait-il répéter le vendeur ?', "il n'a pas bien entendu", ["il n'est pas d'accord", 'il veut un autre prix'],
      '« I didn\'t catch that » porte sur le son, pas sur le sens : la formule polie pour faire répéter.'),
    quiz('On vous dit « Can I help you? ». Vous cherchez, sans urgence :', "I'm just looking, thanks.", ['No, I don\'t want.', 'I search something.'],
      '« I\'m just looking » est la réponse consacrée en magasin. « I search » est un calque : on dit « I\'m looking for ».'),
  ],
}

export const pubDialogue: LessonSource = {
  title: 'Dialogue : un verre après le travail',
  words: [],
  phrases: [],
  dialogue: [
    A("Hi Thibault! Long time no see. How's it going?", 'Salut Thibault ! Ça fait un bail. Comment ça va ?'),
    B('Not too bad, thanks. What have you been up to?', "Pas trop mal, merci. Qu'est-ce que tu deviens ?"),
    A('Not much, just working. Fancy a pint?', 'Pas grand-chose, je travaille. Ça te dit, une pinte ?'),
    B("Go on then. But it's my round.", "Allez, d'accord. Mais c'est ma tournée."),
    A('Cheers! Same again later?', 'Merci ! La même chose tout à l\'heure ?'),
    B("I'm good, thanks. I'm driving tonight.", 'Ça va pour moi, merci. Je conduis ce soir.'),
    A('Fair enough. How was your weekend?', "Ça se comprend. C'était comment, ton week-end ?"),
    B("Great, but I'd better get going. See you Friday!", "Super, mais je ferais mieux d'y aller. À vendredi !"),
  ],
  quizzes: [
    quiz('Qui paie la première tournée ?', 'Thibault', ['son ami', 'chacun paie sa part'],
      '« It\'s my round », dit Thibault : c\'est ma tournée. Chacun son tour, on ne partage pas l\'addition.'),
    quiz('« Go on then » veut dire :', "allez, d'accord", ['vas-y sans moi', 'continue de parler'],
      "Une façon de se laisser convaincre : oui, pourquoi pas. On l'entend à chaque proposition de verre."),
    quiz('Pourquoi Thibault refuse-t-il un deuxième verre ?', 'il conduit', ["il n'a plus d'argent", "il n'aime pas la bière"],
      '« I\'m good, thanks. I\'m driving tonight. » — « I\'m good » décline poliment.'),
    quiz('Que fait Thibault à la fin ?', "il s'en va", ['il commande à manger', 'il reste toute la soirée'],
      '« I\'d better get going » : je ferais mieux d\'y aller. La formule adoucit le départ.'),
    quiz('On vous demande « What have you been up to? ». Vous répondez :', 'Not much, just working. You?', ["I'm up to the pub.", 'I have been to here.'],
      'La question porte sur ce que vous avez fait dernièrement. Réponse courte, puis on renvoie la balle.'),
  ],
}

export const opinionDialogue: LessonSource = {
  title: "Dialogue : pas d'accord",
  words: [],
  phrases: [],
  dialogue: [
    A("I'd say London is the best city in the world.", 'Je dirais que Londres est la meilleure ville du monde.'),
    B("I see your point, but it's so expensive.", "Je vois ce que tu veux dire, mais c'est tellement cher."),
    A('To be fair, the salaries are higher too.', 'Pour être juste, les salaires sont plus élevés aussi.'),
    B("That said, I couldn't live there. It's not my cup of tea.", "Cela dit, je ne pourrais pas y vivre. Ce n'est pas mon truc."),
    A('Fair enough. Where would you live, then?', 'Soit. Tu vivrais où, alors ?'),
    B("I'm on the fence. Dublin, maybe, or somewhere by the sea.", 'Je suis partagé. Dublin, peut-être, ou quelque part au bord de la mer.'),
    A("As far as I know, Dublin isn't cheap either.", "Pour autant que je sache, Dublin n'est pas bon marché non plus."),
    B("True. Let's agree to disagree and have a drink.", 'Vrai. Restons-en là et buvons un verre.'),
  ],
  quizzes: [
    quiz('Que reproche-t-on à Londres ?', "c'est trop cher", ["c'est trop grand", 'il y pleut trop'],
      '« It\'s so expensive ». Notez comment l\'objection est amenée : « I see your point, but… ».'),
    quiz("Quel argument lui répond-on ?", 'les salaires y sont plus élevés', ['les loyers baissent', 'la ville est plus sûre'],
      '« To be fair, the salaries are higher too » : « to be fair » introduit ce qui nuance la critique.'),
    quiz('Sait-il où il aimerait vivre ?', 'non, il hésite', ['oui, à Londres', 'oui, à Dublin sans hésiter'],
      '« I\'m on the fence » : assis sur la clôture, ni d\'un côté ni de l\'autre.'),
    quiz('Comment finit la discussion ?', 'chacun garde son avis, sans se fâcher', ["l'un convainc l'autre", 'ils se disputent'],
      '« Let\'s agree to disagree » : on constate le désaccord et l\'on passe à autre chose.'),
    quiz("Vous n'êtes pas d'accord, mais voulez rester aimable :", "I see your point, but I'm not sure.", ['You are wrong.', 'I am not agree.'],
      'Reconnaître l\'argument avant d\'objecter. « I am not agree » est une faute : on dit « I don\'t agree ».'),
  ],
}

export const dublinDialogue: LessonSource = {
  title: 'Dialogue : dans un pub de Dublin',
  words: [],
  phrases: [],
  dialogue: [
    A("Well! What's the craic?", 'Alors ! Quoi de neuf ?'),
    B("Sorry, I didn't catch that.", "Pardon, je n'ai pas saisi."),
    A('How are things? Are you only after arriving?', 'Comment ça va ? Tu viens juste d\'arriver ?'),
    B('Yes, I landed this morning. Where are the toilets, by the way?', "Oui, j'ai atterri ce matin. Au fait, où sont les toilettes ?"),
    A('The jacks are down the back, past your man in the hat.', 'Les toilettes sont au fond, après le type au chapeau.'),
    B('Thanks a million.', 'Merci mille fois.'),
    A("You're grand. Will you have a wee drop of whiskey?", 'Pas de quoi. Tu prendras une petite goutte de whiskey ?'),
    B("I'd love one. Sláinte!", 'Avec plaisir. Santé !'),
  ],
  quizzes: [
    quiz('« What\'s the craic? » demande :', 'comment ça va, quoi de neuf', ['ce qui est cassé', 'ce que vous voulez boire'],
      'Le voyageur ne comprend pas et fait répéter : l\'Irlandais reformule en « How are things? ».'),
    quiz('« Are you only after arriving? » veut dire :', "tu viens juste d'arriver ?", ['tu repars après ?', 'tu arrives en retard ?'],
      '« To be after » + -ing = venir de. Le voyageur répond d\'ailleurs « I landed this morning ».'),
    quiz('Où sont les toilettes ?', "au fond, après l'homme au chapeau", ["à l'étage, près du bar", 'dehors, à gauche'],
      '« The jacks are down the back, past your man in the hat ». « Your man » = le type, pas quelqu\'un que vous connaissez.'),
    quiz('À « Thanks a million », on répond « You\'re grand ». C\'est :', 'de rien, pas de souci', ['tu es grand', 'tu es formidable'],
      '« Grand » = bien, ça va. Ici, l\'équivalent de « you\'re welcome ».'),
    quiz('« A wee drop » de whiskey, c\'est :', 'une petite goutte', ['un grand verre', 'une bouteille'],
      '« Wee » = petit. La quantité réelle servie n\'est pas garantie.'),
  ],
}

export const servoDialogue: LessonSource = {
  title: 'Dialogue : sur la route en Australie',
  words: [],
  phrases: [],
  dialogue: [
    A("G'day mate, how ya going?", "Bonjour l'ami, comment ça va ?"),
    B('Good, thanks. Is there a servo near here?', "Bien, merci. Il y a une station-service près d'ici ?"),
    A("Yeah, there's one down the road, next to the bottle-o.", "Oui, il y en a une plus bas, à côté du magasin d'alcool."),
    B('Great. Is it open this arvo?', 'Super. Elle est ouverte cet après-midi ?'),
    A('I reckon so. Where are you headed?', 'Je pense que oui. Vous allez où ?'),
    B('Sydney. Is it far?', "Sydney. C'est loin ?"),
    A("Yeah nah, not really. A couple of hours, she'll be right.", 'Non, pas vraiment. Deux ou trois heures, ça ira.'),
    B('Thanks heaps.', 'Merci beaucoup.'),
    A('No worries, mate.', "Pas de souci, l'ami."),
  ],
  quizzes: [
    quiz('Que cherche le voyageur ?', 'une station-service', ["un magasin d'alcool", 'un restaurant'],
      '« Servo » = service station. Le « bottle-o », le magasin d\'alcool, ne sert ici que de repère.'),
    quiz('Où se trouve-t-elle ?', "plus bas sur la route, à côté du magasin d'alcool", ['en face, de l\'autre côté', 'à Sydney'],
      '« Down the road, next to the bottle-o ».'),
    quiz('« Is it open this arvo? » demande si elle est ouverte :', 'cet après-midi', ['ce soir', 'tous les jours'],
      '« Arvo » = afternoon. « This arvo » s\'entend souvent comme un seul mot : « s\'arvo ».'),
    quiz('Sydney est-il loin ?', 'non, pas vraiment', ['oui, très loin', 'il ne sait pas'],
      '« Yeah nah » = non : le « yeah » accuse réception, le « nah » répond. Deux ou trois heures de route, peu de chose en Australie.'),
    quiz('« She\'ll be right » veut dire :', 'ça va aller', ['elle a raison', 'elle arrive à droite'],
      '« She » ne désigne personne : c\'est la situation. Une façon nationale de dire qu\'il n\'y a pas à s\'en faire.'),
  ],
}
