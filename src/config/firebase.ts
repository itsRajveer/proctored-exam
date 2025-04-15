import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDNkjBJJH7xlAg-4W8sJzrqahmf2HDglxM",
  authDomain: "proctored-exam-8b53b.firebaseapp.com",
  databaseURL: "https://proctored-exam-8b53b-default-rtdb.firebaseio.com",
  projectId: "proctored-exam-8b53b",
  storageBucket: "proctored-exam-8b53b.firebasestorage.app",
  messagingSenderId: "656556538635",
  appId: "1:656556538635:web:8633f2666996aeb53a400e",
  measurementId: "G-2HG3PZ4S37"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app); 