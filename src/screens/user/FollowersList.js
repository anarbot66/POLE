import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { useTelegramBackButton } from "./services/useTelegramBackButton";

const FollowersList = ({ currentUser }) => {
  // Получаем username из URL
  const { username } = useParams();
  const navigate = useNavigate();
  useTelegramBackButton();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (!username) return; // Предотвращаем ненужные запросы
  
    const fetchFollowers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const userQuery = query(collection(db, "users"), where("username", "==", username));
        const userSnapshot = await getDocs(userQuery);
  
        if (userSnapshot.empty) {
          setError("Пользователь не найден");
          setLoading(false);
          return;
        }
  
        const userData = userSnapshot.docs[0].data();
        const userUid = userData.uid;
  
        
        const followsQuery = query(collection(db, "follows"), where("followingId", "==", userUid));
        const followsSnapshot = await getDocs(followsQuery);
  
        if (followsSnapshot.empty) {
          setFollowers([]);
          setLoading(false);
          return;
        }
  
        const followersData = await Promise.all(
          followsSnapshot.docs.map(async (doc) => {
            const followerId = doc.data().followerId;
            const followerQuery = query(collection(db, "users"), where("uid", "==", followerId));
            const followerSnapshot = await getDocs(followerQuery);
  
            return followerSnapshot.empty ? null : followerSnapshot.docs[0].data();
          })
        );
  
        setFollowers(followersData.filter(user => user !== null && user.uid !== currentUser?.uid));
      } catch (err) {
        console.error("Ошибка при загрузке подписчиков:", err);
        setError("Ошибка при загрузке подписчиков");
      } finally {
        setLoading(false);
      }
    };
  
    fetchFollowers();
  }, [username]); // Убираем currentUser, чтобы избежать бесконечных запросов
  

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

  return (
    <div
    className=""
    style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <h3 style={{ color: "white", marginLeft: "20px" }}>Подписчики {username}</h3>
      </div>
      {followers.length > 0 ? (
        followers.map((user, index) => (
          <div
            key={index}
            style={{
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
            }}
            onClick={() => navigate(`/userprofile/${user.uid}`)}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "#212124",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              <img
                src={user.photoUrl}
                alt={`${user.firstName} ${user.lastName}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "white", fontSize: "14px" }}>
                {user.firstName} {user.lastName}
              </span>
              <span style={{ color: "#2C8478", fontSize: "12px" }}>
                {user.username ? "@" + user.username : ""}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div style={{ color: "white", fontSize: "14px", marginTop: "50px", textAlign: "center"}}>Пока никто не подписался =(</div>
      )}
    </div>
  );
};

export default FollowersList;
