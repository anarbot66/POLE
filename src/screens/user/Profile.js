// Profile.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { 
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc
} from "firebase/firestore";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import CommentsSection from "./components/CommentsSection";
import RoleIcon, { roleIcons } from "./components/RoleIcon";
import { useSwipeable } from 'react-swipeable';

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
  if (name === "Magnussen") {
    return "kevin_magnussen";
  } else if (name === "Verstappen") {
    return "verstappen";
  }
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const tabs = ['posts','favorites'];

const Profile = ({ currentUser }) => {
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [favoritePilots, setFavoritePilots] = useState([]);
  const [favoriteConstructors, setFavoriteConstructors] = useState([]);
  const [favoriteTracks, setFavoriteTracks] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingPostId, setEditingPostId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const menuRef = useRef(null);

  const username = currentUser.name;
  const roles = useMemo(() => currentUser.role?.split(",") || [], [currentUser.role]);
  const [activeRole, setActiveRole] = useState(null);
  const handleIconClick = (role) => setActiveRole(role);
  const closeRoleModal = () => setActiveRole(null);

  // Loading flags
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [pilotsLoaded, setPilotsLoaded] = useState(false);
  const [constructorsLoaded, setConstructorsLoaded] = useState(false);
  const [tracksLoaded, setTracksLoaded] = useState(false);

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

  // 1) Load profile & followers count
  useEffect(() => {
    if (!username || profileLoaded) return;
    (async () => {
      try {
        await fetchUserAndFavorites(username);
        await fetchFollowersCount(currentUser.uid);
      } catch (e) {
        console.error(e);
        setError("Ошибка при загрузке профиля");
      } finally {
        setProfileLoaded(true);
      }
    })();
  }, [username, profileLoaded, currentUser.uid]);

  // 2) Load favorite pilots once
  useEffect(() => {
    if (!currentUser.uid || pilotsLoaded) return;
    (async () => {
      try {
        await loadFavoritePilots(currentUser.uid);
      } catch (e) {
        console.error(e);
        setError("Ошибка при получении избранных пилотов");
      } finally {
        setPilotsLoaded(true);
      }
    })();
  }, [currentUser.uid, pilotsLoaded]);

  // 3) Load favorite constructors once
  useEffect(() => {
    if (!currentUser.uid || constructorsLoaded) return;
    (async () => {
      try {
        await loadFavoriteConstructors(currentUser.uid);
      } catch (e) {
        console.error(e);
        setError("Ошибка при получении конструкторов");
      } finally {
        setConstructorsLoaded(true);
      }
    })();
  }, [currentUser.uid, constructorsLoaded]);

  // 4) Load favorite tracks once
  useEffect(() => {
    if (!currentUser.uid || tracksLoaded) return;
    (async () => {
      try {
        await loadFavoriteTracks(currentUser.uid);
      } catch (e) {
        console.error(e);
        setError("Ошибка при получении трасс");
      } finally {
        setTracksLoaded(true);
      }
    })();
  }, [currentUser.uid, tracksLoaded]);

  // 5) Load posts
  useEffect(() => {
    if (!currentUser.uid) return;
    const postsQuery = query(
      collection(db, "posts"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [currentUser.uid]);

  // 6) Turn off loading when all four sections loaded
  useEffect(() => {
    if (profileLoaded && pilotsLoaded && constructorsLoaded && tracksLoaded) {
      setLoading(false);
    }
  }, [profileLoaded, pilotsLoaded, constructorsLoaded, tracksLoaded]);

  // Data loaders

  const fetchUserAndFavorites = async (username) => {
    const userSnap = await getDocs(
      query(collection(db, "users"), where("username", "==", username))
    );
    if (userSnap.empty) {
      setError("Пользователь не найден");
      return;
    }
    setProfileUser(userSnap.docs[0].data());
  };

  const loadFavoritePilots = async (uid) => {
    const favSnap = await getDocs(
      query(collection(db, "favorites"), where("userId", "==", uid))
    );
    const pilotIds = favSnap.docs.map(d => d.data().pilotId);
    if (!pilotIds.length) {
      setFavoritePilots([]);
      return;
    }
    const res = await fetch("https://api.jolpi.ca/ergast/f1/2025/driverStandings.json");
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    const drivers = data.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings || [];
    setFavoritePilots(drivers.filter(d => pilotIds.includes(d.Driver.driverId)));
  };

  const loadFavoriteConstructors = async (uid) => {
    const snap = await getDocs(
      query(collection(db, "favoritesConstructors"), where("userId", "==", uid))
    );
    setFavoriteConstructors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const loadFavoriteTracks = async (uid) => {
    const snap = await getDocs(
      query(collection(db, "favoritesTracks"), where("userId", "==", uid))
    );
    setFavoriteTracks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchFollowersCount = async (uid) => {
    const snap = await getDocs(
      query(collection(db, "follows"), where("followingId", "==", uid))
    );
    setFollowersCount(snap.size);
  };


  const handleDeletePost = async (postId) => {
    await deleteDoc(doc(db, "posts", postId));
  };

  const handleEditPost = (post) => {
    setEditingPostId(post.id);
    setEditedText(post.text);
    setOpenMenuPostId(null);
  };

  const handleSaveEdit = async (postId) => {
    await updateDoc(doc(db, "posts", postId), { text: editedText });
    setEditingPostId(null);
    setEditedText("");
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditedText("");
  };

  const toggleMenu = (postId) => {
    setOpenMenuPostId(prev => (prev === postId ? null : postId));
  };

  useEffect(() => {
    if (activeRole) setVisibleRole(activeRole);
  }, [activeRole]);

  const [visibleRole, setVisibleRole] = useState(null);

  const togglePostComments = (postId) => {
    setActiveCommentsPostId(prev => (prev === postId ? null : postId));
  };

  const handlePilotSelect = (pilot) => {
    const last = normalizeName(pilot.Driver.familyName);
    navigate(`/pilot-details/${last}`);
  };

  const handleTrackSelect = (race) => {
    navigate(`/races/${race.round}`, { state: { race } });
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return "—";
    const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return "—";
    const dayMonth = date.toLocaleString("ru-RU", { day: "numeric", month: "long" });
    const time = date.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    return `${dayMonth} в ${time}`;
  };

  // Состояние вкладок
  const [activeTab, setActiveTab] = useState('posts');
  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
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

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!profileUser) {
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
        Ошибка: пользователь не найден
      </div>
    );
  }

  return (
    <div style={{ color: "white", padding: "0 15px", marginBottom: "130px" }}>
      
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
        <div style={{ width: "100%" }}>
          <div style={{ fontSize: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="truncate">{profileUser.firstName} {profileUser.lastName}</span>{" "} 
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
          width={100}
          height={100}
          style={{ borderRadius: "50%", background: "#D9D9D9" }}
        />
      </div>

      <button
        onClick={() => navigate("/create-post")}
        style={{
          marginTop: "10px",
          width: "100%",
          padding: "10px",
          color: "white",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Новый пост
      </button>

      {/* Вкладки */}
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
            
              <div style={{ top: 0, left: 0, width: "100%" }}>
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
            
          ) : (
            
              <div style={{ top: 0, left: 0, width: "100%", marginTop: "10px" }}>
                {/* Секция избранных пилотов */}
                {favoritePilots.length > 0 ? (
                  <>
                    <h3 style={{ marginTop: "10px", marginBottom: "10px", width: "calc(100% - 40px)" }}>
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
                  <p style={{ textAlign: "center", marginTop: "50px" }}>Нет избранных пилотов</p>
                )}

                {/* Секция избранных конструкторов */}
                {favoriteConstructors.length > 0 ? (
                  <>
                    <h3 style={{ marginTop: "20px", marginBottom: "10px", width: "calc(100% - 40px)" }}>
                      {favoriteConstructors.length === 1 ? "Любимый конструктор:" : "Любимые конструкторы:"}
                    </h3>
                    {favoriteConstructors.map((fav) => (
                      <div
                        key={fav.id}
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
                  <p style={{ textAlign: "center", marginTop: "20px" }}>Нет избранных конструкторов</p>
                )}

                {/* Секция избранных трасс */}
                {favoriteTracks.length > 0 ? (
                  <>
                    <h3 style={{ marginTop: "20px", marginBottom: "10px", width: "calc(100% - 40px)" }}>
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
                            src={`https://flagcdn.com/w320/${countryToFlag[fav.raceData.Circuit.Location.country] || fav.raceData.Circuit.Location.country.toLowerCase()}.png`}
                            alt={fav.raceData.Circuit.Location.country}
                            style={{
                              width: "50px",
                              height: "50px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              objectPosition: "center"
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
                          {fav.raceData.Circuit.circuitName}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p style={{ textAlign: "center", marginTop: "20px" }}>Нет избранных трасс</p>
                )}
              </div>
          )}
        </div>
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
    </div>
  );
};

export default Profile;
