import { useState, useCallback } from "react";
import { collection, query, orderBy, limit, startAfter, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";

export const useNews = () => {
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [lastNewsItem, setLastNewsItem] = useState(null);
  const [error, setError] = useState(null);

  const fetchNews = useCallback(async (loadMore = false) => {
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
      const newsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      if (loadMore) {
        setNewsItems(prev => [...prev, ...newsData]);
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
  }, [lastNewsItem]);

  return { newsItems, newsLoading, error, fetchNews };
};
