import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { 
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  doc
} from "firebase/firestore";
import { CSSTransition } from "react-transition-group";

// Пример констант (цвета команд, переводы имён и т.д.)
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
  if (name === "Magnussen") {
    return "kevin_magnussen";
  } else if (name === "Verstappen") {
    return "max_verstappen";
  }
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const Profile = ({ currentUser }) => {
  const navigate = useNavigate();

  // Состояния для данных пользователя и интерфейса
  const [profileUser, setProfileUser] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [favoritePilot, setFavoritePilot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояния для постов и формы поста
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedText, setEditedText] = useState("");
  // Состояние для показа меню конкретного поста
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  // Ref для CSSTransition меню поста (так как одновременно открыто только одно меню)
  const menuRef = useRef(null);

  const username = currentUser.name;

  // Загрузка данных пользователя, избранного пилота и подписчиков
  useEffect(() => {
    const loadData = async () => {
      if (!username) return;
      await fetchUserAndFavorites(username);
      await fetchFollowersCount(currentUser.uid);
      setLoading(false);
    };

    loadData().catch((err) => {
      setError("Ошибка загрузки данных");
      console.error("Error loading data:", err);
      setLoading(false);
    });
  }, [currentUser, username]);

  // Подписка на обновления постов
  useEffect(() => {
    if (!currentUser?.uid) return;
    const postsQuery = query(
      collection(db, "posts"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const fetchUserAndFavorites = async (username) => {
    try {
      const userRef = collection(db, "users");
      const userQuery = query(userRef, where("username", "==", username));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        setProfileUser(userData);
        await loadFavorites(userData.uid);
      } else {
        setError("Пользователь не найден");
      }
    } catch (err) {
      console.error("Ошибка загрузки данных пользователя:", err);
      setError("Ошибка загрузки данных пользователя");
    }
  };

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
      setError("Ошибка при получении данных пилотов");
      console.error(err);
    }
  };

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

  const handlePostSubmit = async () => {
    if (!newPost.trim()) return;
    try {
      await addDoc(collection(db, "posts"), {
        uid: currentUser.uid,
        text: newPost,
        createdAt: serverTimestamp(),
      });
      setNewPost("");
      setShowPostForm(false);
    } catch (err) {
      console.error("Ошибка публикации поста:", err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, "posts", postId));
    } catch (err) {
      console.error("Ошибка при удалении поста:", err);
    }
  };

  const handleEditPost = (post) => {
    setEditingPostId(post.id);
    setEditedText(post.text);
    setOpenMenuPostId(null);
  };

  const handleSaveEdit = async (postId) => {
    try {
      await updateDoc(doc(db, "posts", postId), { text: editedText });
      setEditingPostId(null);
      setEditedText("");
    } catch (err) {
      console.error("Ошибка при сохранении изменений:", err);
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditedText("");
  };

  const toggleMenu = (postId) => {
    setOpenMenuPostId((prev) => (prev === postId ? null : postId));
  };

  const handlePilotSelect = (pilot) => {
    const pilotLastName = normalizeName(pilot.Driver.familyName);
    navigate(`/pilot-details/${pilotLastName}`);
  };

  // Функция форматирования даты
  const formatDate = (dateInput) => {
    if (!dateInput) return "—";
    const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return "—";
    const dayMonth = date.toLocaleString("ru-RU", { day: "numeric", month: "long" });
    const time = date.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    return `${dayMonth} в ${time}`;
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

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
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
        Ошибка: пользователь не найден
      </div>
    );
  }

  let pilotFullName = "";
  let translatedName = "";
  if (favoritePilot) {
    pilotFullName = `${favoritePilot.Driver.givenName} ${favoritePilot.Driver.familyName}`;
    translatedName = driverTranslations[pilotFullName] || pilotFullName;
  }

  return (
    <div
      className="fade-in"
      style={{ backgroundColor: "#1D1D1F", color: "white", padding: "0 10px", marginBottom: "80px" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "15px",
          backgroundColor: "#212124",
          borderRadius: "15px",
        }}
      >
        <img
          src={profileUser.photoUrl || "https://placehold.co/80x80"}
          alt="Avatar"
          width={80}
          height={80}
          style={{ borderRadius: "50%", background: "#D9D9D9", marginTop: "20px" }}
        />
        <div style={{ fontSize: "20px" }}>
          {profileUser.firstName} {profileUser.lastName}
        </div>
        <div style={{ marginBottom: "20px", fontSize: "14px" }}>
          @{profileUser.username}
        </div>
      </div>

      {/* Кликабельное поле "Друзья" */}
      <div
        style={{
          background: "#212124",
          fontSize: "14px",
          color: "white",
          cursor: "pointer",
          marginTop: "10px",
          padding: "20px",
          borderRadius: "15px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
        onClick={() =>
          navigate(`/userprofile/${profileUser.username}/followers`)
        }
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 14C7 14 6 14 6 13C6 12 7 9 11 9C15 9 16 12 16 13C16 14 15 14 15 14H7Z"
            fill="white"
          />
          <path
            d="M11 8C12.6569 8 14 6.65685 14 5C14 3.34315 12.6569 2 11 2C9.34315 2 8 3.34315 8 5C8 6.65685 9.34315 8 11 8Z"
            fill="white"
          />
          <path
            d="M5.21636 14C5.07556 13.7159 5 13.3791 5 13C5 11.6445 5.67905 10.2506 6.93593 9.27997C6.3861 9.10409 5.7451 9 5 9C1 9 0 12 0 13C0 14 1 14 1 14H5.21636Z"
            fill="white"
          />
          <path
            d="M4.5 8C5.88071 8 7 6.88071 7 5.5C7 4.11929 5.88071 3 4.5 3C3.11929 3 2 4.11929 2 5.5C2 6.88071 3.11929 8 4.5 8Z"
            fill="white"
          />
        </svg>
        {followersCount} Подписчиков
      </div>

      {favoritePilot && (
        <>
          <h3 style={{ marginTop: "10px", marginBottom: "10px", width: "calc(100% - 40px)" }}>
            Любимый пилот:
          </h3>
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
                <div style={{ color: "white", fontSize: "12px"}}>
                  {driverTranslations[`${favoritePilot.Driver.givenName} ${favoritePilot.Driver.familyName}`] ||
                    `${favoritePilot.Driver.givenName} ${favoritePilot.Driver.familyName}`}
                </div>
                <img
                  src={`https://flagcdn.com/w40/${
                    nationalityToFlag[favoritePilot.Driver.nationality] || "un"
                  }.png`}
                  alt={favoritePilot.Driver.nationality}
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
                  color: teamColors[favoritePilot.Constructors[0].name] || "#000000",
                  fontSize: "12px",
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
              <span style={{ color: teamColors[favoritePilot.Constructors[0].name] }}>
                PTS
              </span>
            </div>
          </div>
        </>
      )}

      {/* Форма для создания нового поста */}
      <div style={{ width: "100%" }}>
        {showPostForm ? (
          <>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Напишите что-нибудь..."
              style={{
                width: "100%",
                height: "100px",
                borderRadius: "12px",
                padding: "10px",
                fontSize: "16px",
                background: "#212121",
                color: "white",
                border: "none",
                outline: "none",
              }}
            />
            <button
              onClick={handlePostSubmit}
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "10px",
                backgroundColor: "#0078C1",
                color: "white",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Опубликовать
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowPostForm(true)}
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "10px",
              backgroundColor: "#0078C1",
              color: "white",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Есть мысли?
          </button>
        )}
      </div>

      <div>
        {/* Отображение постов */}
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <div
              key={post.id}
              style={{
                width: "100%",
                marginTop: index === 0 ? "20px" : "10px",
                padding: "0 0px",
                position: "relative",
              }}
            >
              {/* Кнопка меню (три точки) */}
              <div style={{ position: "absolute", top: 0, right: 0 }}>
                <button
                  onClick={() => toggleMenu(post.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "18px",
                  }}
                >
                  ⋮
                </button>
                {/* Оборачиваем меню в CSSTransition для анимации */}
                <CSSTransition
                  in={openMenuPostId === post.id}
                  timeout={300}
                  classNames="menuFade"
                  unmountOnExit
                  nodeRef={menuRef}
                >
                  <div
                    ref={menuRef}
                    style={{
                      position: "absolute",
                      top: "24px",
                      right: "0",
                      background: "#333",
                      borderRadius: "12px",
                      padding: "5px",
                      zIndex: 10,
                    }}
                  >
                    <button
                      onClick={() => handleEditPost(post)}
                      style={{
                        display: "block",
                        background: "transparent",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        padding: "5px 10px",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => {
                        handleDeletePost(post.id);
                        setOpenMenuPostId(null);
                      }}
                      style={{
                        display: "block",
                        background: "transparent",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        padding: "5px 10px",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </CSSTransition>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
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
                  <strong style={{ fontSize: "14px", color: "#ddd" }}>
                    {profileUser.firstName} {profileUser.lastName}
                  </strong>
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
                      post.createdAt?.toDate
                        ? post.createdAt.toDate()
                        : post.createdAt
                    )}
                  </small>
                </div>
                {editingPostId === post.id ? (
                  <>
                    <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        padding: "10px",
                        fontSize: "16px",
                        background: "#2C2C2E",
                        color: "white",
                        border: "none",
                        outline: "none",
                        marginTop: "5px",
                      }}
                    />
                    <div style={{ marginTop: "5px", textAlign: "right" }}>
                      <button
                        onClick={() => handleSaveEdit(post.id)}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: "#27ae60",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          marginRight: "5px",
                          fontSize: "12px",
                        }}
                      >
                        Сохранить
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: "#95a5a6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Отмена
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      borderRadius: "12px",
                      padding: "5px 0",
                      marginTop: "0px",
                      color: "white",
                      width: "100%",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {post.text}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", marginTop: "50px" }}>Нет постов</p>
        )}
      </div>
      {/* Стили для анимации меню */}
      <style>
        {`
          /* Начальное состояние для анимации menuFade */
          .menuFade-enter {
            opacity: 0;
            transform: scale(0.95);
          }
          
          .menuFade-enter-active {
            opacity: 1;
            transform: scale(1);
            transition: opacity 300ms ease, transform 300ms ease;
          }
          
          .menuFade-exit {
            opacity: 1;
            transform: scale(1);
          }
          
          .menuFade-exit-active {
            opacity: 0;
            transform: scale(0.95);
            transition: opacity 300ms ease, transform 300ms ease;
          }
          
        `}
      </style>
    </div>
  );
};

export default Profile;
