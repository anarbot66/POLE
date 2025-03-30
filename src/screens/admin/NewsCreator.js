import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const NewsCreator = ({ currentUser }) => {
  const navigate = useNavigate();
  const [newsTitle, setNewsTitle] = useState("");
  const [newsText, setNewsText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Универсальная функция загрузки изображения на imgbb
  const uploadImage = async (file) => {
    if (!file) return "";
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("key", "2efcc5045381407287404d66cbe72876");
      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      return data.data.url;
    } catch (err) {
      console.error("Ошибка загрузки изображения:", err);
      return "";
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Загрузка основного изображения новости
      let uploadedImageUrl = "";
      if (imageFile) {
        uploadedImageUrl = await uploadImage(imageFile);
      }
      // Собираем данные новости без абзацев
      const newsData = {
        createdAt: serverTimestamp(),
        imageUrl: uploadedImageUrl,
        title: newsTitle,
        text: newsText,
      };

      await addDoc(collection(db, "news"), newsData);
      navigate(-1); // Возврат к предыдущей странице
    } catch (err) {
      setError("Ошибка публикации новости");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#1D1D1F",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <div style={{ width: "100%" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "18px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          ← Назад
        </button>
      </div>
      <h2>Создание новости</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {/* Заголовок новости */}
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Введите заголовок новости"
          value={newsTitle}
          onChange={(e) => setNewsTitle(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            backgroundColor: "#212124",
            color: "white",
          }}
        />
      </div>
      {/* Основное изображение новости */}
      <div style={{ marginBottom: "10px" }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
        />
      </div>
      {/* Текст новости */}
      <div style={{ marginBottom: "10px" }}>
        <textarea
          placeholder="Введите текст новости"
          value={newsText}
          onChange={(e) => setNewsText(e.target.value)}
          style={{
            width: "100%",
            height: "150px",
            padding: "10px",
            borderRadius: "8px",
            backgroundColor: "#212124",
            color: "white",
            resize: "vertical",
          }}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          padding: "10px 20px",
          backgroundColor: "#0078C1",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        {loading ? "Публикация..." : "Опубликовать"}
      </button>
    </div>
  );
};

export default NewsCreator;
