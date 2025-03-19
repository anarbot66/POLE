import React, { useState, useEffect, useCallback, useRef } from "react";
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
import CustomSelect from "./components/CustomSelect"; // проверьте путь

const formatDate = (dateInput) => {
  if (!dateInput) return "—";
  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  const dayMonth = date.toLocaleString("ru-RU", { day: "numeric", month: "long" });
  const time = date.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `${dayMonth} в ${time}`;
};

const Feed = ({ currentUser, onFeedLoad }) => {
  // Состояния для постов друзей
  const [followers, setFollowers] = useState([]);
  const [friendPosts, setFriendPosts] = useState([]);
  const [friendPostsLoading, setFriendPostsLoading] = useState(false);
  const [lastFriendPost, setLastFriendPost] = useState(null);

  // Состояния для новостей с пагинацией
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [lastNewsItem, setLastNewsItem] = useState(null);
  const [totalNewsCount, setTotalNewsCount] = useState(0);

  // Глобальное состояние загрузки (например, для подписок)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояния для поиска и переключения вкладок
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("news");

  const navigate = useNavigate();
  // Состояние для открытия меню новости. Открыто только одно меню одновременно.
  const [openNewsMenuId, setOpenNewsMenuId] = useState(null);
  // Создаём ref для CSSTransition, чтобы избежать findDOMNode
  const nodeRef = useRef(null);

  // Используем ref, чтобы onFeedLoad вызывался только один раз для каждой вкладки
  const onFeedLoadCalled = useRef(false);

  // Функция для форматирования текущей даты
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

  // Фильтрация новостей по строке поиска
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

  // Получение общего количества новостей
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
      if (activeTab === "followers" && !onFeedLoadCalled.current) {
        onFeedLoadCalled.current = true;
        onFeedLoad && onFeedLoad();
      }
    }
  };

  // Загрузка новостей с пагинацией
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
        if (activeTab === "news" && !onFeedLoadCalled.current) {
          onFeedLoadCalled.current = true;
          onFeedLoad && onFeedLoad();
        }
      }
    },
    [lastNewsItem, activeTab, onFeedLoad]
  );

  // При выборе вкладки "news", если список пустой, загружаем новости
  useEffect(() => {
    if (activeTab === "news" && newsItems.length === 0) {
      fetchNews(false);
    }
  }, [activeTab, newsItems.length, fetchNews]);

  // При выборе вкладки "followers" загружаем посты друзей
  useEffect(() => {
    if (activeTab === "followers") {
      fetchFriendPosts();
    }
  }, [activeTab, followers]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Сбрасываем флаг, чтобы onFeedLoad можно было вызвать заново для новой вкладки
    onFeedLoadCalled.current = false;
  };

  const handleDeleteNews = async (newsId) => {
    try {
      await deleteDoc(doc(db, "news", newsId));
      setNewsItems((prevItems) => prevItems.filter((item) => item.id !== newsId));
      setTotalNewsCount((prev) => prev - 1);
    } catch (err) {
      console.error("Ошибка при удалении новости:", err);
      setError("Ошибка при удалении новости");
    }
  };

  // Если локальная загрузка закончилась, а onFeedLoad ещё не вызван – вызываем его
  useEffect(() => {
    if (!loading && !onFeedLoadCalled.current) {
      onFeedLoadCalled.current = true;
      onFeedLoad && onFeedLoad();
    }
  }, [loading, onFeedLoad]);

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
          padding: "20px",
          color: "red",
          textAlign: "center",
        }}
      >
        {error}
      </div>
    );
  }

  const tabOptions = [
    { value: "news", label: "Новости" },
    { value: "followers", label: "Друзья" },
  ];

  return (
    <div
      className="fade-in"
      style={{
        width: "100%",
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderRadius: 15,
          margin: "0px 15px",
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

      {activeTab === "news" && (
        <div style={{ position: "relative", margin: "10px 15px 0 15px" }}>
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
              backgroundColor: "#1D1D1F",
              color: "white",
              outline: "none",
              border: "none",
            }}
          />
        </div>
      )}

      <TransitionGroup>
        <CSSTransition key={activeTab} classNames="page" timeout={300}>
          <div style={{ position: "relative", minHeight: "calc(100% - 70px)" }}>
            {activeTab === "followers" && (
              <div style={{ margin: "20px 15px 0px 15px" }}>
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
                        <div
                          onClick={() =>
                            navigate(`/userprofile/${friend.uid}`, {
                              state: { currentUserUid: currentUser.uid },
                            })
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "15px",
                            cursor: "pointer",
                          }}
                        >
                          <img
                            src={friend?.photoUrl || "https://placehold.co/50x50"}
                            alt="avatar"
                            style={{
                              width: "35px",
                              height: "35px",
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
              <div style={{ marginTop: "20px" }}>
                {(currentUser.role === "admin" || currentUser.role === "owner") && (
                  <button
                    onClick={() => navigate("/news/new")}
                    style={{
                      margin: "10px",
                      padding: "10px",
                      borderRadius: "10px",
                      backgroundColor: "#212124",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      display: "block",
                      width: "calc(100% - 20px)",
                    }}
                  >
                    Новая новость
                  </button>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
                      {news.imageUrl && (
                        <img
                          src={news.imageUrl}
                          alt="news"
                          style={{
                            width: "100%",
                            marginTop: "10px",
                          }}
                        />
                      )}
                      <div style={{ margin: "10px 15px 0px 15px", display: "flex", flexDirection: "column" }}>
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
                            <CSSTransition
                              in={openNewsMenuId === news.id}
                              timeout={300}
                              classNames="menuFade"
                              unmountOnExit
                              nodeRef={nodeRef}
                            >
                              <div
                                ref={nodeRef}
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
                        <span style={{ marginBottom: "5px", color: "white" }}>
                          {news.title}
                        </span>
                        <small style={{ color: "#888" }}>
                          @anarbot66 {formatDate(news.createdAt?.toDate ? news.createdAt.toDate() : news.createdAt)}
                        </small>
                      </div>
                      {news.type === "link" ? (
                        <a
                          href={news.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            margin: "10px 15px 0px 15px",
                            padding: "12px 20px",
                            backgroundColor: "#212124",
                            border: "none",
                            borderRadius: "12px",
                            color: "white",
                            cursor: "pointer",
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
                            margin: "10px 15px 0px 15px",
                            padding: "12px 20px",
                            backgroundColor: "#212124",
                            border: "none",
                            borderRadius: "12px",
                            color: "white",
                            cursor: "pointer",
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
              </div>
            )}
          </div>
        </CSSTransition>
      </TransitionGroup>
    </div>
  );
};

export default Feed;
