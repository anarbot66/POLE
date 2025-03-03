import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

const teamColors = {
  "McLaren": "#F48021",
  "Ferrari": "#FF0000",
  "Red Bull": "#2546FF",
  "Mercedes": "#00A19C",
  "Aston Martin": "#00594F",
  "Alpine F1 Team": "#0078C1",
  "Haas F1 Team": "#8B8B8B",
  "RB F1 Team": "#1434CB",
  "Williams": "#00A3E0",
  "Sauber": "#00E701",
};

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

const nationalityToFlag = {
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
  "South African": "za",
};

// Функция для нормализации фамилии, аналогичная PilotsList
const normalizeName = (name) => {
  if (name === "Magnussen") {
    return "kevin_magnussen";
  } else if (name === "Verstappen") {
    return "max_verstappen";
  }
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const Profile = ({ currentUser }) => {
  const { uid } = useParams(); // Получаем uid из URL
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [favoritePilot, setFavoritePilot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followersCount, setFollowersCount] = useState(0); // New state for followers count

  useEffect(() => {
    const loadData = async () => {
      if (uid) {
        try {
          console.log("Fetching data for UID:", uid);
          if (currentUser && uid === currentUser.uid) {
            setProfileUser(currentUser);
            await loadFavorites(currentUser.uid);
          } else {
            await fetchUserAndFavorites(uid);
          }
          await fetchFollowersCount(uid); // Fetch followers count
        } catch (err) {
          setError("Ошибка загрузки данных");
          console.error("Error loading data:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [currentUser, uid]);

  // Загружает пользователя из Firestore и затем его избранного пилота
  const fetchUserAndFavorites = async (uid) => {
    try {
      const userQuery = query(collection(db, "users"), where("uid", "==", uid));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        console.log("Найден пользователь:", userData);
        setProfileUser(userData);
      } else {
        console.log("Пользователь не найден");
        setError("Пользователь не найден");
      }
      await loadFavorites(uid);
    } catch (err) {
      console.error("Ошибка загрузки пользователя:", err);
      setError("Ошибка загрузки пользователя");
    }
  };

  // Загружает избранное (любимого пилота) из Firestore и получает данные пилота по API
  const loadFavorites = async (uid) => {
    try {
      const favQuery = query(collection(db, "favorites"), where("userId", "==", uid));
      const favSnapshot = await getDocs(favQuery);
      if (!favSnapshot.empty) {
        // Если выбран только один любимый пилот:
        const favData = favSnapshot.docs[0].data();
        const favoritePilotId = favData.pilotId;
        console.log("Favorite pilotId из Firestore:", favoritePilotId);
        await fetchPilotData(favoritePilotId);
      } else {
        console.log("Нет избранного пилота");
      }
    } catch (err) {
      console.error("Ошибка загрузки избранного пилота:", err);
      setError("Ошибка загрузки избранного пилота");
    }
  };

  // Запрашивает данные о пилотах и ищет любимого по его driverId
  const fetchPilotData = async (favoritePilotId) => {
    try {
      const response = await fetch("https://api.jolpi.ca/ergast/f1/2024/driverStandings.json");
      if (!response.ok) throw new Error("Ошибка получения данных пилотов");
      const data = await response.json();
      const drivers = data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings;
      if (drivers && Array.isArray(drivers)) {
        const foundPilot = drivers.find(pilot => pilot.Driver.driverId === favoritePilotId);
        setFavoritePilot(foundPilot);
      } else {
        throw new Error("Неверный формат данных о пилотах");
      }
    } catch (err) {
      setError("Ошибка при получении данных пилотов");
    }
  };

  // Fetch followers count
  const fetchFollowersCount = async (uid) => {
    try {
      const followsQuery = query(
        collection(db, "follows"),
        where("followingId", "==", uid)
      );
      const snapshot = await getDocs(followsQuery);
      setFollowersCount(snapshot.size);
    } catch (err) {
      console.error("Ошибка при получении количества подписчиков:", err);
    }
  };

  // Обработчик клика по карточке пилота, переход на страницу pilotdetails
  const handlePilotSelect = (pilot) => {
    const pilotLastName = normalizeName(pilot.Driver.familyName);
    navigate(`/pilot-details/${pilotLastName}`);
  };

  // Обработчик клика по количеству подписчиков, переход на страницу списка подписчиков
  const handleFollowersClick = () => {
    navigate(`/userprofile/${uid}/followers`);
  };

  if (loading) {
    return (
      <div style={{ width: "100vw", height: "100vh", backgroundColor: "#1D1D1F", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>
        Загрузка...
      </div>
    );
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!profileUser) {
    return (
      <div style={{ width: "100vw", height: "100vh", backgroundColor: "#1D1D1F", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>
        {uid}
      </div>
    );
  }

  // Если любимый пилот найден, получаем его полное имя и перевод
  let pilotFullName = "";
  let translatedName = "";
  if (favoritePilot) {
    pilotFullName = `${favoritePilot.Driver.givenName} ${favoritePilot.Driver.familyName}`;
    translatedName = driverTranslations[pilotFullName] || pilotFullName;
  }

  return (
    <div style={{ backgroundColor: "#1D1D1F", color: "white", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <img
          src={profileUser.photoUrl}
          alt="Avatar"
          width={80}
          height={80}
          style={{ borderRadius: "50%", background: "#D9D9D9" }}
        />
        <div>
          {profileUser.firstName} {profileUser.lastName}
        </div>
      </div>

      <h3 style={{ marginTop: "20px", marginBottom: "20px", width: "calc(100% - 40px)"}}>Любимый пилот: </h3>
      {favoritePilot ? (
        <div
          onClick={() => handlePilotSelect(favoritePilot)}
          style={{
            width: "100%",
            background: "#212124",
            borderRadius: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            padding: "10px",
            cursor: "pointer"
          }}
        >
          <div
            style={{
              width: "65px",
              height: "65px",
              borderRadius: "20px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#212124",
            }}
          >
            <div
              style={{
                color: teamColors[favoritePilot.Constructors[0].name] || "#000000",
                fontSize: "24px",
                fontWeight: "600",
              }}
            >
              {favoritePilot.position}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "4px",
              flex: 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ color: "white", fontSize: "12px", fontWeight: "300" }}>
                {translatedName}
              </div>
              <img
                src={`https://flagcdn.com/w40/${nationalityToFlag[favoritePilot.Driver.nationality] || "un"}.png`}
                alt={favoritePilot.Driver.nationality}
                style={{ width: "15px", height: "15px", borderRadius: "50%", objectFit: "cover" }}
              />
            </div>
            <div style={{ color: teamColors[favoritePilot.Constructors[0].name] || "#000000", fontSize: "12px", fontWeight: "300" }}>
              {favoritePilot.Constructors[0].name}
            </div>
          </div>
          <div style={{ textAlign: "center", minWidth: "60px" }}>
            <span style={{ color: "white", fontSize: "16px" }}>{favoritePilot.points}</span>
            <br />
            <span style={{ color: "white", fontSize: "10px" }}>PTS</span>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>Нет избранного пилота</div>
      )}
      
      <div style={{ marginTop: "20px" }}>
        <span style={{ fontSize: "14px" }}>Подписчики: </span>
        <span
          style={{ fontSize: "14px", color: "#0077FF", cursor: "pointer" }}
          onClick={handleFollowersClick}
        >
          {followersCount}
        </span>
      </div>
    </div>
  );
};

export default Profile;