import React, { useState } from "react";
import { db } from "../../../../firebase"; // Убедитесь, что Firebase настроен в вашем проекте
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const styles = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    padding: 15,
  },
  inputContainer: {
    alignSelf: "stretch",
    background: "#212124",
    borderRadius: 15,
    padding: "0 15px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  labelText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Inter",
    fontWeight: "400",
    wordWrap: "break-word",
  },
  placeholderText: {
    color: "#ABABAB",
    fontSize: 14,
    fontFamily: "Inter",
    fontWeight: "400",
    wordWrap: "break-word",
  },
  textInput: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "white",
    outline: "none",
    fontSize: 14,
    fontFamily: "Inter",
    fontWeight: "400",
  },
  fileLabel: {
    cursor: "pointer",
    textAlign: "center",
  },
  button: {
    width: "100%",
    height: 50,
    background: "#212124",
    borderRadius: 15,
    border: "none",
    color: "white",
    fontSize: 14,
    fontFamily: "Inter",
    fontWeight: "400",
    cursor: "pointer",
  },
};

const ArticleCreator = ({ currentUser }) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [title, setTitle] = useState("");
  const [paragraphs, setParagraphs] = useState([
    { id: Date.now(), heading: "", text: "", image: null },
  ]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Функция загрузки изображения через API imgbb
  const uploadImage = async (file) => {
    if (!file) return "";
    try {
      const formData = new FormData();
      formData.append("image", file);
      // Используйте ваш API-ключ imgbb
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

  const handleParagraphImageChange = (id, file) => {
    setParagraphs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, image: file } : p))
    );
  };

  const handleParagraphChange = (id, field, value) => {
    setParagraphs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Функция удаления абзаца
  const handleRemoveParagraph = (id) => {
    setParagraphs((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddParagraph = () => {
    setParagraphs((prev) => [
      ...prev,
      { id: Date.now(), heading: "", text: "", image: null },
    ]);
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      // Загрузка preview-изображения через imgbb
      const previewUrl = await uploadImage(previewImage);

      // Загрузка изображений для абзацев
      const updatedParagraphs = await Promise.all(
        paragraphs.map(async (p) => {
          const paraImageUrl = p.image ? await uploadImage(p.image) : "";
          return {
            heading: p.heading,
            text: p.text,
            imageUrl: paraImageUrl,
          };
        })
      );

      // Собираем данные статьи с uid текущего пользователя
      const articleData = {
        createdAt: serverTimestamp(),
        title,
        previewUrl,
        paragraphs: updatedParagraphs,
        creatorUsername: currentUser.firstName,
      };

      await addDoc(collection(db, "articles"), articleData);
      alert("Статья успешно опубликована!");
    } catch (err) {
      console.error("Ошибка публикации статьи:", err);
      alert("Не удалось опубликовать статью");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={{width: "100%"}}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          ← Назад
        </button>
        </div>
      {/* Загрузка превью */}
      <div style={{ ...styles.inputContainer, height: 50, alignItems: "center" }}>
        <label style={styles.fileLabel}>
          <div style={styles.labelText}>Загрузить превью</div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPreviewImage(e.target.files[0])}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* Название статьи */}
      <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={styles.labelText}>Название</div>
        <div style={{ ...styles.inputContainer, height: 50, justifyContent: "center" }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Как назовем?"
            style={{ ...styles.textInput, ...styles.placeholderText }}
          />
        </div>
      </div>

      {/* Абзацы */}
      {paragraphs.map((para) => (
        <div key={para.id} style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Заголовок абзаца */}
          <div style={styles.labelText}>Заголовок абзаца</div>
          <div style={{ ...styles.inputContainer, height: 50, justifyContent: "center" }}>
            <input
              type="text"
              value={para.heading}
              onChange={(e) => handleParagraphChange(para.id, "heading", e.target.value)}
              placeholder="Как назовем?"
              style={{ ...styles.textInput, ...styles.placeholderText }}
            />
          </div>

          {/* Текст абзаца */}
          <div style={styles.labelText}>Текст абзаца</div>
          <div style={{ ...styles.inputContainer, minHeight: 50, justifyContent: "flex-start", paddingTop: 10 }}>
            <textarea
              value={para.text}
              onChange={(e) => handleParagraphChange(para.id, "text", e.target.value)}
              placeholder="Пишите что угодно..."
              style={{ ...styles.textInput, width: "100%", resize: "vertical", background: "transparent" }}
            />
          </div>

          {/* Загрузка картинки для абзаца */}
          <div style={{ ...styles.inputContainer, height: 50, alignItems: "center" }}>
            <label style={styles.fileLabel}>
              <div style={styles.labelText}>Загрузить картинку абзаца (опционально)</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleParagraphImageChange(para.id, e.target.files[0]);
                  }
                }}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {/* Кнопка для удаления абзаца */}
          <button
            onClick={() => handleRemoveParagraph(para.id)}
            style={{
              padding: "5px 10px",
              backgroundColor: "#ff4d4d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              alignSelf: "flex-end",
            }}
          >
            Удалить абзац
          </button>
        </div>
      ))}

      {/* Добавить новый абзац */}
      <div
        style={{ ...styles.inputContainer, height: 50, justifyContent: "center", alignItems: "center", cursor: "pointer" }}
        onClick={handleAddParagraph}
      >
        <div style={styles.labelText}>Новый абзац +</div>
      </div>

      {/* Кнопка публикации */}
      <button onClick={handlePublish} style={styles.button} disabled={loading}>
        {loading ? "Публикация..." : "Опубликовать"}
      </button>
    </div>
  );
};

export default ArticleCreator;
