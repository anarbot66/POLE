// FavoriteButton.js
import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, } from "../../../firebase";
import { normalizeName } from "./constants";

const FavoriteButton = ({ currentUser, pilot, teamColor }) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [favLoading, setFavLoading] = useState(false);
    const [showFavoriteAlert, setShowFavoriteAlert] = useState(false);

    useEffect(() => {
      const checkFavoriteStatus = async () => {
        if (!currentUser || !pilot) return;
        try {
          const normalizedPilotName = normalizeName(pilot.Driver.familyName);
          const favDocRef = doc(db, "favorites", `${currentUser.uid}_${normalizedPilotName}`);
          const favDoc = await getDoc(favDocRef);
          setIsFavorite(favDoc.exists());
        } catch (error) {
          console.error("Ошибка проверки избранного:", error);
        }
      };
      checkFavoriteStatus();
    }, [currentUser, pilot]);
  
    const handleFavorite = async () => {
      if (!currentUser || !pilot) return;
      try {
        const userFavoritesRef = collection(db, "favorites");
        const q = query(userFavoritesRef, where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        // Если у пользователя уже 3 избранных пилота, показать уведомление
        if (querySnapshot.docs.length >= 3) {
          setShowFavoriteAlert(true);
          return;
        }
        setFavLoading(true);
        const normalizedPilotName = normalizeName(pilot.Driver.familyName);
        const favDocRef = doc(db, "favorites", `${currentUser.uid}_${normalizedPilotName}`);
        await setDoc(favDocRef, {
          userId: currentUser.uid,
          pilotId: normalizedPilotName,
          pilotData: pilot,
          createdAt: new Date()
        });
        setIsFavorite(true);
      } catch (error) {
        console.error("Ошибка при добавлении в избранное:", error);
      }
      setFavLoading(false);
    };
    
  
    const handleUnfavorite = async () => {
      if (!currentUser || !pilot) return;
      setFavLoading(true);
      try {
        const normalizedPilotName = normalizeName(pilot.Driver.familyName);
        const favDocRef = doc(db, "favorites", `${currentUser.uid}_${normalizedPilotName}`);
        await deleteDoc(favDocRef);
        setIsFavorite(false);
      } catch (error) {
        console.error("Ошибка при удалении из избранного:", error);
      }
      setFavLoading(false);
    };
  
    return (
      <>
        {currentUser?.uid && (
  <button
    onClick={isFavorite ? handleUnfavorite : handleFavorite}
    disabled={favLoading}
    style={{
      padding: "5px 15px",
      borderRadius: "50px",
      border: isFavorite
        ? "none"
        : "1px solid rgba(255, 255, 255, 0.2)",
      background: isFavorite ? "white" : "transparent",
      color: isFavorite ? "black" : "white",
      cursor: "pointer",
      fontSize: 12,
      width: '110px',
      height: '28px',

      /* Переходы для плавности */
      transition: "background 300ms ease, color 300ms ease, border 300ms ease",
    }}
  >
    {favLoading
      ? " "
      : isFavorite
      ? "Слежу"
      : "Подписаться"}
  </button>
)}

  
        {/* Уведомление */}
        {showFavoriteAlert && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 2000
            }}
            onClick={() => setShowFavoriteAlert(false)}
          >
            <div
              style={{
                padding: "20px",
                borderRadius: "20px",
                textAlign: "center",
                color: "white",
                maxWidth: "300px"
              }}
            >
              <p style={{ marginBottom: "20px" }}>У вас уже выбрано 3 любимых пилота</p>
              <button
                onClick={() => setShowFavoriteAlert(false)}
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "15px",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Хорошо
              </button>
            </div>
          </div>
        )}
      </>
    );
  };
  
  export default FavoriteButton;
  
