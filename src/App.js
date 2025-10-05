// App.js
import "./App.css";
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import Standings from "./screens/standings/Standings";
import ConstructorDetails from "./screens/constructor/teamDetails/ConstructorDetails.js";
import RacesList from "./screens/races/RacesList";
import RaceDetails from "./screens/races/RaceDetails";
import BottomNavigation from "./screens/components/BottomNavigation";
import PilotDetails from "./screens/pilots/driverDetails/PilotDetails.js";
import Auth from "./screens/user/Auth";
import Profile from "./screens/user/Profile";
import UserProfile from "./screens/user/UserProfile";
import FollowersList from "./screens/user/FollowersList";
import UserSearch from "./screens/user/UserSearch";
import Services from "./screens/user/Services";
import InfoPage from "./screens/user/InfoPage";
import LoadingScreen from "./screens/components/LoadingScreen";
import ChampionsList from "./screens/pilots/champions/ChampionsList.js";
import CreatePost from "./screens/user/components/CreatePost.js";
import { usePreloadImages } from "./screens/hooks/usePreloadImages";
import HallOfFameList from "./screens/pilots/halloffame/HallOfFameList.js";
import FavoritesDashboard from "./screens/user/fav/FavoritesDashboard.js";
import MiniGamesPage from "./screens/user/activity/MiniGamesPage.js";
import Settings from "./screens/user/services/Settings.js";
import MyCards from "./screens/myteam/cards/MyCards.js";
import PackOpeningPage from "./screens/myteam/packopen/PackOpeningPage.js";
import TeamBuilder from "./screens/myteam/team/TeamBuilder.js";


import { db } from "./firebase";
import { collection, query, where, getDocs, setDoc } from "firebase/firestore";
import DailyRewards from "./screens/user/services/DailyRewards.js";
import NextRaceFantasy from "./screens/myteam/NextRaceFantasy.js";
import PackOpener from "./screens/myteam/packopen/PackOpener.js";
import MyTeam from "./screens/myteam/MyTeam.js";
import MarketplacePage from "./screens/myteam/marketplace/MarketplacePage.js";
import CardDetails from "./screens/myteam/cards/CardDetails.js";
import EventListPage from "./screens/myteam/events/EventListPage.js";
import EventPage from "./screens/myteam/events/EventPage.js";
import TradesPage from "./screens/myteam/trade/TradesPage.js";
import Leaderboard from "./screens/myteam/leaderboards/Leaderboard.js";
import CardShop from "./screens/myteam/mysteryshop/CardShop.js";
import AdminGrantPanel from "./screens/admin/AdminGrantPanel.js";

function App() {
  usePreloadImages();
  const navigate = useNavigate();
  const location = useLocation();
  const [, setActivePage] = useState(0);
  const [, setSelectedRace] = useState(null);
  const [, setContentLoaded] = useState(false);
  const [, setSelectedConstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [dbCheckCompleted, setDbCheckCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadTried, setUploadTried] = useState(false);


  // Инициализация данных пользователя
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.expand();
      const userData = window.Telegram.WebApp.initDataUnsafe?.user;
      if (userData) {
        const name = userData.username
          ? userData.username
          : `${userData.first_name}${userData.last_name ? " " + userData.last_name : ""}`;
        setUser({
          name,
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
          uid: userData.uid,
          photoUrl: userData.photo_url || "",
        });
      } else {
        setUser({ name: "anarbot66", uid: "", photoUrl: "" });
      }
    } else {
      setUser({ name: "", uid: "", photoUrl: "" });
    }
    setProgress(10);
  }, []);

  // Загрузка фото пользователя
  useEffect(() => {
    const uploadUserPhoto = async () => {
      // Проверки: есть user, у пользователя нет photoUrl и мы ещё не пробовали загрузку
      if (!user || user.photoUrl || uploadTried) return;
  
      setUploadTried(true); // помечаем, что попытка будет/уже была
      try {
        // --- ВАЖНО: подставь сюда реальный base64 или файл, иначе imgbb вернёт 400 ---
        const defaultImage = "DEFAULT_IMAGE_BASE64_OR_URL";
        if (!defaultImage || defaultImage === "DEFAULT_IMAGE_BASE64_OR_URL") {
          // Не делать запрос если нет валидного изображения
          console.debug("uploadUserPhoto: no default image provided — skipping upload.");
          return;
        }
  
        const formData = new FormData();
        // imgbb принимает поле "image" с base64 (без префикса data:) или file
        formData.append("image", defaultImage);
        // лучше передавать ключ как параметр в URL, но форма тоже работает у большинства
        // formData.append("key", "YOUR_API_KEY"); // опционально
  
        const IMGBB_KEY = "2efcc5045381407287404d66cbe72876"; // убедись, что ключ валидный
        const url = `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`;
  
        const response = await fetch(url, {
          method: "POST",
          body: formData,
        });
  
        // всегда парсим json, но проверяем status / success
        const data = await response.json();
  
        if (!response.ok || !data || data.success !== true) {
          // обработаем ошибку единоразово — подробности в debug, но не будем кидать исключение
          console.warn("uploadUserPhoto: imgbb upload failed", {
            status: response.status,
            statusText: response.statusText,
            body: data,
          });
          return;
        }
  
        const newPhotoUrl = data.data?.url;
        if (!newPhotoUrl) {
          console.warn("uploadUserPhoto: no url returned from imgbb", data);
          return;
        }
  
        // Пишем url в Firestore (если пользователь найден по username)
        const q = query(collection(db, "users"), where("username", "==", user.name));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          // merge: true сохраняет существующие поля
          await setDoc(userDoc.ref, { photoUrl: newPhotoUrl }, { merge: true });
        }
  
        // Обновляем локально
        setUser((u) => ({ ...u, photoUrl: newPhotoUrl }));
        setProgress((p) => Math.min(p + 20, 90));
      } catch (error) {
        // логируем ошибку один раз — без спама
        console.error("uploadUserPhoto: unexpected error", error);
      }
    };
  
    uploadUserPhoto();
  }, [user, uploadTried]); // зависимость uploadTried гарантирует одну попытку
  

  // Проверка пользователя в БД
  useEffect(() => {
    if (!user) return;
    const checkUserInDB = async () => {
      const q = query(collection(db, "users"), where("username", "==", user.name));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const doc = snap.docs[0].data();
        setUser((u) => ({
          ...u,
          uid: doc.uid,
          firstName: doc.firstName,
          lastName: doc.lastName,
          photoUrl: doc.photoUrl,
          role: doc.role ?? null,
          selectedTheme: doc.selectedTheme || "default",
          gsCurrency: doc.gsCurrency ?? 0,
          apexPoints: doc.apexPoints ?? 0,
          lastPlayedWordle: doc.lastPlayedWordle ?? null,
          bestRunner: doc.bestRunner ?? 0,
          runnerAttempts: doc.runnerAttempts ?? 0,
          runnerAttemptsDate: doc.runnerAttemptsDate ?? null,
          fantasyPoints: doc.fantasyPoints ?? 0,
          cards: doc.cards || {}
        }));        
        setIsAuthenticated(true);
        if (initialLoad) {
          setInitialLoad(false);
          
          navigate("/standings");
        }
      } else {
        setIsAuthenticated(false);
        if (initialLoad) {
          setInitialLoad(false);
          navigate("/");
        }
      }
      setDbCheckCompleted(true);
      setProgress((p) => Math.min(p + 30, 90));
    };
    checkUserInDB();
  }, [user, navigate, initialLoad]);

  // Прогресс-бар
  useEffect(() => {
    if (loading) {
      const int = setInterval(() => {
        setProgress((p) => (p < 90 ? p + 2 : p));
      }, 100);
      return () => clearInterval(int);
    }
  }, [loading]);

  // Завершение загрузки
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


  const handlePageChange = (page) => {
    setSelectedConstructor(null);
    setSelectedRace(null);
    setActivePage(page);
    switch (page) {
      case 0:
        return navigate(isAuthenticated ? "/profile" : "/");
      case 1:
        return navigate("/standings");
      case 2:
        return navigate("/races");
      case 3:
        return navigate(isAuthenticated ? "/services" : "/");
      case 4:
        return navigate(isAuthenticated ? "/profile" : "/");
      default:
        return;
    }
  };

  if (!dbCheckCompleted) return <div />;

  return (
    <div className="App" style={{ height: "100%", display: "flex", flexDirection: "column"}}>
      {loading && <LoadingScreen progress={progress} fadeOut={fadeOut} />}
      {!loading && (
        <>
          <div className="content-container">
            <TransitionGroup>
              <CSSTransition key={location.pathname} classNames="page" timeout={500}>
                <div key={location.pathname}>
                  <Routes location={location}>
                    <Route path="/" element={<Auth user={user} />} />
                    <Route path="/standings" element={<Standings currentUser={user} />} />
                    <Route path="/pilot-details/:lastName" element={<PilotDetails currentUser={user} />} />
                    <Route path="/races" element={<RacesList currentUser={user} />} />
                    <Route path="/constructor-details/:id" element={<ConstructorDetails currentUser={user} />} />
                    <Route path="/races/:raceId" element={<RaceDetails currentUser={user} />} />
                    <Route path="/profile" element={<Profile currentUser={user} />} />
                    <Route path="/userprofile/:uid" element={<UserProfile currentUser={user} />} />
                    <Route path="/usersearch" element={<UserSearch currentUser={user} />} />
                    <Route path="/userprofile/:username/followers" element={<FollowersList currentUser={user} />} />
                    <Route path="/services" element={<Services currentUser={user} />} />
                    <Route path="/info" element={<InfoPage />} />
                    <Route path="/champions" element={<ChampionsList />} />
                    <Route path="/create-post" element={<CreatePost currentUser={user} />} />
                    <Route path="/daily-rewards" element={<DailyRewards currentUser={user} />} />
                    <Route path="/hall-of-fame" element={<HallOfFameList/>} />
                    <Route path="/favorites" element={<FavoritesDashboard currentUser={user}/>} />
                    <Route path="/activity" element={<MiniGamesPage currentUser={user}/>} />
                    <Route path="/settings" element={<Settings currentUser={user}/>} />
                    <Route path="/fantasy" element={<NextRaceFantasy currentUser={user}/>} />
                    <Route path="/pack-opener" element={<PackOpener currentUser={user}/>} />
                    <Route path="/collection" element={<MyCards currentUser={user}/>} />
                    <Route path="/my-team" element={<MyTeam currentUser={user}/>} />
                    <Route path="/pack-opening" element={<PackOpeningPage currentUser={user} />} />
                    <Route path="/marketplace" element={<MarketplacePage currentUser={user} />} />
                    <Route path="/card/:cardId" element={<CardDetails currentUser={user} />} />
                    <Route path="/events" element={<EventListPage currentUser={user}/>} />
                    <Route path="/events/:eventId" element={<EventPage user={user}/>} />
                    <Route path="/team" element={<TeamBuilder currentUser={user}/>} />
                    <Route path="/trade" element={<TradesPage currentUser={user}/>} />
                    <Route path="/leaderboard" element={<Leaderboard currentUser={user}/>} />
                    <Route path="/shop" element={<CardShop currentUser={user}/>} />
                    <Route path="//admin-grant" element={<AdminGrantPanel currentUser={user}/>} />
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
