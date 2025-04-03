import React, { useState, useEffect } from "react";
import { collection, doc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import CustomSelect from "../components/CustomSelect"; // Ваш кастомный селект
import { db } from "../../../firebase";
import { CONSTRUCTOR_TRANSLATIONS, DRIVER_TRANSLATIONS } from "./ClubCreate"; // Экспорт переводов из компонента создания клуба

const ClubSettings = ({ currentUser }) => {
  const navigate = useNavigate();

  // Состояния для загрузки данных клуба
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Состояния для формы (данные клуба)
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [thematic, setThematic] = useState("");
  const [dedicated, setDedicated] = useState("");
  const [dedicatedItem, setDedicatedItem] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  // Состояния для социальных ссылок
  const [youtube, setYoutube] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [telegram, setTelegram] = useState("");

  // Переключение вкладок: "данные" и "ссылки"
  const [activeTab, setActiveTab] = useState("данные");

  // Состояние кастомного оповещения об успешном сохранении
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Загружаем данные клуба текущего пользователя
  useEffect(() => {
    const fetchClub = async () => {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, "clubs"),
          where("clubOwnerUid", "==", currentUser.uid)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const clubData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          setClub(clubData);
          // Предзаполнение состояния формы
          setClubName(clubData.clubName || "");
          setDescription(clubData.description || "");
          setThematic(clubData.thematic || "");
          setDedicated(clubData.dedicated || "");
          setDedicatedItem(clubData.dedicatedItem || "");
          setAvatarPreview(clubData.avatarUrl || "");
          setCoverPreview(clubData.coverUrl || "");
          setYoutube(clubData.socialLinks?.youtube || "");
          setInstagram(clubData.socialLinks?.instagram || "");
          setTiktok(clubData.socialLinks?.tiktok || "");
          setTelegram(clubData.socialLinks?.telegram || "");
        } else {
          setError("Клуб не найден.");
        }
      } catch (err) {
        console.error("Ошибка загрузки клуба:", err);
        setError("Ошибка загрузки клуба");
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [currentUser]);

  // Опции для селекта тематик
  const thematicOptions = [
    { value: "f1", label: "Формула 1" },
    { value: "other", label: "Другие виды автоспорта" },
    { value: "mixed", label: "Смешанный" },
  ];

  // Опции для селекта "Посвящен"
  const dedicatedOptions = [
    { value: "team", label: "Команде" },
    { value: "driver", label: "Пилоту" },
    { value: "none", label: "Никому" },
  ];

  // Если выбран dedicated для Формулы 1, возвращаем дополнительные опции
  const getDedicatedItemOptions = () => {
    if (dedicated === "team") {
      return Object.entries(CONSTRUCTOR_TRANSLATIONS).map(([key, label]) => ({
        value: key,
        label,
      }));
    } else if (dedicated === "driver") {
      return Object.entries(DRIVER_TRANSLATIONS).map(([key, label]) => ({
        value: key,
        label,
      }));
    }
    return [];
  };

  // Обработчик выбора аватарки с проверкой соотношения сторон (1:1)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const { width, height } = img;
        if (width !== height) {
          setError("Аватарка должна иметь соотношение 1:1");
          setAvatarFile(null);
          setAvatarPreview("");
        } else {
          setError("");
          setAvatarFile(file);
          setAvatarPreview(objectUrl);
        }
      };
      img.src = objectUrl;
    }
  };

  // Обработчик выбора обложки с проверкой соотношения сторон (16:9)
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const { width, height } = img;
        if (Math.abs(width / height - 16 / 9) > 0.01) {
          setError("Обложка должна иметь соотношение 16:9");
          setCoverFile(null);
          setCoverPreview("");
        } else {
          setError("");
          setCoverFile(file);
          setCoverPreview(objectUrl);
        }
      };
      img.src = objectUrl;
    }
  };

  // Функция загрузки изображения через API (например, imgbb)
  const uploadImageAPI = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("key", "2efcc5045381407287404d66cbe72876");
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data.data.url;
  };

  // Обработка сабмита – обновление данных клуба
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!club) return;
    setLoading(true);
    try {
      let avatarUrl = club.avatarUrl;
      let coverUrl = club.coverUrl;
      if (avatarFile) {
        avatarUrl = await uploadImageAPI(avatarFile);
      }
      if (coverFile) {
        coverUrl = await uploadImageAPI(coverFile);
      }

      const clubData = {
        clubName,
        description,
        thematic,
        dedicated: thematic === "f1" ? dedicated : null,
        dedicatedItem: thematic === "f1" && dedicated !== "none" ? dedicatedItem : null,
        avatarUrl,
        coverUrl,
        socialLinks: {
          youtube,
          instagram,
          tiktok,
          telegram,
        },
      };

      await updateDoc(doc(db, "clubs", club.id), clubData);
      // Показываем кастомное окно оповещения
      setShowSuccessAlert(true);
    } catch (err) {
      console.error("Ошибка при обновлении клуба:", err);
      setError("Ошибка при обновлении клуба");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  return (
    <>
    <div style={{padding: 15}}>
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
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          color: "white",
          marginBottom: 80,
        }}
      >
        <h2>Настройки клуба</h2>
        {/* Переключатель вкладок */}
        <div
          style={{
            display: "flex",
            borderRadius: "20px",
            marginTop: "10px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("данные")}
            style={{
              padding: "10px 20px",
              background: activeTab === "данные" ? "#212124" : "transparent",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "background 0.4s ease",
              fontSize: 14,
            }}
          >
            Данные
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ссылки")}
            style={{
              padding: "10px 20px",
              background: activeTab === "ссылки" ? "#212124" : "transparent",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "background 0.4s ease",
              fontSize: 14,
            }}
          >
            Ссылки
          </button>
        </div>

        {activeTab === "данные" && (
          <>
            <div>
              <label>Мой клуб</label>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Название клуба"
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  width: "100%",
                  background: "#212124",
                }}
                required
              />
            </div>
            <div>
              <label>Тематика</label>
              <CustomSelect
                options={thematicOptions}
                value={thematic}
                onChange={setThematic}
                style={{ width: "100%" }}
              />
            </div>
            {thematic === "f1" && (
              <>
                <div>
                  <label>Посвящен</label>
                  <CustomSelect
                    options={dedicatedOptions}
                    value={dedicated}
                    onChange={setDedicated}
                    style={{ width: "100%" }}
                  />
                </div>
                {dedicated && dedicated !== "none" && (
                  <div>
                    <label>
                      {dedicated === "team" ? "Выберите команду" : "Выберите пилота"}
                    </label>
                    <CustomSelect
                      options={getDedicatedItemOptions()}
                      value={dedicatedItem}
                      onChange={setDedicatedItem}
                      style={{ width: "100%" }}
                    />
                  </div>
                )}
              </>
            )}
            <div>
              <label>Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание клуба"
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  width: "100%",
                  minHeight: "100px",
                  background: "#212124",
                }}
              />
            </div>
            <div>
              <label>Аватарка (1:1)</label>
              <div
                style={{
                  position: "relative",
                  borderRadius: "15px",
                  overflow: "hidden",
                  width: "100%",
                  height: "80px",
                  background: "#212124",
                }}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="avatar preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: "#ABABAB",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    Выберите аватарку
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>
            <div>
              <label>Обложка (16:9)</label>
              <div
                style={{
                  position: "relative",
                  border: "1px solid #212124",
                  borderRadius: "15px",
                  overflow: "hidden",
                  width: "100%",
                  height: "80px",
                  background: "#212124",
                }}
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="cover preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: "#ABABAB",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    Выберите обложку
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "ссылки" && (
          <>
            <div>
              <label>YouTube</label>
              <input
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="Ссылка на YouTube"
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  width: "100%",
                  background: "#212124",
                }}
              />
            </div>
            <div>
              <label>Instagram</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="Ссылка на Instagram"
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  width: "100%",
                  background: "#212124",
                }}
              />
            </div>
            <div>
              <label>TikTok</label>
              <input
                type="text"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="Ссылка на TikTok"
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  width: "100%",
                  background: "#212124",
                }}
              />
            </div>
            <div>
              <label>Telegram</label>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="Ссылка на Telegram"
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  width: "100%",
                  background: "#212124",
                }}
              />
            </div>
          </>
        )}

        {error && <div style={{ color: "red" }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "15px",
            borderRadius: "15px",
            background: "#212124",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Сохранение..." : "Сохранить"}
        </button>
      </form>

      {/* Кастомное окно оповещения об успешном сохранении */}
      {showSuccessAlert && (
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
          onClick={() => setShowSuccessAlert(false)}
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
            <p style={{ marginBottom: "20px" }}>Данные клуба успешно обновлены</p>
            <button
              onClick={() => setShowSuccessAlert(false)}
              style={{
                background: "#212124",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "15px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Хорошо
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ClubSettings;
