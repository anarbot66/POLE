import React, { useState, useEffect } from "react";
import { db } from "../../firebase"; // убедитесь, что путь корректный
import { collection, query, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const UserSearch = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  // Debounce для уменьшения количества запросов
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() !== "") {
        performSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async () => {
    try {
      // Загружаем всех пользователей
      const q = query(collection(db, "users"));
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => doc.data());

      let filteredUsers;
      if (searchTerm.startsWith("@")) {
        const term = searchTerm.slice(1).toLowerCase();
        filteredUsers = users.filter(user =>
          user.username && user.username.toLowerCase().includes(term)
        );
      } else {
        const term = searchTerm.toLowerCase();
        filteredUsers = users.filter(user => {
          const fullName = ((user.firstName || "") + " " + (user.lastName || "")).toLowerCase();
          return fullName.includes(term);
        });
      }
      // Исключаем самого себя из результатов
      filteredUsers = filteredUsers.filter(user => user.uid !== currentUser.uid);
      setResults(filteredUsers);
    } catch (error) {
      console.error("Ошибка при поиске пользователей:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ width: "100%", position: "fixed", display: "flex" }}>
        <button
          onClick={goBack}
          style={{
            backgroundColor: "#212124",
            color: "white",
            border: "none",
            padding: "15px 20px",
            borderRadius: "10px",
            cursor: "pointer",
            zIndex: "1000",
          }}
        >
          ✕
        </button>
        <input
          type="text"
          placeholder="Найти друзей..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            marginLeft: "10px",
            background: "#212124",
            width: "calc(100% - 100px)",
            padding: "15px",
            fontSize: "16px",
            borderRadius: "10px",
            color: "white",
            border: "none"
          }}
        />
      </div>
      <div style={{ marginTop: "60px" }}>
        {results.length > 0 ? (
          results.map((user, index) => (
            <div
              key={index}
              onClick={() => navigate(`/userprofile/${user.uid}`, { state: { currentUserUid: currentUser.uid } })}  // Навигация к профилю пользователя
              style={{
                padding: "10px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                borderBottom: "1px solid #444",
                cursor: "pointer"
              }}
            >
              {/* Аватарка пользователя */}
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
              {/* Информация о пользователе */}
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
          searchTerm && (
            <div style={{ color: "white", fontSize: "14px" }}>Ничего не найдено</div>
          )
        )}
      </div>
    </div>
  );
};

export default UserSearch;
