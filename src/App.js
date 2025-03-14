import "./App.css";
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import Standings from "./screens/standings/Standings";
import ConstructorDetails from "./screens/constructor/ConstructorDetails";
import RacesList from "./screens/races/RacesList";
import RaceDetails from "./screens/races/RaceDetails";
import BottomNavigation from "./screens/components/BottomNavigation";
import logo from "./screens/recources/images/logo-250.png";
import Feed from "./screens/user/Feed";
import PilotDetails from "./screens/pilots/PilotDetails";
import Auth from "./screens/user/Auth";
import Profile from "./screens/user/Profile";
import UserProfile from "./screens/user/UserProfile";
import FollowersList from "./screens/user/FollowersList";
import UserSearch from "./screens/user/UserSearch";
import NewsCreator from "./screens/admin/NewsCreator";
import NewsDetail from "./screens/user/NewsDetail ";
import { db } from "./firebase";
import { collection, query, where, getDocs, setDoc } from "firebase/firestore";
import Services from "./screens/user/Services";
import InfoPage from "./screens/user/InfoPage";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

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
          name: "",
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
  }, []);
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
        } catch (error) {
          console.error("Ошибка загрузки фото:", error);
        }
      }
    };
    if (user) {
      uploadUserPhoto();
    }
  }, [user]);

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
          role: userDoc.role ?? null, // Добавляем поле role, если его нет - ставим null
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
    };
    checkUserInDB();
  }, [user, navigate, initialLoad]);
  
  
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 2 : prev));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loading]);

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
      navigate("/services");
    } else if (page === 4) {
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


  const handleBackToConstructors = () => {
    setSelectedConstructor(null);
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
                    <Route path="/feed" element={<Feed currentUser={user} />} />
                    <Route path="/standings" element={<Standings onConstructorSelect={handleSelectConstructor} currentUser={user} />} />
                    <Route path="/pilot-details/:lastName" element={<PilotDetails currentUser={user} />} />
                    <Route path="/races" element={<RacesList currentUser={user} />} />
                    <Route
                      path="/constructor-details"
                      element={<ConstructorDetails constructor={selectedConstructor} goBack={handleBackToConstructors} />}
                    />
                    <Route path="/races/:raceId" element={<RaceDetails />} />
                    <Route path="/profile" element={<Profile currentUser={user} />} />
                    <Route path="/userprofile/:uid" element={<UserProfile currentUser={user} />} />
                    <Route path="/usersearch" element={<UserSearch currentUser={user} />} />
                    <Route path="/userprofile/:username/followers" element={<FollowersList currentUser={user}/>} />
                    <Route path="/news/new" element={<NewsCreator />} />
                    <Route path="/news/:id" element={<NewsDetail />} />
                    <Route path="/services" element={<Services currentUser={user}/>} />
                    <Route path="/info" element={<InfoPage />} />

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
