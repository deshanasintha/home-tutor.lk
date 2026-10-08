import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


onAuthStateChanged(auth, async (user) => {

  if (!user) {
    console.log("No logged-in user.");
    return;
  }

  console.log("Logged-in user UID:", user.uid);

  try {

    const tutorRef = doc(db, "users", user.uid);

    const tutorSnapshot = await getDoc(tutorRef);

    if (!tutorSnapshot.exists()) {

      console.error("Tutor profile not found.");

      return;
    }

    const tutorData = tutorSnapshot.data();

    console.log("Tutor data:", tutorData);

  } catch (error) {

    console.error(
      "Error loading tutor data:",
      error
    );

  }

});