import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useInitData } from "../../hooks/InitDataContext";

const API = process.env.REACT_APP_API_URL;

const CommentsSection = ({ parentId, onClose, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  const initData = useInitData();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await axios.get(`${API}/api/comments?parentId=${parentId}`, {
          headers: {
            'x-init-data': initData || '',  // передаем initData на бекенд
          }
        });
        setComments(res.data);
      } catch (err) {
        console.error("Ошибка при получении комментариев:", err);
      }
    };
  
    fetchComments();
  }, [parentId, initData]);
  
  // Автоматическая регулировка высоты textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newComment]);

  const handleSend = async () => {
    if (newComment.trim() === "") return;
    try {
      const payload = {
        parentId,
        authorId: currentUser.uid,
        authorName: currentUser.firstName + currentUser.lastName || "Аноним",
        authorPhotoUrl: currentUser.photoUrl || "",
        text: newComment,
        role: currentUser.role
      };
      await axios.post(`${API}/api/comments`, payload, {
        headers: {
          'x-init-data': initData || '',
        }
      });
      setNewComment("");
      // Перезагрузить комментарии
      const res = await axios.get(`${API}/api/comments?parentId=${parentId}`, {
        headers: {
          'x-init-data': initData || '',
        }
      });
      setComments(res.data);
    } catch (err) {
      console.error("Ошибка при отправке комментария:", err);
    }
  };
  
  const handleDelete = async (commentId) => {
    try {
      await axios.delete(`${API}/api/comments/${commentId}`, {
        headers: {
          'x-init-data': initData || '',
        }
      });
      // Перезагрузить комментарии
      const res = await axios.get(`${API}/api/comments?parentId=${parentId}`, {
        headers: {
          'x-init-data': initData || '',
        }
      });
      setComments(res.data);
    } catch (err) {
      console.error("Ошибка при удалении комментария:", err);
    }
  };
  
  // Переход на профиль пользователя по клику на аватар или ник
  const handleProfileClick = (commentAuthorId) => {
    if (currentUser.uid === commentAuthorId) {
      navigate("/profile");
    } else {
      navigate(`/userprofile/${commentAuthorId}`, { state: { currentUserUid: currentUser.uid } });
    }
  };

  return (
    <div className="navGlass" style={styles.commentsSection}>
      <div style={styles.header}>
        <span style={styles.headerText}>Комментарии</span>
        <button onClick={onClose} style={styles.closeButton}>×</button>
      </div>
      
      <div style={styles.commentsList}>
        {comments.length === 0 && (
          <p style={styles.noComments}>Пока нет комментариев</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} style={styles.commentItem}>
            <img
              src={comment.authorPhotoUrl || "https://placehold.co/40x40"}
              alt="avatar"
              style={styles.avatar}
              onClick={() => handleProfileClick(comment.authorId)}
            />
            <div style={styles.commentContent}>
              <div style={styles.commentHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <p 
                    style={styles.commentAuthor}
                    onClick={() => handleProfileClick(comment.authorId)}
                  >
                    {comment.authorName}
                  </p>
                </div>
                {(currentUser.uid === comment.authorId ||
                  currentUser.role === "admin" ||
                  currentUser.role === "owner") && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    style={styles.deleteButton}
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.34375 0.9375C1.82598 0.9375 1.40625 1.35723 1.40625 1.875V2.8125C1.40625 3.33027 1.82598 3.75 2.34375 3.75H2.8125V12.1875C2.8125 13.223 3.65197 14.0625 4.6875 14.0625H10.3125C11.348 14.0625 12.1875 13.223 12.1875 12.1875V3.75H12.6562C13.174 3.75 13.5938 3.33027 13.5938 2.8125V1.875C13.5938 1.35723 13.174 0.9375 12.6562 0.9375H9.375C9.375 0.419733 8.95527 0 8.4375 0H6.5625C6.04473 0 5.625 0.419733 5.625 0.9375H2.34375ZM5.15625 4.6875C5.41513 4.6875 5.625 4.89737 5.625 5.15625V11.7188C5.625 11.9776 5.41513 12.1875 5.15625 12.1875C4.89737 12.1875 4.6875 11.9776 4.6875 11.7188V5.15625C4.6875 4.89737 4.89737 4.6875 5.15625 4.6875ZM7.5 4.6875C7.75888 4.6875 7.96875 4.89737 7.96875 5.15625V11.7188C7.96875 11.9776 7.75888 12.1875 7.5 12.1875C7.24112 12.1875 7.03125 11.9776 7.03125 11.7188V5.15625C7.03125 4.89737 7.24112 4.6875 7.5 4.6875ZM10.3125 5.15625V11.7188C10.3125 11.9776 10.1026 12.1875 9.84375 12.1875C9.58487 12.1875 9.375 11.9776 9.375 11.7188V5.15625C9.375 4.89737 9.58487 4.6875 9.84375 4.6875C10.1026 4.6875 10.3125 4.89737 10.3125 5.15625Z" fill="white"/>
                    </svg>
                  </button>
                )}
              </div>
              <span style={styles.commentText}>{comment.text}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div style={styles.inputContainer}>
        <textarea
          ref={textareaRef}
          placeholder="Напишите комментарий..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          style={styles.textarea}
          maxLength={120}
        />
        <button onClick={handleSend} style={styles.sendButton}>
          <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24.7711 0.228815C24.9921 0.449801 25.0601 0.781222 24.9441 1.07139L15.8521 23.8012C15.4975 24.6879 14.2881 24.8008 13.7754 23.9952L8.80904 16.1909L1.00477 11.2245C0.199116 10.7119 0.312043 9.50247 1.19869 9.14781L23.9285 0.0558698C24.2187 -0.0601979 24.5501 0.00782868 24.7711 0.228815ZM10.3705 15.7343L14.6844 22.5133L22.0797 4.02505L10.3705 15.7343ZM20.9749 2.9202L2.48664 10.3155L9.26566 14.6294L20.9749 2.9202Z" fill="white"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

const styles = {
  commentsSection: {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100%",
    borderTopLeftRadius: "20px",
    borderTopRightRadius: "20px",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    zIndex: 999,
    height: 600,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  headerText: { color: "white", fontSize: "16px" },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "24px",
    cursor: "pointer",
  },
  commentsList: {
    flex: 1,
    overflowY: "auto",
    marginBottom: "10px",
  },
  noComments: { color: "#888", fontSize: "14px", textAlign: "center" },
  commentItem: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "12px",
    color: "white",
    fontSize: "14px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    objectFit: "cover",
    marginRight: "10px",
    cursor: "pointer",
  },
  commentContent: {
    flex: 1,
    maxWidth: "100%",
  },
  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentAuthor: {
    cursor: "pointer",
    color: "#c3c3c3"
  },
  deleteButton: {
    background: "transparent",
    border: "none",
    color: "#e74c3c",
    cursor: "pointer",
    fontSize: "16px",
  },
  commentText: {
    marginTop: "4px",
    display: "inline-block",
    width: "calc(100% - 20px)",
    wordWrap: "break-word",
    whiteSpace: "pre-wrap",
  },
  inputContainer: {
    display: "flex",
    gap: "10px",
  },
  textarea: {
    flex: 1,
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    background: "transparent",
    color: "white",
    outline: "none",
    resize: "none",
    overflow: "hidden",
    fontFamily: "inherit",
    fontSize: "14px",
  },
  sendButton: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    background: "transparent",
    color: "white",
    cursor: "pointer",
  },
};

export default CommentsSection;
