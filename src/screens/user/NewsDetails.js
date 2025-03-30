import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

const formatDate = (dateInput) => {
  if (!dateInput) return "—";
  const date =
    typeof dateInput === "object" ? dateInput : new Date(dateInput);
  const dayMonth = date.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  const time = date.toLocaleString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dayMonth} в ${time}`;
};

const NewsDetail = () => {
  const { id } = useParams();
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
      <div
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#1D1D1F",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div className="loader"></div>
        <style>
          {`
            .loader {
              width: 50px;
              aspect-ratio: 1;
              --_c: no-repeat radial-gradient(farthest-side, white 92%, transparent);
              background:
                var(--_c) top,
                var(--_c) left,
                var(--_c) right,
                var(--_c) bottom;
              background-size: 12px 12px;
              animation: l7 1s infinite;
            }
            @keyframes l7 {
              to { transform: rotate(.5turn); }
            }
          `}
        </style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#1D1D1F",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        width: "calc(100% - 30px)",
        maxWidth: "600px",
        margin: "15px auto",
        borderRadius: "12px",
        color: "white",
      }}
    >
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
      {news.imageUrl && (
        <img
          src={news.imageUrl}
          alt="Новость"
          style={{
            width: "100%",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        />
      )}
      <h2>{news.title}</h2>
      <p style={{ whiteSpace: "pre-wrap", marginTop: "10px" }}>
        {news.text}
      </p>
      <div
        style={{
          marginTop: "20px",
          textAlign: "right",
          fontSize: "12px",
          color: "#888",
        }}
      >
        {formatDate(
          news.createdAt?.toDate
            ? news.createdAt.toDate()
            : news.createdAt
        )}
      </div>
    </div>
  );
};

export default NewsDetail;
