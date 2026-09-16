import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// --- 1. User Register Function ---
export async function registerUser(email, password, fullName, role) {
  try {
    // Firebase Auth එකේ User හදනවා
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore එකේ users collection එකේ details Save කරනවා
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: fullName,
      email: email,
      role: role, // 'student' හෝ 'tutor'
      createdAt: new Date().toISOString()
    });

    alert("Registration Successful!");
    return user;
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// --- 2. User Login Function ---
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore එකෙන් User ගේ Role එක (Student ද Tutor ද) ගන්නවා
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      alert(`Welcome back, ${userData.name}!`);
      
      // Role එක අනුව අදාළ Dashboard එකට Redirect කරනවා
      if (userData.role === 'tutor') {
        window.location.href = 'tutor-dashboard.html';
      } else if (userData.role === 'student') {
        window.location.href = 'parent-dashboard.html';
      } else {
        window.location.href = 'index.html';
      }
    }
  } catch (error) {
    alert("Login Failed: " + error.message);
  }
}

// --- 3. Logout Function ---
export async function logoutUser() {
  await signOut(auth);
  window.location.href = 'login.html';
}