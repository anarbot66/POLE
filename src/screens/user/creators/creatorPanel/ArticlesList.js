import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useNavigate } from "react-router-dom";

const ArticlesList = ({ currentUser }) => {
  const [articles, setArticles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Запрос для получения статей, отсортированных по дате создания
    const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const articlesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setArticles(articlesData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: "20px", color: "white" }}>
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
      {articles.length === 0 ? (
        <p>Нет опубликованных статей.</p>
      ) : (
        articles.map((article) => (
          <div
            key={article.id}
            style={{
              borderRadius: "8px",
              marginBottom: "15px",
              position: "relative",
            }}
          >
            {article.previewUrl && (
              <img
                src={article.previewUrl}
                alt="preview"
                style={{ width: "100%", borderRadius: "8px" }}
              />
            )}
            <h3>{article.title}</h3>
            <p>
              Автор: {article.creatorUsername || article.uid}{" "}
              {article.createdAt?.toDate
                ? article.createdAt.toDate().toLocaleString()
                : ""}
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              {/* Кнопка для просмотра статьи */}
              <button
                onClick={() =>
                  navigate(`/articles/view/${article.id}`, {
                    state: { article },
                  })
                }
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#212124",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Просмотр
              </button>
              {/* Кнопка для редактирования статьи (видна, например, только админам или владельцам) */}
              {(currentUser.role === "admin" ||
                currentUser.role === "owner") && (
                <button
                  onClick={() => navigate(`/articles/edit/${article.id}`)}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#212124",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "15px"
                  }}
                >
                  Редактировать
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ verticalAlign: "middle", marginRight: "5px" }}
                  >
                    <path
                      d="M12.8536 0.146447C12.6583 -0.0488155 12.3417 -0.0488155 12.1465 0.146447L10.5 1.7929L14.2071 5.50001L15.8536 3.85355C16.0488 3.65829 16.0488 3.34171 15.8536 3.14645L12.8536 0.146447Z"
                      fill="white"
                    />
                    <path
                      d="M13.5 6.20711L9.7929 2.50001L3.29291 9H3.5L4 9.5L4.5 10L5 10.5L5.5 11L6 11.5L6.5 12L7 12.5V12.7071L13.5 6.20711Z"
                      fill="white"
                    />
                    <path
                      d="M6.03166 13.6755C6.01119 13.6209 6 13.5617 6 13.5L5.5 13L5 12.5L4.5 12L4 11.5L3.5 11L3 10.5L2.5 10C2.43827 10 2.37915 9.98881 2.32455 9.96835L2.14646 10.1464C2.09858 10.1943 2.06092 10.2514 2.03578 10.3143L0.0357762 15.3143C-0.0385071 15.5 0.00502989 15.7121 0.146461 15.8536C0.287892 15.995 0.500001 16.0385 0.68571 15.9642L5.68571 13.9642C5.74858 13.9391 5.80569 13.9014 5.85357 13.8536L6.03166 13.6755Z"
                      fill="white"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ArticlesList;
