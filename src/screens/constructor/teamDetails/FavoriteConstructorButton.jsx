// FavoriteConstructorButton.js
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { CONSTRUCTOR_API_NAMES } from "../../recources/json/constants";

const FavoriteConstructorButton = ({ currentUser, constructor }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showFavoriteAlert, setShowFavoriteAlert] = useState(false);

  // Переводим имя команды в её API-версию
  const constructorId =
    CONSTRUCTOR_API_NAMES[constructor.Constructor.name] ||
    constructor.Constructor.name
      .toLowerCase()
      .replace(/\s+/g, "_");

  // Проверяем, добавлен ли уже в избранное
  useEffect(() => {
    if (!currentUser?.uid) return;

    const checkFavorite = async () => {
      try {
        const favColl = collection(db, "favoritesConstructors");
        const q = query(
          favColl,
          where("userId", "==", currentUser.uid),
          where("constructorId", "==", constructorId)
        );
        const snap = await getDocs(q);
        setIsFavorite(snap.docs.length > 0);
      } catch (err) {
        console.error("Ошибка проверки избранного:", err);
      }
    };

    checkFavorite();
  }, [currentUser, constructorId]);

  // Добавление в избранное
  const handleFavorite = async () => {
    if (!currentUser?.uid) return;
  
    try {
      setFavLoading(true);
  
      // сохраняем документ по ключу userId_constructorId
      const docRef = doc(
        db,
        "favoritesConstructors",
        `${currentUser.uid}_${constructorId}`
      );
      await setDoc(docRef, {
        userId: currentUser.uid,
        constructorId,
        createdAt: new Date(),
      });
  
      setIsFavorite(true);
    } catch (err) {
      console.error("Ошибка добавления в избранное:", err);
    } finally {
      setFavLoading(false);
    }
  };
  

  // Удаление из избранного
  const handleUnfavorite = async () => {
    if (!currentUser?.uid) return;

    setFavLoading(true);
    try {
      const docRef = doc(
        db,
        "favoritesConstructors",
        `${currentUser.uid}_${constructorId}`
      );
      await deleteDoc(docRef);
      setIsFavorite(false);
    } catch (err) {
      console.error("Ошибка удаления из избранного:", err);
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
              "background 300ms ease, color 300ms ease, border 300ms ease",
          }}
        >
          {favLoading ? "..." : isFavorite ? "Слежу" : "Подписаться"}
        </button>
      )}

    </>
  );
};

export default FavoriteConstructorButton;
