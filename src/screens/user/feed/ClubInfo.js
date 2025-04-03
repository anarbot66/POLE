import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { useNavigate } from "react-router-dom";

const ClubInfo = ({ clubId }) => {
  const [clubData, setClubData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        const clubDocRef = doc(db, "clubs", clubId);
        const clubDoc = await getDoc(clubDocRef);
        if (clubDoc.exists()) {
          setClubData(clubDoc.data());
        }
      } catch (err) {
        console.error("Ошибка загрузки данных клуба:", err);
      }
    };

    fetchClubData();
  }, [clubId]);

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
};

export default ClubInfo;
