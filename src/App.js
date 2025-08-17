import "./App.css";
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import axios from "axios";

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
import InitDataContext from "./screens/hooks/InitDataContext.js";
import DailyRewards from "./screens/user/services/DailyRewards.js";
import Header from "./screens/components/Header.js";
import FavoritesDashboard from "./screens/user/fav/FavoritesDashboard.js";
import MiniGamesPage from "./screens/user/activity/MiniGamesPage.js";
import { initTheme } from "./screens/hooks/theme.js";
import Settings from "./screens/user/services/Settings.js";

function App() {
  usePreloadImages();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dbCheckCompleted, setDbCheckCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  const initData = window.Telegram?.WebApp?.initData || null;

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.expand();

      const authUser = async () => {
        try {
          const res = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/auth/telegram`,
            { initData },
            { withCredentials: true }
          );
          if (res.data.user) {
            setUser(res.data.user);
            setIsAuthenticated(true);
            navigate("/standings");
          }
        } catch (err) {
          console.error("Auth failed:", err);
          setIsAuthenticated(false);
          navigate("/");
        }
        setDbCheckCompleted(true);
      };

      if (initData) authUser();
    }
  }, [navigate, initData]);

  useEffect(() => {
    initTheme(user);
  }, [user]);

  // Fake progress bar
  useEffect(() => {
    if (loading) {
      const int = setInterval(() => {
        setProgress((p) => (p < 90 ? p + 2 : p));
      }, 100);
      return () => clearInterval(int);
    }
  }, [loading]);

  useEffect(() => {
    if (dbCheckCompleted) {
      setTimeout(() => {
        setProgress(100);
        setFadeOut(true);
        setTimeout(() => setLoading(false), 600);
      }, 1000);
    }
  }, [dbCheckCompleted]);

  if (!dbCheckCompleted) return <div />;

  return (
    <InitDataContext.Provider value={initData}>
      <div className="App" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
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
                      <Route path="/hall-of-fame" element={<HallOfFameList />} />
                      <Route path="/favorites" element={<FavoritesDashboard currentUser={user} />} />
                      <Route path="/activity" element={<MiniGamesPage currentUser={user} />} />
                      <Route path="/settings" element={<Settings currentUser={user} />} />
                    </Routes>
                  </div>
                </CSSTransition>
              </TransitionGroup>
            </div>
            <BottomNavigation setActivePage={() => {}} currentUser={user} />
          </>
        )}
      </div>
    </InitDataContext.Provider>
  );
}

export default App;
