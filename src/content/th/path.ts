// Parcours thaï : même principe que le vietnamien, avec une différence de
// taille — l'écriture. Le thaï a son propre alphabet, et s'écrit sans espace
// entre les mots. Ici chaque mot est séparé du suivant et accompagné de sa
// prononciation en lettres latines : on apprend à parler et à comprendre,
// l'œil s'habitue aux lettres au passage.
//
// Les phrases sont dites par un homme (« ผม », « ครับ »). Une femme remplace
// « ผม » par « ฉัน » et « ครับ » par « ค่ะ » : les conseils le rappellent.

import type { Course } from '../../types'
import { EMOJI, EXTRAS } from './extras'
import { buildExtraUnits, buildPathUnits, type UnitSource, type W } from '../path'

/** terme, prononciation, sens, note éventuelle. */
const t = (term: string, roman: string, gloss: string, note?: string): W => [
  term,
  gloss,
  note,
  roman,
]

export const PROPER_NOUNS = ['Tom', 'France']

const units: UnitSource[] = [
  {
    id: 'salut',
    title: 'Premiers mots',
    subtitle: 'Saluer, remercier, se présenter',
    tips: [
      "La prononciation est notée en lettres latines sous chaque mot. « kh », « th », « ph » sont un k, un t, un p soufflés — jamais « f » ni le « th » anglais. Une voyelle doublée (aa, ii, uu) est longue.",
      "Le thaï a cinq tons : le même son, dit plus haut, plus bas, montant ou descendant, change de mot. La notation latine ne les montre pas : fiez-vous à l'écoute, et répétez à voix haute.",
      "La politesse tient en un mot placé en fin de phrase : « ครับ » (khrap) si vous êtes un homme, « ค่ะ » (kha) si vous êtes une femme. De même, « je » se dit « ผม » (phom) pour un homme, « ฉัน » (chan) pour une femme.",
      "Pas de conjugaison, pas de pluriel, pas d'article. Une question fermée se forme en ajoutant « ไหม » (mai) à la fin.",
    ],
    lessons: [
      {
        title: 'Bonjour',
        words: [
          t('สวัสดี', 'sawatdi', 'bonjour ; au revoir', "Sert à l'arrivée comme au départ, à toute heure."),
          t('ขอบคุณ', 'khop khun', 'merci'),
          t('ขอโทษ', 'kho thot', 'pardon, excusez-moi'),
          t('ครับ', 'khrap', '(politesse, dite par un homme)', 'Une femme dit « ค่ะ » (kha). Seul, « ครับ » veut aussi dire « oui ».'),
          t('ใช่', 'chai', "oui, c'est ça"),
          t('ไม่', 'mai', 'non ; ne… pas', 'Se place devant le verbe ou l\'adjectif.'),
        ],
        phrases: [
          ['สวัสดี ครับ', 'Bonjour.'],
          ['ขอบคุณ ครับ', 'Merci.'],
          ['ขอโทษ ครับ', 'Pardon.'],
          ['ใช่ ครับ', "Oui, c'est ça."],
          ['ไม่ ใช่ ครับ', "Non, ce n'est pas ça."],
          ['ไม่ ครับ ขอบคุณ ครับ', 'Non, merci.'],
        ],
      },
      {
        title: 'Moi et vous',
        words: [
          t('ผม', 'phom', 'je, moi (homme)', 'Une femme dit « ฉัน » (chan).'),
          t('คุณ', 'khun', 'vous, tu'),
          t('ชื่อ', 'chue', "s'appeler ; nom"),
          t('อะไร', 'arai', 'quoi'),
          t('สบายดี', 'sabai di', 'aller bien'),
          t('ไหม', 'mai', '(marque de question)', 'En fin de phrase. Même notation latine que « ไม่ » (non), mais un autre ton.'),
        ],
        phrases: [
          ['ผม ชื่อ Tom ครับ', "Je m'appelle Tom."],
          ['คุณ ชื่อ อะไร ครับ', 'Comment vous appelez-vous ?'],
          ['คุณ สบายดี ไหม ครับ', 'Vous allez bien ?'],
          ['ผม สบายดี ครับ', 'Je vais bien.'],
          ['สบายดี ไหม', 'Ça va ?'],
          ['สบายดี ครับ ขอบคุณ ครับ', 'Ça va, merci.'],
        ],
      },
      {
        title: "D'où venez-vous ?",
        words: [
          t('มา', 'maa', 'venir'),
          t('จาก', 'chaak', 'de (provenance)'),
          t('ฝรั่งเศส', 'farangset', 'France ; français'),
          t('ประเทศ', 'prathet', 'pays'),
          t('คน', 'khon', 'personne'),
          t('ไทย', 'thai', 'thaï'),
          t('เป็น', 'pen', 'être'),
        ],
        phrases: [
          ['ผม มา จาก ฝรั่งเศส ครับ', 'Je viens de France.'],
          ['ผม เป็น คน ฝรั่งเศส ครับ', 'Je suis français.'],
          ['คุณ เป็น คน ไทย ไหม ครับ', 'Vous êtes thaïlandais ?'],
          ['คุณ มา จาก ประเทศ อะไร ครับ', 'Vous venez de quel pays ?'],
          ['ผม ไม่ ใช่ คน ไทย ครับ', 'Je ne suis pas thaïlandais.'],
          ['ผม มา จาก ประเทศ ฝรั่งเศส', 'Je viens du pays de France.'],
        ],
      },
    ],
  },
  {
    id: 'comprendre',
    title: 'Se comprendre',
    subtitle: 'Dire ce que l\'on parle, faire répéter',
    tips: [
      "« ได้ » (dai) après le verbe veut dire « pouvoir » : « พูด ได้ » = savoir parler. « …ได้ ไหม » demande si c'est possible : la formule de politesse la plus utile.",
      "« ไม่เป็นไร » (mai pen rai) — ce n'est rien, pas de souci — s'entend dix fois par jour.",
    ],
    lessons: [
      {
        title: 'Les langues',
        words: [
          t('พูด', 'phuut', 'parler'),
          t('ภาษา', 'phasa', 'langue'),
          t('อังกฤษ', 'angkrit', 'anglais ; Angleterre'),
          t('ได้', 'dai', 'pouvoir, savoir faire'),
          t('นิดหน่อย', 'nit noi', 'un peu'),
          t('เข้าใจ', 'khao chai', 'comprendre'),
        ],
        phrases: [
          ['คุณ พูด ภาษา อังกฤษ ได้ ไหม ครับ', 'Vous parlez anglais ?'],
          ['ผม พูด ภาษา ไทย ได้ นิดหน่อย ครับ', 'Je parle un peu thaï.'],
          ['ผม ไม่ เข้าใจ ครับ', 'Je ne comprends pas.'],
          ['เข้าใจ ไหม ครับ', 'Vous comprenez ?'],
          ['ผม พูด ภาษา ไทย ไม่ ได้ ครับ', 'Je ne parle pas thaï.'],
          ['เข้าใจ นิดหน่อย ครับ', 'Je comprends un peu.'],
          ['ผม พูด ภาษา ฝรั่งเศส ครับ', 'Je parle français.'],
        ],
      },
      {
        title: 'Plus lentement',
        words: [
          t('รู้', 'ruu', 'savoir'),
          t('ช้า', 'chaa', 'lent, lentement'),
          t('หน่อย', 'noi', '(adoucit une demande)', 'Littéralement « un peu » : rend la demande polie.'),
          t('อีก', 'iik', 'encore'),
          t('ครั้ง', 'khrang', 'fois'),
          t('ไม่เป็นไร', 'mai pen rai', "ce n'est rien, pas grave"),
        ],
        phrases: [
          ['ผม ไม่ รู้ ครับ', 'Je ne sais pas.'],
          ['พูด ช้า หน่อย ได้ ไหม ครับ', 'Vous pouvez parler plus lentement ?'],
          ['พูด อีก ครั้ง ได้ ไหม ครับ', 'Vous pouvez répéter ?'],
          ['ไม่เป็นไร ครับ', "Ce n'est pas grave."],
          ['ขอโทษ ครับ ผม ไม่ รู้', 'Pardon, je ne sais pas.'],
          ['อีก ครั้ง ครับ', 'Encore une fois.'],
        ],
      },
    ],
  },
  {
    id: 'nombres',
    title: 'Les nombres',
    subtitle: 'Compter, lire un prix',
    tips: [
      "Les dizaines : nombre + « สิบ » (sip). 30 = สาม สิบ, 50 = ห้า สิบ. Exception : 20 se dit « ยี่สิบ » (yii sip).",
      "Les nombres s'enchaînent comme en français : 350 = สาม ร้อย ห้า สิบ (trois cent cinq dix).",
    ],
    lessons: [
      {
        title: 'De 1 à 5',
        words: [
          t('หนึ่ง', 'nueng', 'un'),
          t('สอง', 'song', 'deux'),
          t('สาม', 'saam', 'trois'),
          t('สี่', 'sii', 'quatre'),
          t('ห้า', 'haa', 'cinq'),
        ],
        phrases: [
          ['หนึ่ง สอง สาม', 'Un, deux, trois.'],
          ['สาม สี่ ห้า', 'Trois, quatre, cinq.'],
          ['ห้า สี่ สาม สอง หนึ่ง', 'Cinq, quatre, trois, deux, un.'],
          ['สอง สี่', 'Deux, quatre.'],
          ['หนึ่ง สาม ห้า', 'Un, trois, cinq.'],
        ],
      },
      {
        title: 'De 6 à 10',
        words: [
          t('หก', 'hok', 'six'),
          t('เจ็ด', 'chet', 'sept'),
          t('แปด', 'paet', 'huit'),
          t('เก้า', 'kao', 'neuf'),
          t('สิบ', 'sip', 'dix'),
        ],
        phrases: [
          ['หก เจ็ด แปด', 'Six, sept, huit.'],
          ['เก้า สิบ', 'Neuf, dix.'],
          ['สิบ เก้า แปด เจ็ด หก', 'Dix, neuf, huit, sept, six.'],
          ['สอง สี่ หก แปด สิบ', 'Deux, quatre, six, huit, dix.'],
          ['หนึ่ง สาม ห้า เจ็ด เก้า', 'Un, trois, cinq, sept, neuf.'],
        ],
      },
      {
        title: 'Les prix',
        words: [
          t('ร้อย', 'roi', 'cent'),
          t('พัน', 'phan', 'mille'),
          t('บาท', 'baat', 'baht (la monnaie)'),
          t('เท่าไหร่', 'thao rai', 'combien'),
          t('ราคา', 'rakha', 'prix'),
          t('ยี่สิบ', 'yii sip', 'vingt'),
        ],
        phrases: [
          ['ราคา เท่าไหร่ ครับ', 'Quel est le prix ?'],
          ['เท่าไหร่ ครับ', "C'est combien ?"],
          ['ห้า สิบ บาท', 'Cinquante bahts.'],
          ['หนึ่ง ร้อย บาท', 'Cent bahts.'],
          ['สอง ร้อย บาท', 'Deux cents bahts.'],
          ['ยี่สิบ บาท', 'Vingt bahts.'],
          ['หนึ่ง พัน บาท', 'Mille bahts.'],
          ['สาม ร้อย ห้า สิบ บาท', 'Trois cent cinquante bahts.'],
        ],
      },
    ],
  },
  {
    id: 'manger',
    title: 'Manger et boire',
    subtitle: 'Commander, doser le piment, payer',
    tips: [
      "Pour commander : « เอา… » (ao, je prends) ou, plus poli, « ขอ… » (kho, je voudrais).",
      "Le piment se négocie : « ไม่ เผ็ด » = pas épicé, « เผ็ด นิดหน่อย » = un peu épicé. « Pas épicé » reste souvent relevé pour un palais français.",
      "L'adjectif suit le nom : « กาแฟ เย็น » = café glacé. « มาก » (très) vient après l'adjectif : « อร่อย มาก ».",
    ],
    lessons: [
      {
        title: "J'ai faim",
        words: [
          t('กิน', 'kin', 'manger'),
          t('ดื่ม', 'duem', 'boire'),
          t('อยาก', 'yaak', 'avoir envie de, vouloir'),
          t('ข้าว', 'khao', 'riz ; repas', '« กิน ข้าว » veut dire prendre un repas.'),
          t('น้ำ', 'naam', 'eau'),
          t('อร่อย', 'aroi', 'bon, délicieux'),
        ],
        phrases: [
          ['ผม อยาก กิน ข้าว ครับ', 'Je veux manger du riz.'],
          ['ผม อยาก ดื่ม น้ำ ครับ', "Je veux boire de l'eau."],
          ['อร่อย ไหม ครับ', "C'est bon ?"],
          ['อร่อย ครับ', "C'est bon."],
          ['คุณ อยาก กิน อะไร ครับ', 'Vous voulez manger quoi ?'],
          ['ไม่ อร่อย', "Ce n'est pas bon."],
          ['กิน ข้าว ไหม', 'On mange ?'],
        ],
      },
      {
        title: 'Commander',
        words: [
          t('เอา', 'ao', 'prendre (pour commander)'),
          t('ขอ', 'kho', 'je voudrais ; demander'),
          t('เผ็ด', 'phet', 'épicé, piquant'),
          t('มาก', 'maak', 'très, beaucoup'),
          t('ผัดไทย', 'phat thai', 'pad thaï (nouilles sautées)'),
          t('ไก่', 'kai', 'poulet'),
          t('หมู', 'muu', 'porc'),
        ],
        phrases: [
          ['เอา ผัดไทย ครับ', 'Je prends un pad thaï.'],
          ['ไม่ เผ็ด ครับ', 'Pas épicé.'],
          ['เผ็ด นิดหน่อย ครับ', 'Un peu épicé.'],
          ['เผ็ด มาก', 'Très épicé.'],
          ['อร่อย มาก ครับ', "C'est très bon."],
          ['ขอ ข้าว ไก่ ครับ', 'Je voudrais du riz au poulet.'],
          ['ผม ไม่ กิน หมู ครับ', 'Je ne mange pas de porc.'],
          ['ไม่ เอา เผ็ด ครับ', 'Je ne veux pas épicé.'],
        ],
      },
      {
        title: 'Les boissons',
        words: [
          t('เบียร์', 'bia', 'bière'),
          t('กาแฟ', 'kafae', 'café'),
          t('ชา', 'chaa', 'thé'),
          t('เย็น', 'yen', 'froid, glacé'),
          t('ร้อน', 'ron', 'chaud'),
          t('น้ำแข็ง', 'nam khaeng', 'glaçons'),
          t('เช็คบิล', 'chek bin', "l'addition"),
        ],
        phrases: [
          ['เอา เบียร์ ครับ', 'Je prends une bière.'],
          ['ขอ กาแฟ เย็น ครับ', 'Je voudrais un café glacé.'],
          ['ชา ร้อน ครับ', 'Un thé chaud.'],
          ['ไม่ เอา น้ำแข็ง ครับ', 'Je ne veux pas de glaçons.'],
          ['เช็คบิล ครับ', "L'addition."],
          ['ขอ น้ำ เย็น ครับ', "Je voudrais de l'eau fraîche."],
          ['กาแฟ ร้อน อร่อย มาก', 'Le café chaud est très bon.'],
        ],
      },
    ],
  },
  {
    id: 'acheter',
    title: 'Acheter et négocier',
    subtitle: 'Demander un prix, marchander, payer',
    tips: [
      "Sur les marchés, on marchande avec le sourire : « แพง มาก » (c'est très cher), puis « ลด ได้ ไหม ครับ » (vous pouvez baisser ?).",
      "« มี… ไหม » = vous avez… ? On répond « มี » (il y en a) ou « ไม่ มี » (il n'y en a pas).",
    ],
    lessons: [
      {
        title: "C'est combien ?",
        words: [
          t('อันนี้', 'an nii', 'ceci, ça'),
          t('ซื้อ', 'sue', 'acheter'),
          t('แพง', 'phaeng', 'cher'),
          t('ถูก', 'thuuk', 'bon marché, pas cher'),
          t('ลด', 'lot', 'baisser (un prix)'),
          t('มี', 'mii', 'avoir, il y a'),
        ],
        phrases: [
          ['อันนี้ เท่าไหร่ ครับ', 'Ça coûte combien ?'],
          ['ผม อยาก ซื้อ อันนี้ ครับ', 'Je veux acheter ça.'],
          ['แพง มาก', "C'est très cher."],
          ['ลด ได้ ไหม ครับ', 'Vous pouvez baisser le prix ?'],
          ['เอา อันนี้ ครับ', 'Je prends ça.'],
          ['อันนี้ ถูก มาก', "Ça, c'est vraiment pas cher."],
          ['มี เบียร์ ไหม ครับ', 'Vous avez de la bière ?'],
          ['ไม่ มี ครับ', "Il n'y en a pas."],
        ],
      },
      {
        title: 'Payer',
        words: [
          t('เงินสด', 'ngoen sot', 'espèces'),
          t('บัตร', 'bat', 'carte (bancaire)'),
          t('จ่าย', 'chaai', 'payer'),
          t('ถุง', 'thung', 'sac'),
          t('ใหญ่', 'yai', 'grand'),
          t('เล็ก', 'lek', 'petit'),
        ],
        phrases: [
          ['จ่าย บัตร ได้ ไหม ครับ', 'On peut payer par carte ?'],
          ['ผม จ่าย เงินสด ครับ', 'Je paie en espèces.'],
          ['ไม่ เอา ถุง ครับ', 'Je ne veux pas de sac.'],
          ['อันนี้ ใหญ่ มาก', "C'est très grand."],
          ['อันนี้ เล็ก มาก', "C'est très petit."],
          ['ผม ไม่ มี เงินสด ครับ', "Je n'ai pas d'espèces."],
          ['ขอ ถุง ครับ', 'Je voudrais un sac.'],
        ],
      },
    ],
  },
  {
    id: 'deplacer',
    title: 'Se déplacer',
    subtitle: 'Demander son chemin, guider un taxi',
    tips: [
      "« …อยู่ ที่ไหน » = où se trouve… ? C'est la question passe-partout.",
      "« ใกล้ » (près) et « ไกล » (loin) se notent presque pareil en lettres latines : seul le ton les distingue — descendant pour « près », plat pour « loin ». Écoutez-les côte à côte.",
      "En taxi, demandez le compteur ou fixez le prix avant de partir : « ไป… เท่าไหร่ ครับ ».",
    ],
    lessons: [
      {
        title: 'Où est… ?',
        words: [
          t('ไป', 'pai', 'aller'),
          t('อยู่', 'yuu', 'se trouver, être (quelque part)'),
          t('ที่ไหน', 'thii nai', 'où'),
          t('ห้องน้ำ', 'hong naam', 'toilettes'),
          t('โรงแรม', 'rong raem', 'hôtel'),
          t('สนามบิน', 'sanaam bin', 'aéroport'),
        ],
        phrases: [
          ['ห้องน้ำ อยู่ ที่ไหน ครับ', 'Où sont les toilettes ?'],
          ['ผม อยาก ไป สนามบิน ครับ', "Je veux aller à l'aéroport."],
          ['โรงแรม อยู่ ที่ไหน ครับ', "Où est l'hôtel ?"],
          ['คุณ ไป ที่ไหน ครับ', 'Vous allez où ?'],
          ['ผม ไป โรงแรม ครับ', "Je vais à l'hôtel."],
          ['ไป สนามบิน เท่าไหร่ ครับ', "Combien pour aller à l'aéroport ?"],
        ],
      },
      {
        title: 'Près, loin',
        words: [
          t('ใกล้', 'klâi', 'près, proche'),
          t('ไกล', 'klai', 'loin'),
          t('เลี้ยว', 'liao', 'tourner'),
          t('ซ้าย', 'saai', 'gauche'),
          t('ขวา', 'khwaa', 'droite'),
          t('ที่นี่', 'thii nii', 'ici'),
          t('จอด', 'chot', "s'arrêter, se garer"),
        ],
        phrases: [
          ['ไกล ไหม ครับ', "C'est loin ?"],
          ['ไม่ ไกล ครับ', "Ce n'est pas loin."],
          ['อยู่ ใกล้ โรงแรม', "C'est près de l'hôtel."],
          ['เลี้ยว ซ้าย ครับ', 'Tournez à gauche.'],
          ['เลี้ยว ขวา ครับ', 'Tournez à droite.'],
          ['จอด ที่นี่ ครับ', 'Arrêtez-vous ici.'],
          ['สนามบิน ไกล มาก', "L'aéroport est très loin."],
        ],
      },
      {
        title: 'Les transports',
        words: [
          t('ตรงไป', 'trong pai', 'tout droit'),
          t('แท็กซี่', 'thaeksii', 'taxi'),
          t('รถ', 'rot', 'voiture, véhicule'),
          t('ตั๋ว', 'tua', 'billet, ticket'),
          t('เช่า', 'chao', 'louer'),
          t('มอเตอร์ไซค์', 'motoesai', 'moto, scooter'),
        ],
        phrases: [
          ['ตรงไป ครับ', 'Tout droit.'],
          ['ผม อยาก เช่า มอเตอร์ไซค์ ครับ', 'Je veux louer un scooter.'],
          ['ตั๋ว เท่าไหร่ ครับ', 'Combien coûte le billet ?'],
          ['ตรงไป เลี้ยว ขวา', 'Tout droit puis à droite.'],
          ['รถ อยู่ ที่ไหน ครับ', 'Où est la voiture ?'],
          ['เช่า รถ เท่าไหร่ ครับ', 'Combien pour louer une voiture ?'],
          ['แท็กซี่ แพง มาก', 'Le taxi est très cher.'],
          ['ซื้อ ตั๋ว ที่ไหน ครับ', 'Où acheter un billet ?'],
        ],
      },
    ],
  },
  {
    id: 'loger',
    title: 'Hôtel et imprévus',
    subtitle: 'Prendre une chambre, demander de l\'aide',
    tips: [
      "« ช่วย ด้วย » (chuai duai) = au secours. Pour demander un service : « ช่วย ผม ได้ ไหม ครับ ».",
      "« ปวด » + la partie du corps dit où l'on a mal : « ปวด หัว » = mal à la tête.",
      "Numéros utiles en Thaïlande : 1155 police touristique (anglophone), 1669 urgences médicales.",
    ],
    lessons: [
      {
        title: 'Une chambre',
        words: [
          t('ห้อง', 'hong', 'chambre, pièce'),
          t('คืน', 'khuen', 'nuit'),
          t('วัน', 'wan', 'jour'),
          t('จอง', 'chong', 'réserver'),
          t('กุญแจ', 'kunchae', 'clé'),
          t('แอร์', 'ae', 'climatisation'),
        ],
        phrases: [
          ['มี ห้อง ไหม ครับ', 'Vous avez une chambre ?'],
          ['ผม อยาก จอง ห้อง ครับ', 'Je veux réserver une chambre.'],
          ['ห้อง ราคา เท่าไหร่ ครับ', 'Quel est le prix de la chambre ?'],
          ['สอง คืน ครับ', 'Deux nuits.'],
          ['สาม วัน', 'Trois jours.'],
          ['ขอ กุญแจ ห้อง ครับ', 'Je voudrais la clé de la chambre.'],
          ['ห้อง มี แอร์ ไหม ครับ', 'La chambre a la climatisation ?'],
        ],
      },
      {
        title: "À l'aide",
        words: [
          t('ช่วย', 'chuai', 'aider'),
          t('ด้วย', 'duai', 'aussi ; (renforce une demande)'),
          t('ปวด', 'puat', 'avoir mal'),
          t('หัว', 'hua', 'tête'),
          t('ท้อง', 'thong', 'ventre'),
          t('หมอ', 'mo', 'médecin'),
          t('ยา', 'yaa', 'médicament'),
        ],
        phrases: [
          ['ช่วย ด้วย ครับ', 'Au secours !'],
          ['ผม ปวด หัว ครับ', "J'ai mal à la tête."],
          ['ผม ปวด ท้อง ครับ', "J'ai mal au ventre."],
          ['ผม อยาก ซื้อ ยา ครับ', 'Je veux acheter un médicament.'],
          ['หมอ อยู่ ที่ไหน ครับ', 'Où est le médecin ?'],
          ['ช่วย ผม ได้ ไหม ครับ', "Vous pouvez m'aider ?"],
          ['มี ยา ไหม ครับ', 'Vous avez un médicament ?'],
        ],
      },
    ],
  },
  {
    id: 'discuter',
    title: 'Discuter',
    subtitle: 'Dire ce que l\'on aime, se quitter, trinquer',
    tips: [
      "« แล้ว » (laeo) en fin de phrase marque que c'est fait : « กิน ข้าว แล้ว » = j'ai déjà mangé. « ยัง » = pas encore.",
      "« สนุก » (sanuk) — s'amuser, prendre plaisir — est une valeur cardinale : dire qu'une chose est « สนุก มาก » fait toujours plaisir.",
    ],
    lessons: [
      {
        title: "J'aime la Thaïlande",
        words: [
          t('ชอบ', 'chop', 'aimer, apprécier'),
          t('รัก', 'rak', "aimer (d'amour), adorer"),
          t('สวย', 'suai', 'beau, joli'),
          t('สนุก', 'sanuk', 'amusant ; s\'amuser'),
          t('เที่ยว', 'thiao', 'voyager, se balader'),
          t('เมืองไทย', 'mueang thai', 'la Thaïlande'),
        ],
        phrases: [
          ['ผม ชอบ เมืองไทย ครับ', "J'aime la Thaïlande."],
          ['ผม มา เที่ยว ครับ', 'Je suis venu en voyage.'],
          ['สวย มาก', "C'est très beau."],
          ['สนุก มาก ครับ', "C'est très amusant."],
          ['ผม รัก เมืองไทย', "J'adore la Thaïlande."],
          ['ผม ชอบ กิน ผัดไทย', "J'aime manger du pad thaï."],
          ['คุณ ชอบ ไหม ครับ', 'Ça vous plaît ?'],
        ],
      },
      {
        title: 'Se quitter',
        words: [
          t('วันนี้', 'wan nii', "aujourd'hui"),
          t('พรุ่งนี้', 'phrung nii', 'demain'),
          t('แล้ว', 'laeo', 'déjà ; alors'),
          t('ยัง', 'yang', 'pas encore'),
          t('เจอกัน', 'choe kan', 'se revoir'),
          t('โชคดี', 'chok dii', 'bonne chance'),
          t('ชนแก้ว', 'chon kaeo', 'santé ! (pour trinquer)'),
        ],
        phrases: [
          ['วันนี้ ร้อน มาก', "Aujourd'hui il fait très chaud."],
          ['พรุ่งนี้ ผม ไป สนามบิน', "Demain je vais à l'aéroport."],
          ['กิน ข้าว แล้ว ครับ', "J'ai déjà mangé."],
          ['ยัง ครับ', 'Pas encore.'],
          ['แล้ว เจอกัน ครับ', 'À bientôt.'],
          ['โชคดี ครับ', 'Bonne chance.'],
          ['พรุ่งนี้ เจอกัน', 'À demain.'],
          ['ชนแก้ว ครับ', 'Santé !'],
        ],
      },
    ],
  },
]

export const thai: Course = {
  id: 'th',
  lang: 'th',
  voice: 'th-TH',
  title: 'Thaï',
  icon: '🇹🇭',
  path: true,
  romanized: true,
  properNouns: PROPER_NOUNS,
  units: buildPathUnits('t', units, EMOJI),
  extras: buildExtraUnits('t', EXTRAS, EMOJI),
}
