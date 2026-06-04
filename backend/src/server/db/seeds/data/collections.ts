export const collectionsData = [
  {
    userKey: 'oksana_k',
    title: 'Українська класика, яку треба прочитати',
    description:
      'Моя особиста підбірка найкращих творів української класичної літератури. Ці книги формують наше розуміння України, її історії та культури. Обов\'язково до прочитання для кожного українця!',
    isPublic: true,
    bookKeys: ['kobzar', 'lisova_pisnya', 'tini_zabutykh_predkiv', 'kaidasheva_simya', 'zakhar_berkut'],
  },
  {
    userKey: 'andriy_m',
    title: 'Антиутопії та екзистенціалізм',
    description:
      'Збірка найвпливовіших антиутопічних романів та екзистенціальної прози XX століття. Орвелл, Кафка, Камю — автори, які попередили нас про небезпеки тоталітаризму та абсурду існування. Актуально завжди.',
    isPublic: true,
    bookKeys: ['1984', 'skotoferma', 'peretvorennya', 'chuma', 'staryi_i_more'],
  },
  {
    userKey: 'yulia_t',
    title: 'Сучасна українська проза: must-read',
    description:
      'Найкращі твори сучасних українських письменників. Жадан, Забужко, Андрухович — ці автори визначають обличчя нової української літератури. Читайте і пишайтеся!',
    isPublic: true,
    bookKeys: ['internat', 'voroshylovhrad', 'polovi_doslidzhennya', 'perverziia', 'mesopotamiia'],
  },
  {
    userKey: 'maria_s',
    title: 'Поезія, яка зігріває душу',
    description:
      'Моя підбірка найкращих поетичних творів. Від Шевченка до Стуса — поезія, яка торкається серця. Читайте повільно, вдумливо, і ви відкриєте для себе нові світи.',
    isPublic: true,
    bookKeys: ['kobzar', 'haidamaky', 'lisova_pisnya', 'palimpsesty'],
  },
  {
    userKey: 'dmytro_l',
    title: 'Книги для саморозвитку',
    description:
      'Підбірка книг, які допомогли мені змінити життя. Від класики психології до сучасних бестселерів. Практичні поради, наукове обґрунтування, реальні результати.',
    isPublic: true,
    bookKeys: ['atomni_zvychky', 'zlochyn_i_kara', 'chomu_ya_ne_feminist'],
  },
];

export interface CollectionSeedEntry {
  userKey: string;
  title: string;
  description: string;
  isPublic: boolean;
  bookKeys: string[];
}
