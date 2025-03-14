import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const NewsCreator = ({ currentUser }) => {
  const navigate = useNavigate();
  const [newsTitle, setNewsTitle] = useState("");
  const [newsType, setNewsType] = useState("text"); // "text" или "link"
  const [newsText, setNewsText] = useState("");
  const [newsLink, setNewsLink] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Функция загрузки изображения на imgbb (аналогично загрузке аватарки)
  const uploadImage = async () => {
    if (!imageFile) return "";
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
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
      let uploadedImageUrl = "";
      if (imageFile) {
        uploadedImageUrl = await uploadImage();
      }
      // Собираем данные новости, включая заголовок
      const newsData = {
        createdAt: serverTimestamp(),
        type: newsType,
        imageUrl: uploadedImageUrl,
        title: newsTitle,
      };
      if (newsType === "text") {
        newsData.text = newsText;
      } else {
        newsData.link = newsLink;
      }
      await addDoc(collection(db, "news"), newsData);
      navigate(-1); // Возвращаемся на страницу новостей
    } catch (err) {
      setError("Ошибка публикации новости");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#1D1D1F", color: "white", minHeight: "100vh" }}>
      <h2>Создание новости</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {/* Поле для заголовка */}
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Введите заголовок новости"
          value={newsTitle}
          onChange={(e) => setNewsTitle(e.target.value)}
          style={{ width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: "#212124", }}
        />
      </div>
      <div style={{ marginBottom: "10px"}}>
        <label>
          Тип новости:{" "}
          <select style={{backgroundColor: "#212124"}} value={newsType} onChange={(e) => setNewsType(e.target.value)}>
            <option value="text">Текст</option>
            <option value="link">Ссылка</option>
          </select>
        </label>
      </div>
      {newsType === "text" ? (
        <div style={{ marginBottom: "10px" }}>
          <textarea
            placeholder="Введите текст новости"
            value={newsText}
            onChange={(e) => setNewsText(e.target.value)}
            style={{ width: "100%", height: "100px", borderRadius: "8px", padding: "10px", backgroundColor: "#212124", }}
          />
        </div>
      ) : (
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Введите ссылку новости"
            value={newsLink}
            onChange={(e) => setNewsLink(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: "#212124", }}
          />
        </div>
      )}
      <div style={{ marginBottom: "10px" }}>
        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
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
