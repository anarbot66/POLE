// constants.js
export const driverTranslations = {
    "Verstappen": "Макс Ферстаппен",
    "Norris": "Ландо Норрис",
    "Leclerc": "Шарль Леклер",
    "Piastri": "Оскар Пиастри",
    "Sainz": "Карлос Сайнс",
    "Russell": "Джордж Расселл",
    "Hamilton": "Льюис Хэмилтон",
    "Pérez": "Серхио Перес",
    "Alonso": "Фернандо Алонсо",
    "Gasly": "Пьер Гасли",
    "Hulkenberg": "Нико Хюлькенберг",
    "Tsunoda": "Юки Цунода",
    "Stroll": "Лэнс Стролл",
    "Ocon": "Эстебан Окон",
    "Magnussen": "Кевин Магнуссен",
    "Albon": "Александер Албон",
    "Ricciardo": "Даниэль Риккьярдо",
    "Bearman": "Оливер Бирман",
    "Colapinto": "Франко Колапинто",
    "Zhou": "Гуанью Джоу",
    "Lawson": "Лиам Лоусон",
    "Bottas": "Валттери Боттас",
    "Sargeant": "Логан Сарджент",
    "Doohan": "Джек Дуэн",
    "Antonelli": "Кими Антонелли",
    "Bortoleto": "Габриэль Бортолето",
    "Hadjar": "Исак Хаджар",
    "Hülkenberg" : "Нико Хюлькенберг",
  };

  export const driverSurnames = {
    "Verstappen": "М. Ферстаппен",
    "Norris": "Л. Норрис",
    "Leclerc": "Ш. Леклер",
    "Piastri": "О. Пиастри",
    "Sainz": "К. Сайнс",
    "Russell": "Д. Расселл",
    "Hamilton": "Л. Хэмилтон",
    "Pérez": "С. Перес",
    "Alonso": "Ф. Алонсо",
    "Gasly": "П. Гасли",
    "Hulkenberg": "Н. Хюлькенберг",
    "Tsunoda": "Ю. Цунода",
    "Stroll": "Л. Стролл",
    "Ocon": "Э. Окон",
    "Magnussen": "К. Магнуссен",
    "Albon": "А. Албон",
    "Ricciardo": "Д. Риккьярдо",
    "Bearman": "О. Бирман",
    "Colapinto": "Ф. Колапинто",
    "Zhou": "Г. Джоу",
    "Lawson": "Л. Лоусон",
    "Bottas": "В. Боттас",
    "Sargeant": "Л. Сарджент",
    "Doohan": "Д. Дуэн",
    "Antonelli": "К. Антонелли",
    "Bortoleto": "Г. Бортолето",
    "Hadjar": "И. Хаджар",
    "Hülkenberg" : "Н. Хюлькенберг",
  };
  
  export const teamColors = {
    "McLaren": "#F48021",
    "Ferrari": "#FF0000",
    "Red Bull": "#2546FF",
    "Mercedes": "#00A19C",
    "Aston Martin": "#00594F",
    "Alpine F1 Team": "#F60195",
    "Haas F1 Team": "#8B8B8B",
    "RB F1 Team": "#1434CB",
    "Williams": "#00A3E0",
    "Sauber": "#00E701"
  };
  
  export const driverToConstructor = {
    "verstappen": "Red Bull",
    "norris": "McLaren",
    "leclerc": "Ferrari",
    "piastri": "McLaren",
    "russell": "Mercedes",
    "hamilton": "Ferrari",
    "lawson": "Red Bull",
    "alonso": "Aston Martin",
    "gasly": "Alpine F1 Team",
    "hulkenberg": "Sauber",
    "tsunoda": "RB F1 Team",
    "stroll": "Aston Martin",
    "ocon": "Haas F1 Team",
    "bearman": "Haas F1 Team",
    "albon": "Williams",
    "sainz": "Williams",
    "hadjar": "RB F1 Team",
    "bortoleto": "Sauber",
    "antonelli": "Mercedes",
    "doohan": "Alpine F1 Team"
  };
  
  export const nationalityToFlag = {
    "British": "gb",
    "Dutch": "nl",
    "Spanish": "es",
    "Monegasque": "mc",
    "Mexican": "mx",
    "French": "fr",
    "German": "de",
    "Finnish": "fi",
    "Australian": "au",
    "Canadian": "ca",
    "Japanese": "jp",
    "Danish": "dk",
    "Chinese": "cn",
    "Thai": "th",
    "American": "us",
    "Brazilian": "br",
    "Italian": "it",
    "Austrian": "at",
    "Swiss": "ch",
    "New Zealander": "nz",
    "Argentinian": "ar",
    "South African": "za"
  };
  
  // Утилиты для нормализации и форматирования имен
  export const normalizeName = (name) => {
    if (name === "Magnussen") return "kevin_magnussen";
    if (name === "verstappen") return "max_verstappen";
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };
  
  export const formatDriverName = (key) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  export const countryToFlag = {
    "Bahrain": "bh", "Saudi Arabia": "sa", "Australia": "au", "Japan": "jp",
    "China": "cn", "USA": "us", "United States": "us", "Miami": "us",
    "Italy": "it", "Monaco": "mc", "Canada": "ca", "Spain": "es",
    "Austria": "at", "Great Britain": "gb", "United Kingdom": "gb", "UK": "gb",
    "Hungary": "hu", "Belgium": "be", "Netherlands": "nl", "Singapore": "sg",
    "Mexico": "mx", "Brazil": "br", "Las Vegas": "us", "UAE": "ae",
    "Qatar": "qa", "Azerbaijan": "az"
  };
  
  // Перевод названий гонок
  export const raceNameTranslations = {
    "Bahrain Grand Prix": "Бахрейн",
    "Saudi Arabian Grand Prix": "Саудовская Аравия",
    "Australian Grand Prix": "Австралия",
    "Japanese Grand Prix": "Япония",
    "Chinese Grand Prix": "Китай",
    "Miami Grand Prix": "Майами",
    "Emilia Romagna Grand Prix": "Эмилия-Романья",
    "Monaco Grand Prix": "Монако",
    "Canadian Grand Prix": "Канада",
    "Spanish Grand Prix": "Испания",
    "Austrian Grand Prix": "Австрия",
    "British Grand Prix": "Великобритания",
    "Hungarian Grand Prix": "Венгрия",
    "Belgian Grand Prix": "Бельгия",
    "Dutch Grand Prix": "Нидерланды",
    "Italian Grand Prix": "Италия",
    "Azerbaijan Grand Prix": "Азербайджан",
    "Singapore Grand Prix": "Сингапур",
    "United States Grand Prix": "США",
    "Mexico City Grand Prix": "Мексика",
    "São Paulo Grand Prix": "Бразилия",
    "Las Vegas Grand Prix": "Лас-Вегас",
    "Qatar Grand Prix": "Катар",
    "Abu Dhabi Grand Prix": "Абу-Даби"
  };
  
  // Функция форматирования даты в "7 марта"
  export const formatRaceWeekend = (firstPracticeDate, raceDate) => {
    const months = [
      "Января", "Февраля", "Марта", "Апреля", "Мая", "Июня",
      "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"
    ];
    const startDate = new Date(firstPracticeDate);
    return `${startDate.getDate()} ${months[startDate.getMonth()]}`;
  };
  