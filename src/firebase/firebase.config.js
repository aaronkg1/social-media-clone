import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: `${process.env.REACT_APP_API_KEY}`,
  authDomain: `${process.env.REACT_APP_AUTH_DOMAIN}`,
  projectId: "social-media-clone-e353c",
  storageBucket: "social-media-clone-e353c.appspot.com",
  messagingSenderId: "806414854909",
  appId: "1:806414854909:web:900766c16f293e5884ec94",
};
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDatabase = getFirestore(firebaseApp);
const firebaseStorage = getStorage(firebaseApp);
const auth = getAuth(firebaseApp);
export { firebaseApp, firestoreDatabase, firebaseStorage, auth };
