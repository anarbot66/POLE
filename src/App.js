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

import { db } from "./firebase";
import { collection, query, where, getDocs, setDoc } from "firebase/firestore";
import DailyRewards from "./screens/user/services/DailyRewards.js";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [, setActivePage] = useState(0);
  const [, setSelectedRace] = useState(null);
  const [, setContentLoaded] = useState(false);
  const [selectedConstructor, setSelectedConstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [dbCheckCompleted, setDbCheckCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

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
        setUser({ name: "", uid: "", photoUrl: "" });
      }
    } else {
      setUser({ name: "", uid: "", photoUrl: "" });
    }
    setProgress(10);
  }, []);

  // Загрузка фото пользователя
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
          setUser((u) => ({ ...u, photoUrl: newPhotoUrl }));
          setProgress((p) => Math.min(p + 20, 90));
        } catch (error) {
          console.error("Ошибка загрузки фото:", error);
        }
      }
    };
    if (user) uploadUserPhoto();
  }, [user]);

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

  const handleSelectConstructor = (c) => {
    setSelectedConstructor({ ...c, position: c.position, points: c.points });
    navigate("/constructor-details");
  };
  const handleBackToConstructors = () => {
    setSelectedConstructor(null);
    navigate("/standings");
  };

  if (!dbCheckCompleted) return <div />;

  return (
    <div className="App" style={{ height: "100%", display: "flex", flexDirection: "column", marginTop: '80px' }}>
      {loading && <LoadingScreen progress={progress} fadeOut={fadeOut} />}
      {!loading && (
        <>
          <div className="content-container">
            <TransitionGroup>
              <CSSTransition key={location.pathname} classNames="page" timeout={500}>
                <div key={location.pathname}>
                  <Routes location={location}>
                    <Route path="/" element={<Auth user={user} />} />
                    <Route path="/standings" element={<Standings onConstructorSelect={handleSelectConstructor} currentUser={user} />} />
                    <Route path="/pilot-details/:lastName" element={<PilotDetails currentUser={user} />} />
                    <Route path="/races" element={<RacesList currentUser={user} />} />
                    <Route path="/constructor-details" element={<ConstructorDetails constructor={selectedConstructor} goBack={handleBackToConstructors} currentUser={user} />} />
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
