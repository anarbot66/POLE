import { useState, useEffect } from "react";

const getFormattedDate = () => {
  const now = new Date();
  const day = now.getDate();
  const monthNames = [
    "января", "февраля", "марта", "апреля", "мая", "июня", 
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];
  const month = monthNames[now.getMonth()]; // Используем правильный месяц
  const year = now.getFullYear();
  
  return `${day} ${month} ${year}`;
};

const ConstructorsList = ({ onConstructorSelect }) => {
  const [constructors, setConstructors] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);
  const formattedDate = getFormattedDate();
  

  // Цвета команд
  const teamColors = {
    "McLaren": "#F48021",
    "Ferrari": "#FF0000",
    "Red Bull": "#001690",
    "Mercedes": "#00A19C",
    "Aston Martin": "#00594F",
    "Alpine F1 Team": "#0078C1",
    "Haas F1 Team": "#8B8B8B",
    "RB F1 Team": "#1434CB",
    "Williams": "#00A3E0",
    "Sauber": "#00E701",
  };

  // Словарь для перевода имен пилотов на русский
  const driverTranslations = {
    "Max Verstappen": "Макс Ферстаппен",
    "Lando Norris": "Ландо Норрис",
    "Charles Leclerc": "Шарль Леклер",
    "Oscar Piastri": "Оскар Пиастри",
    "Carlos Sainz": "Карлос Сайнс",
    "George Russell": "Джордж Расселл",
    "Lewis Hamilton": "Льюис Хэмилтон",
    "Sergio Pérez": "Серхио Перес",
    "Fernando Alonso": "Фернандо Алонсо",
    "Pierre Gasly": "Пьер Гасли",
    "Nico Hülkenberg": "Нико Хюлькенберг",
    "Yuki Tsunoda": "Юки Цунода",
    "Lance Stroll": "Лэнс Стролл",
    "Esteban Ocon": "Эстебан Окон",
    "Kevin Magnussen": "Кевин Магнуссен",
    "Alexander Albon": "Александер Албон",
    "Daniel Ricciardo": "Даниэль Риккьярдо",
    "Oliver Bearman": "Оливер Бирман",
    "Franco Colapinto": "Франко Колапинто",
    "Guanyu Zhou": "Гуанью Джоу",
    "Liam Lawson": "Лиам Лоусон",
    "Valtteri Bottas": "Валттери Боттас",
    "Logan Sargeant": "Логан Сарджент",
    "Jack Doohan": "Джек Дуэн",
  };

  // Функция для получения данных по конструкторам
  const fetchConstructors = async () => {
    try {
      const response = await fetch('https://api.jolpi.ca/ergast/f1/2024/constructorstandings.json');
      if (!response.ok) {
        throw new Error("Не удалось получить данные о конструкторах");
      }
      const data = await response.json();
      const constructorData = data?.MRData?.StandingsTable?.StandingsLists[0]?.ConstructorStandings;
      if (constructorData && Array.isArray(constructorData)) {
        setConstructors(constructorData);
      } else {
        throw new Error("Данные о конструкторах отсутствуют или имеют неверный формат");
      }
    } catch (error) {
      console.error("Ошибка при получении данных о конструкторах:", error);
      setError("Ошибка при получении данных о конструкторах");
    }
  };

  // Функция для получения данных о пилотах
  const fetchDrivers = async () => {
    try {
      const response = await fetch('https://api.jolpi.ca/ergast/f1/2024/driverstandings.json');
      if (!response.ok) {
        throw new Error("Не удалось получить данные о пилотах");
      }
      const data = await response.json();
      const driverData = data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings;
      if (driverData && Array.isArray(driverData)) {
        setDrivers(driverData);
      } else {
        throw new Error("Данные о пилотах отсутствуют или имеют неверный формат");
      }
    } catch (error) {
      console.error("Ошибка при получении данных о пилотах:", error);
      setError("Ошибка при получении данных о пилотах");
    }
  };

  useEffect(() => {
    fetchConstructors();
    fetchDrivers();
  }, []);

  // Возвращаем ошибку, если она возникла
  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  // Убираем "Загрузка...", если данные загружены
  if (!constructors.length || !drivers.length) {
    return null; // Не показываем ничего, пока данные не загружены
  }

  return (
    <div style={{
      width: "calc(100% - 20px)", // Убираем отступы по бокам (слева и справа)
      margin: "0 auto", // Центрируем контейнер
      height: "100%",
      marginBottom: "100px",
      overflowY: "auto",
      paddingTop: "10px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      gap: "15px",
      backgroundColor: "#1D1D1F"
    }}>
      <div style={{
          width: "calc(100% - 20px)",
          margin: "0 auto",
          paddingTop: "10px",
          display: "flex",
          flexDirection: "column"
        }}>
        <h3 style={{ fontSize: "14px", color: "white", textAlign: "left", marginBottom: "10px"}}>
        {`Сегодня: ${formattedDate}`}
        </h3>
        <h4 style={{ fontSize: "12px", color: "lightgray" }}>
          Кликни по конструктору чтобы узнать подробнее
        </h4>
      </div>
      {constructors.map((constructor, index) => {
        const teamColor = teamColors[constructor.Constructor.name] || "#000000";
        
        // Получаем двух пилотов, принадлежащих этому конструктору
        const pilots = drivers.filter(driver => 
          driver.Constructors.some(c => c.name === constructor.Constructor.name)
        ).slice(0, 2); // Ограничиваем до двух пилотов

        // Переводим имена пилотов и объединяем их через `&`
        const pilotNames = pilots.map((pilot) => {
          const fullName = `${pilot.Driver.givenName} ${pilot.Driver.familyName}`; // Правильный порядок имени
          return driverTranslations[fullName] || fullName; // Если есть перевод, используем его
        }).join(' & ');

        return (
          <div key={index} onClick={() => onConstructorSelect(constructor)}>
            <div style={{
              width: "100%",
              background: "#212124",
              borderRadius: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              padding: "10px",
              cursor: "pointer"
            }}>
              <div style={{
                width: "65px", height: "65px", borderRadius: "20px",
                display: "flex", justifyContent: "center", alignItems: "center",
                background: "#212124"
              }}>
                <div style={{
                  color: teamColor,
                  fontSize: "24px", fontWeight: "600"
                }}>
                  {constructor.position}
                </div>
              </div>

              <div style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", flex: 1
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ color: "White", fontSize: "14px" }}>
                    {constructor.Constructor.name}
                  </div>
                </div>
                <div style={{
                  color: "#B9B9B9", // Серый цвет для имен пилотов
                  fontSize: "10px"
                }}>
                  {pilotNames} {/* Имена пилотов, разделённые & */}
                </div>
              </div>

              <div style={{ textAlign: "center", minWidth: "60px" }}>
                <span style={{ color: "white", fontSize: "16px" }}>
                  {constructor.points}
                </span>
                <br />
                <span style={{ color: "white", fontSize: "10px" }}>
                  PTS
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConstructorsList;
