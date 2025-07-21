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
    { givenName: "Михаэль",      familyName: "Шумахер",      nationality: "German",        titles: 7, team: "Ferrari"    },
    { givenName: "Льюис",        familyName: "Хэмилтон",     nationality: "British",       titles: 7, team: "Mercedes"   },
    { givenName: "Хуан Мануэль", familyName: "Фанхио",       nationality: "Argentinian",   titles: 5, team: "Maserati"   },
    { givenName: "Ален",         familyName: "Прост",        nationality: "French",        titles: 4, team: "Williams"   },
    { givenName: "Себастьян",    familyName: "Феттель",      nationality: "German",        titles: 4, team: "Red Bull"   },
    { givenName: "Макс",         familyName: "Ферстаппен",   nationality: "Dutch",         titles: 4, team: "Red Bull"   },
    { givenName: "Джек",         familyName: "Брэбем",       nationality: "Australian",    titles: 3, team: "Brabham"    },
    { givenName: "Джеки",        familyName: "Стюарт",       nationality: "British",       titles: 3, team: "Tyrrell"    },
    { givenName: "Ники",         familyName: "Лауда",        nationality: "Austrian",      titles: 3, team: "McLaren"    },
    { givenName: "Нельсон",      familyName: "Пике",         nationality: "Brazilian",     titles: 3, team: "Williams"   },
    { givenName: "Айртон",       familyName: "Сенна",        nationality: "Brazilian",     titles: 3, team: "McLaren"    },
    { givenName: "Альберто",     familyName: "Аскари",       nationality: "Italian",       titles: 2, team: "Ferrari"    },
    { givenName: "Джим",         familyName: "Кларк",        nationality: "British",       titles: 2, team: "Lotus"      },
    { givenName: "Грэм",         familyName: "Хилл",         nationality: "British",       titles: 2, team: "Lotus"      },
    { givenName: "Эмерсон",      familyName: "Фиттипальди",  nationality: "Brazilian",     titles: 2, team: "McLaren"    },
    { givenName: "Мика",         familyName: "Хёркинен",     nationality: "Finnish",       titles: 2, team: "McLaren"    },
    { givenName: "Фернандо",     familyName: "Алонсо",       nationality: "Spanish",       titles: 2, team: "Renault"    },
    { givenName: "Джузеппе",     familyName: "Фарина",       nationality: "Italian",       titles: 1, team: "Alfa Romeo" },
    { givenName: "Майк",         familyName: "Хоторн",       nationality: "British",       titles: 1, team: "Ferrari"    },
    { givenName: "Фил",          familyName: "Хилл",         nationality: "American",      titles: 1, team: "Ferrari"    },
    { givenName: "Джон",         familyName: "Сёртис",       nationality: "British",       titles: 1, team: "Ferrari"    },
    { givenName: "Дэнни",        familyName: "Халм",         nationality: "New Zealander", titles: 1, team: "Brabham"    },
    { givenName: "Иохен",        familyName: "Риндт",        nationality: "Austrian",      titles: 1, team: "Lotus"      },
    { givenName: "Джеймс",       familyName: "Хант",         nationality: "British",       titles: 1, team: "McLaren"    },
    { givenName: "Марио",        familyName: "Андретти",     nationality: "American",      titles: 1, team: "Lotus"      },
    { givenName: "Джоди",        familyName: "Шектер",       nationality: "South African", titles: 1, team: "Ferrari"    },
    { givenName: "Алан",         familyName: "Джонс",        nationality: "Australian",    titles: 1, team: "Williams"   },
    { givenName: "Кеке",         familyName: "Росберг",      nationality: "Finnish",       titles: 1, team: "Williams"   },
    { givenName: "Найджел",      familyName: "Мэнселл",      nationality: "British",       titles: 1, team: "Williams"   },
    { givenName: "Дэймон",       familyName: "Хилл",         nationality: "British",       titles: 1, team: "Williams"   },
    { givenName: "Жак",          familyName: "Вильнёв",      nationality: "Canadian",      titles: 1, team: "Williams"   },
    { givenName: "Дженсон",      familyName: "Баттон",       nationality: "British",       titles: 1, team: "Brawn GP"   },
    { givenName: "Нико",         familyName: "Росберг",      nationality: "German",        titles: 1, team: "Mercedes"   }
  ];
  
  