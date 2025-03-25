// src/components/RoleIcon.js
import React from "react";

// Объект с данными по ролям можно определить здесь или импортировать из другого файла
export const roleIcons = {
    old: {
      small: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.65723 6.24707C7.76704 5.91764 8.233 5.91765 8.34281 6.24707L8.98828 8.1835C9.27599 9.04666 9.95332 9.72399 10.8165 10.0117L12.7529 10.6572C13.0824 10.767 13.0824 11.233 12.7529 11.3428L10.8165 11.9883C9.95332 12.276 9.27599 12.9533 8.98828 13.8165L8.34281 15.7529C8.233 16.0823 7.76704 16.0823 7.65723 15.7529L7.01173 13.8165C6.72401 12.9533 6.04669 12.276 5.18353 11.9883L3.24707 11.3428C2.91764 11.233 2.91764 10.767 3.24707 10.6572L5.18353 10.0117C6.04669 9.72399 6.72401 9.04667 7.01173 8.18352L7.65723 6.24707Z" fill="#E8A2FF"/>
      <path d="M3.79434 1.14824C3.86023 0.950586 4.1398 0.950587 4.20569 1.14824L4.59297 2.3101C4.7656 2.828 5.172 3.2344 5.6899 3.40703L6.85177 3.79432C7.04942 3.86021 7.04942 4.13978 6.85177 4.20567L5.6899 4.59296C5.172 4.76559 4.7656 5.17199 4.59297 5.68989L4.20569 6.85176C4.13981 7.04941 3.86023 7.04941 3.79434 6.85176L3.40704 5.68988C3.23441 5.17198 2.82801 4.76559 2.31012 4.59296L1.14824 4.20567C0.950586 4.13978 0.950586 3.86021 1.14824 3.79432L2.31012 3.40703C2.82802 3.2344 3.23441 2.82801 3.40704 2.31011L3.79434 1.14824Z" fill="#E8A2FF"/>
      <path d="M10.8629 0.0988265C10.9068 -0.032943 11.0932 -0.0329419 11.1371 0.098828L11.3953 0.873401C11.5104 1.21867 11.7813 1.4896 12.1266 1.60469L12.9012 1.86288C13.0329 1.9068 13.0329 2.09319 12.9012 2.13711L12.1266 2.39531C11.7813 2.51039 11.5104 2.78133 11.3953 3.12659L11.1371 3.90117C11.0932 4.03294 10.9068 4.03294 10.8629 3.90117L10.6047 3.12659C10.4896 2.78132 10.2187 2.5104 9.87342 2.39531L9.09883 2.13711C8.96706 2.09319 8.96706 1.9068 9.09883 1.86288L9.87342 1.60469C10.2187 1.4896 10.4896 1.21867 10.6047 0.873408L10.8629 0.0988265Z" fill="#E8A2FF"/>
      </svg>
      `
      ,
      large: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.3145 12.4941C15.5341 11.8353 16.466 11.8353 16.6856 12.4941L17.9766 16.367C18.552 18.0933 19.9066 19.448 21.633 20.0234L25.5059 21.3144C26.1647 21.534 26.1647 22.4659 25.5059 22.6855L21.633 23.9765C19.9066 24.5519 18.552 25.9066 17.9766 27.6329L16.6856 31.5058C16.466 32.1647 15.5341 32.1647 15.3145 31.5058L14.0235 27.6329C13.448 25.9066 12.0934 24.552 10.3671 23.9765L6.49414 22.6855C5.83529 22.4659 5.83529 21.534 6.49414 21.3144L10.3671 20.0234C12.0934 19.448 13.448 18.0933 14.0235 16.367L15.3145 12.4941Z" fill="#E8A2FF"/>
      <path d="M7.58868 2.29648C7.72046 1.90117 8.27961 1.90117 8.41138 2.29648L9.18594 4.6202C9.53121 5.656 10.344 6.4688 11.3798 6.81406L13.7035 7.58864C14.0988 7.72041 14.0988 8.27957 13.7035 8.41134L11.3798 9.18592C10.344 9.53118 9.53121 10.344 9.18594 11.3798L8.41138 13.7035C8.27961 14.0988 7.72046 14.0988 7.58868 13.7035L6.81408 11.3798C6.46882 10.344 5.65603 9.53119 4.62024 9.18592L2.29648 8.41134C1.90117 8.27957 1.90117 7.72041 2.29648 7.58864L4.62024 6.81406C5.65603 6.46879 6.46882 5.65601 6.81409 4.62022L7.58868 2.29648Z" fill="#E8A2FF"/>
      <path d="M21.7258 0.197653C21.8136 -0.0658859 22.1864 -0.0658837 22.2743 0.197656L22.7906 1.7468C23.0208 2.43734 23.5627 2.9792 24.2532 3.20938L25.8024 3.72576C26.0659 3.81361 26.0659 4.18638 25.8024 4.27423L24.2532 4.79061C23.5627 5.02079 23.0208 5.56265 22.7906 6.25319L22.2743 7.80234C22.1864 8.06588 21.8136 8.06589 21.7258 7.80235L21.2094 6.25317C20.9792 5.56265 20.4374 5.02079 19.7468 4.79062L18.1977 4.27423C17.9341 4.18638 17.9341 3.81361 18.1977 3.72576L19.7468 3.20937C20.4374 2.9792 20.9792 2.43734 21.2094 1.74682L21.7258 0.197653Z" fill="#E8A2FF"/>
      </svg>
      `
      ,
      name: "олд",
      description: "Олд канала, чатер или активный юзер Apex, легенда одним словом",
    },
    beta: {
      small: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.4965 8C12.4965 9.42835 11.8311 10.7013 10.7932 11.5256L9.49654 8.5L12.4556 7.39036C12.4826 7.58972 12.4965 7.79323 12.4965 8Z" fill="#0087E8"/>
      <path d="M16 8C16 12.4183 12.4183 16 8 16C6.58144 16 5.24911 15.6308 4.09387 14.9832C4.01226 14.9375 3.93152 14.8903 3.85171 14.8418C2.67087 14.1243 1.69051 13.1097 1.01437 11.9018C0.368295 10.7476 0 9.41679 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 9.17262 1.28833 10.2779 1.79797 11.2488L3.78623 9.59193C3.59901 9.09702 3.49654 8.56048 3.49654 8C3.49654 5.51472 5.51126 3.5 7.99654 3.5C9.31446 3.5 10.5001 4.06655 11.3231 4.96939L7.49654 6.5L8.49654 9L9.82977 12.1109C9.26983 12.361 8.64942 12.5 7.99654 12.5C7.43606 12.5 6.89952 12.3975 6.40461 12.2103L4.74678 14.1997C5.71875 14.7108 6.8256 15 8 15C11.866 15 15 11.866 15 8ZM6.70455 8.13868C6.76379 8.04981 6.76004 7.93313 6.69522 7.84825C6.63039 7.76338 6.5188 7.72906 6.41748 7.76283L4.91748 8.26283L5.0756 8.73717L5.88435 8.46758L5.28853 9.36132C5.22928 9.45019 5.23304 9.56687 5.29786 9.65175C5.36269 9.73662 5.47428 9.77094 5.5756 9.73717L6.38435 9.46758L5.78853 10.3613C5.72928 10.4502 5.73304 10.5669 5.79786 10.6517C5.86269 10.7366 5.97428 10.7709 6.0756 10.7372L7.5756 10.2372L7.41748 9.76283L6.60872 10.0324L7.20455 9.13868C7.26379 9.04981 7.26004 8.93313 7.19522 8.84825C7.13039 8.76338 7.0188 8.72906 6.91748 8.76283L6.10872 9.03242L6.70455 8.13868Z" fill="#0087E8"/>
      </svg>
      `
      ,
      large: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24.9931 16C24.9931 18.8567 23.6621 21.4026 21.5865 23.0513L18.9931 17L24.9112 14.7807C24.9652 15.1794 24.9931 15.5865 24.9931 16Z" fill="#0087E8"/>
      <path d="M32 16C32 24.8366 24.8366 32 16 32C13.1629 32 10.4982 31.2616 8.18774 29.9664C8.02451 29.8749 7.86305 29.7806 7.70342 29.6836C5.34174 28.2486 3.38101 26.2195 2.02875 23.8036C0.73659 21.4951 0 18.8336 0 16C0 7.16344 7.16344 0 16 0C24.8366 0 32 7.16344 32 16ZM30 16C30 8.26801 23.732 2 16 2C8.26801 2 2 8.26801 2 16C2 18.3452 2.57667 20.5558 3.59594 22.4976L7.57245 19.1839C7.19801 18.194 6.99308 17.121 6.99308 16C6.99308 11.0294 11.0225 7 15.9931 7C18.6289 7 21.0001 8.13311 22.6461 9.93879L14.9931 13L16.9931 18L19.6595 24.2218C18.5397 24.7219 17.2988 25 15.9931 25C14.8721 25 13.799 24.7951 12.8092 24.4206L9.49356 28.3994C11.4375 29.4216 13.6512 30 16 30C23.732 30 30 23.732 30 16ZM13.4091 16.2774C13.5276 16.0996 13.5201 15.8663 13.3904 15.6965C13.2608 15.5268 13.0376 15.4581 12.835 15.5257L9.83496 16.5257L10.1512 17.4743L11.7687 16.9352L10.5771 18.7226C10.4586 18.9004 10.4661 19.1337 10.5957 19.3035C10.7254 19.4732 10.9486 19.5419 11.1512 19.4743L12.7687 18.9352L11.5771 20.7227C11.4586 20.9004 11.4661 21.1337 11.5957 21.3035C11.7254 21.4732 11.9486 21.5419 12.1512 21.4743L15.1512 20.4743L14.835 19.5257L13.2174 20.0648L14.4091 18.2774C14.5276 18.0996 14.5201 17.8663 14.3904 17.6965C14.2608 17.5268 14.0376 17.4581 13.835 17.5257L12.2174 18.0648L13.4091 16.2774Z" fill="#0087E8"/>
      </svg>
      `
      ,
      name: "бета-тестер",
      description: "Участник самой первой програмы бета-теста Apex, на всё приложение таких всего 2 юзера!",
    },
    admin: {
      small: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.61224 15.4427C3.2258 15.6413 2.78823 15.2942 2.86603 14.8508L3.69576 10.1213L0.173428 6.76462C-0.155753 6.45092 0.0146475 5.87737 0.455637 5.81472L5.35411 5.11885L7.53823 0.792305C7.73498 0.402565 8.26795 0.402565 8.4647 0.792305L10.6488 5.11885L15.5473 5.81472C15.9883 5.87737 16.1587 6.45092 15.8295 6.76462L12.3072 10.1213L13.1369 14.8508C13.2147 15.2942 12.7771 15.6413 12.3907 15.4427L8.00146 13.1868L3.61224 15.4427Z" fill="white"/>
      </svg>
      `
      ,
      large: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.22448 30.8854C6.4516 31.2827 5.57647 30.5884 5.73206 29.7015L7.39152 20.2425L0.346856 13.5292C-0.311505 12.9018 0.0292951 11.7547 0.911274 11.6294L10.7082 10.2377L15.0765 1.58461C15.47 0.80513 16.5359 0.80513 16.9294 1.58461L21.2976 10.2377L31.0946 11.6294C31.9766 11.7547 32.3174 12.9018 31.659 13.5292L24.6143 20.2425L26.2738 29.7015C26.4294 30.5884 25.5543 31.2827 24.7814 30.8854L16.0029 26.3735L7.22448 30.8854Z" fill="white"/>
      </svg>
      `
      ,
      name: "админ",
      description: "Вот он админ, помидорами если что в него бросаться",
    },
    creator: {
      small: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.8254 0.12029C15.9935 0.264266 16.0469 0.501593 15.9567 0.703697C14.4262 4.13468 11.2138 8.8743 8.86227 11.3447C8.22716 12.012 7.54616 12.4205 7.02348 12.6626C6.81786 12.7578 6.63568 12.8278 6.48885 12.878C6.4711 13.1051 6.42878 13.4159 6.32843 13.7456C6.12786 14.4046 5.66244 15.2248 4.62136 15.4851C3.5492 15.7531 2.35462 15.7535 1.54292 15.6182C1.33748 15.584 1.14585 15.5393 0.980547 15.4834C0.825775 15.4311 0.650744 15.3548 0.514627 15.2357C0.443829 15.1737 0.360185 15.0799 0.311435 14.9481C0.258258 14.8043 0.259521 14.6486 0.315083 14.5051C0.410093 14.2596 0.631487 14.1253 0.776495 14.0528C1.16954 13.8563 1.40109 13.6002 1.64337 13.2275C1.73756 13.0826 1.82737 12.9298 1.93011 12.755C1.96705 12.6921 2.00566 12.6264 2.04674 12.5572C2.1982 12.3021 2.37307 12.0176 2.59324 11.7094C3.12105 10.9705 3.79396 10.7845 4.33889 10.8132C4.46509 10.8198 4.58224 10.8377 4.68713 10.8606C4.74935 10.6888 4.82884 10.4812 4.92515 10.253C5.18625 9.63422 5.58306 8.83431 6.1124 8.18428C8.28757 5.51317 12.2914 1.97796 15.2287 0.0800421C15.4146 -0.0400593 15.6573 -0.0236867 15.8254 0.12029Z" fill="white"/>
      </svg>
      `
      ,
      large: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M31.6505 0.24058C31.9867 0.528533 32.0935 1.00319 31.9132 1.40739C28.8522 8.26935 22.4274 17.7486 17.7243 22.6895C16.4541 24.0239 15.0921 24.8409 14.0467 25.3251C13.6355 25.5156 13.2711 25.6555 12.9775 25.7559C12.942 26.2102 12.8573 26.8318 12.6566 27.4912C12.2555 28.8092 11.3246 30.4496 9.24247 30.9701C7.09815 31.5062 4.709 31.507 3.08559 31.2364C2.67471 31.1679 2.29146 31.0786 1.96085 30.9668C1.65131 30.8621 1.30124 30.7095 1.02901 30.4713C0.887414 30.3474 0.720126 30.1598 0.622626 29.8961C0.516271 29.6085 0.518798 29.2972 0.629922 29.0101C0.819941 28.5192 1.26273 28.2506 1.55275 28.1056C2.33884 27.7125 2.80194 27.2005 3.2865 26.455C3.47487 26.1652 3.6545 25.8596 3.85997 25.5099C3.93385 25.3842 4.01107 25.2528 4.09324 25.1145C4.39616 24.6043 4.74589 24.0353 5.18624 23.4188C6.24185 21.9409 7.58767 21.569 8.67754 21.6264C8.92994 21.6397 9.16424 21.6753 9.37401 21.7213C9.49845 21.3775 9.65743 20.9624 9.85006 20.5059C10.3723 19.2684 11.1659 17.6686 12.2246 16.3686C16.5749 11.0263 24.5826 3.95593 30.4572 0.160084C30.829 -0.0801186 31.3144 -0.0473734 31.6505 0.24058Z" fill="white"/>
      </svg>
      `
      ,
      name: "креатор!",
      description: "Креаторы создают контент в Apeх и публикуют его в вашу ленту! Креативные ребята.",
    },
  };

const RoleIcon = React.memo(({ role, size = 16, onClick, fullWidth = false }) => {
  const iconData = roleIcons[role];
  if (!iconData) return null;

  // Выбираем нужную версию SVG в зависимости от переданного размера
  const svgCode = size === 32 ? iconData.large : iconData.small;

  return (
    <div
      onClick={() => onClick?.(role)}
      style={{
        width: fullWidth ? "100%" : size,
        height: size,
        cursor: "pointer",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
      dangerouslySetInnerHTML={{ __html: svgCode }}
    />
  );
});

export default RoleIcon;
