// App.js
import "./App.css";
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Navigate } from "react-router-dom";

import Standings from "./screens/standings/Standings";
import ConstructorDetails from "./screens/constructor/teamDetails/ConstructorDetails";
import RacesList from "./screens/races/RacesList";
import RaceDetails from "./screens/races/RaceDetails";
import Profile from "./screens/user/Profile";
import UserProfile from "./screens/user/UserProfile";
import FollowersList from "./screens/user/FollowersList";
import UserSearch from "./screens/user/UserSearch";
import Services from "./screens/user/Services";
import InfoPage from "./screens/user/InfoPage";
import ChampionsList from "./screens/pilots/champions/ChampionsList";
import CreatePost from "./screens/user/components/CreatePost";
import DailyRewards from "./screens/user/services/DailyRewards";
import HallOfFameList from "./screens/pilots/halloffame/HallOfFameList";
import FavoritesDashboard from "./screens/user/fav/FavoritesDashboard";
import MiniGamesPage from "./screens/user/activity/MiniGamesPage";
import Settings from "./screens/user/services/Settings";
import PilotDetails from "./screens/pilots/driverDetails/PilotDetails";

import LoadingScreen from "./screens/components/LoadingScreen";
import BottomNavigation from "./screens/components/BottomNavigation";
import Header from "./screens/components/Header";

import { usePreloadImages } from "./screens/hooks/usePreloadImages";
import { initTheme } from "./screens/hooks/theme";

const API = "http://37.1.199.12:5000";

function App() {
  // Preload images
  usePreloadImages();

  // Configure axios
  axios.defaults.baseURL = API;
  const savedToken = localStorage.getItem("token");
  if (savedToken) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
  }

  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);

  // 1) Try restore session from existing token
  useEffect(() => {
    if (!savedToken) {
      setLoading(false);
      return;
    }
    axios
      .get("/auth/me")
      .then((res) => {
        setCurrentUser(res.data.user);
        initTheme(res.data.user);
        navigate("/standings");
      })
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, [navigate, savedToken]);

  // 2) If no session but have Telegram initData, perform Telegram login
  useEffect(() => {
    if (currentUser) return; // already logged in
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) {
      setLoading(false);
      return;
    }
    axios
      .post("/auth/telegram-login", { initData })
      .then((res) => {
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setCurrentUser(user);
        initTheme(user);
        navigate("/standings");
      })
      .catch((err) => {
        console.error("Telegram login failed:", err);
      })
      .finally(() => setLoading(false));
  }, [currentUser, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="App" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {currentUser && (
        <Header currentUser={currentUser} showNotifs={showNotifs} setShowNotifs={setShowNotifs} />
      )}

      <div className="content-container" style={{ flex: 1, position: "relative" }}>
        <TransitionGroup>
          <CSSTransition key={location.pathname} classNames="page" timeout={500}>
            <Routes location={location}>
            <Route path="/" element={<Navigate to="/standings" />} />
              <Route
                path="/standings"
                element={<Standings onConstructorSelect={() => {}} currentUser={currentUser} />}
              />
              <Route path="/pilot-details/:lastName" element={<PilotDetails currentUser={currentUser} />} />
              <Route path="/races" element={<RacesList currentUser={currentUser} />} />
              <Route
                path="/constructor-details"
                element={
                  <ConstructorDetails
                    constructor={null}
                    goBack={() => navigate(-1)}
                    currentUser={currentUser}
                  />
                }
              />
              <Route path="/races/:raceId" element={<RaceDetails currentUser={currentUser} />} />
              <Route path="/profile" element={<Profile currentUser={currentUser} />} />
              <Route path="/userprofile/:uid" element={<UserProfile currentUser={currentUser} />} />
              <Route path="/usersearch" element={<UserSearch currentUser={currentUser} />} />
              <Route
                path="/userprofile/:username/followers"
                element={<FollowersList currentUser={currentUser} />}
              />
              <Route path="/services" element={<Services currentUser={currentUser} />} />
              <Route path="/info" element={<InfoPage />} />
              <Route path="/champions" element={<ChampionsList />} />
              <Route path="/create-post" element={<CreatePost currentUser={currentUser} />} />
              <Route path="/daily-rewards" element={<DailyRewards currentUser={currentUser} />} />
              <Route path="/hall-of-fame" element={<HallOfFameList />} />
              <Route path="/favorites" element={<FavoritesDashboard currentUser={currentUser} />} />
              <Route path="/activity" element={<MiniGamesPage currentUser={currentUser} />} />
              <Route path="/settings" element={<Settings currentUser={currentUser} />} />
            </Routes>
          </CSSTransition>
        </TransitionGroup>
      </div>

      {currentUser && <BottomNavigation setActivePage={() => {}} currentUser={currentUser} />}
    </div>
  );
}

export default App;
