import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

const formatDate = (dateInput) => {
  if (!dateInput) return "—";
  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  const dayMonth = date.toLocaleString("ru-RU", { day: "numeric", month: "long" });
  const time = date.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `${dayMonth} в ${time}`;
};

const NewsDetail = () => {
  const { id } = useParams(); // Получаем ID новости из URL
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        const newsDocRef = doc(db, "news", id);
        const newsDoc = await getDoc(newsDocRef);
        if (newsDoc.exists()) {
          setNews(newsDoc.data());
        } else {
          setError("Новость не найдена");
        }
      } catch (err) {
        console.error("Ошибка загрузки новости:", err);
        setError("Ошибка загрузки новости");
      } finally {
        setLoading(false);
      }
    };
    fetchNewsDetail();
  }, [id]);

  if (loading) {
    return (
      <div style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#1D1D1F",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white"
      }}>
        Загрузка...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#1D1D1F",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white"
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{
      width: "calc(100% - 40px)",
      maxWidth: "600px",
      margin: "20px auto",
      borderRadius: "12px",
      color: "white"
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "transparent",
          border: "none",
          color: "white",
          fontSize: "18px",
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        ← Назад
      </button>
      {news.imageUrl && (
        <img
          src={news.imageUrl}
          alt="Новость"
          style={{
            width: "100%",
            borderRadius: "8px",
            marginBottom: "20px"
          }}
        />
      )}
      <h1 style={{
        fontSize: "24px",
        fontWeight: "bold",
        marginBottom: "20px"
      }}>
        {news.title}
      </h1>
      <div style={{ fontSize: "16px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
        {news.text}
      </div>

      <div style={{
        marginTop: "20px",
        textAlign: "right",
        fontSize: "12px",
        color: "#888"
      }}>
        {formatDate(news.createdAt?.toDate ? news.createdAt.toDate() : news.createdAt)}
      </div>
    </div>
  );
};

export default NewsDetail;
