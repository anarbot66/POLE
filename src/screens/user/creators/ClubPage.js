import React, { useState, useEffect, useRef } from "react";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  collection,
  increment 
} from "firebase/firestore";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { db } from "../../../firebase";
import ArticlesList from "./creatorPanel/ArticlesList";
import ClubArticles from "./creatorPanel/ClubArticles";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import SocialButton from "./components/SocialButton";

const ClubPage = ({ currentUser }) => {
  const { clubId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [club, setClub] = useState(location.state?.club || null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [owner, setOwner] = useState(null); // состояние для данных владельца клуба

  // Загружаем клуб из Firestore, если он не был передан через state
  useEffect(() => {
    if (!club && clubId) {
      const fetchClub = async () => {
        setLoading(true);
        try {
          const q = query(
            collection(db, "clubs"),
            where("__name__", "==", clubId)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            setClub({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
          }
        } catch (err) {
          console.error("Ошибка загрузки клуба: ", err);
        } finally {
          setLoading(false);
        }
      };
      fetchClub();
    }
  }, [club, clubId]);

  // Получаем данные владельца клуба по clubOwnerUid
  useEffect(() => {
    if (club?.clubOwnerUid) {
      const fetchOwner = async () => {
        try {
          const ownerDoc = await getDoc(doc(db, "users", club.clubOwnerUid));
          if (ownerDoc.exists()) {
            setOwner({ uid: club.clubOwnerUid, ...ownerDoc.data() });
          }
        } catch (error) {
          console.error("Ошибка загрузки владельца клуба:", error);
        }
      };
      fetchOwner();
    }
  }, [club]);

  // Проверка подписки через коллекцию "clubFollows"
  useEffect(() => {
    if (!club?.id || !currentUser) return;
    const checkFollowing = async () => {
      const q = query(
        collection(db, "clubFollows"),
        where("uid", "==", currentUser.uid),
        where("clubId", "==", club.id)
      );
      const snapshot = await getDocs(q);
      setIsFollowing(!snapshot.empty);
    };
    checkFollowing();
  }, [club, currentUser]);

  // Функция для перехода к настройкам клуба (для владельца)
  const handleSettings = () => {
    navigate("/creator-panel", { state: { club } });
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Функция для подписки на клуб через коллекцию "clubFollows"
  const handleFollow = async () => {
    if (!currentUser) return;
    setLoadingFollow(true);
    try {
      await addDoc(collection(db, "clubFollows"), {
        uid: currentUser.uid,
        clubId: club.id,
        followedAt: new Date(),
      });
      setIsFollowing(true);
      // Увеличиваем количество подписчиков в документе клуба на 1
      await updateDoc(doc(db, "clubs", club.id), { followers: increment(1) });
      // Обновляем локальное состояние клуба
      setClub((prev) => ({ ...prev, followers: (prev.followers || 0) + 1 }));
    } catch (error) {
      console.error("Ошибка при подписке: ", error);
    } finally {
      setLoadingFollow(false);
    }
  };

  // Функция для отписки от клуба
  const handleUnfollow = async () => {
    if (!currentUser) return;
    setLoadingFollow(true);
    try {
      const q = query(
        collection(db, "clubFollows"),
        where("uid", "==", currentUser.uid),
        where("clubId", "==", club.id)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const subscriptionDoc = snapshot.docs[0];
        await deleteDoc(doc(db, "clubFollows", subscriptionDoc.id));
        setIsFollowing(false);
        await updateDoc(doc(db, "clubs", club.id), { followers: increment(-1) });
        setClub((prev) => ({ ...prev, followers: (prev.followers || 0) - 1 }));
      }
    } catch (error) {
      console.error("Ошибка при отписке: ", error);
    } finally {
      setLoadingFollow(false);
    }
  };

  if (loading || !club) {
    return <div>Загрузка...</div>;
  }

  return (
    <div
      style={{
        width: "100%",
        position: "relative",
        background: "#1D1D1F",
        overflow: "hidden",
        padding: 15,
        marginBottom: 60,
      }}
    >
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 15,
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 7,
            width: "100%",
          }}
        >
          <img
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              border: "5px solid #212124",
            }}
            src={club.avatarUrl || "https://placehold.co/100x100"}
            alt="avatar"
          />
        </div>
        <div
          style={{
            color: "white",
            fontSize: 24,
            fontFamily: "Inter",
            fontWeight: 500,
            width: "100%",
          }}
        >
          {club.clubName}
        </div>
        <span style={{ color: "white" }}>{club.description}</span>
        <div
          style={{
            fontSize: "14px",
            color: "white",
            cursor: "default",
            marginTop: "10px",
            padding: "10px 20px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#212124"
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 14C7 14 6 14 6 13C6 12 7 9 11 9C15 9 16 12 16 13C16 14 15 14 15 14H7Z"
              fill="white"
            />
            <path
              d="M11 8C12.6569 8 14 6.65685 14 5C14 3.34315 12.6569 2 11 2C9.34315 2 8 3.34315 8 5C8 6.65685 9.34315 8 11 8Z"
              fill="white"
            />
            <path
              d="M5.21636 14C5.07556 13.7159 5 13.3791 5 13C5 11.6445 5.67905 10.2506 6.93593 9.27997C6.3861 9.10409 5.7451 9 5 9C1 9 0 12 0 13C0 14 1 14 1 14H5.21636Z"
              fill="white"
            />
            <path
              d="M4.5 8C5.88071 8 7 6.88071 7 5.5C7 4.11929 5.88071 3 4.5 3C3.11929 3 2 4.11929 2 5.5C2 6.88071 3.11929 8 4.5 8Z"
              fill="white"
            />
          </svg>
          {club.followers || 0} подписчиков
        </div>
        <div style={{ width: "100%", display: "flex", gap: 10 }}>
          {currentUser.uid === club.clubOwnerUid ? (
            <button
              onClick={handleSettings}
              style={{
                flex: 1,
                height: 45,
                padding: "5px 15px",
                background: "#808080",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontSize: 13,
                  fontFamily: "Inter",
                  fontWeight: 400,
                  textAlign: "center",
                }}
              >
                Панель креатора
              </span>
            </button>
          ) : (
            <button
              onClick={isFollowing ? handleUnfollow : handleFollow}
              disabled={loadingFollow}
              style={{
                flex: 1,
                height: 45,
                padding: "5px 15px",
                background: isFollowing ? "#808080" : "#0077FF",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontSize: 12,
                  fontFamily: "Inter",
                  fontWeight: 400,
                  textAlign: "center",
                }}
              >
                {isFollowing ? "Отписаться" : "Подписаться"}
              </span>
            </button>
          )}
        </div>
      </div>
      <div
        style={{
          display: "inline-flex",
          gap: 15,
          alignItems: "center",
          marginTop: 15,
        }}
      >
        <div
          onClick={() => setActiveTab("posts")}
          style={{
            padding: "10px 20px",
            background: activeTab === "posts" ? "#212124" : "transparent",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "background 0.4s ease",
            fontSize: 14,
          }}
        >
          Публикации
        </div>
        <div
          onClick={() => setActiveTab("links")}
          style={{
            padding: "10px 20px",
            background: activeTab === "links" ? "#212124" : "transparent",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "background 0.4s ease",
            fontSize: 14,
          }}
        >
          Ссылки
        </div>
      </div>
      <TransitionGroup>
        {activeTab === "posts" && (
          <CSSTransition key="posts" timeout={400} classNames="tab" unmountOnExit>
            <ClubArticles club={club} currentUser={currentUser} />
          </CSSTransition>
        )}
        {activeTab === "links" && (
          <CSSTransition key="links" timeout={400} classNames="tab" unmountOnExit>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 15, gap: 15 }}>
              {/* Соцсети */}
              <SocialButton 
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.0642 2.49838C10.0713 2.4984 10.079 2.49842 10.0872 2.49844L10.1757 2.49871C11.2029 2.50249 16.4093 2.54022 17.8131 2.91761C18.6736 3.14842 19.3512 3.82861 19.5812 4.69203C19.7078 5.1664 19.7961 5.79689 19.8576 6.44534L19.8695 6.57522C19.8792 6.68359 19.8881 6.79221 19.8964 6.90042L19.906 7.03005C19.9882 8.17268 19.9978 9.24194 19.9989 9.47588L19.999 9.50744C19.999 9.51002 19.999 9.51425 19.999 9.51425V9.53196C19.999 9.53196 19.999 9.53619 19.999 9.53877L19.9989 9.57033C19.9977 9.81311 19.9874 10.9555 19.8964 12.1459L19.8862 12.2759L19.8752 12.406C19.8133 13.1217 19.7205 13.8324 19.5812 14.3542C19.3512 15.2176 18.6736 15.898 17.8131 16.1286C16.3625 16.5187 10.8516 16.546 10.0872 16.5479L10.0283 16.5481C10.0235 16.5481 10.0192 16.5481 10.0156 16.5481L9.99158 16.5481C9.99158 16.5481 9.98607 16.5481 9.98241 16.5481L9.91082 16.5479C9.52451 16.547 7.92595 16.5395 6.25186 16.482L6.03783 16.4744C6.00212 16.4731 5.96639 16.4718 5.93067 16.4704L5.71639 16.4619L5.5026 16.4529C4.11571 16.392 2.7934 16.2922 2.18511 16.1286C1.32458 15.898 0.646958 15.2176 0.416968 14.3542C0.277635 13.8324 0.184747 13.1217 0.122821 12.406L0.1119 12.2759L0.10164 12.1459C0.0138733 10.9988 0.00113304 9.89625 -0.000716363 9.60034L-0.00093736 9.55798C-0.000952869 9.55417 -0.000965793 9.55066 -0.000976562 9.54745V9.49875C-0.000965793 9.49555 -0.000952869 9.49204 -0.00093736 9.48822L-0.000716363 9.44587C0.000958563 9.17788 0.0115664 8.24834 0.0787496 7.22324L0.0874456 7.09464C0.0889452 7.07314 0.0904702 7.05161 0.0920211 7.03005L0.10164 6.90042C0.10992 6.79221 0.118867 6.68359 0.128536 6.57522L0.140489 6.44534C0.20202 5.79689 0.290302 5.1664 0.416968 4.69203C0.646958 3.82861 1.32458 3.14842 2.18511 2.91761C2.7934 2.75408 4.11571 2.65432 5.5026 2.59347L5.71639 2.58441L5.93067 2.57595C5.96639 2.57458 6.00212 2.57325 6.03783 2.57193L6.25186 2.56432C7.8191 2.51052 9.32013 2.50056 9.82233 2.49871L9.91082 2.49844C9.91904 2.49842 9.92671 2.4984 9.93382 2.49838H10.0642ZM7.99906 6.51238V12.5338L13.195 9.52327L7.99906 6.51238Z" fill="white"/>
                  </svg>
                }
                link={club.socialLinks.youtube}
              />
              <SocialButton 
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10ZM10.3584 7.38249C9.38576 7.78704 7.44183 8.62437 4.52663 9.89448C4.05324 10.0827 3.80527 10.2669 3.78269 10.447C3.74454 10.7513 4.12565 10.8711 4.64461 11.0343C4.7152 11.0565 4.78835 11.0795 4.86333 11.1039C5.37391 11.2698 6.06074 11.464 6.41779 11.4717C6.74167 11.4787 7.10316 11.3452 7.50225 11.0712C10.226 9.23254 11.632 8.30322 11.7203 8.28318C11.7826 8.26905 11.8689 8.25128 11.9274 8.30325C11.9858 8.35522 11.9801 8.45364 11.9739 8.48005C11.9361 8.64099 10.4402 10.0318 9.66599 10.7515C9.42464 10.9759 9.25344 11.1351 9.21845 11.1714C9.14005 11.2528 9.06016 11.3298 8.98337 11.4039C8.50902 11.8611 8.15331 12.2041 9.00306 12.764C9.41142 13.0331 9.73818 13.2556 10.0642 13.4777C10.4202 13.7201 10.7753 13.9619 11.2347 14.2631C11.3518 14.3398 11.4636 14.4195 11.5725 14.4971C11.9868 14.7925 12.359 15.0579 12.8189 15.0156C13.0861 14.991 13.3621 14.7397 13.5023 13.9903C13.8336 12.2193 14.4847 8.38209 14.6352 6.80086C14.6484 6.66232 14.6318 6.48502 14.6185 6.40719C14.6052 6.32936 14.5774 6.21847 14.4762 6.13638C14.3564 6.03916 14.1714 6.01866 14.0887 6.02012C13.7126 6.02675 13.1355 6.2274 10.3584 7.38249Z" fill="white"/>
                  </svg>
                }
                link={club.socialLinks.telegram}
              />
              <SocialButton 
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.25 1.27405e-05L13.7257 0C13.9045 0.893764 14.4007 2.02132 15.2688 3.13993C16.1193 4.236 17.2464 5.00001 18.75 5.00001V7.50001C16.5583 7.50001 14.9113 6.48306 13.75 5.21424V13.75C13.75 17.2018 10.9518 20 7.5 20C4.04822 20 1.25 17.2018 1.25 13.75C1.25 10.2982 4.04822 7.50001 7.5 7.50001V10C5.42893 10 3.75 11.6789 3.75 13.75C3.75 15.8211 5.42893 17.5 7.5 17.5C9.57107 17.5 11.25 15.8211 11.25 13.75V1.27405e-05Z" fill="white"/>
                  </svg>
                }
                link={club.socialLinks.tiktok}
              />
              <SocialButton 
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.0009 0C7.28508 0 6.94424 0.0118753 5.87756 0.0604175C4.81297 0.109168 4.08629 0.277711 3.45045 0.525006C2.79274 0.780425 2.23481 1.1221 1.67898 1.67814C1.12272 2.23398 0.78105 2.7919 0.524797 3.44941C0.276878 4.08546 0.108126 4.81234 0.0602089 5.87652C0.0125 6.9432 0 7.28424 0 10.0001C0 12.716 0.0120837 13.0558 0.0604175 14.1224C0.109376 15.187 0.27792 15.9137 0.525006 16.5495C0.780633 17.2073 1.1223 17.7652 1.67835 18.321C2.23398 18.8773 2.7919 19.2198 3.4492 19.4752C4.08546 19.7225 4.81234 19.891 5.87673 19.9398C6.94341 19.9883 7.28403 20.0002 9.99969 20.0002C12.7158 20.0002 13.0556 19.9883 14.1222 19.9398C15.1868 19.891 15.9143 19.7225 16.5506 19.4752C17.2081 19.2198 17.7652 18.8773 18.3208 18.321C18.8771 17.7652 19.2187 17.2073 19.475 16.5498C19.7208 15.9137 19.8896 15.1868 19.9396 14.1226C19.9875 13.056 20 12.716 20 10.0001C20 7.28424 19.9875 6.94341 19.9396 5.87673C19.8896 4.81213 19.7208 4.08546 19.475 3.44962C19.2187 2.7919 18.8771 2.23398 18.3208 1.67814C17.7646 1.12189 17.2083 0.780217 16.55 0.525006C15.9125 0.277711 15.1854 0.109168 14.1208 0.0604175C13.0541 0.0118753 12.7145 0 9.99781 0H10.0009ZM9.10385 1.8021C9.3701 1.80169 9.66718 1.8021 10.0009 1.8021C12.671 1.8021 12.9874 1.81169 14.0418 1.8596C15.0168 1.90419 15.546 2.0671 15.8985 2.20398C16.3652 2.38523 16.6979 2.6019 17.0477 2.95191C17.3977 3.30191 17.6143 3.63525 17.796 4.10192C17.9329 4.454 18.096 4.98318 18.1404 5.95819C18.1883 7.01236 18.1987 7.32903 18.1987 9.99781C18.1987 12.6666 18.1883 12.9833 18.1404 14.0374C18.0958 15.0124 17.9329 15.5416 17.796 15.8937C17.6148 16.3604 17.3977 16.6927 17.0477 17.0425C16.6977 17.3925 16.3654 17.6091 15.8985 17.7904C15.5464 17.9279 15.0168 18.0904 14.0418 18.135C12.9876 18.1829 12.671 18.1933 10.0009 18.1933C7.3307 18.1933 7.01424 18.1829 5.96006 18.135C4.98505 18.09 4.45588 17.9271 4.10317 17.7902C3.6365 17.6089 3.30316 17.3923 2.95316 17.0423C2.60315 16.6923 2.38648 16.3598 2.20481 15.8929C2.06794 15.5408 1.90481 15.0116 1.86044 14.0366C1.81252 12.9824 1.80294 12.6658 1.80294 9.99531C1.80294 7.32487 1.81252 7.00987 1.86044 5.95569C1.90502 4.98068 2.06794 4.4515 2.20481 4.099C2.38607 3.63233 2.60315 3.29899 2.95316 2.94899C3.30316 2.59899 3.6365 2.38232 4.10317 2.20065C4.45567 2.06315 4.98505 1.90065 5.96006 1.85585C6.88257 1.81419 7.24008 1.80169 9.10385 1.7996V1.8021ZM15.3389 3.46254C14.6764 3.46254 14.1389 3.99942 14.1389 4.66213C14.1389 5.32464 14.6764 5.86214 15.3389 5.86214C16.0014 5.86214 16.5389 5.32464 16.5389 4.66213C16.5389 3.99962 16.0014 3.46212 15.3389 3.46212V3.46254ZM10.0009 4.86463C7.16487 4.86463 4.86547 7.16403 4.86547 10.0001C4.86547 12.8362 7.16487 15.1345 10.0009 15.1345C12.837 15.1345 15.1356 12.8362 15.1356 10.0001C15.1356 7.16403 12.8368 4.86463 10.0007 4.86463H10.0009ZM10.0009 6.66674C11.8418 6.66674 13.3343 8.15904 13.3343 10.0001C13.3343 11.841 11.8418 13.3335 10.0009 13.3335C8.15988 13.3335 6.66757 11.841 6.66757 10.0001C6.66757 8.15904 8.15988 6.66674 10.0009 6.66674V6.66674Z" fill="white"/>
                  </svg>
                }
                link={club.socialLinks.instagram}
              />
              <div style={{display: "flex", flexDirection: "column"}}>
              <span style={{color: "white"}}>Владелец клуба: </span>
              {owner && (
                <div
                  onClick={() => navigate(`/userprofile/${owner.uid}`, { state: { currentUserUid: currentUser.uid } })}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 15,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      background: "#212124",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={owner.photoUrl || "https://placehold.co/50x50"}
                      alt={`${owner.firstName} ${owner.lastName}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ color: "white", fontSize: "14px" }}>
                      {owner.firstName} {owner.lastName}
                    </span>
                    <span style={{ color: "#0077FF", fontSize: "12px" }}>
                      {owner.username ? "@" + owner.username : ""}
                    </span>
                  </div>
                </div>
              )}
              </div>
            </div>
          </CSSTransition>
        )}
      </TransitionGroup>
    </div>
  );
};

export default ClubPage;
