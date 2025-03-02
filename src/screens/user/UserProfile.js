import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useParams, useNavigate, useLocation } from "react-router-dom";

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

// Функция для нормализации фамилии
const normalizeName = (name) => {
  if (name === "Magnussen") return "kevin_magnussen";
  if (name === "Verstappen") return "max_verstappen";
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const UserProfile = ({ currentUser }) => {
  const navigate = useNavigate();
  const { uid } = useParams(); // Получаем uid из URL
  const location = useLocation();
  // Берем из state, если передано, иначе используем currentUser.uid
  const currentUserUid = location.state?.currentUserUid || currentUser.uid;

  const goBack = () => {
    navigate(-1);
  };

  const [profileUser, setProfileUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [favoritePilot, setFavoritePilot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followersCount, setFollowersCount] = useState(0); // New state for followers count

  // Загружаем данные профиля и избранного пилота
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userRef = collection(db, "users");
        const q = query(userRef, where("uid", "==", uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setProfileUser(snapshot.docs[0].data());
        } else {
          console.log("Пользователь не найден.");
        }
        await loadFavorites(uid);
        await fetchFollowersCount(uid); // Fetch followers count
      } catch (err) {
        console.error("Ошибка при загрузке данных профиля:", err);
        setError("Ошибка загрузки данных профиля");
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [uid]);

  // Проверяем, подписан ли текущий пользователь на этого пользователя
  useEffect(() => {
    if (currentUser) {
      const checkIfFollowing = async () => {
        try {
          const followsQuery = query(
            collection(db, "follows"),
            where("followerId", "==", currentUserUid),
            where("followingId", "==", uid)
          );
          const snapshot = await getDocs(followsQuery);
          setIsFollowing(!snapshot.empty);
        } catch (err) {
          console.error("Ошибка при проверке подписки:", err);
        }
      };
      checkIfFollowing();
    }
  }, [currentUser, uid, currentUserUid]);

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

  // Функции подписки/отписки
  const handleFollow = async () => {
    try {
      await addDoc(collection(db, "follows"), {
        followerId: currentUserUid,
        followingId: uid,
      });
      setIsFollowing(true);
      setFollowersCount((prevCount) => prevCount + 1); // Increment followers count
    } catch (err) {
      console.error("Ошибка при подписке:", err);
    }
  };

  const handleUnfollow = async () => {
    try {
      const q = query(
        collection(db, "follows"),
        where("followerId", "==", currentUserUid),
        where("followingId", "==", uid)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach(async (docSnapshot) => {
        await deleteDoc(doc(db, "follows", docSnapshot.id));
      });
      setIsFollowing(false);
      setFollowersCount((prevCount) => prevCount - 1); // Decrement followers count
    } catch (err) {
      console.error("Ошибка при отписке:", err);
    }
  };

  // Загружаем избранного пилота из Firestore и получаем данные через API
  const loadFavorites = async (uid) => {
    try {
      const favQuery = query(
        collection(db, "favorites"),
        where("userId", "==", uid)
      );
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

  const fetchPilotData = async (favoritePilotId) => {
    try {
      const response = await fetch(
        "https://api.jolpi.ca/ergast/f1/2024/driverStandings.json"
      );
      if (!response.ok) throw new Error("Ошибка получения данных пилотов");
      const data = await response.json();
      const drivers =
        data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings;
      if (drivers && Array.isArray(drivers)) {
        const foundPilot = drivers.find(
          (pilot) => pilot.Driver.driverId === favoritePilotId
        );
        setFavoritePilot(foundPilot);
      } else {
        throw new Error("Неверный формат данных о пилотах");
      }
    } catch (err) {
      console.error("Ошибка при получении данных пилотов:", err);
      setError("Ошибка при получении данных пилотов");
    }
  };

  // Обработчик клика по карточке пилота – переходим на страницу деталей
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
      <div
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#1D1D1F",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        Загрузка...
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#1D1D1F",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        Пользователь не найден.
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        backgroundColor: "#1D1D1F",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "20px",
        color: "white",
      }}
    >

        <button
          onClick={goBack}
          style={{
            position: "absolute",
            backgroundColor: "#1D1D1F",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: "10px",
            cursor: "pointer",
            zIndex: "1000",
            left: "30px",
            top: "30px"
          }}
        >
          ✕
        </button>
      <div
        style={{
          width: "calc(100% - 40px)",
          padding: 20,
          background: "#212124",
          borderRadius: 15,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        <img
          src={profileUser.photoUrl}
          alt="Аватар"
          style={{ width: 80, height: 80, background: "#D9D9D9", borderRadius: "50%" }}
        />
        <div style={{ fontSize: 18, fontWeight: "500", textAlign: "center" }}>
          {profileUser.firstName} {profileUser.lastName}
        </div>
        <div style={{ fontSize: 14, color: "#7E7E7E", textAlign: "center" }}>
          @{profileUser.username}
        </div>
        <div style={{ fontSize: 14, color: "#7E7E7E", textAlign: "center" }}>
          Подписчики:{" "}
          <span
            style={{ color: "#0077FF", cursor: "pointer" }}
            onClick={handleFollowersClick}
          >
            {followersCount}
          </span>
        </div>
        <button
          onClick={isFollowing ? handleUnfollow : handleFollow}
          style={{
            marginTop: "20px",
            backgroundColor: isFollowing ? "#1D1D1F" : "#0077FF",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          {isFollowing ? "Вы подписаны" : "Подписаться"}
        </button>
      </div>

      {/* Блок с карточкой любимого пилота */}
      <h3 style={{ marginTop: "20px", marginBottom: "20px", width: "calc(100% - 40px)"}}>Любимый пилот</h3>
      {favoritePilot ? (
        <div
          onClick={() => handlePilotSelect(favoritePilot)}
          style={{
            width: "calc(100% - 40px)",
            background: "#212124",
            borderRadius: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            padding: "10px",
            cursor: "pointer",
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
                {driverTranslations[`${favoritePilot.Driver.givenName} ${favoritePilot.Driver.familyName}`] ||
                  `${favoritePilot.Driver.givenName} ${favoritePilot.Driver.familyName}`}
              </div>
              <img
                src={`https://flagcdn.com/w40/${nationalityToFlag[favoritePilot.Driver.nationality] || "un"}.png`}
                alt={favoritePilot.Driver.nationality}
                style={{ width: "15px", height: "15px", borderRadius: "50%", objectFit: "cover" }}
              />
            </div>
            <div
              style={{
                color: teamColors[favoritePilot.Constructors[0].name] || "#000000",
                fontSize: "12px",
                fontWeight: "300",
              }}
            >
              {favoritePilot.Constructors[0].name}
            </div>
          </div>
          <div style={{ textAlign: "center", minWidth: "60px" }}>
            <span style={{ color: "white", fontSize: "16px" }}>
              {favoritePilot.points}
            </span>
            <br />
            <span style={{ color: "white", fontSize: "10px" }}>PTS</span>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>Нет избранного пилота</div>
      )}
    </div>
  );
};

export default UserProfile;