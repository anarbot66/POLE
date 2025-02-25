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
import { db } from "./firebase"; // Импорт Firestore
import { collection, query, where, getDocs } from "firebase/firestore"; // Методы Firestore
import ProgressBar from "./components/ProgressBar"; // Компонент прогресс-бара

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

  // Получаем данные пользователя из Telegram
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
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          id: userData.id,
          photo_url: userData.photo_url || '',
        });
      } else {
        setUser({
          name: "Гость",
          id: null,
        });
      }
    } else {
      setUser({
        name: "TestUser",
        id: null,
      });
    }
  }, []);

  // Проверка наличия пользователя в базе данных (асинхронно)
  useEffect(() => {
    if (!user) return; // Не выполняем, пока нет данных пользователя
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
      // Как только поиск завершился, помечаем, что БД проверена
      setDbCheckCompleted(true);
    };
    checkUserInDB();
  }, [user, navigate, initialLoad]);

  // Обновление progress bar во время загрузки (параллельно с запросом к БД)
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        // Увеличиваем progress до 90%, оставляя место для завершающего этапа
        setProgress((prev) => (prev < 90 ? prev + 2 : prev));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Как только поиск в БД завершен, завершаем progress bar и запускаем fade-out
  useEffect(() => {
    if (dbCheckCompleted) {
      // Устанавливаем progress в 100% после небольшой задержки
      setTimeout(() => {
        setContentLoaded(true);
        setProgress(100);
      }, 300);
      // Запускаем анимацию скрытия экрана загрузки
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
      navigate("/profile");
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
                    <Route path="/profile" element={<Profile user={user} />} />
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