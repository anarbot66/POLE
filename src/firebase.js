import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";



const firebaseConfig = {
  apiKey: "AIzaSyBPoyLmh0O7hK8SVghXcYal0SlDcPMUuzg",
  authDomain: "telegram-formula.firebaseapp.com",
  projectId: "telegram-formula",
  storageBucket: "telegram-formula.firebasestorage.app",
  messagingSenderId: "471526452772",
  appId: "1:471526452772:web:9940ac9db0104e05ad32b1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
