import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  where
} from "firebase/firestore";
import { db } from "../../../../firebase";
import { useNavigate } from "react-router-dom";
import { CSSTransition } from "react-transition-group";

const ArticlesList = ({ currentUser }) => {
  const [articles, setArticles] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  // Состояние для модального окна подтверждения удаления
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    articleId: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "articles"),
      where("creatorUsername", "==", currentUser.name),
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
  }, [currentUser]);
  

  // Функция для удаления статьи из Firestore
  const handleDeleteArticle = async (articleId) => {
    try {
      await deleteDoc(doc(db, "articles", articleId));
    } catch (error) {
      console.error("Ошибка при удалении статьи:", error);
    }
  };

  // Показываем модальное окно подтверждения удаления
  const showDeleteModal = (articleId) => {
    setDeleteModal({ show: true, articleId });
  };

  // Скрываем модальное окно
  const hideDeleteModal = () => {
    setDeleteModal({ show: false, articleId: null });
  };

  // Функция обработки подтверждения удаления
  const confirmDelete = async () => {
    await handleDeleteArticle(deleteModal.articleId);
    hideDeleteModal();
  };

  // Тогглер выпадающего меню для каждой статьи
  const toggleMenu = (articleId) => {
    setOpenDropdownId((prevId) => (prevId === articleId ? null : articleId));
  };

  return (
    <div style={{ padding: "20px", color: "white", marginBottom: 70 }}>
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
      {articles.length === 0 ? (
        <p>Нет статей</p>
      ) : (
        articles.map((article) => (
          <div
            key={article.id}
            style={{
              borderRadius: "8px",
              marginBottom: "15px",
              position: "relative",
              padding: "10px",
              background: "#212124",
            }}
          >
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <button
                onClick={() =>
                  navigate(`/articles/view/${article.id}`, {
                    state: { article },
                  })
                }
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#1D1D1F",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Просмотр
              </button>
                <div style={{ position: "relative" }}>
                  <div
                    onClick={() => toggleMenu(article.id)}
                    style={{
                      width: 50,
                      height: 50,
                      padding: 12,
                      borderRadius: 30,
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                    }}
                  >
                    <svg
                      width="25"
                      height="26"
                      viewBox="0 0 25 26"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.125 16.9062C3.125 16.4748 3.47478 16.125 3.90625 16.125H8.59375C9.02522 16.125 9.375 16.4748 9.375 16.9062C9.375 17.3377 9.02522 17.6875 8.59375 17.6875H3.90625C3.47478 17.6875 3.125 17.3377 3.125 16.9062Z"
                        fill="white"
                      />
                      <path
                        d="M3.125 12.2188C3.125 11.7873 3.47478 11.4375 3.90625 11.4375H14.8438C15.2752 11.4375 15.625 11.7873 15.625 12.2188C15.625 12.6502 15.2752 13 14.8438 13H3.90625C3.47478 13 3.125 12.6502 3.125 12.2188Z"
                        fill="white"
                      />
                      <path
                        d="M3.125 7.53125C3.125 7.09978 3.47478 6.75 3.90625 6.75H21.0938C21.5252 6.75 21.875 7.09978 21.875 7.53125C21.875 7.96272 21.5252 8.3125 21.0938 8.3125H3.90625C3.47478 8.3125 3.125 7.96272 3.125 7.53125Z"
                        fill="white"
                      />
                    </svg>
                  </div>

                  <CSSTransition
                    in={openDropdownId === article.id}
                    timeout={200}
                    classNames="menuFade"
                    unmountOnExit
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "40px",
                        right: "10px",
                        background: "#1D1D1F",
                        borderRadius: "12px 0px 12px 12px",
                        padding: "5px",
                        zIndex: 10,
                      }}
                    >
                      <button
                        onClick={() => navigate(`/articles/edit/${article.id}`)}
                        style={{
                          display: "block",
                          background: "transparent",
                          border: "none",
                          color: "white",
                          cursor: "pointer",
                          padding: "5px 10px",
                          textAlign: "left",
                          width: "150px",
                        }}
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => showDeleteModal(article.id)}
                        style={{
                          display: "block",
                          background: "transparent",
                          border: "none",
                          color: "white",
                          cursor: "pointer",
                          padding: "5px 10px",
                          textAlign: "left",
                          width: "150px",
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </CSSTransition>
                </div>
            </div>
            {article.previewUrl && (
              <img
                src={article.previewUrl}
                alt="preview"
                style={{ width: "100%", borderRadius: "8px" }}
              />
            )}
            <h3>{article.title}</h3>
            <p>
              Создано: {" "}
              {article.createdAt?.toDate
                ? article.createdAt.toDate().toLocaleString()
                : ""}
            </p>
          </div>
        ))
      )}

      {/* Кастомное модальное окно подтверждения удаления */}
      <CSSTransition
        in={deleteModal.show}
        timeout={300}
        classNames="window-fade"
        unmountOnExit
      >
        <div
          style={{
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
          }}
        >
          <div
            style={{
              background: "#1D1D1F",
              padding: "20px",
              borderRadius: "20px",
              textAlign: "center",
              color: "white",
              maxWidth: "300px",
            }}
          >
            <p style={{ marginBottom: "20px" }}>
              Вы уверены, что хотите удалить статью?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={confirmDelete}
                style={{
                  background: "#212124",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "15px",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                Да
              </button>
              <button
                onClick={hideDeleteModal}
                style={{
                  background: "#212124",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "15px",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </CSSTransition>
    </div>
  );
};

export default ArticlesList;
