import React, { useState, useEffect, memo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";

// Кастомный хук для загрузки данных клуба
const useClubData = (clubId) => {
  const [clubData, setClubData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchClubData = async () => {
      try {
        const clubDocRef = doc(db, "clubs", clubId);
        const clubDoc = await getDoc(clubDocRef);
        if (mounted && clubDoc.exists()) {
          setClubData(clubDoc.data());
        }
      } catch (err) {
        console.error("Ошибка загрузки данных клуба:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (clubId) {
      fetchClubData();
    } else {
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [clubId]);

  return { clubData, loading };
};

// Компонент для отображения информации о клубе
const ClubInfoInline = memo(({ clubId, navigate }) => {
  const { clubData, loading } = useClubData(clubId);

  // Пока данные загружаются, можно отобразить placeholder или skeleton
  if (loading) {
    return (
      <div style={{ width: "40px", height: "40px", marginRight: "10px", backgroundColor: "#333", borderRadius: "50%" }} />
    );
  }

  if (!clubData) return null;

  return (
    <div
      style={{ display: "flex", alignItems: "center", paddingBottom: "15px", cursor: "pointer", color: "white" }}
      onClick={() => navigate(`/club/${clubId}`)}
    >
      <img
        src={clubData.avatarUrl || "https://placehold.co/40"}
        alt="club avatar"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          marginRight: "10px"
        }}
      />
      <span style={{ fontSize: "16px" }}>{clubData.clubName}</span>
    </div>
  );
});

export default ClubInfoInline;
