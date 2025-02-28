import "./App.css";
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import Standings from "./screens/Standings";
import ConstructorDetails from "./screens/ConstructorDetails";
import RacesList from "./screens/RacesList";
import RaceDetails from "./screens/RaceDetails";
import BottomNavigation from "./components/BottomNavigation";
import logo from "./screens/images/logo-250.png";
import Feed from "./screens/Feed";
import PilotDetails from "./screens/PilotDetails";
import LegendDetails from "./screens/LegendDetails";
import Auth from "./screens/Auth";
import Profile from "./screens/Profile";
import UserSearch from "./screens/UserSearch"; // Компонент поиска пользователей
import { db } from "./firebase";
import { collection, query, where, getDocs, setDoc } from "firebase/firestore";
import ProgressBar from "./components/ProgressBar";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Состояния
  const [activePage, setActivePage] = useState(0);
  const [selectedConstructor, setSelectedConstructor] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [dbCheckCompleted, setDbCheckCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Получаем данные пользователя из Telegram или задаем тестовые данные
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
          uid: userData.id, // Используем userData.id как uid
          photoUrl: userData.photo_url || "",
        });
      } else {
        setUser({
          name: "Гость",
          uid: null,
          photoUrl: ""
        });
      }
    } else {
      setUser({
        name: "TestUser",
        uid: "test_uid",
        photoUrl: ""
      });
    }
  }, []);

  // Если у пользователя нет photoUrl, выполняем загрузку (например, дефолтного изображения)
  useEffect(() => {
    const uploadUserPhoto = async () => {
      if (user && !user.photoUrl) {
        try {
          const defaultImage = "DEFAULT_IMAGE_BASE64_OR_URL";
          const formData = new FormData();
          formData.append("image", defaultImage);
          formData.append("key", "YOUR_IMGBB_API_KEY");
          const response = await fetch("https://api.imgbb.com/1/upload", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          const newPhotoUrl = data.data.url;
          // Обновляем Firestore, если пользователь уже существует
          const q = query(collection(db, "users"), where("username", "==", user.name));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            await setDoc(userDoc.ref, { photoUrl: newPhotoUrl }, { merge: true });
          }
          // Обновляем локальное состояние пользователя
          setUser((prevUser) => ({
            ...prevUser,
            photoUrl: newPhotoUrl,
          }));
        } catch (error) {
          console.error("Ошибка загрузки фото:", error);
        }
      }
    };
    if (user) {
      uploadUserPhoto();
    }
  }, [user]);

  // Проверка наличия пользователя в базе данных (асинхронно)
  useEffect(() => {
    if (!user) return;
    const checkUserInDB = async () => {
      const q = query(collection(db, "users"), where("username", "==", user.name));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
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
    };
    checkUserInDB();
  }, [user, navigate, initialLoad]);

  // Обновление progress bar во время загрузки
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 2 : prev));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Завершаем progress bar и запускаем анимацию скрытия загрузочного экрана
  useEffect(() => {
    if (dbCheckCompleted) {
      setTimeout(() => {
        setContentLoaded(true);
        setProgress(100);
      }, 300);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setLoading(false), 600);
      }, 900);
    }
  }, [dbCheckCompleted]);

  // Функция для навигации между страницами
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
      // Переход к профилю текущего пользователя
      navigate(`/profile/${user.uid}`);
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

  const handleSelectRace = (race) => {
    setSelectedRace(race);
    navigate("/race-details");
  };

  const handleBackToRaces = () => {
    setSelectedRace(null);
    navigate("/races");
  };

  const handleBackToConstructors = () => {
    setSelectedConstructor(null);
    navigate("/standings");
  };

  const handleBackToPilots = () => {
    navigate("/standings");
  };

  if (!dbCheckCompleted) {
    return <div> </div>;
  }

  return (
    <div
      className="App"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#1D1D1F",
      }}
    >
      {loading && (
        <div className={`loading-screen ${fadeOut ? "fade-out" : "fade-in"}`}>
          <img style={{ height: "50px" }} src={logo} alt="Логотип" className="logo" />
        </div>
      )}

      {!loading && (
        <>
          <div className="content-container">
            <TransitionGroup>
              <CSSTransition key={location.pathname} classNames="page" timeout={500}>
                <div key={location.pathname}>
                  <Routes location={location}>
                    <Route path="/" element={<Auth user={user} />} />
                    <Route path="/feed" element={<Feed userName={user?.name} />} />
                    <Route path="/standings" element={<Standings onConstructorSelect={handleSelectConstructor} />} />
                    <Route path="/pilot-details/:lastName" element={<PilotDetails />} />
                    <Route path="/races" element={<RacesList onRaceSelect={handleSelectRace} />} />
                    <Route
                      path="/constructor-details"
                      element={<ConstructorDetails constructor={selectedConstructor} goBack={handleBackToConstructors} />}
                    />
                    <Route path="/races/:raceId" element={<RaceDetails />} />
                    <Route path="/legend-details/:lastName" element={<LegendDetails />} />
                    {/* Маршрут профиля с параметром uid */}
                    <Route path="/profile/:uid" element={<Profile currentUser={user} />} />
                    <Route path="/usersearch" element={<UserSearch currentUser={user} />} />
                  </Routes>
                </div>
              </CSSTransition>
            </TransitionGroup>
          </div>
          <BottomNavigation setActivePage={handlePageChange} />
        </>
      )}
    </div>
  );
}

export default App;
