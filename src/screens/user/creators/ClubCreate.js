import React, { useState, useEffect } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import CustomSelect from "../components/CustomSelect"; // Ваш кастомный селект
import { db } from "../../../firebase";

// Константы перевода
export const CONSTRUCTOR_TRANSLATIONS = {
  "Red Bull": "Ред Булл",
  "McLaren": "Макларен",
  "Ferrari": "Феррари",
  "Aston Martin": "Астон Мартин",
  "Alpine F1 Team": "Альпин",
  "Haas F1 Team": "Хаас F1",
  "RB F1 Team": "РБ Виза",
  "Williams": "Вилльямс",
  "Sauber": "Заубер",
  "Mercedes": "Мерседес",
};

export const DRIVER_TRANSLATIONS = {
  "Max Verstappen": "Макс Ферстаппен",
  "Lando Norris": "Ландо Норрис",
  "Charles Leclerc": "Шарль Леклер",
  "Oscar Piastri": "Оскар Пиастри",
  "Carlos Sainz": "Карлос Сайнс",
  "George Russell": "Джордж Расселл",
  "Lewis Hamilton": "Льюис Хэмилтон",
  "Sergio Pérez": "Серхио Перес",
  "Fernando Alonso": "Фернандо Алонсо",
  "Pierre Gasly": "Пьер Гасли",
  "Nico Hülkenberg": "Нико Хюлькенберг",
  "Yuki Tsunoda": "Юки Цунода",
  "Lance Stroll": "Лэнс Стролл",
  "Esteban Ocon": "Эстебан Окон",
  "Kevin Magnussen": "Кевин Магнуссен",
  "Alexander Albon": "Александер Албон",
  "Daniel Ricciardo": "Даниэль Риккьярдо",
  "Oliver Bearman": "Оливер Бирман",
  "Franco Colapinto": "Франко Колапинто",
  "Guanyu Zhou": "Гуанью Джоу",
  "Liam Lawson": "Лиам Лоусон",
  "Valtteri Bottas": "Валттери Боттас",
  "Logan Sargeant": "Логан Сарджент",
  "Jack Doohan": "Джек Дуэн",
  "Andrea Kimi Antonelli": "Кими Антонелли",
  "Gabriel Bortoleto": "Габриэль Бортолето",
  "Isack Hadjar": "Исак Хаджар",
};

const ClubCreate = ({ currentUser }) => {
  const navigate = useNavigate();

  // Состояния формы
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [thematic, setThematic] = useState("");
  const [dedicated, setDedicated] = useState("");
  const [dedicatedItem, setDedicatedItem] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingClubs, setLoadingClubs] = useState(true);

  // Социальные ссылки (не обязательны)
  const [youtube, setYoutube] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [telegram, setTelegram] = useState("");

  // Переключение вкладок: "данные" и "ссылки"
  const [activeTab, setActiveTab] = useState("данные");

  // Состояние для клубов пользователя
  const [userClubs, setUserClubs] = useState([]);

  // Запрос клубов текущего пользователя
  useEffect(() => {
    const fetchClubs = async () => {
      if (!currentUser) {
        setLoadingClubs(false);
        return;
      }
      try {
        const q = query(
          collection(db, "clubs"),
          where("clubOwnerUid", "==", currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const clubs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserClubs(clubs);

        if (clubs.length > 0) {
          navigate(`/club/${clubs[0].id}`, { state: { club: clubs[0] } });
        } else {
          setLoadingClubs(false); // Только если клубов нет, убираем загрузку
        }
      } catch (err) {
        console.error("Ошибка получения клубов:", err);
        setLoadingClubs(false);
      }
    };

    fetchClubs();
  }, [currentUser, navigate]);
  

  // Опции для тематического селекта (3 варианта)
  const thematicOptions = [
    { value: "f1", label: "Формула 1" },
    { value: "other", label: "Другие виды автоспорта" },
    { value: "mixed", label: "Смешанный" },
  ];

  // Опции для селекта «Посвящен» (появляется, если тематика = Формула 1)
  const dedicatedOptions = [
    { value: "team", label: "Команде" },
    { value: "driver", label: "Пилоту" },
    { value: "none", label: "Никому" },
  ];

  // Если выбран dedicated для Формулы 1, показываем дополнительный селект
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

  // Обработчики выбора аватарки и обложки с проверкой соотношения сторон
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
          setAvatarPreview(null);
        } else {
          setError("");
          setAvatarFile(file);
          setAvatarPreview(objectUrl);
        }
      };
      img.src = objectUrl;
    }
  };

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
          setCoverPreview(null);
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

  // Обработка сабмита – загрузка изображений через API и сохранение данных в Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let avatarUrl = "";
      let coverUrl = "";
      if (avatarFile) {
        avatarUrl = await uploadImageAPI(avatarFile);
      }
      if (coverFile) {
        coverUrl = await uploadImageAPI(coverFile);
      }
      // Если изображение не выбрано, устанавливаем дефолтное значение
      if (!avatarUrl) avatarUrl = "no avi";
      if (!coverUrl) coverUrl = "no banner";

      const clubData = {
        clubName,
        description: description || "",
        thematic,
        dedicated: thematic === "f1" ? dedicated : null,
        dedicatedItem:
          thematic === "f1" && dedicated !== "none" ? dedicatedItem : null,
        avatarUrl,
        coverUrl,
        // Социальные ссылки
        socialLinks: {
          youtube: youtube || "",
          instagram: instagram || "",
          tiktok: tiktok || "",
          telegram: telegram || "",
        },
        clubOwnerUid: currentUser.uid,
        clubOwnerUsername: currentUser.name,
        createdAt: new Date(),
      };
      await addDoc(collection(db, "clubs"), clubData);
      // Можно добавить уведомление об успешном создании или редирект
    } catch (err) {
      console.error(err);
      setError("Ошибка при создании клуба");
    } finally {
      setLoading(false);
    }
  };

  if (loadingClubs) {
    return <div> </div>;
  }

  if (userClubs.length > 0) {
    return null;
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
          <h2>Создание клуба</h2>
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
                background:
                  activeTab === "данные" ? "#212124" : "transparent",
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
                background:
                  activeTab === "ссылки" ? "#212124" : "transparent",
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
                        {dedicated === "team"
                          ? "Выберите команду"
                          : "Выберите пилота"}
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
                {loading ? "Создается..." : "Создать"}
              </button>
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
        </form>
      </div>
    </>
  );
};

export default ClubCreate;