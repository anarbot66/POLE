// App.js
import "./App.css";
import React, { useState, useEffect, useContext } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import Standings from "./screens/standings/Standings";
import ConstructorDetails from "./screens/constructor/teamDetails/ConstructorDetails.js";
import RacesList from "./screens/races/RacesList";
import RaceDetails from "./screens/races/RaceDetails";
import BottomNavigation from "./screens/components/BottomNavigation";
import PilotDetails from "./screens/pilots/driverDetails/PilotDetails.js";
import Auth from "./screens/user/Auth";
import Feed from "./screens/user/feed/Feed.js";
import Profile from "./screens/user/Profile";
import UserProfile from "./screens/user/UserProfile";
import FollowersList from "./screens/user/FollowersList";
import UserSearch from "./screens/user/UserSearch";
import NewsCreator from "./screens/admin/NewsCreator";
import NewsDetail from "./screens/user/NewsDetails";
import Services from "./screens/user/Services";
import InfoPage from "./screens/user/InfoPage";
import LoadingScreen from "./screens/components/LoadingScreen";
import ChampionsList from "./screens/pilots/champions/ChampionsList.js";
import CreatorForm from "./screens/user/creators/CreatorForm.js";
import CreatorView from "./screens/user/creators/CreatorView.js";
import CreatePost from "./screens/user/components/CreatePost.js";
import CreatorPanel from "./screens/user/creators/creatorPanel/CreatorPanel.js";
import ArticleCreator from "./screens/user/creators/creatorPanel/ArticleCreator.js";
import EditArticle from "./screens/user/creators/creatorPanel/EditArticle.js";
import ArticlesList from "./screens/user/creators/creatorPanel/ArticlesList.js";
import ArticleView from "./screens/user/creators/creatorPanel/ArticleView.js";
import ClubCreate from "./screens/user/creators/ClubCreate.js";
import ClubPage from "./screens/user/creators/ClubPage.js";
import ClubArticles from "./screens/user/creators/creatorPanel/ClubArticles.js";
import LikeButton from "./screens/user/creators/components/LikeButton.js";
import ClubSearch from "./screens/user/creators/ClubSearch.js";
import ClubSettings from "./screens/user/creators/ClubSettings.js";
import SettingsPage from "./screens/user/SettingsPage.js";

import { db } from "./firebase";
import { collection, query, where, getDocs, setDoc } from "firebase/firestore";
import { ThemeContext } from "./screens/user/ThemeContext.js"; // Импортируем контекст темы

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [, setActivePage] = useState(0);
  const [, setSelectedRace] = useState(null);
  const [, setContentLoaded] = useState(false);
  const [selectedConstructor, setSelectedConstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  // Состояние пользователя с функцией setUser (она будет передаваться как setCurrentUser)
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [dbCheckCompleted, setDbCheckCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const { theme } = useContext(ThemeContext);

  // Получаем функцию для обновления выбранной темы из ThemeContext
  const { setSelectedTheme } = useContext(ThemeContext);

  // Инициализация данных пользователя из Telegram или по умолчанию
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.expand();
      const userData = window.Telegram.WebApp.initDataUnsafe?.user;
      if (userData) {
        const name = userData.username
          ? userData.username
          : `${userData.first_name}${userData.last_name ? " " + userData.last_name : ""}`;
        setUser({
          name: name,
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
          uid: userData.uid,
          photoUrl: userData.photo_url || "",
        });
      } else {
        setUser({
          name: "anarbot66",
          uid: "",
          photoUrl: ""
        });
      }
    } else {
      setUser({
        name: "",
        uid: "",
        photoUrl: ""
      });
    }
    setProgress(10);
  }, []);

  // Загрузка фото пользователя, если его нет
  useEffect(() => {
    const uploadUserPhoto = async () => {
      if (user && !user.photoUrl) {
        try {
          const defaultImage = "DEFAULT_IMAGE_BASE64_OR_URL";
          const formData = new FormData();
          formData.append("image", defaultImage);
          formData.append("key", "2efcc5045381407287404d66cbe72876");
          const response = await fetch("https://api.imgbb.com/1/upload", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          const newPhotoUrl = data.data.url;
          const q = query(collection(db, "users"), where("username", "==", user.name));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            await setDoc(userDoc.ref, { photoUrl: newPhotoUrl }, { merge: true });
          }
          setUser((prevUser) => ({
            ...prevUser,
            photoUrl: newPhotoUrl,
          }));
          setProgress((prev) => Math.min(prev + 20, 90));
        } catch (error) {
          console.error("Ошибка загрузки фото:", error);
        }
      }
    };
    if (user) {
      uploadUserPhoto();
    }
  }, [user]);

  // Проверка пользователя в БД и загрузка данных (включая selectedTheme)
  useEffect(() => {
    if (!user) return;
    const checkUserInDB = async () => {
      const q = query(collection(db, "users"), where("username", "==", user.name));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0].data();
        setUser((prevUser) => ({
          ...prevUser,
          uid: userDoc.uid,
          firstName: userDoc.firstName,
          lastName: userDoc.lastName,
          photoUrl: userDoc.photoUrl,
          role: userDoc.role ?? null,
          selectedTheme: userDoc.selectedTheme || "default", // Добавляем выбранную тему
        }));
        setIsAuthenticated(true);
        if (initialLoad) {
          setInitialLoad(false);
          navigate("/feed");
        }
      } else {
        setIsAuthenticated(false);
        if (initialLoad) {
          setInitialLoad(false);
          navigate("/");
        }
      }
      setDbCheckCompleted(true);
      setProgress((prev) => Math.min(prev + 30, 90));
    };
    checkUserInDB();
  }, [user, navigate, initialLoad]);

  // Симуляция дополнительных обновлений progress
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 2 : prev));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Завершаем загрузку, когда проверка БД завершена
  useEffect(() => {
    if (dbCheckCompleted) {
      setTimeout(() => {
        setContentLoaded(true);
        setProgress(100);
      }, 500);
      setTimeout(() => { 
        setFadeOut(true);
        setTimeout(() => setLoading(false), 600);
      }, 1500);
    }
  }, [dbCheckCompleted]);

  // Синхронизация выбранной темы в ThemeProvider с полем selectedTheme в user
  useEffect(() => {
    if (user && user.selectedTheme) {
      setSelectedTheme(user.selectedTheme);
    }
  }, [user, setSelectedTheme]);

  const handlePageChange = (page) => {
    setSelectedConstructor(null);
    setSelectedRace(null);
    setActivePage(page);
    if (page === 0) {
      navigate(isAuthenticated ? "/feed" : "/");
    } else if (page === 1) {
      navigate("/standings");
    } else if (page === 2) {
      navigate("/races");
    } else if (page === 3) {
      navigate(isAuthenticated ? "/services" : "/");
    } else if (page === 4) {
      navigate(isAuthenticated ? "/profile" : "/");
    }
  };

  const handleSelectConstructor = (constructor) => {
    setSelectedConstructor({
      ...constructor,
      position: constructor.position,
      points: constructor.points,
    });
    navigate("/constructor-details");
  };

  const handleBackToConstructors = () => {
    setSelectedConstructor(null);
    navigate("/standings");
  };

  if (!dbCheckCompleted) {
    return <div></div>;
  }

  return (
    <div
      className="App"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {loading && <LoadingScreen progress={progress} fadeOut={fadeOut} />}
      {!loading && (
        <>
          <div className="content-container">
            <TransitionGroup>
              <CSSTransition key={location.pathname} classNames="page" timeout={500}>
                <div key={location.pathname}>
                  <Routes location={location}>
                    <Route path="/" element={<Auth user={user} />} />
                    <Route path="/feed" element={<Feed currentUser={user} onFeedLoad={() => setLoading(false)} />} />
                    <Route path="/standings" element={<Standings onConstructorSelect={handleSelectConstructor} currentUser={user} />} />
                    <Route path="/pilot-details/:lastName" element={<PilotDetails currentUser={user} />} />
                    <Route path="/races" element={<RacesList currentUser={user} />} />
                    <Route path="/constructor-details" element={<ConstructorDetails constructor={selectedConstructor} goBack={handleBackToConstructors} currentUser={user} />} />
                    <Route path="/races/:raceId" element={<RaceDetails currentUser={user} />} />
                    <Route path="/profile" element={<Profile currentUser={user} />} />
                    <Route path="/userprofile/:uid" element={<UserProfile currentUser={user} />} />
                    <Route path="/usersearch" element={<UserSearch currentUser={user} />} />
                    <Route path="/userprofile/:username/followers" element={<FollowersList currentUser={user} />} />
                    <Route path="/news/new" element={<NewsCreator />} />
                    <Route path="/news/:id" element={<NewsDetail />} />
                    <Route path="/services" element={<Services currentUser={user} />} />
                    <Route path="/info" element={<InfoPage />} />
                    <Route path="/champions" element={<ChampionsList />} />
                    <Route path="/creatorForm" element={<CreatorForm currentUser={user} />} />
                    <Route path="/creatorView" element={<CreatorView currentUser={user} />} />
                    <Route path="/create-post" element={<CreatePost currentUser={user} />} />
                    <Route path="/creator-panel" element={<CreatorPanel currentUser={user} />} />
                    <Route path="/creator-new-post" element={<ArticleCreator currentUser={user} />} />
                    <Route path="/articles/edit/:id" element={<EditArticle currentUser={user} />} />
                    <Route path="/articles" element={<ArticlesList currentUser={user} />} />
                    <Route path="/articles/view/:articleId" element={<ArticleView />} />
                    <Route path="/club-create" element={<ClubCreate currentUser={user} />} />
                    <Route path="/club/:clubId" element={<ClubPage currentUser={user} />} />
                    <Route path="/club-articles" element={<ClubArticles currentUser={user} />} />
                    <Route path="/like" element={<LikeButton currentUser={user} />} />
                    <Route path="/club-search" element={<ClubSearch currentUser={user} />} />
                    <Route path="/club-settings" element={<ClubSettings currentUser={user} />} />
                    <Route path="/settings" element={<SettingsPage currentUser={user} setCurrentUser={setUser} />} />
                  </Routes>
                </div>
              </CSSTransition>
            </TransitionGroup>
          </div>
          <BottomNavigation setActivePage={handlePageChange} currentUser={user} />
        </>
      )}
    </div>
  );
}

export default App;
