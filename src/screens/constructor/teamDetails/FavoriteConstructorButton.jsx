// FavoriteConstructorButton.js
import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "../../../firebase";
import { normalizeName } from "../../pilots/driverDetails/constants"; // можно переиспользовать, либо удалить, если не нужен

const FavoriteConstructorButton = ({ currentUser, constructor }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showFavoriteAlert, setShowFavoriteAlert] = useState(false);

  // нормализованный ID конструктора
  const formattedConstructorId = normalizeName(constructor.Constructor.name);

  // Проверяем, в избранном ли уже конструктор
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!currentUser || !constructor) return;
      try {
        const favDocRef = doc(
          db,
          "favoritesConstructors",
          `${currentUser.uid}_${formattedConstructorId}`
        );
        const favDoc = await getDoc(favDocRef);
        setIsFavorite(favDoc.exists());
      } catch (error) {
        console.error("Ошибка проверки избранного конструктора:", error);
      }
    };
    checkFavoriteStatus();
  }, [currentUser, constructor, formattedConstructorId]);

  // Добавление в избранное
  const handleFavorite = async () => {
    if (!currentUser || !constructor) return;
    try {
      // проверяем лимит в 3 команды
      const favCollRef = collection(db, "favoritesConstructors");
      const q = query(
        favCollRef,
        where("userId", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.docs.length >= 3) {
        setShowFavoriteAlert(true);
        return;
      }

      setFavLoading(true);
      const favDocRef = doc(
        db,
        "favoritesConstructors",
        `${currentUser.uid}_${formattedConstructorId}`
      );
      await setDoc(favDocRef, {
        userId: currentUser.uid,
        constructorId: formattedConstructorId,
        constructorData: constructor,
        createdAt: new Date()
      });
      setIsFavorite(true);
    } catch (error) {
      console.error("Ошибка при добавлении конструктора в избранное:", error);
    } finally {
      setFavLoading(false);
    }
  };

  // Удаление из избранного
  const handleUnfavorite = async () => {
    if (!currentUser || !constructor) return;
    setFavLoading(true);
    try {
      const favDocRef = doc(
        db,
        "favoritesConstructors",
        `${currentUser.uid}_${formattedConstructorId}`
      );
      await deleteDoc(favDocRef);
      setIsFavorite(false);
    } catch (error) {
      console.error("Ошибка при удалении конструктора из избранного:", error);
    } finally {
      setFavLoading(false);
    }
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
            width: "110px",
            height: "28px",
            transition:
              "background 300ms ease, color 300ms ease, border 300ms ease"
          }}
        >
          {favLoading
            ? " "
            : isFavorite
            ? "Слежу"
            : "Подписаться"}
        </button>
      )}

      {/* Лимит */}
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
            <p style={{ marginBottom: "20px" }}>
              У вас уже выбрано 3 любимых команды
            </p>
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
}

export default FavoriteConstructorButton;
