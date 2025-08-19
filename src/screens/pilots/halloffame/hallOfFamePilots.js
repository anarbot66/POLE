// src/data/hallOfFamePilots.js

// Маппинги флагов
export const nationalityToFlag = {
    British:      "gb", // Lewis Hamilton, Jackie Stewart…
    Dutch:        "nl", // Max Verstappen
    Spanish:      "es", // Fernando Alonso
    Monegasque:   "mc", // (если появится)
    Mexican:      "mx", // (если появится)
    French:       "fr", // Alain Prost
    German:       "de", // Schumacher, Vettel, Rosberg
    Finnish:      "fi", // Häkkinen, Keke Rosberg
    Australian:   "au", // Jack Brabham, Alan Jones
    Canadian:     "ca", // Jacques Villeneuve
    Japanese:     "jp", // (если появится)
    Danish:       "dk", // (если появится)
    Chinese:      "cn", // (если появится)
    Thai:         "th", // (если появится)
    American:     "us", // Phil Hill, Mario Andretti
    Brazilian:    "br", // Senna, Piquet, Fittipaldi
    Italian:      "it", // Ascari, Farina
    Austrian:     "at", // Lauda, Rindt
    Swiss:        "ch", // (если появится)
    NewZealander: "nz", // Denny Hulme
    Argentinian:  "ar", // Juan Manuel Fangio
    SouthAfrican: "za", // Jody Scheckter
  };
  
  
  // Переводы фамилий
  export const driverTranslations = {
    Verstappen: "Макс Ферстаппен",
    Norris: "Ландо Норрис",
    Leclerc: "Шарль Леклер",
    Piastri: "Оскар Пиастри",
    Sainz: "Карлос Сайнс",
    Russell: "Джордж Расселл",
    Hamilton: "Льюис Хэмилтон",
    Pérez: "Серхио Перес",
    Alonso: "Фернандо Алонсо",
    Gasly: "Пьер Гасли",
    Hulkenberg: "Нико Хюлькенберг",
    Tsunoda: "Юки Цунода",
    Stroll: "Лэнс Стролл",
    Ocon: "Эстебан Окон",
    Magnussen: "Кевин Магнуссен",
    Albon: "Александер Албон",
    Ricciardo: "Даниэль Риккьярдо",
    Bearman: "Оливер Бирман",
    Colapinto: "Франко Колапинто",
    Zhou: "Гуанью Джоу",
    Lawson: "Лиам Лоусон",
    Bottas: "Валттери Боттас",
    Sargeant: "Логан Сарджент",
    Doohan: "Джек Дуэн",
    Antonelli: "Кими Антонелли",
    Bortoleto: "Габриэль Бортолето",
    Hadjar: "Исак Хаджар"
  };
  
  // Сам массив «Зала славы»
  export const hallOfFamePilots = [
    { givenName: "Михаэль",      familyName: "Шумахер",      nationality: "German",        titles: 7, team: "Ferrari", gp: 307, wins: 91, poles: 68, podiums: 155, pts: 1566, dnf: 68},
    { givenName: "Льюис",        familyName: "Хэмилтон",     nationality: "British",       titles: 7, team: "Mercedes", gp: 370, wins: 105, poles: 104, podiums: 202, pts: 4971.5, dnf: 32},
    { givenName: "Хуан Мануэль", familyName: "Фанхио",       nationality: "Argentinian",   titles: 5, team: "Maserati", gp: 51, wins: 24, poles: 29, podiums: 35, pts: 277.64, dnf: 14},
    { givenName: "Ален",         familyName: "Прост",        nationality: "French",        titles: 4, team: "Williams", gp: 199, wins: 51, poles: 33, podiums: 106, pts: 798.5, dnf: 59},
    { givenName: "Себастьян",    familyName: "Феттель",      nationality: "German",        titles: 4, team: "Red Bull", gp: 299, wins: 53, poles: 57, podiums: 122, pts: 3098, dnf: 44},
    { givenName: "Макс",         familyName: "Ферстаппен",   nationality: "Dutch",         titles: 4, team: "Red Bull", gp: 223, wins: 65, poles: 44, podiums: 117, pts: 3210.5, dnf: 33},
    { givenName: "Айртон",       familyName: "Сенна",        nationality: "Brazilian",     titles: 3, team: "McLaren", gp: 161, wins: 41, poles: 65, podiums: 80, pts: 614, dnf: 60},
    { givenName: "Ники",         familyName: "Лауда",        nationality: "Austrian",      titles: 3, team: "McLaren", gp: 171, wins: 25, poles: 24, podiums: 54, pts: 420.5, dnf: 80},
    { givenName: "Джим",         familyName: "Кларк",        nationality: "British",       titles: 2, team: "Lotus", gp: 72, wins: 25, poles: 33, podiums: 32, pts: 274, dnf: 28},
    { givenName: "Фернандо",      familyName: "Алонсо",     nationality: "Spanish",       titles: 2,   team: "Renault", gp: 415, wins: 32, poles: 22, podiums: 106, pts: 2363, dnf: 80},
  ];
  
  
  