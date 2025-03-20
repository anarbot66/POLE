import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

// Цвета команд и другие данные
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

const normalizeName = (name) => {
  if (name === "Magnussen") return "kevin_magnussen";
  if (name === "Verstappen") return "max_verstappen";
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const formatDate = (dateInput) => {
    const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
    const dayMonth = date.toLocaleString("ru-RU", { day: "numeric", month: "long" });
    const time = date.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    return `${dayMonth} в ${time}`;
  };

const UserProfile = ({ currentUser }) => {
  const navigate = useNavigate();
  const { uid } = useParams(); // uid профиля, который отображается
  const location = useLocation();
  // Если в state передали currentUserUid, используем его, иначе currentUser.uid
  const currentUserUid = location.state?.currentUserUid || currentUser?.uid;

  const goBack = () => {
    navigate(-1);
  };

  const [profileUser, setProfileUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [favoritePilot, setFavoritePilot] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followsYou, setFollowsYou] = useState(false);


  // Загружаем данные профиля, избранного пилота, подписчиков и посты
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userRef = collection(db, "users");
        const q = query(userRef, where("uid", "==", uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setProfileUser(snapshot.docs[0].data());
        } else {

        }
        await loadFavorites(uid);
        await fetchFollowersCount(uid);
        await fetchPosts(uid);
      } catch (err) {
        console.error("Ошибка при загрузке данных профиля:", err);
        setError("Ошибка загрузки данных профиля");
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [uid]);

  

  // Проверяем, подписан ли текущий пользователь на данного пользователя
  useEffect(() => {
    if (currentUser && currentUserUid) {
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

  useEffect(() => {
    if (currentUser && currentUserUid) {
      const checkIfTheyFollowYou = async () => {
        try {
          const followsYouQuery = query(
            collection(db, "follows"),
            where("followerId", "==", uid),              // uid пользователя, чей профиль вы смотрите
            where("followingId", "==", currentUserUid)     // текущий пользователь
          );
          const snapshot = await getDocs(followsYouQuery);
          setFollowsYou(!snapshot.empty);
        } catch (err) {
          console.error("Ошибка при проверке обратной подписки:", err);
        }
      };
      checkIfTheyFollowYou();
    }
  }, [currentUser, uid, currentUserUid]);
  

  // Получаем количество подписчиков
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

  // Загружаем посты пользователя (сортировка: новые сверху)
  const fetchPosts = async (uid) => {
    try {
      const postsQuery = query(
        collection(db, "posts"),
        where("uid", "==", uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(postsQuery);
      const userPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(userPosts);
    } catch (err) {
      console.error("Ошибка при загрузке постов:", err);
      setError("Ошибка при загрузке постов");
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
      setFollowersCount((prev) => prev + 1);
    } catch (err) {
      console.error("Ошибка при подписке:", err);
      setError("Ошибка при подписке: " + err.message);
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
      setFollowersCount((prev) => prev - 1);
    } catch (err) {
      console.error("Ошибка при отписке:", err);
      setError("Ошибка при отписке: " + err.message);
    }
  };

  // Загружаем избранного пилота
  const loadFavorites = async (uid) => {
    try {
      const favQuery = query(
        collection(db, "favorites"),
        where("userId", "==", uid)
      );
      const favSnapshot = await getDocs(favQuery);
      if (!favSnapshot.empty) {
        const favData = favSnapshot.docs[0].data();
        const favoritePilotId = favData.pilotId;
        
        await fetchPilotData(favoritePilotId);
      } else {

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
      if (!response.ok)
        throw new Error("Ошибка получения данных пилотов");
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

  const handlePilotSelect = (pilot) => {
    const pilotLastName = normalizeName(pilot.Driver.familyName);
    navigate(`/pilot-details/${pilotLastName}`);
  };

  const handleFollowersClick = () => {
    if (profileUser && profileUser.username) {
      navigate(`/userprofile/${profileUser.username}/followers`, {
        state: { currentUserUid },
      });
    }
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
        }}
      >
        <div className="loader"></div>
        <style>
          {`
            .loader {
              width: 50px;
              aspect-ratio: 1;
              --_c: no-repeat radial-gradient(farthest-side, white 92%, transparent);
              background:
                var(--_c) top,
                var(--_c) left,
                var(--_c) right,
                var(--_c) bottom;
              background-size: 12px 12px;
              animation: l7 1s infinite;
            }
            @keyframes l7 {
              to { transform: rotate(.5turn); }
            }
          `}
        </style>
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
    className="fade-in"
      style={{
        width: "100vw",
        minHeight: "100vh",
        backgroundColor: "#1D1D1F",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        color: "white",
        marginBottom: "100px"
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
          top: "30px",
        }}
      >
        ✕
      </button>
      {/* Информация о пользователе */}
      <div
        style={{
          width: "100%",
          padding: 20,
          background: "#212124",
          borderRadius: 15,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <img
          src={profileUser.photoUrl}
          alt="Аватар"
          style={{ width: 80, height: 80, borderRadius: "50%" }}
        />
        <div style={{ fontSize: 18, fontWeight: "500", textAlign: "center" }}>
          {profileUser.firstName} {profileUser.lastName}
        </div>
        <div style={{ fontSize: 14, color: "#7E7E7E", textAlign: "center" }}>
          @{profileUser.username}
        </div>
        <div
          style={{ fontSize: 14, color: "#7E7E7E", textAlign: "center", cursor: "pointer" }}
          onClick={handleFollowersClick}
        >
          Подписчики: {followersCount}
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
        {isFollowing
          ? "Вы подписаны"
          : (followsYou ? "Подписаться в ответ" : "Подписаться")}
      </button>

      </div>

      {/* Блок с любимым пилотом */}
      <h3
        style={{
          marginTop: "20px",
          marginBottom: "20px",
          width: "100%",
          textAlign: "center",
        }}
      >
        Любимый пилот
      </h3>
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
                color:
                  teamColors[favoritePilot.Constructors[0].name] || "#000000",
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
              <div style={{ color: "white", fontSize: "12px"}}>
                {driverTranslations[`${favoritePilot.Driver.givenName} ${favoritePilot.Driver.familyName}`] ||
                  `${favoritePilot.Driver.givenName} ${favoritePilot.Driver.familyName}`}
              </div>
              <img
                src={`https://flagcdn.com/w40/${
                  nationalityToFlag[favoritePilot.Driver.nationality] || "un"
                }.png`}
                alt={favoritePilot.Driver.nationality}
                style={{ width: "15px", height: "15px", borderRadius: "50%", objectFit: "cover" }}
              />
            </div>
            <div
              style={{
                color: teamColors[favoritePilot.Constructors[0].name] || "#000000",
                fontSize: "12px"
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

      {/* Отображение постов пользователя */}
      <div style={{ width: "100%", marginTop: "20px" }}>
        {posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post.id}
              style={{
                width: "100%",
                alignItems: "flex-start",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              <div
              style={{
                display: "flex", alignItems: "center", gap: "15px"
              }}>
                {/* Аватарка пользователя */}
              <img
                src={profileUser.photoUrl || "https://placehold.co/50x50"}
                alt="avatar"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
                  <div>
                    <strong style={{ fontSize: "14px", color: "#ddd" }}>
                    {profileUser.firstName} {profileUser.lastName}
                    </strong>
                    <span
                      style={{
                        fontSize: "16px",
                        color: "white",
                        marginLeft: "10px",
                      }}
                    >
                    </span>
                  </div>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "5px",
                  }}
                >
                  <small style={{ color: "#888" }}>
                  {formatDate(post.createdAt?.toDate ? post.createdAt.toDate() : post.createdAt)}
                  </small>
                </div>
                <div
                  style={{
                    borderRadius: "12px",
                    marginTop: "5px",
                    color: "white",
                  }}
                >
                  {post.text}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>Постов пока нет.</p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
