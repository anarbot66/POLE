import React, { useState, useEffect } from "react";
import { collection, query, orderBy, where, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../../../firebase";
import LikeButton from "../components/LikeButton"; // Импортируем компонент лайков
import CommentsSection from "../../components/CommentsSection"; // Импортируем компонент комментариев
import { CSSTransition, TransitionGroup } from "react-transition-group";

const ClubArticles = ({ club, currentUser }) => {
  const [articles, setArticles] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [openCommentsArticle, setOpenCommentsArticle] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!club || !club.clubOwnerUsername) return;
    // Запрос для получения статей от владельца клуба, отсортированных по дате
    const q = query(
      collection(db, "articles"),
      where("creatorUsername", "==", club.clubOwnerUsername),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const articlesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setArticles(articlesData);
    });
    return () => unsubscribe();
  }, [club]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  return (
    <div style={{ padding: "15px 0px", color: "white" }}>
      {articles.length === 0 ? (
        <p>Нет статей</p>
      ) : (
        articles.slice(0, visibleCount).map((article) => (
          <div
            key={article.id}
            style={{
              borderRadius: "12px",
              marginBottom: "15px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Заголовок */}
            <div style={{ display: "flex", alignItems: "center", padding: "15px 0px" }}>
              <img
                src={club.avatarUrl || "https://placehold.co/40"}
                alt="club avatar"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  marginRight: "10px",
                }}
              />
              <span style={{ fontSize: "16px" }}>{club.clubName}</span>
            </div>
            {/* Превью картинки статьи */}
            {article.previewUrl && (
              <img
                src={article.previewUrl}
                alt="preview"
                style={{ width: "100%", display: "block", borderRadius: "12px" }}
              />
            )}
            <span style={{ padding: "15px 0px" }}>{article.title}</span>
            {/* Блок с лайками и переключателем комментариев */}
            {/* Кнопка «Читать» */}
            <button
              onClick={() =>
                navigate(`/articles/view/${article.id}`, { state: { article } })
              }
              style={{
                width: "100%",
                padding: "12px",
                color: "white",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                borderRadius: "12px",
                background: "#212124"
              }}
            >
              Читать
            </button>
            <div style={{ display: "flex", alignItems: "center", padding: "10px 0px", gap: 15 }}>
            
            <LikeButton articleId={article.id} currentUser={currentUser} />
              <button
                onClick={() => setOpenCommentsArticle(openCommentsArticle === article.id ? null : article.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#0078C1",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.68209 15.2515C3.97139 15.5469 4.11624 15.9583 4.0772 16.3735C3.98969 17.3041 3.78815 18.2726 3.52931 19.1723C5.44728 18.7209 6.61867 18.1973 7.15112 17.9226C7.45336 17.7667 7.8015 17.7299 8.12876 17.8192C9.03329 18.0661 9.9973 18.2 11 18.2C16.4939 18.2 20.625 14.2694 20.625 9.8C20.625 5.33056 16.4939 1.4 11 1.4C5.50605 1.4 1.375 5.33056 1.375 9.8C1.375 11.8553 2.22379 13.7625 3.68209 15.2515ZM3.00423 20.7185C2.99497 20.7204 2.9857 20.7222 2.97641 20.7241C2.85015 20.7494 2.72143 20.7744 2.59025 20.7988C2.40625 20.8332 2.21738 20.8665 2.02362 20.8988C1.74997 20.9445 1.5405 20.653 1.6486 20.393C1.71922 20.2231 1.78884 20.0451 1.85666 19.8605C1.89975 19.7432 1.94212 19.6233 1.98356 19.5012C1.98534 19.4959 1.98713 19.4906 1.98891 19.4854C2.32956 18.4778 2.60695 17.3196 2.70845 16.2401C1.02171 14.5178 0 12.2652 0 9.8C0 4.38761 4.92487 0 11 0C17.0751 0 22 4.38761 22 9.8C22 15.2124 17.0751 19.6 11 19.6C9.87696 19.6 8.79323 19.4501 7.77265 19.1714C7.05838 19.54 5.51971 20.2108 3.00423 20.7185Z" fill="white"/>
                </svg>
              </button>
            </div>
            {/* Секция комментариев */}
            {article.id && (
              <CSSTransition
                in={openCommentsArticle === article.id}
                timeout={300}
                classNames="slideUp"
                unmountOnExit
              >
                <CommentsSection
                  parentId={article.id}
                  onClose={() => setOpenCommentsArticle(null)}
                  currentUser={currentUser}
                />
              </CSSTransition>
            )}
          </div>
        ))
      )}
      {articles.length > visibleCount && (
        <button
          onClick={handleLoadMore}
          style={{
            padding: "12px",
            width: "100%",
            background: "#212124",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer"
          }}
        >
          Загрузить ещё
        </button>
      )}
    </div>
  );
};

export default ClubArticles;
