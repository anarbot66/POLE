import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useLocation, useParams } from "react-router-dom";

const Profile = ({ currentUser }) => {
  const location = useLocation();
  const { uid } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [favoritePilot, setFavoritePilot] = useState(null);

  // Проверяем, если uid совпадает с currentUser.uid, используем текущего пользователя
  useEffect(() => {
    if (currentUser && uid === currentUser.uid) {
      setProfileUser(currentUser);
      setLoading(false);
    } else {
      fetchProfileData();
    }
  }, [currentUser, uid]);

  const fetchProfileData = async () => {
    if (location.state && location.state.profileUser) {
      setProfileUser(location.state.profileUser);
      setLoading(false);
    } else if (uid) {
      try {
        const q = query(collection(db, "users"), where("uid", "==", uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setProfileUser(snapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Ошибка загрузки данных профиля:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  // Проверка подписки
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (currentUser && profileUser && currentUser.uid !== profileUser.uid) {
        try {
          const followQuery = query(
            collection(db, "follows"),
            where("followerId", "==", currentUser.uid),
            where("followingId", "==", profileUser.uid)
          );
          const snapshot = await getDocs(followQuery);
          setIsFollowing(!snapshot.empty);
        } catch (error) {
          console.error("Ошибка проверки подписки:", error);
        }
      }
    };
    checkFollowStatus();
  }, [currentUser, profileUser]);

  // Подписка на пользователя
  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;
    setSubLoading(true);
    try {
      const followDocRef = doc(db, "follows", `${currentUser.uid}_${profileUser.uid}`);
      await setDoc(followDocRef, {
        followerId: currentUser.uid,
        followingId: profileUser.uid,
        createdAt: new Date(),
      });
      setIsFollowing(true);
    } catch (error) {
      console.error("Ошибка при создании подписки:", error);
    }
    setSubLoading(false);
  };

  // Отписка от пользователя
  const handleUnfollow = async () => {
    if (!currentUser || !profileUser) return;
    setSubLoading(true);
    try {
      const followDocRef = doc(db, "follows", `${currentUser.uid}_${profileUser.uid}`);
      await deleteDoc(followDocRef);
      setIsFollowing(false);
    } catch (error) {
      console.error("Ошибка при удалении подписки:", error);
    }
    setSubLoading(false);
  };

  // Загрузка любимого пилота
  useEffect(() => {
    const fetchFavoritePilot = async () => {
      const storedPilotId = localStorage.getItem("favoritePilot");
      if (storedPilotId) {
        try {
          const response = await fetch("https://ergast.com/api/f1/current/driverStandings.json");
          const data = await response.json();
          const standings = data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings || [];
          const pilotData = standings.find(pilot => pilot.Driver.driverId === storedPilotId);
          if (pilotData) {
            setFavoritePilot({
              givenName: pilotData.Driver.givenName,
              familyName: pilotData.Driver.familyName,
              team: pilotData.Constructors[0].name,
              position: pilotData.position,
              points: pilotData.points,
              wins: pilotData.wins,
            });
          }
        } catch (error) {
          console.error("Ошибка загрузки любимого пилота:", error);
        }
      }
    };
    fetchFavoritePilot();
  }, []);

  if (loading) {
    return (
      <div style={{ width: "100vw", height: "100vh", backgroundColor: "#1D1D1F", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>
        Загрузка...
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div style={{ width: "100vw", height: "100vh", backgroundColor: "#1D1D1F", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>
        Пользователь не найден.
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", minHeight: "100vh", backgroundColor: "#1D1D1F", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "20px", color: "white" }}>
      <div style={{ width: 340, padding: 20, background: "#212124", borderRadius: 15, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
        <img src={profileUser.photoUrl} alt="Аватар" style={{ width: 80, height: 80, background: "#D9D9D9", borderRadius: "50%" }} />
        <div style={{ fontSize: 18, fontWeight: "500", textAlign: "center" }}>
          {profileUser.firstName} {profileUser.lastName}
        </div>
        
        {/* Карточка любимого пилота */}
        {favoritePilot && (
          <div style={{ background: "#212124", padding: "15px", borderRadius: "10px", width: "100%", textAlign: "center", marginTop: "15px" }}>
            <h3>{favoritePilot.givenName} {favoritePilot.familyName}</h3>
            <p>Команда: {favoritePilot.team}</p>
            <p>Позиция: {favoritePilot.position}</p>
            <p>Очки: {favoritePilot.points}</p>
            <p>Победы: {favoritePilot.wins}</p>
          </div>
        )}

        {/* Подписка/Отписка */}
        {currentUser && currentUser.uid !== profileUser.uid && (
          <button onClick={isFollowing ? handleUnfollow : handleFollow} disabled={subLoading} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: isFollowing ? "#888" : "#0077FF", color: "white", cursor: "pointer" }}>
            {subLoading ? "Обработка..." : isFollowing ? "Отписаться" : "Подписаться"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;
