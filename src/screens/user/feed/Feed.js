import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  limit,
  startAfter,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { db } from "../../../firebase";
import LikeButton from "../creators/components/LikeButton";
import CommentsSection from "../components/CommentsSection"; // Компонент комментариев
import RoleIcon from "../components/RoleIcon";
import friendsImage from "../images/friendsImage.png";
import creatorsImage from "../images/creatorsImage.png";
import newsImage from "../images/newsImage.png";
import randomRoutes from "../dict/randomRoutes";
import { formatDate, getFormattedDate } from "./utils/dateUtils";
import ClubInfo from "./ClubInfo";
import ClubInfoInline from "./hooks/ClubInfoInline";
import CustomSelect from "../components/CustomSelect";
import { CONSTRUCTOR_TRANSLATIONS, DRIVER_TRANSLATIONS } from "../../recources/json/constants";

const Feed = ({ currentUser, onFeedLoad }) => {
  // Общие состояния
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("news");
  const navigate = useNavigate();
  const [openNewsMenuId, setOpenNewsMenuId] = useState(null);
  const nodeRef = useRef(null);
  const onFeedLoadCalled = useRef(false);
  const [activeCommentsNewsId, setActiveCommentsNewsId] = useState(null);
  const [activeCommentsFriendPostId, setActiveCommentsFriendPostId] = useState(null);
  const [totalNewsCount, setTotalNewsCount] = useState(0);
  const [openCommentsArticle, setOpenCommentsArticle] = useState(null);

  // Состояния для постов клубов (вкладка "Креаторы")
  const [clubPosts, setClubPosts] = useState([]);
  const [clubPostsLoading, setClubPostsLoading] = useState(false);
  const [lastClubPost, setLastClubPost] = useState(null);

  // Состояния для новостей с пагинацией
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [lastNewsItem, setLastNewsItem] = useState(null);

  // Состояния для постов друзей (вкладка "Друзья")
  const [friendPosts, setFriendPosts] = useState([]);
  const [friendPostsLoading, setFriendPostsLoading] = useState(false);
  const [lastFriendPost, setLastFriendPost] = useState(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedPilot, setSelectedPilot] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("");

  const formattedDate = getFormattedDate();

  const toggleFriendPostComments = (postId) => {
    setActiveCommentsFriendPostId((prev) => (prev === postId ? null : postId));
  };

  const toggleComments = (newsId) => {
    setActiveCommentsNewsId((prev) => (prev === newsId ? null : newsId));
  };

  // Новая логика фильтрации новостей, комбинирующая текстовый поиск и фильтры
  const filteredNews = newsItems.filter((news) => {
    const lowerQuery = searchQuery.toLowerCase();
    const title = news.title ? news.title.toLowerCase() : "";
    const text = news.text ? news.text.toLowerCase() : "";
    const matchesSearch = title.includes(lowerQuery) || text.includes(lowerQuery);

    const matchesPilot = selectedPilot
      ? title.includes(selectedPilot.toLowerCase())
      : true;
    const matchesTeam = selectedTeam
      ? title.includes(selectedTeam.toLowerCase())
      : true;

    let matchesDate = true;
    if (selectedDateFilter) {
      const now = new Date();
      let limitDate = new Date();
      if (selectedDateFilter === "week") {
        limitDate.setDate(now.getDate() - 7);
      } else if (selectedDateFilter === "month") {
        limitDate.setMonth(now.getMonth() - 1);
      }
      const newsDate = news.createdAt?.toDate ? news.createdAt.toDate() : new Date(news.createdAt);
      matchesDate = newsDate >= limitDate;
    }
    return matchesSearch && matchesPilot && matchesTeam && matchesDate;
  });

  // Состояния для боковой панели фильтров
  

  // Формирование опций для фильтров с использованием констант
  const pilotOptions = [
    { value: "", label: "Все" },
    ...Object.values(DRIVER_TRANSLATIONS).map((pilot) => ({
      value: pilot,
      label: pilot,
    })),
  ];
  const teamOptions = [
    { value: "", label: "Все" },
    ...Object.values(CONSTRUCTOR_TRANSLATIONS).map((team) => ({
      value: team,
      label: team,
    })),
  ];
  const dateOptions = [
    { value: "", label: "Все даты" },
    { value: "week", label: "За последнюю неделю" },
    { value: "month", label: "За последний месяц" },
  ];

  // Загрузка подписок на пользователей (для вкладки "Друзья")
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

  // Загрузка постов друзей при выборе вкладки "Друзья"
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
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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

  // Загрузка новостей при выборе вкладки "Новости"
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
        const newsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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

  // Загрузка постов клубов при выборе вкладки "Клубы"
  const [clubPostsEnd, setClubPostsEnd] = useState(false); // Флаг для конца данных

  const fetchClubPosts = async (loadMore = false) => {
    if (clubPostsLoading || (clubPostsEnd && loadMore)) return;
    setClubPostsLoading(true);

    try {
      // Получаем список клубов, на которые подписан пользователь
      const followsQuery = query(
        collection(db, "clubFollows"),
        where("uid", "==", currentUser.uid)
      );
      const followsSnapshot = await getDocs(followsQuery);
      const clubIds = followsSnapshot.docs.map((doc) => doc.data().clubId);

      if (clubIds.length === 0) {
        setClubPosts([]);
        setClubPostsEnd(true);
        return;
      }

      let articlesQuery;
      if (loadMore && lastClubPost) {
        articlesQuery = query(
          collection(db, "articles"),
          where("clubid", "in", clubIds),
          orderBy("createdAt", "desc"),
          orderBy("__name__", "desc"),
          startAfter(lastClubPost),
          limit(5)
        );
      } else {
        articlesQuery = query(
          collection(db, "articles"),
          where("clubid", "in", clubIds),
          orderBy("createdAt", "desc"),
          orderBy("__name__", "desc"),
          limit(5)
        );
      }

      const articlesSnapshot = await getDocs(articlesQuery);
      const articlesData = articlesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (
        loadMore &&
        articlesData.length > 0 &&
        lastClubPost &&
        articlesData[0].id === lastClubPost.id
      ) {
        setClubPostsEnd(true);
      } else {
        if (loadMore) {
          setClubPosts((prev) => [...prev, ...articlesData]);
        } else {
          setClubPosts(articlesData);
        }
        if (articlesSnapshot.docs.length > 0) {
          setLastClubPost(articlesSnapshot.docs[articlesSnapshot.docs.length - 1]);
        }
        if (articlesSnapshot.docs.length < 5) {
          setClubPostsEnd(true);
        }
      }
    } catch (err) {
      console.error("Ошибка загрузки постов клубов:", err);
      setError("Ошибка загрузки постов клубов");
    } finally {
      setClubPostsLoading(false);
    }
  };

  const [totalClubPostsCount, setTotalClubPostsCount] = useState(0);
  const fetchTotalClubPostsCount = async () => {
    try {
      if (!currentUser) return;
      const followsQuery = query(
        collection(db, "clubFollows"),
        where("uid", "==", currentUser.uid)
      );
      const followsSnapshot = await getDocs(followsQuery);
      const clubIds = followsSnapshot.docs.map((doc) => doc.data().clubId);
      if (clubIds.length === 0) {
        setTotalClubPostsCount(0);
        return;
      }
      let totalCount = 0;
      if (clubIds.length <= 10) {
        const countQuery = query(
          collection(db, "articles"),
          where("clubid", "in", clubIds)
        );
        const snapshot = await getCountFromServer(countQuery);
        totalCount = snapshot.data().count;
      } else {
        const chunks = [];
        for (let i = 0; i < clubIds.length; i += 10) {
          chunks.push(clubIds.slice(i, i + 10));
        }
        const countPromises = chunks.map(async (chunk) => {
          const countQuery = query(
            collection(db, "articles"),
            where("clubid", "in", chunk)
          );
          const snapshot = await getCountFromServer(countQuery);
          return snapshot.data().count;
        });
        const counts = await Promise.all(countPromises);
        totalCount = counts.reduce((sum, count) => sum + count, 0);
      }
      setTotalClubPostsCount(totalCount);
    } catch (err) {
      console.error("Ошибка получения количества постов клубов:", err);
    }
  };

  useEffect(() => {
    fetchTotalClubPostsCount();
  }, [currentUser]);

  const allRoutes = [...Object.values(randomRoutes.pilotdetails)];
  const handleRandomNavigation = () => {
    const randomIndex = Math.floor(Math.random() * allRoutes.length);
    const selectedRoute = allRoutes[randomIndex];
    navigate(selectedRoute);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    onFeedLoadCalled.current = false;
  };

  const handleDeleteNews = async (newsId) => {
    try {
      await deleteDoc(doc(db, "news", newsId));
      setTotalNewsCount((prev) => prev - 1);
    } catch (err) {
      console.error("Ошибка при удалении новости:", err);
      setError("Ошибка при удалении новости");
    }
  };

  useEffect(() => {
    if (!loading && !onFeedLoadCalled.current) {
      onFeedLoadCalled.current = true;
      onFeedLoad && onFeedLoad();
    }
  }, [loading, onFeedLoad]);

  useEffect(() => {
    if (activeTab === "news" && newsItems.length === 0) {
      fetchNews(false);
    }
  }, [activeTab, newsItems.length, fetchNews]);

  useEffect(() => {
    if (activeTab === "followers") {
      fetchFriendPosts();
    }
  }, [activeTab, followers]);

  useEffect(() => {
    if (activeTab === "creators" && currentUser?.uid) {
      fetchClubPosts(false);
    }
  }, [activeTab, currentUser?.uid]);

  if (loading) {
    return (
      <div style={{ width: "100vw", height: "100vh", backgroundColor: "#1D1D1F", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="loader"></div>
        <style>{`
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
          `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red", textAlign: "center" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", margin: "0 auto", marginBottom: "100px", overflowY: "auto", paddingTop: "15px", display: "flex", flexDirection: "column", background: "#1D1D1F" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", borderRadius: 15, padding: "0px 15px 5px 15px", justifyContent: "space-between", height: "30px" }}>
        <div onClick={handleRandomNavigation} style={{ background: "#212124", borderRadius: 50, width: 30, height: 30, alignItems: "center", justifyContent: "center", display: "flex" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.49998 2.67157C9.49998 2.94771 9.72384 3.17157 9.99998 3.17157C10.2761 3.17157 10.5 2.94771 10.5 2.67157V0.843139C10.5 0.566997 10.2761 0.34314 9.99998 0.34314C9.72384 0.34314 9.49998 0.566997 9.49998 0.84314V2.67157Z" fill="white"/>
            <path d="M14 2.7071C14.1952 2.51184 14.1952 2.19526 14 1.99999C13.8047 1.80473 13.4881 1.80473 13.2929 1.99999L12 3.29289C11.8047 3.48815 11.8047 3.80473 12 3.99999C12.1952 4.19526 12.5118 4.19526 12.7071 3.99999L14 2.7071Z" fill="white"/>
            <path d="M7.29287 4C7.48814 4.19526 7.80472 4.19526 7.99998 4C8.19524 3.80473 8.19524 3.48815 7.99998 3.29289L6.70709 1.99999C6.51182 1.80473 6.19524 1.80473 5.99998 2C5.80472 2.19526 5.80472 2.51184 5.99998 2.7071L7.29287 4Z" fill="white"/>
            <path d="M6.67155 6.49999C6.9477 6.49999 7.17155 6.27614 7.17155 5.99999C7.17155 5.72385 6.94769 5.49999 6.67155 5.49999H4.84312C4.56698 5.49999 4.34313 5.72385 4.34313 5.99999C4.34313 6.27614 4.56698 6.49999 4.84313 6.49999H6.67155Z" fill="white"/>
            <path d="M15.1568 6.49999C15.433 6.49999 15.6568 6.27614 15.6568 5.99999C15.6568 5.72385 15.433 5.49999 15.1568 5.49999H13.3284C13.0523 5.49999 12.8284 5.72385 12.8284 5.99999C12.8284 6.27614 13.0523 6.49999 13.3284 6.49999H15.1568Z" fill="white"/>
            <path d="M13.2929 10C13.4881 10.1953 13.8047 10.1953 14 10C14.1952 9.80473 14.1952 9.48815 14 9.29289L12.7071 7.99999C12.5118 7.80473 12.1952 7.80473 12 8C11.8047 8.19526 11.8047 8.51184 12 8.7071L13.2929 10Z" fill="white"/>
            <path d="M9.49998 11.1568C9.49998 11.433 9.72384 11.6568 9.99998 11.6568C10.2761 11.6568 10.5 11.433 10.5 11.1568V9.32842C10.5 9.05228 10.2761 8.82842 9.99998 8.82842C9.72384 8.82842 9.49998 9.05228 9.49998 9.32842V11.1568Z" fill="white"/>
            <path d="M11.3536 6.06065C11.5488 5.86539 11.5488 5.54881 11.3536 5.35355L10.6464 4.64644C10.4512 4.45118 10.1346 4.45118 9.93934 4.64644L8.64645 5.93933C8.45118 6.13459 8.45118 6.45118 8.64645 6.64644L9.35355 7.35355C9.54882 7.54881 9.8654 7.54881 10.0607 7.35355L11.3536 6.06065Z" fill="white"/>
          </svg>
        </div>
        <img onClick={() => navigate("/profile")} src={currentUser.photoUrl || "https://placehold.co/80x80"} alt="Avatar" style={{ width: "30px", height: "30px", borderRadius: "50%", alignContent: "right" }} />
      </div>
      <div style={{ width: "100%", height: 80, padding: "0px 15px", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start" }}>
        <div style={{ color: "white", fontSize: 24, fontWeight: "500", wordWrap: "break-word" }}>
          Привет, {currentUser.firstName}!
        </div>
        <div style={{ color: "white", fontSize: 24, fontFamily: "Inter", fontWeight: "500", wordWrap: "break-word" }}>
          Что посмотрим сегодня?
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0px 15px" }}>
        <div style={{ justifyContent: "flex-start", alignItems: "center", gap: 10, display: "inline-flex", width: "100%" }}>
          {[
            { key: "news", label: "Новости", image: newsImage },
            { key: "creators", label: "Клубы", image: creatorsImage },
            { key: "followers", label: "Друзья", image: friendsImage },
          ].map(({ key, label, image }) => {
            const isActive = activeTab === key;
            return (
              <div
                key={key}
                onClick={key !== "creators" ? () => handleTabChange(key) : () => handleTabChange("creators")}
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: 1,
                  padding: 7,
                  borderRadius: 12,
                  backgroundImage: `url(${image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  alignItems: "flex-start",
                  gap: 6,
                  display: "inline-flex",
                  cursor: "pointer",
                  overflow: "hidden",
                  transition: "opacity 0.4s ease",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    opacity: isActive ? 0 : 1,
                    zIndex: 1,
                    pointerEvents: "none",
                    transition: "opacity 0.4s ease",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    textAlign: "right",
                    color: "white",
                    fontSize: 15,
                    fontFamily: "Inter",
                    fontWeight: "400",
                    wordWrap: "break-word",
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <TransitionGroup>
        <CSSTransition key={activeTab} classNames="tab" timeout={400}>
          <div style={{ position: "relative", minHeight: "calc(100% - 70px)" }}>
            {activeTab === "followers" && (
              <div style={{ margin: "20px 15px 0px 15px" }}>
                {friendPosts.length > 0 ? (
                  friendPosts.map((post) => {
                    const friend = followers.find((user) => user.uid === post.uid);
                    return (
                      <div key={post.id} style={{ width: "100%", display: "flex", flexDirection: "column", marginBottom: "20px" }}>
                        <div
                          onClick={() =>
                            navigate(`/userprofile/${friend.uid}`, { state: { currentUserUid: currentUser.uid } })
                          }
                          style={{ display: "flex", alignItems: "center", gap: "15px", cursor: "pointer" }}
                        >
                          <img
                            src={friend?.photoUrl || "https://placehold.co/50x50"}
                            alt="avatar"
                            style={{ width: "35px", height: "35px", borderRadius: "50%", objectFit: "cover" }}
                          />
                          <div>
                            <strong style={{ fontSize: "14px", color: "#ddd", display: "flex", alignItems: "center", gap: "10px" }}>
                              {friend ? `${friend.firstName} ${friend.lastName}` : "Неизвестный пользователь"}
                              {friend && friend.role && (
                                <RoleIcon role={friend.role} style={{ marginLeft: "5px" }} size={14} />
                              )}
                            </strong>
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "5px" }}>
                            <small style={{ color: "#888" }}>
                              {formatDate(post.createdAt?.toDate ? post.createdAt.toDate() : post.createdAt)}
                            </small>
                          </div>
                          <div style={{ borderRadius: "12px", color: "white", marginTop: 7 }}>
                            {post.text}
                          </div>
                          <button
                            onClick={() => toggleFriendPostComments(post.id)}
                            style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: "20px", marginTop: 7 }}
                          >
                            <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3.68209 15.2515C3.97139 15.5469 4.11624 15.9583 4.0772 16.3735C3.98969 17.3041 3.78815 18.2726 3.52931 19.1723C5.44728 18.7209 6.61867 18.1973 7.15112 17.9226C7.45336 17.7667 7.8015 17.7299 8.12876 17.8192C9.03329 18.0661 9.9973 18.2 11 18.2C16.4939 18.2 20.625 14.2694 20.625 9.8C20.625 5.33056 16.4939 1.4 11 1.4C5.50605 1.4 1.375 5.33056 1.375 9.8C1.375 11.8553 2.22379 13.7625 3.68209 15.2515ZM3.00423 20.7185C2.99497 20.7204 2.9857 20.7222 2.97641 20.7241C2.85015 20.7494 2.72143 20.7744 2.59025 20.7988C2.40625 20.8332 2.21738 20.8665 2.02362 20.8988C1.74997 20.9445 1.5405 20.653 1.6486 20.393C1.71922 20.2231 1.78884 20.0451 1.85666 19.8605C1.89975 19.7432 1.94212 19.6233 1.98356 19.5012C1.98534 19.4959 1.98713 19.4906 1.98891 19.4854C2.32956 18.4778 2.60695 17.3196 2.70845 16.2401C1.02171 14.5178 0 12.2652 0 9.8C0 4.38761 4.92487 0 11 0C17.0751 0 22 4.38761 22 9.8C22 15.2124 17.0751 19.6 11 19.6C9.87696 19.6 8.79323 19.4501 7.77265 19.1714C7.05838 19.54 5.51971 20.2108 3.00423 20.7185Z" fill="white"/>
                            </svg>
                          </button>
                        </div>
                        <CSSTransition in={activeCommentsFriendPostId === post.id} timeout={300} classNames="slideUp" unmountOnExit>
                          <CommentsSection parentId={activeCommentsFriendPostId} currentUser={currentUser} onClose={() => setActiveCommentsFriendPostId(null)} />
                        </CSSTransition>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ textAlign: "center", marginTop: "100px", color: "white", fontSize: 15 }}>
                    Ваши друзья ничего не публиковали
                  </p>
                )}
                {friendPosts.length > 0 && (
                  <button onClick={() => fetchFriendPosts(true)} disabled={friendPostsLoading} style={{ margin: "20px auto", padding: "10px 20px", borderRadius: "10px", color: "gray", border: "none", cursor: "pointer", display: "block" }}>
                    {friendPostsLoading ? "Загрузка..." : "Загрузить ещё"}
                  </button>
                )}
              </div>
            )}
            {activeTab === "news" && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ margin: "10px 15px 0 15px", display: "flex", flexDirection: "column", gap: 15, marginBottom: 15 }}>
                <div style={{ position: "relative", display: "flex" }}>
                  <input
                    type="text"
                    placeholder="Ищите что угодно о формуле..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "20px 50px 20px 20px", // увеличиваем правый отступ для кнопки
                      borderRadius: "12px",
                      backgroundColor: "#212124",
                      color: "white",
                      outline: "none",
                      border: "none",
                    }}
                  />
                  {/* Кнопка фильтра */}
                  <button
                    onClick={() => setFiltersOpen((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "20px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
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
                  </button>
                </div>

                  {(currentUser.role === "admin" || currentUser.role === "owner") && (
                    <button
                      onClick={() => navigate("/news/new")}
                      style={{ width: "100%", padding: "20px", borderRadius: "12px", backgroundColor: "#212124", color: "white", outline: "none", border: "none" }}
                    >
                      Новая новость
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {filteredNews.map((news) => (
                    <div key={news.id} style={{ padding: "0px 15px", marginBottom: "10px", position: "relative", display: "flex", flexDirection: "column", borderRadius: "8px" }}>
                      <div onClick={() => navigate(`/news/${news.id}`, { state: { news } })}>
                        {news.imageUrl && (
                          <img src={news.imageUrl} alt="news" style={{ width: "100%", borderRadius: "12px" }} />
                        )}
                        <div style={{ margin: "10px 0px 0px 0px", display: "flex", flexDirection: "column" }}>
                          {(currentUser.role === "admin" || currentUser.role === "owner") && (
                            <div style={{ position: "absolute", top: 0, right: 0 }}>
                              <button
                                onClick={() => setOpenNewsMenuId((prev) => (prev === news.id ? null : news.id))}
                                style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: "18px" }}
                              >
                                ⋮
                              </button>
                              <CSSTransition in={openNewsMenuId === news.id} timeout={300} classNames="menuFade" unmountOnExit nodeRef={nodeRef}>
                                <div ref={nodeRef} style={{ position: "absolute", top: "24px", right: "0", background: "#333", borderRadius: "12px 0px 12px 12px", padding: "5px", zIndex: 10 }}>
                                  <button
                                    onClick={() => {
                                      handleDeleteNews(news.id);
                                      setOpenNewsMenuId(null);
                                    }}
                                    style={{ display: "block", background: "transparent", border: "none", color: "white", cursor: "pointer", padding: "5px 10px", textAlign: "left", width: "100%", fontSize: "14px" }}
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
                          {news.text && (
                            <div style={{ margin: "5px 0 10px 0", color: "white", fontSize: "14px" }}>
                              {news.text}
                            </div>
                          )}
                          <small style={{ color: "#888" }}>
                            {news.creatorUsername} {formatDate(news.createdAt?.toDate ? news.createdAt.toDate() : news.createdAt)}
                          </small>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", margin: "10px 0px 0px 0px", gap: 15 }}>
                        <button onClick={() => toggleComments(news.id)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: "20px" }}>
                          <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.68209 15.2515C3.97139 15.5469 4.11624 15.9583 4.0772 16.3735C3.98969 17.3041 3.78815 18.2726 3.52931 19.1723C5.44728 18.7209 6.61867 18.1973 7.15112 17.9226C7.45336 17.7667 7.8015 17.7299 8.12876 17.8192C9.03329 18.0661 9.9973 18.2 11 18.2C16.4939 18.2 20.625 14.2694 20.625 9.8C20.625 5.33056 16.4939 1.4 11 1.4C5.50605 1.4 1.375 5.33056 1.375 9.8C1.375 11.8553 2.22379 13.7625 3.68209 15.2515ZM3.00423 20.7185C2.99497 20.7204 2.9857 20.7222 2.97641 20.7241C2.85015 20.7494 2.72143 20.7744 2.59025 20.7988C2.40625 20.8332 2.21738 20.8665 2.02362 20.8988C1.74997 20.9445 1.5405 20.653 1.6486 20.393C1.71922 20.2231 1.78884 20.0451 1.85666 19.8605C1.89975 19.7432 1.94212 19.6233 1.98356 19.5012C1.98534 19.4959 1.98713 19.4906 1.98891 19.4854C2.32956 18.4778 2.60695 17.3196 2.70845 16.2401C1.02171 14.5178 0 12.2652 0 9.8C0 4.38761 4.92487 0 11 0C17.0751 0 22 4.38761 22 9.8C22 15.2124 17.0751 19.6 11 19.6C9.87696 19.6 8.79323 19.4501 7.77265 19.1714C7.05838 19.54 5.51971 20.2108 3.00423 20.7185Z" fill="white"/>
                          </svg>
                        </button>
                      </div>
                      <CSSTransition in={!!activeCommentsNewsId} timeout={300} classNames="slideUp" unmountOnExit>
                        <CommentsSection parentId={activeCommentsNewsId} currentUser={currentUser} onClose={() => setActiveCommentsNewsId(null)} />
                      </CSSTransition>
                    </div>
                  ))}
                  {totalNewsCount > newsItems.length && (
                    <button onClick={() => fetchNews(true)} disabled={newsLoading} style={{ margin: "20px auto", padding: "10px 20px", borderRadius: "10px", color: "gray", border: "none", cursor: "pointer", display: "block" }}>
                      {newsLoading ? "Загрузка..." : "Загрузить ещё"}
                    </button>
                  )}
                </div>
              </div>
            )}
            {activeTab === "creators" && (
              <div style={{ margin: "20px 15px 0px 15px" }}>
                {clubPosts.length > 0 ? (
                  clubPosts.map((article) => (
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
                      <ClubInfoInline clubId={article.clubid} navigate={navigate} />
                      {article.previewUrl && (
                        <img
                          src={article.previewUrl}
                          alt="preview"
                          style={{ width: "100%", display: "block", borderRadius: "12px" }}
                        />
                      )}
                      <span style={{ padding: "15px 0px", color: "white" }}>{article.title}</span>
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
                ) : (
                  <p style={{ textAlign: "center", marginTop: "100px", color: "white", fontSize: 15 }}>
                    Нет публикаций клубов
                  </p>
                )}
                {!clubPostsEnd && (
                  <button onClick={() => fetchClubPosts(true)} style={{ margin: "20px auto", padding: "10px 20px", borderRadius: "10px", color: "gray", border: "none", cursor: "pointer", display: "block" }} disabled={clubPostsLoading}>
                    {clubPostsLoading ? "Загрузка..." : "Загрузить ещё"}
                  </button>
                )}
              </div>
            )}
          </div>
        </CSSTransition>
      </TransitionGroup>

          <CSSTransition
          in={filtersOpen}
          timeout={300}
          classNames="slide"
          unmountOnExit
        >
          <div
            style={{
              position: "fixed",
              right: "0",
              top: 0,
              bottom: 0,
              width: "300px",
              background: "#1D1D1F",
              padding: "20px",
              zIndex: 1000,
              overflowY: "auto",
            }}
          >
            {/* Кнопка закрытия панели */}
            <button
              onClick={() => setFiltersOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "18px",
                marginBottom: "15px",
              }}
            >
              ✕ Закрыть
            </button>
          
            <h3 style={{ color: "white", fontSize: 24, marginBottom: 15}}>Фильтры</h3>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ color: "white", marginBottom: "5px", display: "block" }}>
                Пилот
              </label>
              <CustomSelect
                options={pilotOptions}
                value={selectedPilot}
                onChange={setSelectedPilot}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ color: "white", marginBottom: "5px", display: "block" }}>
                Команда
              </label>
              <CustomSelect
                options={teamOptions}
                value={selectedTeam}
                onChange={setSelectedTeam}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ color: "white", marginBottom: "5px", display: "block" }}>
                Период
              </label>
              <CustomSelect
                options={dateOptions}
                value={selectedDateFilter}
                onChange={setSelectedDateFilter}
                style={{ width: "100%" }}
              />
            </div>
            <button
              onClick={() => setFiltersOpen(false)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#0077FF",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Применить
            </button>
          </div>
        </CSSTransition>
      
      
      {/* Добавляем стили для анимации */}
      <style>{`
        .slide-enter {
          transform: translateX(300px);
        }
        .slide-enter-active {
          transform: translateX(0);
          transition: transform 300ms ease-in-out;
        }
        .slide-exit {
          transform: translateX(0);
        }
        .slide-exit-active {
          transform: translateX(300px);
          transition: transform 300ms ease-in-out;
        }
      `}</style>
    </div>
    
  );
};

export default Feed;
