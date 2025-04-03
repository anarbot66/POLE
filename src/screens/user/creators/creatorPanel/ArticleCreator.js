import React, { useState, useEffect } from "react";
import { db } from "../../../../firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
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
  noClubMessage: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginTop: "20vh",
  },
  // Стили для кастомного уведомления
  customAlertOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  customAlertBox: {
    background: "#1D1D1F",
    padding: "20px",
    borderRadius: "20px",
    textAlign: "center",
    color: "white",
    maxWidth: "300px",
  },
  customAlertButton: {
    background: "#212124",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "15px",
    cursor: "pointer",
    width: "100%",
  },
};

const ArticleCreator = ({ currentUser }) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [title, setTitle] = useState("");
  const [paragraphs, setParagraphs] = useState([
    { id: Date.now(), heading: "", text: "", image: null },
  ]);
  const [loading, setLoading] = useState(false);
  const [userClubs, setUserClubs] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [customAlert, setCustomAlert] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClubs = async () => {
      if (!currentUser) {
        setLoadingClubs(false);
        return;
      }
      try {
        const clubsQuery = query(
          collection(db, "clubs"),
          where("clubOwnerUid", "==", currentUser.uid)
        );
        const snapshot = await getDocs(clubsQuery);
        const clubs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserClubs(clubs);
        setLoadingClubs(false);
      } catch (err) {
        console.error("Ошибка получения клубов:", err);
        setLoadingClubs(false);
      }
    };

    fetchClubs();
  }, [currentUser]);

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
    if (userClubs.length === 0) {
      setCustomAlert({ message: "Сначала создайте клуб!" });
      return;
    }
    setLoading(true);
    try {
      const previewUrl = await uploadImage(previewImage);
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
      const articleData = {
        createdAt: serverTimestamp(),
        title,
        previewUrl,
        paragraphs: updatedParagraphs,
        creatorUsername: currentUser.name,
        clubid: userClubs[0].id,
      };

      await addDoc(collection(db, "articles"), articleData);
      setCustomAlert({ message: "Статья успешно опубликована!" });
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err) {
      console.error("Ошибка публикации статьи:", err);
      setCustomAlert({ message: "Не удалось опубликовать статью" });
    } finally {
      setLoading(false);
    }
  };

  if (!loadingClubs && userClubs.length === 0) {
    return (
      <div style={styles.noClubMessage}>
        Сначала создайте клуб!
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ width: "100%" }}>
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
      {paragraphs.map((para) => (
        <div key={para.id} style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 10 }}>
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
          <div style={styles.labelText}>Текст абзаца</div>
          <div style={{ ...styles.inputContainer, minHeight: 50, justifyContent: "flex-start", paddingTop: 10 }}>
            <textarea
              value={para.text}
              onChange={(e) => handleParagraphChange(para.id, "text", e.target.value)}
              placeholder="Пишите что угодно..."
              style={{ ...styles.textInput, width: "100%", resize: "vertical", background: "transparent" }}
            />
          </div>
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
      <div
        style={{ ...styles.inputContainer, height: 50, justifyContent: "center", alignItems: "center", cursor: "pointer" }}
        onClick={handleAddParagraph}
      >
        <div style={styles.labelText}>Новый абзац +</div>
      </div>
      <button onClick={handlePublish} style={styles.button} disabled={loading}>
        {loading ? "Публикация..." : "Опубликовать"}
      </button>

      {/* Кастомное уведомление */}
      {customAlert && (
        <div
          style={styles.customAlertOverlay}
          onClick={() => setCustomAlert(null)}
        >
          <div style={styles.customAlertBox}>
            <p style={{ marginBottom: "20px" }}>{customAlert.message}</p>
            <button
              onClick={() => setCustomAlert(null)}
              style={styles.customAlertButton}
            >
              Хорошо
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleCreator;
