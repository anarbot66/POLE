// UserProfile.js
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import CommentsSection from "./components/CommentsSection";
import RoleIcon, { roleIcons } from "./components/RoleIcon";
import { useSwipeable } from 'react-swipeable';
import BackButton from "../components/BackButton";

// Объект с цветами команд
const teamColors = {
  "McLaren": "#F48021",
  "Ferrari": "#FF0000",
  "Red Bull": "#2546FF",
  "Mercedes": "#00A19C",
  "Aston Martin": "#00594F",
  "Alpine F1 Team": "#F60195",
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

// Для избранных трасс используем маппинг стран
const countryToFlag = {
  "Bahrain": "bh", "Saudi Arabia": "sa", "Australia": "au", "Japan": "jp",
  "China": "cn", "USA": "us", "United States": "us", "Miami": "us",
  "Italy": "it", "Monaco": "mc", "Canada": "ca", "Spain": "es",
  "Austria": "at", "Great Britain": "gb", "United Kingdom": "gb", "UK": "gb",
  "Hungary": "hu", "Belgium": "be", "Netherlands": "nl", "Singapore": "sg",
  "Mexico": "mx", "Brazil": "br", "Las Vegas": "us", "UAE": "ae",
  "Qatar": "qa", "Azerbaijan": "az"
};

const normalizeName = (name) => {
  if (name === "Magnussen") return "kevin_magnussen";
  if (name === "verstappen") return "max_verstappen";
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
  const currentUserUid = location.state?.currentUserUid || currentUser?.uid;

  const [profileUser, setProfileUser] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  // Для избранных пилотов, конструкторов и трасс – массивы
  const [favoritePilots, setFavoritePilots] = useState([]);
  const [favoriteConstructors, setFavoriteConstructors] = useState([]);
  const [favoriteTracks, setFavoriteTracks] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [activeRole, setActiveRole] = useState(null);
  const [visibleRole, setVisibleRole] = useState(null);
  const menuRef = useRef(null);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);

  const tabs = ['posts','favorites'];

  const goPrev = () => {
    const i = tabs.indexOf(activeTab);
    const prev = tabs[(i - 1 + tabs.length) % tabs.length];
    setActiveTab(prev);
  };
  const goNext = () => {
    const i = tabs.indexOf(activeTab);
    const next = tabs[(i + 1) % tabs.length];
    setActiveTab(next);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft:  () => goNext(),
    onSwipedRight: () => goPrev(),
    trackMouse: true,    // чтобы работало и мышью
    preventDefaultTouchmoveEvent: true
  });


  // Загрузка базовых данных профиля, постов и избранного
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userRef = collection(db, "users");
        const q = query(userRef, where("uid", "==", uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setProfileUser(snapshot.docs[0].data());
        }
        await loadFavoritePilots(uid);
        await loadFavoriteConstructors(uid);
        await loadFavoriteTracks(uid);
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

  // Подписка на посты пользователя
  useEffect(() => {
    const postsQuery = query(
      collection(db, "posts"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const userPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(userPosts);
    });
    return () => unsubscribe();
  }, [uid]);

  // Проверка подписки текущего пользователя на профиль
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsYou, setFollowsYou] = useState(false);
  useEffect(() => {
    if (currentUser && currentUserUid) {
      const checkFollowing = async () => {
        try {
          const followsQuery = query(
            collection(db, "follows"),
            where("followerId", "==", currentUserUid),
            where("followingId", "==", uid)
          );
          const snapshot = await getDocs(followsQuery);
          setIsFollowing(!snapshot.empty);
        } catch (err) {
          console.error("Ошибка проверки подписки:", err);
        }
      };
      checkFollowing();
    }
  }, [currentUser, uid, currentUserUid]);

  useEffect(() => {
    if (currentUser && currentUserUid) {
      const checkTheyFollowYou = async () => {
        try {
          const followsYouQuery = query(
            collection(db, "follows"),
            where("followerId", "==", uid),
            where("followingId", "==", currentUserUid)
          );
          const snapshot = await getDocs(followsYouQuery);
          setFollowsYou(!snapshot.empty);
        } catch (err) {
          console.error("Ошибка проверки обратной подписки:", err);
        }
      };
      checkTheyFollowYou();
    }
  }, [currentUser, uid, currentUserUid]);

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

  // Функция загрузки избранных пилотов (запрос всех документов из коллекции "favorites" по userId)
  const loadFavoritePilots = async (uid) => {
    try {
      const favQuery = query(
        collection(db, "favorites"),
        where("userId", "==", uid)
      );
      const favSnapshot = await getDocs(favQuery);
      if (!favSnapshot.empty) {
        const favDocs = favSnapshot.docs.map(doc => doc.data());
        const pilotPromises = favDocs.map(async (fav) => {
          const response = await fetch(
            "https://api.jolpi.ca/ergast/f1/2025/driverStandings.json"
          );
          if (!response.ok) throw new Error("Ошибка получения данных пилотов");
          const data = await response.json();
          const drivers = data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings;
          if (drivers && Array.isArray(drivers)) {
            return drivers.find(
              (pilot) => pilot.Driver.driverId === fav.pilotId
            );
          } else {
            throw new Error("Неверный формат данных о пилотах");
          }
        });
        const pilotsData = await Promise.all(pilotPromises);
        setFavoritePilots(pilotsData.filter(Boolean));
      } else {
        setFavoritePilots([]);
      }
    } catch (err) {
      console.error("Ошибка при загрузке избранных пилотов:", err);
      setError("Ошибка при загрузке избранных пилотов");
    }
  };

  const loadFavoriteConstructors = async (uid) => {
    try {
      const q = query(
        collection(db, "favoritesConstructors"),
        where("userId", "==", uid)
      );
      const snapshot = await getDocs(q);
      const favorites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFavoriteConstructors(favorites);
    } catch (err) {
      console.error("Ошибка загрузки избранных конструкторов:", err);
      setError("Ошибка загрузки избранных конструкторов");
    }
  };

  const loadFavoriteTracks = async (uid) => {
    try {
      const q = query(
        collection(db, "favoritesTracks"),
        where("userId", "==", uid)
      );
      const snapshot = await getDocs(q);
      const favorites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFavoriteTracks(favorites);
    } catch (err) {
      console.error("Ошибка загрузки избранных трасс:", err);
      setError("Ошибка загрузки избранных трасс");
    }
  };



  const handlePilotSelect = (pilot) => {
    const pilotLastName = normalizeName(pilot.Driver.familyName);
    navigate(`/pilot-details/${pilotLastName}`);
  };

  // Переход на страницу деталей избранного конструктора
  const handleConstructorSelect = (constructorData) => {
    navigate(`/constructor-details/${constructorData.Constructor.name}`, {
      state: { constructor: constructorData },
    });
  };

  // Переход на страницу деталей избранной трассы
  const handleTrackSelect = (raceData) => {
    navigate(`/races/${raceData.round}`, { state: { race: raceData } });
  };

  const togglePostComments = (postId) => {
    setActiveCommentsPostId((prev) => (prev === postId ? null : postId));
  };

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  useEffect(() => {
    if (activeRole) setVisibleRole(activeRole);
  }, [activeRole]);

  const closeRoleModal = () => {
    setActiveRole(null);
  };

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
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

  if (error || !profileUser) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        {error || "Пользователь не найден"}
      </div>
    );
  }

  return (
    <div style={{ color: "white", padding: "0 15px", marginBottom: "80px" }}>
      <div style={{position: 'fixed'}}>
      <BackButton
        label="Назад"
        style={{}}
      />
        
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          borderRadius: "15px",
          justifyContent: "space-between",
          marginTop: "15px",
        }}
      >
        <div style={{ width: "calc(100% - 30px)", marginTop: '50px'}}>
          <div style={{ fontSize: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="truncate">{profileUser.firstName}{profileUser.lastName}</span>
          </div>
          <div style={{ fontSize: "14px" }}>@{profileUser.username}</div>
          <div
            style={{
              fontSize: "14px",
              cursor: "pointer",
              marginTop: "10px",
              padding: "10px 20px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
            onClick={() => navigate(`/userprofile/${profileUser.username}/followers`, { state: { currentUserUid } })}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7 14C7 14 6 14 6 13C6 12 7 9 11 9C15 9 16 12 16 13C16 14 15 14 15 14H7Z" fill="white" />
              <path d="M11 8C12.6569 8 14 6.65685 14 5C14 3.34315 12.6569 2 11 2C9.34315 2 8 3.34315 8 5C8 6.65685 9.34315 8 11 8Z" fill="white" />
              <path d="M5.21636 14C5.07556 13.7159 5 13.3791 5 13C5 11.6445 5.67905 10.2506 6.93593 9.27997C6.3861 9.10409 5.7451 9 5 9C1 9 0 12 0 13C0 14 1 14 1 14H5.21636Z" fill="white" />
              <path d="M4.5 8C5.88071 8 7 6.88071 7 5.5C7 4.11929 5.88071 3 4.5 3C3.11929 3 2 4.11929 2 5.5C2 6.88071 3.11929 8 4.5 8Z" fill="white" />
            </svg>
            {followersCount} подписчиков
          </div>
        </div>
        <img
          src={profileUser.photoUrl || "https://placehold.co/80x80"}
          alt="Avatar"
          width={129}
          height={129}
          style={{ borderRadius: "50%", background: "#D9D9D9" }}
        />
      </div>

      <div style={{ display: "flex", borderRadius: "20px", marginTop: "10px" }}>
        <button
          onClick={() => handleTabChange('posts')}
          style={{
            padding: "10px 20px",
            boxShadow: activeTab === 'posts' ? '0 0 0 1px rgba(255,255,255,0.2)' : '0 0 0 0 rgba(255,255,255,0)',
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: 'box-shadow 0.3s ease',
            fontSize: 14
          }}
        >
          Посты
        </button>
        <button
          onClick={() => handleTabChange('favorites')}
          style={{
            padding: "10px 20px",
            boxShadow: activeTab === 'favorites' ? '0 0 0 1px rgba(255,255,255,0.2)' : '0 0 0 0 rgba(255,255,255,0)',
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: 'box-shadow 0.3s ease',
            fontSize: 14
          }}
        >
          Предпочтения
        </button>
      </div>

      <div style={{ position: "relative", overflow: "hidden" }}>
      <TransitionGroup>
        <CSSTransition
            key={activeTab}
            classNames="tab"
            timeout={400}
          >
        <div {...swipeHandlers} className="">
          {activeTab === "posts" ? (
              <div style={{ width: "100%", top: 0, left: 0 }}>
                {posts.length > 0 ? (
                  posts.map((post, index) => (
                    <div
                      key={post.id}
                      style={{
                        width: "100%",
                        marginTop: index === 0 ? "20px" : "10px",
                        position: "relative",
                        padding: "0 0px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img
                          src={profileUser.photoUrl || "https://placehold.co/50x50"}
                          alt="avatar"
                          style={{
                            width: "35px",
                            height: "35px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                        <div>
                          <p style={{ fontSize: "14px", color: "#ddd" }}>
                            {profileUser.firstName} {profileUser.lastName}
                          </p>
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "15px",
                          }}
                        >
                          <small style={{ color: "#888" }}>
                            {formatDate(
                              post.createdAt?.toDate ? post.createdAt.toDate() : post.createdAt
                            )}
                          </small>
                        </div>
                        <div style={{ marginTop: "5px", borderRadius: "12px", color: "white" }}>
                          {post.text}
                        </div>
                        <div style={{ marginTop: "10px" }}>
                          <button
                            onClick={() => togglePostComments(post.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#0078C1",
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3.68209 15.2515C3.97139 15.5469 4.11624 15.9583 4.0772 16.3735C3.98969 17.3041 3.78815 18.2726 3.52931 19.1723C5.44728 18.7209 6.61867 18.1973 7.15112 17.9226C7.45336 17.7667 7.8015 17.7299 8.12876 17.8192C9.03329 18.0661 9.9973 18.2 11 18.2C16.4939 18.2 20.625 14.2694 20.625 9.8C20.625 5.33056 16.4939 1.4 11 1.4C5.50605 1.4 1.375 5.33056 1.375 9.8C1.375 11.8553 2.22379 13.7625 3.68209 15.2515ZM3.00423 20.7185C2.99497 20.7204 2.9857 20.7222 2.97641 20.7241C2.85015 20.7494 2.72143 20.7744 2.59025 20.7988C2.40625 20.8332 2.21738 20.8665 2.02362 20.8988C1.74997 20.9445 1.5405 20.653 1.6486 20.393C1.71922 20.2231 1.78884 20.0451 1.85666 19.8605C1.89975 19.7432 1.94212 19.6233 1.98356 19.5012C1.98534 19.4959 1.98713 19.4906 1.98891 19.4854C2.32956 18.4778 2.60695 17.3196 2.70845 16.2401C1.02171 14.5178 0 12.2652 0 9.8C0 4.38761 4.92487 0 11 0C17.0751 0 22 4.38761 22 9.8C22 15.2124 17.0751 19.6 11 19.6C9.87696 19.6 8.79323 19.4501 7.77265 19.1714C7.05838 19.54 5.51971 20.2108 3.00423 20.7185Z" fill="white"/>
                            </svg>
                          </button>
                        </div>
                        <CSSTransition
                          in={activeCommentsPostId === post.id}
                          timeout={300}
                          classNames="slideUp"
                          unmountOnExit
                        >
                          <CommentsSection
                            parentId={post.id}
                            currentUser={currentUser}
                            onClose={() => setActiveCommentsPostId(null)}
                          />
                        </CSSTransition>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: "center", marginTop: "50px" }}>Постов пока нет.</p>
                )}
              </div>
          ) : (
              <div style={{ width: "100%", marginTop: "10px", top: 0, left: 0 }}>
                {/* Секция избранных пилотов */}
                {favoritePilots.length > 0 ? (
                  <>
                    <h3 style={{ marginTop: "10px", marginBottom: "10px", textAlign: "left" }}>
                      {favoritePilots.length === 1 ? "Любимый пилот:" : "Любимые пилоты:"}
                    </h3>
                    {favoritePilots.map((pilot, idx) => (
                      <div
                        key={idx}
                        onClick={() => handlePilotSelect(pilot)}
                        style={{
                          width: "100%",
                          borderRadius: "15px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px",
                          cursor: "pointer",
                          marginBottom: "10px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
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
                          }}
                        >
                          <div
                            style={{
                              color: teamColors[pilot.Constructors[0].name] || "#000000",
                              fontSize: "24px",
                              fontWeight: "600",
                            }}
                          >
                            {pilot.position}
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
                            <div style={{ color: "white", fontSize: "12px" }}>
                              {driverTranslations[`${pilot.Driver.givenName} ${pilot.Driver.familyName}`] ||
                                `${pilot.Driver.givenName} ${pilot.Driver.familyName}`}
                            </div>
                            <img
                              src={`https://flagcdn.com/w40/${nationalityToFlag[pilot.Driver.nationality] || "un"}.png`}
                              alt={pilot.Driver.nationality}
                              style={{
                                width: "15px",
                                height: "15px",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                          <div
                            style={{
                              color: teamColors[pilot.Constructors[0].name] || "#000000",
                              fontSize: "12px",
                            }}
                          >
                            {pilot.Constructors[0].name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p style={{ textAlign: "left", marginTop: "50px" }}>Нет избранных пилотов</p>
                )}

                {/* Секция избранных конструкторов */}
                {favoriteConstructors.length > 0 ? (
                  <>
                    <h3 style={{ marginTop: "20px", marginBottom: "10px", textAlign: "left" }}>
                      {favoriteConstructors.length === 1 ? "Любимый конструктор:" : "Любимые конструкторы:"}
                    </h3>
                    {favoriteConstructors.map((fav) => (
                      <div
                        key={fav.id}
                        onClick={() => handleConstructorSelect(fav.constructorData)}
                        style={{
                          width: "100%",
                          borderRadius: "15px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px",
                          cursor: "pointer",
                          marginBottom: "10px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
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
                          }}
                        >
                          <div
                            style={{
                              color: teamColors[fav.constructorData.Constructor.name] || "#000000",
                              fontSize: "24px",
                              fontWeight: "600",
                            }}
                          >
                            {fav.constructorData.position || "-"}
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
                          <div style={{ color: "white", fontSize: "14px" }}>
                            {fav.constructorData.Constructor.name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p style={{ textAlign: "left", marginTop: "20px" }}>Нет избранных конструкторов</p>
                )}

                {/* Секция избранных трасс */}
                {favoriteTracks.length > 0 ? (
                  <>
                    <h3 style={{ marginTop: "20px", marginBottom: "10px", textAlign: "left" }}>
                      {favoriteTracks.length === 1 ? "Любимая трасса:" : "Любимые трассы:"}
                    </h3>
                    {favoriteTracks.map((fav) => (
                      <div
                        key={fav.id}
                        onClick={() => handleTrackSelect(fav.raceData)}
                        style={{
                          width: "100%",
                          display: "flex",
                          borderRadius: "15px",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px",
                          cursor: "pointer",
                          marginBottom: "10px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
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
                          }}
                        >
                          <img
                            src={`https://flagcdn.com/w320/${
                              countryToFlag[fav.raceData.Circuit.Location.country] ||
                              fav.raceData.Circuit.Location.country.toLowerCase()
                            }.png`}
                            alt={fav.raceData.Circuit.Location.country}
                            style={{
                              width: "50px",
                              height: "50px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              objectPosition: "center",
                            }}
                          />
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
                          <div style={{ color: "white", fontSize: "13px" }}>
                            {fav.raceData.raceName}
                          </div>
                          <div style={{ color: "#B9B9B9", fontSize: "10px" }}>
                            {fav.raceData.Circuit.circuitName}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p style={{ textAlign: "left", marginTop: "20px" }}>Нет избранных трасс</p>
                )}
              </div>
          )} </div>
          </CSSTransition>
          </TransitionGroup>
      </div>

      <CSSTransition
        in={!!activeRole}
        timeout={300}
        classNames="window-fade"
        unmountOnExit
        onExited={() => setVisibleRole(null)}
      >
        <div
          onClick={closeRoleModal}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: "20px",
              borderRadius: "20px",
              textAlign: "center",
              color: "white",
              maxWidth: "300px",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            {visibleRole && (
              <>
                <RoleIcon role={visibleRole} size={32} fullWidth />
                <div>
                  <h3>
                    {profileUser.firstName} {roleIcons[visibleRole].name}
                  </h3>
                  <p>{roleIcons[visibleRole].description}</p>
                </div>
              </>
            )}
            <button
              onClick={closeRoleModal}
              style={{
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "15px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Понятно ^^
            </button>
          </div>
        </div>
      </CSSTransition>
    </div>
  );
};

export default UserProfile;
