import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { CSSTransition, TransitionGroup } from "react-transition-group";
import CommentsSection from "./components/CommentsSection";
import RoleIcon, { roleIcons } from "./components/RoleIcon";

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
  const [profileUser, setProfileUser] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [favoritePilot, setFavoritePilot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [showFavoriteAlert, setShowFavoriteAlert] = useState(false);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const menuRef = useRef(null);
  const username = currentUser.name;
  
  const roles = useMemo(() => currentUser.role ? currentUser.role.split(",") : [], [currentUser.role]);
  const [activeRole, setActiveRole] = useState(null);

  const handleIconClick = (role) => {
    setActiveRole(role);
  };

  const closeRoleModal = () => {
    setActiveRole(null);
  };
  
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
        "https://api.jolpi.ca/ergast/f1/2025/driverStandings.json"
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

  const [visibleRole, setVisibleRole] = useState(null);
  useEffect(() => {
    if (activeRole) {
      setVisibleRole(activeRole);
    }
  }, [activeRole]);

  const togglePostComments = (postId) => {
    setActiveCommentsPostId((prev) => (prev === postId ? null : postId));
  };

  const handlePilotSelect = (pilot) => {
    const pilotLastName = normalizeName(pilot.Driver.familyName);
    navigate(`/pilot-details/${pilotLastName}`);
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return "—";
    const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return "—";
    const dayMonth = date.toLocaleString("ru-RU", { day: "numeric", month: "long" });
    const time = date.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    return `${dayMonth} в ${time}`;
  };

  // Состояние вкладок и направления анимации
  const [activeTab, setActiveTab] = useState('posts');
  const [direction, setDirection] = useState("right");

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
  
    // Обновляем активную вкладку
    setActiveTab(tab);
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
      style={{ backgroundColor: "#1D1D1F", color: "white", padding: "0 15px", marginBottom: "80px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          borderRadius: "15px",
          marginTop: "15px",
          justifyContent: "space-between"
        }}
      >
        <div style={{ width: "100%" }}>
          <div style={{ fontSize: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span>{profileUser.firstName} {profileUser.lastName}</span>{" "}
            {roles.map((role) => (
              <RoleIcon key={role} role={role} onClick={handleIconClick} />
            ))}
          </div>
          <div style={{ fontSize: "14px" }}>
            @{profileUser.username}
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "white",
              cursor: "pointer",
              marginTop: "10px",
              padding: "10px 20px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#212124"
            }}
            onClick={() => navigate(`/userprofile/${profileUser.username}/followers`)}
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

      <button
        onClick={() => navigate("/create-post")}
        style={{
          marginTop: "10px",
          width: "100%",
          padding: "10px",
          backgroundColor: "#0078FF",
          color: "white",
          borderRadius: "12px",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Создать пост
      </button>

      {/* Вкладки */}
      <div
        style={{
          display: "flex",
          borderRadius: "20px",
          marginTop: "10px"
        }}
      >
        <button
          onClick={() => handleTabChange('posts')}
          style={{
            padding: "10px 20px",
            background: activeTab === "posts" ? "#212124" : "transparent",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "background 1.2s ease",
            fontSize: 14
          }}
        >
          Посты
        </button>
        <button
          onClick={() => handleTabChange('favorites')}
          style={{
            padding: "10px 20px",
            background: activeTab === "favorites" ? "#212124" : "transparent",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "background 1.2s ease",
            fontSize: 14
          }}
        >
          Предпочтения
        </button>
      </div>

      {/* Контейнер для слайдера */}
      <div style={{ position: "relative", overflow: "hidden", minHeight: "300px" }}>
        <TransitionGroup>
          {activeTab === "posts" ? (
            <CSSTransition
              key="posts"
              classNames="slider-posts"
              timeout={500}
              unmountOnExit
            >
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%" }}>
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
                              background: "#212124",
                              borderRadius: "12px 0px 12px 12px",
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
                  <p style={{ textAlign: "center", marginTop: "50px" }}>Нет постов</p>
                )}
              </div>
            </CSSTransition>
          ) : (
            <CSSTransition
              key="favorites"
              classNames="slider-favorites"
              timeout={500}
              unmountOnExit
            >
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", marginTop: "10px" }}>
                {favoritePilot ? (
                  <>
                    <h3 style={{ marginTop: "10px", marginBottom: "10px", width: "calc(100% - 40px)" }}>
                      Любимый пилот:
                    </h3>
                    <div
                      onClick={() => handlePilotSelect(favoritePilot)}
                      style={{
                        width: "100%",
                        background: "#212124",
                        borderRadius: "15px",
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
                          <div style={{ color: "white", fontSize: "12px" }}>
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
                ) : (
                  <p style={{ textAlign: "center", marginTop: "50px" }}>Нет избранного пилота</p>
                )}
              </div>
            </CSSTransition>
          )}
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
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1D1D1F",
              padding: "20px",
              borderRadius: "20px",
              textAlign: "center",
              color: "white",
              maxWidth: "300px",
              justifyContent: "center",
              alignItems: "center",
              gap: "15px",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {visibleRole && (
              <>
                <RoleIcon role={visibleRole} size={32} fullWidth />
                <div>
                  <h3>{profileUser.firstName} {roleIcons[visibleRole].name}</h3>
                  <p>{roleIcons[visibleRole].description}</p>
                </div>
              </>
            )}
            <button
              onClick={closeRoleModal}
              style={{
                background: "#212124",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "15px",
                cursor: "pointer",
                width: "100%"
              }}
            >
              Понятно ^^
            </button>
          </div>
        </div>
      </CSSTransition>

      {/* Стили анимаций слайдера */}
      <style>
  {`
    /* Для постов */
    .slider-posts-enter {
      transform: translateX(-100%);
    }
    .slider-posts-enter-active {
      transform: translateX(0%);
      transition: transform 500ms ease;
    }
    .slider-posts-exit {
      transform: translateX(0%);
    }
    .slider-posts-exit-active {
      transform: translateX(-100%);
      transition: transform 500ms ease;
    }
    
    /* Для любимых */
    .slider-favorites-enter {
      transform: translateX(100%);
    }
    .slider-favorites-enter-active {
      transform: translateX(0%);
      transition: transform 500ms ease;
    }
    .slider-favorites-exit {
      transform: translateX(0%);
    }
    .slider-favorites-exit-active {
      transform: translateX(100%);
      transition: transform 500ms ease;
    }
    
    
  `}
      </style>
    </div>
  );
};

export default Profile;
