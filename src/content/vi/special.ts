// Leçons vietnamiennes qui sortent du moule « des mots, puis des phrases » :
// des dialogues à écouter, les prix à reconnaître à l'oreille, les tons.
//
// Elles visent ce que les leçons ordinaires ne travaillent pas : comprendre
// la réponse qu'on reçoit, pas seulement savoir poser la question.

import type { DialogueLine, SpokenNumber } from '../../types'
import { quiz, type LessonSource, type UnitSource } from '../path'

const A = (text: string, fr: string): DialogueLine => ({ who: 'A', text, fr })
const B = (text: string, fr: string): DialogueLine => ({ who: 'B', text, fr })

// --- Les tons ----------------------------------------------------------------

export const tonesUnit: UnitSource = {
  id: 'tons',
  title: 'Les tons',
  subtitle: "Six façons de dire « ma », six mots différents",
  tips: [
    "Chaque syllabe vietnamienne porte un ton, noté par un accent. Le changer change le mot : « ma » est un fantôme, « má » une joue, « mạ » un plant de riz. C'est la première cause d'incompréhension, loin devant le vocabulaire.",
    "Les six tons : a — plat, voix tenue ; à — descendant, comme un soupir ; á — montant, comme une question ; ả — creusé, descend puis remonte ; ã — brisé, monte avec une cassure ; ạ — lourd, tombe bas et s'arrête net.",
    "Pour s'entraîner : écoutez la version lente, puis répétez à voix haute en exagérant la mélodie. On se sent ridicule, et c'est exactement ce qu'il faut.",
    "Le contexte aide beaucoup : personne ne commande un fantôme au restaurant. Un ton approximatif dans une phrase claire passe ; un mot isolé au mauvais ton, non.",
  ],
  lessons: [
    {
      title: 'Les six tons',
      drill: true,
      words: [
        ['ma', 'fantôme', 'Ton plat : la voix reste tenue, sans monter ni descendre.'],
        ['mà', 'mais ; que (mot de liaison)', 'Ton descendant : la voix tombe doucement, comme un soupir.'],
        ['má', 'joue ; maman (au sud)', 'Ton montant : la voix grimpe, comme une question en français.'],
        ['mả', 'tombe, sépulture', 'Ton creusé : la voix descend puis remonte.'],
        ['mã', 'code ; cheval (mots savants)', 'Ton brisé : la voix monte, avec une cassure au milieu.'],
        ['mạ', 'jeune plant de riz', "Ton lourd : la voix tombe bas et s'arrête net."],
      ],
      phrases: [],
      quizzes: [
        quiz('Écoutez. La voix…', 'monte', ['descend', 'reste plate'],
          "C'est « má », le ton montant, noté par l'accent aigu. Il sonne comme la fin d'une question en français.", 'má'),
        quiz('Écoutez. La voix…', 'descend doucement', ['monte', "s'arrête net"],
          "C'est « mà », le ton descendant, noté par l'accent grave. Plus bas et plus long que le ton plat.", 'mà'),
        quiz('Écoutez. La voix…', "tombe et s'arrête net", ['monte', 'reste plate'],
          "C'est « mạ », le ton lourd, noté par le point sous la voyelle. Court, bas, coupé comme si on vous interrompait.", 'mạ'),
        quiz('Écoutez. La voix…', 'reste plate', ['descend puis remonte', 'monte'],
          "C'est « ma », sans accent : le ton plat. La voix se tient à mi-hauteur, comme une note chantée.", 'ma'),
        quiz('Écoutez. La voix…', 'descend puis remonte', ['reste plate', 'tombe net'],
          "C'est « mả », le ton creusé, noté par le petit crochet. Il ressemble à un « ah ? » dubitatif.", 'mả'),
      ],
    },
  ],
}

/** Mots du cours que seul le ton, ou presque, distingue. */
export const pairsLesson: LessonSource = {
  title: 'Les paires qui piègent',
  drill: true,
  words: [],
  phrases: [],
  quizzes: [
    quiz('Écoutez. Quel mot entendez-vous ?', 'tối — le soir', ['tôi — je', 'túi — le sac'],
      "« Tối » monte, « tôi » reste plat. Les deux reviennent sans cesse : « tối nay tôi đi » = ce soir, je pars.", 'tối'),
    quiz('Écoutez. Quel mot entendez-vous ?', 'đá — la glace', ['đã — (marque du passé)', 'đau — avoir mal'],
      "« Đá » monte franchement ; « đã » monte aussi, mais avec une cassure. « Trà đá » = thé glacé.", 'đá'),
    quiz('Écoutez. Quel mot entendez-vous ?', 'trả — payer', ['trà — le thé', 'trái — gauche'],
      "« Trả » descend puis remonte, « trà » descend seulement. « Trả tiền » = payer ; « trà đá » = thé glacé.", 'trả'),
    quiz('Écoutez. Quel mot entendez-vous ?', 'rẻ — pas cher', ['rẽ — tourner', 'rau — légumes'],
      "« Rẻ » se creuse, « rẽ » se brise. Au marché, c'est « rẻ » que vous voulez entendre.", 'rẻ'),
    quiz('Écoutez. Quel mot entendez-vous ?', 'chợ — le marché', ['chờ — attendre', 'cho — donner'],
      "« Chợ » tombe et s'arrête net, « chờ » descend en douceur, « cho » reste plat. Trois mots du quotidien.", 'chợ'),
    quiz('Écoutez. Quel mot entendez-vous ?', 'đâu — où', ['đau — avoir mal', 'đầu — la tête'],
      "Ici le ton ne suffit pas : « đâu » et « đau » sont tous deux plats, c'est la voyelle qui change. « Đau đầu » = mal à la tête.", 'đâu'),
    quiz('Écoutez. Quel mot entendez-vous ?', 'bà — madame', ['ba — trois', 'bò — le bœuf'],
      "« Bà » descend, « ba » reste plat. Appeler une dame âgée « trois » fait sourire, sans plus.", 'bà'),
    quiz('Écoutez. Quel mot entendez-vous ?', 'mười — dix', ['mươi — (dizaine)', 'một — un'],
      "« Mười » descend : c'est dix tout seul. « Mươi », plat, forme les dizaines : « hai mươi » = vingt.", 'mười'),
    quiz('Écoutez. Quel mot entendez-vous ?', 'con — enfant', ['còn — et (toi) ?', 'cơm — le riz'],
      "« Con » est plat, « còn » descend. « Còn bạn? » = et toi ?", 'con'),
    quiz('Écoutez. Quel mot entendez-vous ?', 'mưa — la pluie', ['mua — acheter', 'muốn — vouloir'],
      "Même ton plat pour « mưa » et « mua » : seule la voyelle change, le « ư » se disant lèvres étirées.", 'mưa'),
  ],
}

// --- Les prix à l'oreille ----------------------------------------------------

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']

/** Un nombre de 1 à 999 en toutes lettres, avec ses irrégularités. */
export function viNumber(n: number): string {
  if (n < 10) return DIGITS[n]
  if (n < 20) {
    const u = n % 10
    return u === 0 ? 'mười' : `mười ${u === 5 ? 'lăm' : DIGITS[u]}`
  }
  if (n < 100) {
    const u = n % 10
    const tens = `${DIGITS[Math.floor(n / 10)]} mươi`
    if (u === 0) return tens
    return `${tens} ${u === 1 ? 'mốt' : u === 5 ? 'lăm' : DIGITS[u]}`
  }
  const rest = n % 100
  const hundreds = `${DIGITS[Math.floor(n / 100)]} trăm`
  if (rest === 0) return hundreds
  return `${hundreds} ${rest < 10 ? `linh ${DIGITS[rest]}` : viNumber(rest)}`
}

/** Un prix en dongs, donné en milliers, tel qu'on l'annonce. */
function price(thousands: number): SpokenNumber {
  const millions = Math.floor(thousands / 1000)
  const rest = thousands % 1000
  const text = [
    millions ? `${viNumber(millions)} triệu` : '',
    rest ? `${viNumber(rest)} nghìn` : '',
  ]
    .filter(Boolean)
    .join(' ')
  return { text, value: thousands * 1000 }
}

export const pricesLesson: LessonSource = {
  title: "Les prix à l'oreille",
  words: [
    ['lăm', 'cinq (après une dizaine)', '15 = mười lăm, 25 = hai mươi lăm. Jamais « năm » à cette place.'],
    ['mốt', 'un (après vingt, trente…)', '21 = hai mươi mốt. Mais 11 reste « mười một ».'],
    ['linh', 'zéro intercalé (cent cinq)', '105 = một trăm linh năm. Au sud : « lẻ ».'],
    ['triệu', 'million', "Un million de dongs vaut une trentaine d'euros : le mot sert tous les jours, pour une chambre ou un billet."],
  ],
  phrases: [
    ['Hai mươi lăm nghìn đồng.', 'Vingt-cinq mille dongs.'],
    ['Ba mươi mốt nghìn.', 'Trente et un mille.'],
    ['Một triệu đồng.', 'Un million de dongs.'],
    ['Một trăm linh năm nghìn.', 'Cent cinq mille.'],
    ['Mười lăm nghìn đồng.', 'Quinze mille dongs.'],
    ['Hai triệu đồng.', 'Deux millions de dongs.'],
  ],
  quizzes: [
    quiz('Le vendeur dit simplement « ba mươi ». Il annonce :', '30 000 dongs', ['30 dongs', '300 000 dongs'],
      "À l'oral, « nghìn » saute presque toujours : les prix se comptent en milliers. « Ba mươi » pour un café, c'est 30 000."),
    quiz('On vous annonce « một trăm rưỡi ». C\'est :', '150 000 dongs', ['100 000 dongs', '105 000 dongs'],
      "« Rưỡi » veut dire « et demi » : cent et demi, soit 150 000. De même « hai triệu rưỡi » = 2 500 000."),
  ],
  numbers: [
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 75, 80, 90, 100, 105,
    120, 150, 180, 200, 250, 300, 350, 400, 500, 21, 31, 65, 85, 95, 1000,
    1500, 2000,
  ].map(price),
}

// --- Marchander --------------------------------------------------------------

export const bargainLesson: LessonSource = {
  title: 'Marchander',
  words: [
    ['giá', 'prix'],
    ['giảm giá', 'faire une réduction ; rabais'],
    ['thôi', 'tant pis, laisse tomber ; ça suffit', "Dit en s'éloignant, c'est souvent ce qui fait baisser le prix."],
    ['nếu', 'si'],
    ['thì', 'alors (après « si »)', '« Nếu… thì… » = si… alors…'],
    ['đồng ý', "être d'accord, marché conclu"],
  ],
  phrases: [
    ['Giá bao nhiêu?', 'Quel est le prix ?'],
    ['Giảm giá được không?', 'Vous pouvez faire une réduction ?'],
    ['Đắt quá, thôi.', 'Trop cher, tant pis.'],
    ['Nếu tôi mua hai cái thì bao nhiêu?', "Si j'en achète deux, c'est combien ?"],
    ['Năm mươi nghìn được không?', 'Cinquante mille, ça va ?'],
    ['Đồng ý, tôi lấy cái này.', "D'accord, je prends ça."],
    ['Hai cái thì rẻ hơn.', "Deux, c'est moins cher."],
  ],
  quizzes: [
    quiz('Le vendeur annonce un prix trop élevé. Votre première réponse :', 'Đắt quá!', ['Đồng ý.', 'Ngon quá!'],
      "« Đắt quá! », dit avec le sourire, ouvre la négociation. Sur un marché touristique, le premier prix est souvent le double du prix final."),
    quiz('Vous proposez votre propre prix :', 'Một trăm nghìn được không?', ['Một trăm nghìn là gì?', 'Một trăm nghìn ở đâu?'],
      "Un prix suivi de « được không? » : c'est possible ? Proposez franchement moins que ce que vous êtes prêt à payer."),
    quiz('Le prix ne baisse plus et vous renoncez :', 'Thôi, cảm ơn.', ['Xin lỗi, tôi không hiểu.', 'Tính tiền!'],
      "« Thôi, cảm ơn », puis on s'éloigne sans se fâcher. Si le vendeur peut faire mieux, il vous rappelle."),
  ],
}

// --- Dialogues ---------------------------------------------------------------

export const restaurantDialogue: LessonSource = {
  title: 'Dialogue : au restaurant',
  words: [],
  phrases: [],
  dialogue: [
    A('Xin chào! Bạn muốn ăn gì?', 'Bonjour ! Vous voulez manger quoi ?'),
    B('Cho tôi một phở bò.', 'Donnez-moi un phở au bœuf.'),
    A('Bạn muốn uống gì?', 'Vous voulez boire quoi ?'),
    B('Một trà đá. Phở cay không?', 'Un thé glacé. Le phở est épicé ?'),
    A('Không cay lắm.', 'Pas très épicé.'),
    B('Ngon quá! Xin lỗi, tính tiền!', "C'est trop bon ! Excusez-moi, l'addition !"),
    A('Năm mươi nghìn đồng.', 'Cinquante mille dongs.'),
    B('Cảm ơn, tạm biệt!', 'Merci, au revoir !'),
  ],
  quizzes: [
    quiz('Que commande le client ?', 'un phở au bœuf', ['du riz au poulet', 'un sandwich'],
      '« Cho tôi một phở bò » : donnez-moi un phở au bœuf.', 'Cho tôi một phở bò.'),
    quiz('Que boit-il ?', 'un thé glacé', ['un café au lait', 'une bière'],
      '« Một trà đá » : un thé glacé, servi partout pour quelques milliers de dongs.', 'Một trà đá.'),
    quiz('Le phở est-il épicé ?', 'pas très', ['beaucoup trop', 'pas du tout'],
      '« Không cay lắm » : pas très épicé. « Lắm » après un adjectif renforce, et « không… lắm » atténue.', 'Không cay lắm.'),
    quiz('Combien paie-t-il ?', '50 000 dongs', ['15 000 dongs', '500 000 dongs'],
      '« Năm mươi nghìn đồng » : cinq dizaines de mille. « Mươi » marque la dizaine.', 'Năm mươi nghìn đồng.'),
    quiz('On vous demande « Bạn muốn uống gì? ». Que répondre ?', 'Cho tôi một bia.', ['Tôi là người Pháp.', 'Không cay.'],
      'La question porte sur la boisson : « uống » = boire. On répond par « Cho tôi… ».', 'Bạn muốn uống gì?'),
  ],
}

export const marketDialogue: LessonSource = {
  title: 'Dialogue : au marché',
  words: [],
  phrases: [],
  dialogue: [
    B('Cái này bao nhiêu tiền?', 'Ça coûte combien ?'),
    A('Hai trăm nghìn đồng.', 'Deux cent mille dongs.'),
    B('Đắt quá! Giảm giá được không?', "C'est trop cher ! Vous pouvez faire une réduction ?"),
    A('Một trăm tám mươi nghìn.', 'Cent quatre-vingt mille.'),
    B('Nếu tôi mua hai cái thì bao nhiêu?', "Si j'en achète deux, c'est combien ?"),
    A('Hai cái thì ba trăm nghìn.', "Deux, c'est trois cent mille."),
    B('Đồng ý, tôi lấy hai cái.', "D'accord, j'en prends deux."),
    A('Cảm ơn bạn.', 'Merci à vous.'),
  ],
  quizzes: [
    quiz('Quel est le premier prix annoncé ?', '200 000 dongs', ['20 000 dongs', '120 000 dongs'],
      '« Hai trăm nghìn » : deux centaines de mille.', 'Hai trăm nghìn đồng.'),
    quiz('Après la première réduction, le prix est de :', '180 000 dongs', ['108 000 dongs', '150 000 dongs'],
      '« Một trăm tám mươi nghìn » : cent, huit dizaines. 108 000 se dirait « một trăm linh tám ».', 'Một trăm tám mươi nghìn.'),
    quiz('Combien coûtent les deux ?', '300 000 dongs', ['360 000 dongs', '200 000 dongs'],
      '« Hai cái thì ba trăm nghìn » : soit 150 000 pièce, au lieu de 200 000 au départ.', 'Hai cái thì ba trăm nghìn.'),
    quiz("Que fait l'acheteur à la fin ?", 'il en prend deux', ['il renonce', 'il en prend un seul'],
      '« Đồng ý, tôi lấy hai cái » : d\'accord, j\'en prends deux.', 'Đồng ý, tôi lấy hai cái.'),
    quiz('Le vendeur dit « Hai trăm nghìn ». Que répondre pour négocier ?', 'Đắt quá! Giảm giá được không?', ['Đồng ý, cảm ơn.', 'Ngon lắm!'],
      'On commence par trouver ça trop cher, puis on demande la réduction.', 'Hai trăm nghìn.'),
  ],
}

export const taxiDialogue: LessonSource = {
  title: 'Dialogue : en taxi-moto',
  words: [],
  phrases: [],
  dialogue: [
    A('Bạn đi đâu?', 'Vous allez où ?'),
    B('Tôi muốn đi khách sạn Hà Nội.', "Je veux aller à l'hôtel Hanoï."),
    B('Có xa không?', "C'est loin ?"),
    A('Không xa lắm. Năm mươi nghìn.', 'Pas très loin. Cinquante mille.'),
    B('Bốn mươi nghìn được không?', 'Quarante mille, ça va ?'),
    A('Được.', "D'accord."),
    B('Đi thẳng, rẽ phải ở đây.', 'Tout droit, à droite ici.'),
    B('Dừng ở đây. Cảm ơn!', 'Arrêtez-vous ici. Merci !'),
  ],
  quizzes: [
    quiz('Où veut aller le voyageur ?', "à l'hôtel", ["à l'aéroport", 'au marché'],
      '« Khách sạn » = hôtel. « Sân bay » serait l\'aéroport, « chợ » le marché.', 'Tôi muốn đi khách sạn Hà Nội.'),
    quiz('Quel prix demande le chauffeur ?', '50 000 dongs', ['40 000 dongs', '15 000 dongs'],
      '« Năm mươi nghìn » : cinquante mille. C\'est le voyageur qui propose ensuite quarante.', 'Không xa lắm. Năm mươi nghìn.'),
    quiz('Sur quel prix se mettent-ils d\'accord ?', '40 000 dongs', ['50 000 dongs', '45 000 dongs'],
      '« Bốn mươi nghìn được không? — Được. » Le chauffeur accepte la contre-proposition.', 'Bốn mươi nghìn được không?'),
    quiz('Quelle direction donne-t-il ?', 'tout droit, puis à droite', ['à gauche, puis tout droit', 'tout droit, puis à gauche'],
      '« Đi thẳng, rẽ phải » : « phải » = droite, « trái » = gauche.', 'Đi thẳng, rẽ phải ở đây.'),
    quiz('Le chauffeur demande « Bạn đi đâu? ». Que répondre ?', 'Tôi muốn đi sân bay.', ['Tôi tên là Paul.', 'Bốn mươi nghìn.'],
      '« Đi đâu? » = aller où ? On répond par « Tôi muốn đi… » suivi du lieu.', 'Bạn đi đâu?'),
  ],
}

export const hotelDialogue: LessonSource = {
  title: "Dialogue : à l'hôtel",
  words: [],
  phrases: [],
  dialogue: [
    B('Xin chào, có phòng không?', 'Bonjour, vous avez une chambre ?'),
    A('Có. Bạn ở bao nhiêu đêm?', 'Oui. Vous restez combien de nuits ?'),
    B('Ba đêm. Phòng bao nhiêu tiền một đêm?', 'Trois nuits. La chambre coûte combien par nuit ?'),
    A('Bốn trăm nghìn đồng một đêm.', 'Quatre cent mille dongs par nuit.'),
    B('Phòng có máy lạnh không?', 'La chambre a la climatisation ?'),
    A('Có. Phòng rất sạch.', 'Oui. La chambre est très propre.'),
    B('Được. Mật khẩu wifi là gì?', "D'accord. Quel est le mot de passe du wifi ?"),
    A('Đây là chìa khóa phòng.', 'Voici la clé de la chambre.'),
  ],
  quizzes: [
    quiz('Combien de nuits reste le voyageur ?', 'trois', ['deux', 'quatre'],
      '« Ba đêm » : trois nuits. « Đêm » = nuit, « ngày » = jour.', 'Ba đêm.'),
    quiz('Quel est le prix par nuit ?', '400 000 dongs', ['40 000 dongs', '4 000 000 dongs'],
      '« Bốn trăm nghìn » : quatre centaines de mille. Quatre millions se dirait « bốn triệu ».', 'Bốn trăm nghìn đồng một đêm.'),
    quiz('La chambre a-t-elle la climatisation ?', 'oui', ['non', 'on ne sait pas'],
      'À « Phòng có máy lạnh không? », on répond « Có » : oui, il y en a.', 'Có. Phòng rất sạch.'),
    quiz('Que demande-t-il en dernier ?', 'le mot de passe du wifi', ['une serviette', "l'heure du petit-déjeuner"],
      '« Mật khẩu wifi là gì? » : quel est le mot de passe du wifi ?', 'Mật khẩu wifi là gì?'),
    quiz('On vous demande « Bạn ở bao nhiêu đêm? ». Que répondre ?', 'Hai đêm.', ['Hai trăm nghìn.', 'Tôi ở Pháp.'],
      '« Bao nhiêu đêm » = combien de nuits : on répond par un nombre et « đêm ».', 'Bạn ở bao nhiêu đêm?'),
  ],
}

export const meetingDialogue: LessonSource = {
  title: 'Dialogue : faire connaissance',
  words: [],
  phrases: [],
  dialogue: [
    A('Chào anh! Anh tên là gì?', 'Bonjour ! Comment vous appelez-vous ?'),
    B('Tôi tên là Paul. Còn chị?', "Je m'appelle Paul. Et vous ?"),
    A('Tôi tên là Lan. Anh là người nước nào?', "Je m'appelle Lan. Vous êtes de quel pays ?"),
    B('Tôi là người Pháp. Tôi đi du lịch.', 'Je suis français. Je voyage.'),
    A('Anh bao nhiêu tuổi?', 'Vous avez quel âge ?'),
    B('Tôi ba mươi tuổi.', "J'ai trente ans."),
    A('Anh thích Việt Nam không?', 'Vous aimez le Vietnam ?'),
    B('Tôi yêu Việt Nam. Phở ngon lắm!', "J'adore le Vietnam. Le phở est vraiment bon !"),
  ],
  quizzes: [
    quiz("Comment s'appelle la femme ?", 'Lan', ['Mai', 'Paul'],
      '« Tôi tên là Lan » : mon nom est Lan.', 'Tôi tên là Lan. Anh là người nước nào?'),
    quiz("D'où vient le voyageur ?", 'de France', ['du Vietnam', "d'Angleterre"],
      '« Người Pháp » : personne de France, donc français.', 'Tôi là người Pháp. Tôi đi du lịch.'),
    quiz('Que fait-il au Vietnam ?', 'il voyage', ['il étudie', 'il travaille'],
      '« Đi du lịch » = voyager. Étudier se dirait « học », travailler « làm ».', 'Tôi là người Pháp. Tôi đi du lịch.'),
    quiz('Quel âge a-t-il ?', 'trente ans', ['treize ans', 'vingt-trois ans'],
      '« Ba mươi tuổi » : trois dizaines. Treize se dirait « mười ba ».', 'Tôi ba mươi tuổi.'),
    quiz('On vous demande « Anh là người nước nào? ». Que répondre ?', 'Tôi là người Pháp.', ['Tôi ba mươi tuổi.', 'Tôi tên là Paul.'],
      '« Người nước nào » = de quel pays : la question la plus posée aux voyageurs, avec l\'âge.', 'Anh là người nước nào?'),
  ],
}
