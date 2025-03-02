import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

const FollowersList = () => {
  const { uid } = useParams(); // Получаем uid из URL
  const navigate = useNavigate();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const goBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const followsQuery = query(
          collection(db, "follows"),
          where("followingId", "==", uid)
        );
        const snapshot = await getDocs(followsQuery);
        const followersData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const followerId = doc.data().followerId;
            const userQuery = query(collection(db, "users"), where("uid", "==", followerId));
            const userSnapshot = await getDocs(userQuery);
            return userSnapshot.docs[0].data();
          })
        );
        setFollowers(followersData);
      } catch (err) {
        console.error("Ошибка при загрузке подписчиков:", err);
        setError("Ошибка при загрузке подписчиков");
      } finally {
        setLoading(false);
      }
    };
    fetchFollowers();
  }, [uid]);

  if (loading) {
    return (
      <div style={{ width: "100vw", height: "100vh", backgroundColor: "#1D1D1F", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>
        Загрузка...
      </div>
    );
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  return (
    <div style={{ padding: "20px" }}>

        <div style={{ display: "flex", alignItems: "center" }}>
        <button
          onClick={goBack}
          style={{
            backgroundColor: "#212124",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: "10px",
            cursor: "pointer",
            zIndex: "1000"
          }}
        >
          ✕
        </button>
      <h3 style={{ color: "white", marginLeft: "20px" }}>Подписчики</h3>
        </div>
      {followers.length > 0 ? (
        followers.map((user, index) => (
          <div
            key={index}
            style={{
              padding: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              borderBottom: "1px solid #444",
              cursor: "pointer",
            }}
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
                overflow: "hidden"
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
              <span style={{ color: "#0077FF", fontSize: "12px" }}>
                {user.username ? "@" + user.username : ""}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div style={{ color: "white", fontSize: "14px" }}>Нет подписчиков</div>
      )}
    </div>
  );
};

export default FollowersList;