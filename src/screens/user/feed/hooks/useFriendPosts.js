import { useState } from "react";
import { collection, query, where, orderBy, limit, startAfter, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";

export const useFriendPosts = () => {
  const [friendPosts, setFriendPosts] = useState([]);
  const [friendPostsLoading, setFriendPostsLoading] = useState(false);
  const [lastFriendPost, setLastFriendPost] = useState(null);
  const [error, setError] = useState(null);

  const fetchFriendPosts = async (followers, loadMore = false) => {
    if (!followers || followers.length === 0) return;
    setFriendPostsLoading(true);
    try {
      const friendUids = followers.map(user => user.uid);
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
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      if (loadMore) {
        setFriendPosts(prev => [...prev, ...postsData]);
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

  return { friendPosts, friendPostsLoading, error, fetchFriendPosts };
};
