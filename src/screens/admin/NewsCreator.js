import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const NewsCreator = ({ currentUser }) => {
  const navigate = useNavigate();
  const [newsTitle, setNewsTitle] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [paragraphs, setParagraphs] = useState([]);
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

  // Функция добавления нового абзаца
  const addParagraph = () => {
    setParagraphs([
      ...paragraphs,
      { paraImageFile: null, paraTitle: "", paraText: "" },
    ]);
  };

  // Функция удаления абзаца по индексу
  const removeParagraph = (index) => {
    setParagraphs(paragraphs.filter((_, i) => i !== index));
  };

  // Обновление данных абзаца
  const handleParagraphChange = (index, field, value) => {
    const updatedParagraphs = paragraphs.map((para, i) =>
      i === index ? { ...para, [field]: value } : para
    );
    setParagraphs(updatedParagraphs);
  };

  const handleParagraphImageChange = (index, file) => {
    handleParagraphChange(index, "paraImageFile", file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Загрузка основного изображения новости
      let uploadedImageUrl = "";
      if (imageFile) {
        uploadedImageUrl = await uploadImage(imageFile);
      }

      // Загрузка изображений для абзацев
      const updatedParagraphs = await Promise.all(
        paragraphs.map(async (p) => {
          let paraImageUrl = "";
          if (p.paraImageFile) {
            paraImageUrl = await uploadImage(p.paraImageFile);
          }
          return {
            paraImageUrl, // URL картинки абзаца
            paraTitle: p.paraTitle,
            paraText: p.paraText,
          };
        })
      );

      // Собираем данные новости
      const newsData = {
        createdAt: serverTimestamp(),
        imageUrl: uploadedImageUrl,
        title: newsTitle,
        paragraphs: updatedParagraphs, // Массив абзацев
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
      {/* Основной заголовок новости */}
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

      {/* Раздел для абзацев новости */}
      <h3>Абзацы новости</h3>
      {paragraphs.map((paragraph, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #333",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <p>
            <strong>Абзац {index + 1}</strong>
          </p>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Заголовок абзаца"
              value={paragraph.paraTitle}
              onChange={(e) =>
                handleParagraphChange(index, "paraTitle", e.target.value)
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "8px",
                backgroundColor: "#212124",
              }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <textarea
              placeholder="Текст абзаца"
              value={paragraph.paraText}
              onChange={(e) =>
                handleParagraphChange(index, "paraText", e.target.value)
              }
              style={{
                width: "100%",
                height: "80px",
                padding: "8px",
                borderRadius: "8px",
                backgroundColor: "#212124",
              }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleParagraphImageChange(index, e.target.files[0])
              }
            />
          </div>
          {/* Кнопка удаления абзаца */}
          <button
            onClick={() => removeParagraph(index)}
            style={{
              padding: "6px 12px",
              backgroundColor: "#D9534F",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Удалить абзац
          </button>
        </div>
      ))}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <button
          onClick={addParagraph}
          style={{
            padding: "8px 16px",
            marginBottom: "20px",
            backgroundColor: "#0078C1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Добавить абзац
        </button>

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
    </div>
  );
};

export default NewsCreator;
