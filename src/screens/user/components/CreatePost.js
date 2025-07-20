import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const CreatePost = ({ currentUser }) => {
  const navigate = useNavigate();
  const [newPost, setNewPost] = useState("");
  const [error, setError] = useState(null);

  const handlePostSubmit = async () => {
    if (!newPost.trim()) return;
    try {
      await addDoc(collection(db, "posts"), {
        uid: currentUser.uid,
        text: newPost,
        createdAt: serverTimestamp(),
      });
      navigate(-1);
    } catch (err) {
      console.error("Ошибка публикации поста:", err);
      setError("Ошибка публикации поста");
    }
  };

  return (
    <div
      style={{
        color: "white",
        padding: "15px",
        minHeight: "100vh",
      }}
    >
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
        ←
      </button>
      <h2>Создать пост</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <textarea
        value={newPost}
        onChange={(e) => setNewPost(e.target.value)}
        placeholder="Напишите что-нибудь..."
        style={{
          width: "100%",
          height: "100px",
          borderRadius: "12px",
          padding: "10px",
          fontSize: "16px",
          background: "transparent",
          color: "white",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          outline: "none",
          marginTop: 10,
        }}
      />
      <button
        onClick={handlePostSubmit}
        style={{
          marginTop: "10px",
          width: "100%",
          padding: "10px",
          color: "white",
          borderRadius: "12px",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Опубликовать
      </button>
    </div>
  );
};

export default CreatePost;
