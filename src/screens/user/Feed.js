import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  deleteDoc,
  doc,
  getCountFromServer,
} from "firebase/firestore";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import CustomSelect from "./components/CustomSelect"; // путь обновите в зависимости от структуры проекта

const formatDate = (dateInput) => {
  if (!dateInput) return "—";
  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  const dayMonth = date.toLocaleString("ru-RU", { day: "numeric", month: "long" });
  const time = date.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `${dayMonth} в ${time}`;
};

const Feed = ({ currentUser }) => {
  // Посты друзей
  const [followers, setFollowers] = useState([]);
  const [friendPosts, setFriendPosts] = useState([]);
  const [friendPostsLoading, setFriendPostsLoading] = useState(false);
  const [lastFriendPost, setLastFriendPost] = useState(null);

  // Новости с пагинацией
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [lastNewsItem, setLastNewsItem] = useState(null);
  const [totalNewsCount, setTotalNewsCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Строка поиска для новостей
  const [searchQuery, setSearchQuery] = useState("");

  // Активная вкладка: "news" или "followers"
  const [activeTab, setActiveTab] = useState("news");

  const navigate = useNavigate();

  // Состояние для выпадающего меню новостей (для удаления)
  const [openNewsMenuId, setOpenNewsMenuId] = useState(null);

  // Функция для получения текущей даты (пример)
  const getFormattedDate = () => {
    const now = new Date();
    const day = now.getDate();
    const monthNames = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря",
    ];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formattedDate = getFormattedDate();

  // Фильтрация новостей по строке поиска (по заголовку и тексту)
  const filteredNews = newsItems.filter((news) => {
    const lowerQuery = searchQuery.toLowerCase();
    const title = news.title ? news.title.toLowerCase() : "";
    const text = news.text ? news.text.toLowerCase() : "";
    return title.includes(lowerQuery) || text.includes(lowerQuery);
  });

  // Загрузка подписок (на кого подписан текущий пользователь)
  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      setLoading(false);
      return;
    }
    const fetchFollowing = async () => {
      setLoading(true);
      try {
        const followsQuery = query(
          collection(db, "follows"),
          where("followerId", "==", currentUser.uid)
        );
        const snapshot = await getDocs(followsQuery);
        const followingData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const followingId = doc.data().followingId;
            const userQuery = query(
              collection(db, "users"),
              where("uid", "==", followingId)
            );
            const userSnapshot = await getDocs(userQuery);
            return userSnapshot.docs[0]?.data() || {};
          })
        );
        setFollowers(followingData);
      } catch (err) {
        console.error("Ошибка при загрузке подписок:", err);
        setError("Ошибка при загрузке подписок");
      } finally {
        setLoading(false);
      }
    };
    fetchFollowing();
  }, [currentUser?.uid]);

  // Получаем общее количество новостей (для показа кнопки "Загрузить ещё")
  useEffect(() => {
    const fetchNewsCount = async () => {
      try {
        const newsCol = collection(db, "news");
        const snapshot = await getCountFromServer(newsCol);
        setTotalNewsCount(snapshot.data().count);
      } catch (err) {
        console.error("Ошибка подсчета новостей:", err);
      }
    };
    fetchNewsCount();
  }, []);

  // Загрузка постов друзей с пагинацией
  const fetchFriendPosts = async (loadMore = false) => {
    if (!followers || followers.length === 0) return;
    setFriendPostsLoading(true);
    try {
      const friendUids = followers.map((user) => user.uid);
      let postsQuery = query(
        collection(db, "posts"),
        where("uid", "in", friendUids),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      if (loadMore && lastFriendPost) {
        postsQuery = query(
          collection(db, "posts"),
          where("uid", "in", friendUids),
          orderBy("createdAt", "desc"),
          startAfter(lastFriendPost),
          limit(5)
        );
      }
      const snapshot = await getDocs(postsQuery);
      const postsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (loadMore) {
        setFriendPosts((prev) => [...prev, ...postsData]);
      } else {
        setFriendPosts(postsData);
      }
      if (snapshot.docs.length > 0) {
        setLastFriendPost(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (err) {
      console.error("Ошибка загрузки постов друзей:", err);
      setError("Ошибка загрузки постов друзей");
    } finally {
      setFriendPostsLoading(false);
    }
  };

  // Загрузка новостей с пагинацией (по 5 штук)
  const fetchNews = useCallback(
    async (loadMore = false) => {
      setNewsLoading(true);
      try {
        let newsQuery;
        if (loadMore && lastNewsItem) {
          newsQuery = query(
            collection(db, "news"),
            orderBy("createdAt", "desc"),
            startAfter(lastNewsItem),
            limit(5)
          );
        } else {
          newsQuery = query(
            collection(db, "news"),
            orderBy("createdAt", "desc"),
            limit(5)
          );
        }
        const snapshot = await getDocs(newsQuery);
        const newsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (loadMore) {
          setNewsItems((prev) => [...prev, ...newsData]);
        } else {
          setNewsItems(newsData);
        }
        if (snapshot.docs.length > 0) {
          setLastNewsItem(snapshot.docs[snapshot.docs.length - 1]);
        }
      } catch (err) {
        console.error("Ошибка загрузки новостей:", err);
        setError("Ошибка загрузки новостей");
      } finally {
        setNewsLoading(false);
      }
    },
    [lastNewsItem]
  );

  // Загружаем новости при переключении на вкладку "news", если список пустой
  useEffect(() => {
    if (activeTab === "news" && newsItems.length === 0) {
      fetchNews(false);
    }
  }, [activeTab, newsItems.length, fetchNews]);

  // При переключении на вкладку "followers" загружаем посты друзей
  useEffect(() => {
    if (activeTab === "followers") {
      fetchFriendPosts();
    }
  }, [activeTab, followers]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Функция удаления новости (только для admin/owner)
  const handleDeleteNews = async (newsId) => {
    try {
      await deleteDoc(doc(db, "news", newsId));
      // После удаления обновляем список новостей
      setNewsItems((prevItems) => prevItems.filter((item) => item.id !== newsId));
      // Обновляем общее количество новостей
      setTotalNewsCount((prev) => prev - 1);
    } catch (err) {
      console.error("Ошибка при удалении новости:", err);
      setError("Ошибка при удалении новости");
    }
  };

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
          color: "white",
        }}
      ></div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          color: "red",
          textAlign: "center",
        }}
      >
        {error}
      </div>
    );
  }

  // Опции для кастомного селекта
  const tabOptions = [
    { value: "news", label: "Новости" },
    { value: "followers", label: "Друзья" },
  ];

  return (
    <div
      style={{
        width: "calc(100% - 20px)",
        height: "100%",
        margin: "0 auto",
        marginBottom: "100px",
        overflowY: "auto",
        paddingTop: "10px",
        display: "flex",
        flexDirection: "column",
        background: "#1D1D1F",
      }}
    >
      {/* Стили для fade-анимации */}
      <style>
        {`
          .fade-enter {
            opacity: 0;
          }
          .fade-enter-active {
            opacity: 1;
            transition: opacity 300ms;
          }
          .fade-exit {
            opacity: 1;
          }
          .fade-exit-active {
            opacity: 0;
            transition: opacity 300ms;
          }
          .page-enter {
            opacity: 0;
          }
          .page-enter-active {
            opacity: 1;
            transition: opacity 300ms;
          }
          .page-exit {
            opacity: 1;
          }
          .page-exit-active {
            opacity: 0;
            transition: opacity 300ms;
          }
        `}
      </style>

      {/* Верхний блок: аватарка + кастомный селект */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px",
          backgroundColor: "#212124",
          borderRadius: 15,
        }}
      >
        <img
          src={currentUser.photoUrl || "https://placehold.co/80x80"}
          alt="Avatar"
          style={{ width: "30px", height: "30px", borderRadius: "50%" }}
        />
        <CustomSelect
          options={tabOptions}
          value={activeTab}
          onChange={(val) => handleTabChange(val)}
          style={{ flexGrow: 1 }}
        />
      </div>

      {/* Если выбрана вкладка "news", показываем строку поиска */}
      {activeTab === "news" && (
        <div style={{ marginTop: "10px", position: "relative" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              stroke: "white",
              fill: "none",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              marginLeft: "5px",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Поиск по заголовку или тексту..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "20px 20px 20px 50px",
              borderRadius: "12px",
              backgroundColor: "#212124",
              color: "white",
            }}
          />
        </div>
      )}

      {/* Содержимое вкладок с анимацией */}
      <TransitionGroup>
        <CSSTransition key={activeTab} classNames="page" timeout={300}>
          <div style={{ position: "relative", minHeight: "calc(100% - 70px)" }}>
            {activeTab === "followers" && (
              <div style={{ width: "100%", marginTop: "20px" }}>
                {friendPosts.length > 0 ? (
                  friendPosts.map((post) => {
                    const friend = followers.find((user) => user.uid === post.uid);
                    return (
                      <div
                        key={post.id}
                        style={{
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          marginBottom: "20px",
                        }}
                      >
                        {/* Оборачиваем блок с информацией о друге в кликабельный контейнер */}
                        <div
                          onClick={() =>
                            navigate(`/userprofile/${friend.uid}`, { state: { currentUserUid: currentUser.uid } })
                          }
                          
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "15px",
                            cursor: "pointer", // Добавляем указатель мыши для индикации кликабельности
                          }}
                        >
                          <img
                            src={friend?.photoUrl || "https://placehold.co/50x50"}
                            alt="avatar"
                            style={{
                              width: "50px",
                              height: "50px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                          <div>
                            <strong style={{ fontSize: "14px", color: "#ddd" }}>
                              {friend
                                ? `${friend.firstName} ${friend.lastName}`
                                : "Неизвестный пользователь"}
                            </strong>
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: "5px",
                            }}
                          >
                            <small style={{ color: "#888" }}>
                              {formatDate(
                                post.createdAt?.toDate
                                  ? post.createdAt.toDate()
                                  : post.createdAt
                              )}
                            </small>
                          </div>
                          <div
                            style={{
                              borderRadius: "12px",
                              marginTop: "5px",
                              color: "white",
                            }}
                          >
                            {post.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ textAlign: "center", marginTop: "100px", color: "white", fontSize: 12 }}>
                    Ваши друзья ничего не публиковали
                  </p>
                )}

                {friendPosts.length > 0 && (
                  <button
                    onClick={() => fetchFriendPosts(true)}
                    disabled={friendPostsLoading}
                    style={{
                      margin: "20px auto",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      color: "gray",
                      border: "none",
                      cursor: "pointer",
                      display: "block",
                    }}
                  >
                    {friendPostsLoading ? "Загрузка..." : "Загрузить ещё"}
                  </button>
                )}
              </div>
            )}
            {activeTab === "news" && (
              <div style={{ width: "100%", marginTop: "20px" }}>
                {(currentUser.role === "admin" || currentUser.role === "owner") && (
                  <button
                    onClick={() => navigate("/news/new")}
                    style={{
                      marginBottom: "20px",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      backgroundColor: "#212124",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      display: "block",
                      width: "100%",
                    }}
                  >
                    Новая новость
                  </button>
                )}
                {filteredNews.map((news) => (
                  <div
                    key={news.id}
                    style={{
                      marginBottom: "10px",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "8px",
                    }}
                  >
                    {(currentUser.role === "admin" || currentUser.role === "owner") && (
                      <div style={{ position: "absolute", top: 0, right: 0 }}>
                        <button
                          onClick={() =>
                            setOpenNewsMenuId((prev) => (prev === news.id ? null : news.id))
                          }
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "18px",
                          }}
                        >
                          ⋮
                        </button>
                        <CSSTransition in={openNewsMenuId === news.id} timeout={300} classNames="fade" unmountOnExit>
                          <div
                            style={{
                              position: "absolute",
                              top: "24px",
                              right: "0",
                              background: "#333",
                              borderRadius: "12px",
                              padding: "5px",
                              zIndex: 10,
                            }}
                          >
                            <button
                              onClick={() => {
                                handleDeleteNews(news.id);
                                setOpenNewsMenuId(null);
                              }}
                              style={{
                                display: "block",
                                background: "transparent",
                                border: "none",
                                color: "white",
                                cursor: "pointer",
                                padding: "5px 10px",
                                textAlign: "left",
                                width: "100%",
                                fontSize: "14px",
                              }}
                            >
                              Удалить
                            </button>
                          </div>
                        </CSSTransition>
                      </div>
                    )}
                    <span
                      style={{
                        fontWeight: "bold",
                        marginBottom: "5px",
                        color: "white",
                      }}
                    >
                      {news.title}
                    </span>
                    <small style={{ color: "#888" }}>
                      @anarbot66 {formatDate(news.createdAt?.toDate ? news.createdAt.toDate() : news.createdAt)}
                    </small>
                    {news.imageUrl && (
                      <img
                        src={news.imageUrl}
                        alt="news"
                        style={{
                          width: "100%",
                          borderRadius: "8px",
                          marginTop: "10px",
                        }}
                      />
                    )}
                    {news.type === "link" ? (
                      <a
                        href={news.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          marginTop: "10px",
                          padding: "12px 20px",
                          backgroundColor: "#212124",
                          border: "none",
                          borderRadius: "12px",
                          color: "white",
                          cursor: "pointer",
                          width: "100%",
                          textAlign: "center",
                          textDecoration: "none",
                          display: "block",
                        }}
                      >
                        Читать
                      </a>
                    ) : (
                      <button
                        onClick={() => navigate(`/news/${news.id}`, { state: { news } })}
                        style={{
                          marginTop: "10px",
                          padding: "12px 20px",
                          backgroundColor: "#212124",
                          border: "none",
                          borderRadius: "12px",
                          color: "white",
                          cursor: "pointer",
                          width: "100%",
                          textAlign: "center",
                        }}
                      >
                        Читать
                      </button>
                    )}
                  </div>
                ))}
                {totalNewsCount > newsItems.length && (
                  <button
                    onClick={() => fetchNews(true)}
                    disabled={newsLoading}
                    style={{
                      margin: "20px auto",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      background: "transparent",
                      color: "white",
                      cursor: "pointer",
                      display: "block",
                    }}
                  >
                    {newsLoading ? " " : "Загрузить ещё"}
                  </button>
                )}
              </div>
            )}
          </div>
        </CSSTransition>
      </TransitionGroup>
    </div>
  );
};

export default Feed;
