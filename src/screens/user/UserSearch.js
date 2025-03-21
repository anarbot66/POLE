import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const UserSearch = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = useState("@"); // Устанавливаем начальное значение как "@"
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  if (!currentUser || !currentUser.uid) {
    navigate("/");
  }

  // Загружаем всех пользователей при первой загрузке
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const q = query(collection(db, "users"));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => doc.data());

        // Исключаем текущего пользователя из списка
        const filteredUsers = users.filter(user => user.uid !== currentUser.uid);
        setResults(filteredUsers);
      } catch (error) {
        console.error("Ошибка при загрузке пользователей:", error);
      }
    };
    loadUsers();
  }, [currentUser.uid]);

  // Debounce для уменьшения количества запросов при вводе
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() !== "@" && searchTerm.trim() !== "") {
        performSearch();
      } else if (searchTerm.trim() === "@") {
        // Если в строке только "@", показываем всех пользователей
        const loadUsers = async () => {
          const q = query(collection(db, "users"));
          const snapshot = await getDocs(q);
          const users = snapshot.docs.map(doc => doc.data());
          const filteredUsers = users.filter(user => user.uid !== currentUser.uid);
          setResults(filteredUsers);
        };
        loadUsers();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentUser.uid]);

  const performSearch = async () => {
    try {
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

      filteredUsers = filteredUsers.filter(user => user.uid !== currentUser.uid);
      setResults(filteredUsers);
    } catch (error) {
      console.error("Ошибка при поиске пользователей:", error);
    }
  };

  

  return (
    <div
    className="fade-in"
    style={{ padding: "10px", marginBottom: 50 }}>
      
      <div style={{ width: "100%", position: "fixed", display: "flex"}}>
        
        <button
          onClick={goBack}
          style={{
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            zIndex: "1000",
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
          placeholder="Найти друзей..."
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
            outline: "none"
          }}
        />
      </div>
      <div style={{ marginTop: "60px" }}>
        {results.length > 0 ? (
          results.map((user, index) => (
            <div
              key={index}
              onClick={() => navigate(`/userprofile/${user.uid}`, { state: { currentUserUid: currentUser.uid } })}
              style={{
                padding: "10px",
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
                <span style={{ color: "#0077FF", fontSize: "12px" }}>
                  {user.username ? "@" + user.username : ""}
                </span>
              </div>
            </div>
          ))
        ) : (
          searchTerm && (
            <div style={{ color: "white", fontSize: "14px" }}> </div>
          )
        )}
      </div>
    </div>
  );
};

export default UserSearch;
