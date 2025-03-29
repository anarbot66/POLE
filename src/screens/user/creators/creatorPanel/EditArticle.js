import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../../../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const EditArticle = ({ currentUser }) => {
  const { id: articleId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [articleData, setArticleData] = useState(null);
  const [title, setTitle] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [paragraphs, setParagraphs] = useState([]);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const docRef = doc(db, "articles", articleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setArticleData(data);
          setTitle(data.title);
          setPreviewUrl(data.previewUrl || "");
          // Приводим абзацы к удобному виду, добавляя поле newImage для замены картинки
          setParagraphs(
            data.paragraphs.map((p, index) => ({
              ...p,
              id: index, // можно заменить на другой уникальный идентификатор
              newImage: null,
            }))
          );
        } else {
          alert("Статья не найдена");
          navigate("/");
        }
      } catch (err) {
        console.error("Ошибка получения статьи:", err);
      }
    };

    fetchArticle();
  }, [articleId, navigate]);

  // Функция загрузки изображения через API imgbb
  const uploadImage = async (file) => {
    if (!file) return "";
    try {
      const formData = new FormData();
      formData.append("image", file);
      // Используйте свой API-ключ imgbb
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

  const handleParagraphChange = (id, field, value) => {
    setParagraphs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Функция удаления абзаца
  const handleRemoveParagraph = (id) => {
    setParagraphs((prev) => prev.filter((p) => p.id !== id));
  };

  // Добавление нового абзаца
  const handleAddParagraph = () => {
    setParagraphs((prev) => [
      ...prev,
      { id: Date.now(), heading: "", text: "", imageUrl: "", newImage: null },
    ]);
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      // Если выбрано новое превью, загружаем его через imgbb
      let updatedPreviewUrl = previewUrl;
      if (previewImage) {
        updatedPreviewUrl = await uploadImage(previewImage);
      }

      // Для каждого абзаца, если есть новый файл, загружаем его через imgbb
      const updatedParagraphs = await Promise.all(
        paragraphs.map(async (p) => {
          let updatedImageUrl = p.imageUrl;
          if (p.newImage) {
            updatedImageUrl = await uploadImage(p.newImage);
          }
          return {
            heading: p.heading,
            text: p.text,
            imageUrl: updatedImageUrl,
          };
        })
      );

      // Обновляем статью в Firestore
      const articleRef = doc(db, "articles", articleId);
      await updateDoc(articleRef, {
        title,
        previewUrl: updatedPreviewUrl,
        paragraphs: updatedParagraphs,
        updatedAt: serverTimestamp(),
      });
      alert("Изменения сохранены!");
      navigate("/articles");
    } catch (err) {
      console.error("Ошибка сохранения статьи:", err);
      alert("Не удалось сохранить изменения");
    } finally {
      setLoading(false);
    }
  };

  if (!articleData) return <div>Загрузка статьи...</div>;

  return (
    <div style={{ padding: 20, marginBottom: "100px" }}>
      <div style={{width: "100%"}}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "18px",
            cursor: "pointer",
            marginBottom: "15px"
          }}
        >
          ← Назад
        </button>
        </div>
      <h2 style={{color: "white", fontSize: "24px", marginBottom: 10, color: "white"}}>Редактирование поста</h2>
      <div style={{color: "white", alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", gap: 15, marginBottom: 10}}>
        <div style={{color: "gray", fontSize: "18px", width: "100%", textAlign: "left"}}>Превью:</div>
        {previewUrl ? (
          <img src={previewUrl} alt="preview" style={{ width: "100%", borderRadius: 15 }} />
        ) : (
          <div>Нет превью</div>
        )}
        <label style={{ 
          alignSelf: "stretch",
          background: "#212124",
          borderRadius: 15,
          padding: "15px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          textAlign: "center"
        }}>
          Выбрать новое превью
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPreviewImage(e.target.files[0])}
            style={{ display: "none" }}
          />
        </label>

      </div>

      <div style={{display: "flex", gap: 10, flexDirection: "column", marginBottom: 15}}>
        <div style={{color: "gray", fontSize: "18px"}}>Заголовок:</div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", padding: "15px", marginBottom: "10px", background: "#212124", color: "white", borderRadius: 12 }}
        />
      </div>

      {/* Абзацы */}
      <div style={{display: "flex", flexDirection: "column", gap: 15}}>
        <h3 style={{color: "gray", fontSize: "18px"}}>Абзацы</h3>
        {paragraphs.map((para) => (
          <div
            key={para.id}
            style={{display: "flex", flexDirection: "column", gap: 10, padding: 15, background: "#212124", borderRadius: 15}}
          >
            <div style={{display: "flex", flexDirection: "column", gap: 10}}>
              <div style={{color: "white", fontSize: "16px"}}>Заголовок абзаца:</div>
              <input
                type="text"
                value={para.heading}
                onChange={(e) => handleParagraphChange(para.id, "heading", e.target.value)}
                style={{ width: "100%", padding: "15px", marginBottom: "10px", background: "#1D1D1F", color: "white", borderRadius: 12 }}
              />
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: 10}}>
              <div style={{color: "white", fontSize: "16px"}}>Текст абзаца:</div>
              <textarea
                value={para.text}
                onChange={(e) => handleParagraphChange(para.id, "text", e.target.value)}
                style={{ width: "100%", padding: "15px", marginBottom: "10px", background: "#1D1D1F", color: "white", borderRadius: 12 }}
              />
            </div>
            <div>
              <div style={{color: "white", fontSize: "16px", marginBottom: 10, }}>Картинка абзаца:</div>
              {para.imageUrl && (
                <img
                  src={para.imageUrl}
                  alt="paragraph"
                  style={{ width: "100%", borderRadius: 15, marginBottom: "10px" }}
                />
              )}
              <label style={{ 
                alignSelf: "stretch",
                background: "#1D1D1F",
                borderRadius: 15,
                padding: "15px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                textAlign: "center",
                color: "white"
              }}>
                Выбрать новое превью
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPreviewImage(e.target.files[0])}
                  style={{ display: "none" }}
                />
              </label>
            </div>
            {/* Кнопка для удаления абзаца */}
            <button
              onClick={() => handleRemoveParagraph(para.id)}
              style={{
                marginTop: "10px",
                padding: "15px",
                backgroundColor: "#ff4d4d",
                color: "white",
                border: "none",
                borderRadius: "15px",
                cursor: "pointer",
              }}
            >
              Удалить абзац
            </button>
          </div>
        ))}
        <button onClick={handleAddParagraph} style={{ padding: "15px", color: "white", background: "#212124", width: "100%", borderRadius: 15 }}>
          Добавить новый абзац
        </button>
      </div>

      <button
        onClick={handleSaveChanges}
        disabled={loading}
        style={{
          marginTop: "20px",
          padding: "15px", color: "white", background: "#007C00", width: "100%", borderRadius: 15
        }}
      >
        {loading ? "Сохраняется..." : "Сохранить изменения"}
      </button>
    </div>
  );
};

export default EditArticle;
