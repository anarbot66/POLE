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
        if (!querySnapshot.empty) {
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
        {currentUser && currentUser.uid && (
          <button
            onClick={isFavorite ? handleUnfavorite : handleFavorite}
            disabled={favLoading}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: isFavorite ? "#888" : teamColor, // Используем цвет команды
              color: "white",
              cursor: "pointer"
            }}
          >
            {favLoading
              ? "Обработка..."
              : isFavorite
              ? "Больше не любимый..."
              : "Мой любимый пилот!"}
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
                background: "#1D1D1F",
                padding: "20px",
                borderRadius: "20px",
                textAlign: "center",
                color: "white",
                maxWidth: "300px"
              }}
            >
              <p style={{ marginBottom: "20px" }}>Вы уже выбрали любимого пилота</p>
              <button
                onClick={() => setShowFavoriteAlert(false)}
                style={{
                  background: "#212124",
                  color: "white",
                  border: "none",
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
  
