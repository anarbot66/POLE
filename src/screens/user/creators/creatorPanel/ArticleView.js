import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";

const ArticleView = () => {
  const { articleId } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const docRef = doc(db, "articles", articleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setArticle(docSnap.data());
        } else {
          console.error("Статья не найдена");
        }
      } catch (error) {
        console.error("Ошибка при загрузке статьи:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  if (loading) return <div>Загрузка статьи...</div>;
  if (!article) return <div>Статья не найдена</div>;

  // Форматирование даты публикации, если она есть
  const formattedDate =
    article.createdAt && article.createdAt.toDate
      ? article.createdAt.toDate().toLocaleString()
      : "";

  return (
    <div
      style={{
        margin: "0 auto",
        padding: "20px",
        lineHeight: 1.6,
        marginBottom: 70
      }}
    >
      <div style={{width: "100%"}}>
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
      </div>

      <h1 style={{ textAlign: "center", textAlign: "left", fontSize: 28, color: "white" }}>
        {article.title}
      </h1>
      {formattedDate && (
        <p style={{ textAlign: "left", color: "#666", marginBottom: "10px" }}>
          Опубликовано: {formattedDate}
        </p>
      )}
      
      <div>
        {article.paragraphs &&
          article.paragraphs.map((para, index) => (
            <div key={index} style={{ marginBottom: "30px" }}>
              {para.imageUrl && (
                <img
                  src={para.imageUrl}
                  alt={`Абзац ${index + 1}`}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    objectFit: "cover",
                  }}
                />
              )}
              {para.heading && <h2 style={{ marginBottom: "10px", color: "white", fontSize: 21 }}>{para.heading}</h2>}
              {para.text && <p style={{ marginBottom: "10px", color: "white", fontSize: 17 }}>{para.text}</p>}
              
            </div>
          ))}
      </div>
    </div>
  );
};

export default ArticleView;
