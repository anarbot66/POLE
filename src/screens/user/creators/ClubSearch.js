import React, { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const ClubSearch = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = useState(""); 
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  if (!currentUser || !currentUser.uid) {
    navigate("/");
  }

  // Загружаем все клубы при первой загрузке
  useEffect(() => {
    const loadClubs = async () => {
      try {
        const q = query(collection(db, "clubs"));
        const snapshot = await getDocs(q);
        const clubs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setResults(clubs);
      } catch (error) {
        console.error("Ошибка при загрузке клубов:", error);
      }
    };
    loadClubs();
  }, []);

  // Debounce для поиска
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async () => {
    try {
      const q = query(collection(db, "clubs"));
      const snapshot = await getDocs(q);
      const clubs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const filteredClubs = clubs.filter((club) =>
        club.clubName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setResults(filteredClubs);
    } catch (error) {
      console.error("Ошибка при поиске клубов:", error);
    }
  };

  return (
    <div style={{ padding: "10px 15px", marginBottom: 50 }}>
      <div style={{ width: "100%", position: "fixed", display: "flex", alignItems: "center" }}>
        <button
          onClick={goBack}
          style={{
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            zIndex: 1000,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M30 20C30 20.6904 29.4404 21.25 28.75 21.25H14.2678L19.6339 26.6161C20.122 27.1043 20.122 27.8957 19.6339 28.3839C19.1457 28.872 18.3543 28.872 17.8661 28.3839L10.3661 20.8839C9.87796 20.3957 9.87796 19.6043 10.3661 19.1161L17.8661 11.6161C18.3543 11.128 19.1457 11.128 19.6339 11.6161C20.122 12.1043 20.122 12.8957 19.6339 13.3839L14.2678 18.75H28.75C29.4404 18.75 30 19.3096 30 20Z"
              fill="white"
            />
          </svg>
        </button>
        <input
          type="text"
          placeholder="Найти клубы..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            marginLeft: "10px",
            background: "#212124",
            width: "calc(100% - 85px)",
            padding: "15px",
            fontSize: "16px",
            borderRadius: "10px",
            color: "white",
            border: "none",
            outline: "none",
          }}
        />
      </div>
      <div style={{ marginTop: "60px", display: "flex", flexDirection: "column", gap: 15 }}>
        {results.length > 0 ? (
          results.map((club) => (
            <div
              key={club.id}
              onClick={() => navigate(`/club/${club.id}`, { state: { club } })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "#212124",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                  flexShrink: 0
                }}
              >
                <img
                  src={club.avatarUrl || "https://placehold.co/50x50"}
                  alt={club.clubName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "white", fontSize: "14px" }}>{club.clubName}</span>
                <span style={{ color: "#0077FF", fontSize: "12px" }}>
                  {club.description.length > 30
                    ? `${club.description.substring(0, 45)}...`
                    : club.description}
                </span>

              </div>
            </div>
          ))
        ) : (
          searchTerm && (
            <div style={{ color: "white", fontSize: "14px" }}>Ничего не найдено</div>
          )
        )}
      </div>
    </div>
  );
};

export default ClubSearch;
