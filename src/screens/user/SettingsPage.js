import React, { useContext } from "react";
import CustomSelect from "./components/CustomSelect";
import { ThemeContext } from "./ThemeContext";
import { db } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";

const themeOptions = [
  { value: "default", label: "Стандартная" },
  { value: "redbull", label: "Red Bull Racing" },
  { value: "mercedes", label: "Mercedes" },
  { value: "ferrari", label: "Ferrari" },
  { value: "mclaren", label: "McLaren" },
  { value: "astonmartin", label: "Aston Martin" },
  { value: "alpine", label: "Alpine" },
  { value: "williams", label: "Williams" },
  { value: "rb", label: "RB Visa" },
  { value: "haas", label: "Haas" },
  { value: "sauber", label: "Sauber" },
];

const SettingsPage = ({ currentUser, setCurrentUser }) => {
  const { selectedTheme, setSelectedTheme, theme } = useContext(ThemeContext);

  const handleThemeChange = async (value) => {
    setSelectedTheme(value);
    if (currentUser && currentUser.uid) {
      // Обновляем Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, { selectedTheme: value });
      // Обновляем объект пользователя локально
      setCurrentUser((prev) => ({ ...prev, selectedTheme: value }));
    }
  };

  return (
    <div style={{ padding: 20, backgroundColor: theme.primary, color: "white", minHeight: "100vh" }}>
      <h2>Настройки темы</h2>
      <CustomSelect
        options={themeOptions}
        value={selectedTheme}
        onChange={handleThemeChange}
        style={{ marginTop: 20 }}
      />
    </div>
  );
};

export default SettingsPage;
