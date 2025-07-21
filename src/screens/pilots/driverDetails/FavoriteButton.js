// FavoriteButton.js
import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { normalizeName } from "./constants";

const FavoriteButton = ({ currentUser, pilot, teamColor }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || !pilot) return;

    const checkFavoriteStatus = async () => {
      try {
        const normalizedPilotName = normalizeName(pilot.Driver.familyName);
        const favDocRef = doc(
          db,
          "favorites",
          `${currentUser.uid}_${normalizedPilotName}`
        );
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

    setFavLoading(true);
    try {
      const normalizedPilotName = normalizeName(pilot.Driver.familyName);
      const favDocRef = doc(
        db,
        "favorites",
        `${currentUser.uid}_${normalizedPilotName}`
      );
      await setDoc(favDocRef, {
        userId: currentUser.uid,
        pilotId: normalizedPilotName,
        pilotData: pilot,
        createdAt: new Date(),
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
      const favDocRef = doc(
        db,
        "favorites",
        `${currentUser.uid}_${normalizedPilotName}`
      );
      await deleteDoc(favDocRef);
      setIsFavorite(false);
    } catch (error) {
      console.error("Ошибка при удалении из избранного:", error);
    }
    setFavLoading(false);
  };

  if (!currentUser?.uid) return null;

  return (
    <button
      onClick={isFavorite ? handleUnfavorite : handleFavorite}
      disabled={favLoading}
      style={{
        padding: "5px 15px",
        borderRadius: "50px",
        border: isFavorite ? "none" : "1px solid rgba(255, 255, 255, 0.2)",
        background: isFavorite ? "white" : "transparent",
        color: isFavorite ? "black" : "white",
        cursor: "pointer",
        fontSize: 12,
        width: "110px",
        height: "28px",
        transition: "background 300ms ease, color 300ms ease, border 300ms ease",
      }}
    >
      {favLoading ? "..." : isFavorite ? "Слежу" : "Подписаться"}
    </button>
  );
};

export default FavoriteButton;
