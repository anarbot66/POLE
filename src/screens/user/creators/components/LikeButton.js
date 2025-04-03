import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../../../../firebase";

const LikeButton = ({ articleId, currentUser }) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Загружаем информацию о лайках
  useEffect(() => {
    const loadLikes = async () => {
      if (!currentUser || !articleId) return;
      const likesDocRef = doc(db, "likes", articleId);
      const docSnap = await getDoc(likesDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const likedBy = data.likedBy || [];
        setLikesCount(likedBy.length);
        setLiked(likedBy.includes(currentUser.uid));
      } else {
        setLikesCount(0);
        setLiked(false);
      }
    };
    loadLikes();
  }, [articleId, currentUser]);

  const handleLike = async () => {
    const likesDocRef = doc(db, "likes", articleId);
    if (liked) {
      await updateDoc(likesDocRef, {
        likedBy: arrayRemove(currentUser.uid),
      });
      setLiked(false);
      setLikesCount(likesCount - 1);
    } else {
      try {
        await updateDoc(likesDocRef, {
          likedBy: arrayUnion(currentUser.uid),
        });
      } catch (err) {
        await setDoc(likesDocRef, { likedBy: [currentUser.uid] });
      }
      setLiked(true);
      setLikesCount(likesCount + 1);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div
      onClick={handleLike}
      style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
      className={`like-button ${liked ? "liked" : ""}`}
    >
      <svg
        className="heart-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
      <span style={{ marginLeft: "8px", color: "white" }}>{likesCount}</span>
      <style jsx>{`
        .like-button {
          color: gray;
          transition: color 0.4s ease;
        }

        .like-button.liked {
          color: red;
        }

        .heart-icon {
          fill: currentColor;
          transition: fill 0.4s ease;
        }
      `}</style>
    </div>
  );
};

export default LikeButton;
