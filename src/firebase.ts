import {initializeApp} from "firebase/app";
import { getAuth } from "firebase/auth";
import { collection, enableIndexedDbPersistence, getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCTtya5MBXBpPL-AYfw5Hdf-Y70vE6MfGI",
  authDomain: "scuffedgpt.firebaseapp.com",
  projectId: "scuffedgpt",
  storageBucket: "scuffedgpt.appspot.com",
  messagingSenderId: "1031216283872",
  appId: "1:1031216283872:web:216f316c61e6f45386d085",
  measurementId: "G-VJVXMCXDNM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const firestore = getFirestore(app);

export const threadsCollection = collection(firestore, 'Threads');

export const imageThreadsCollection = collection(firestore, 'ImageThreads');

export const transcriptionsCollection = collection(firestore, 'Transcriptions');

export const userCollection = collection(firestore, 'Users');

export const auth = getAuth(app);