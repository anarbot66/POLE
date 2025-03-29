import { useState, useEffect } from "react";
import pilotStats from "../../recources/json/driversData.json";
import {  formatDriverName } from "./formatters";
import {  driverToConstructor } from "./constants";

export const usePilots = () => {
  const [pilots, setPilots] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const pilotsFromJson = Object.entries(pilotStats).map(([key, stats]) => {
        const constructorName = driverToConstructor[key] || "Unknown";
        const fullName = formatDriverName(key);
        return {
          Driver: {
            givenName: fullName.split(" ")[0] || "",
            familyName: fullName.split(" ")[1] || fullName,
            translatedName: fullName,
            nationality: stats.nationality
          },
          Constructors: [{ name: constructorName }],
          position: stats.pos,
          points: stats.point,
          extraStats: { ...stats }
        };
      });

      pilotsFromJson.sort((a, b) => a.position - b.position);
      setPilots(pilotsFromJson);
    } catch (err) {
      setError("Ошибка при получении данных");
    }
  }, []);

  return { pilots, error };
};
