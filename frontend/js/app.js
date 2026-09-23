import { db, auth } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// HTML Form එක ලබා ගැනීම
const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Form එක refresh වීම වැළැක්වීම

        // දැනට Log වී සිටින User (Parent) ගේ විස්තර ගැනීම
        const currentUser = auth.currentUser;

        if (!currentUser) {
            alert("කරුණාකර පළමුව Log In වන්න!");
            return;
        }

        // Form එකෙන් Data ලබා ගැනීම
        const tutorId = document.getElementById("tutorId").value;
        const tutorName = document.getElementById("tutorName").value;
        const subject = document.getElementById("subject").value;

        try {
            // Firestore එකේ 'bookings' Collection එකට Data එකතු කිරීම
            const docRef = await addDoc(collection(db, "bookings"), {
                parentId: currentUser.uid,
                parentName: currentUser.displayName || "Parent User", // User ගේ Name එක
                tutorId: tutorId,
                tutorName: tutorName,
                subject: subject,
                status: "pending",
                createdAt: serverTimestamp() // Current Time එක Auto Set වේ
            });

            alert("Booking Request එක සාර්ථකව යැවුවා! Booking ID: " + docRef.id);
            bookingForm.reset(); // Form එක Clear කිරීම

        } catch (error) {
            console.error("Booking Error: ", error);
            alert("Request එක යැවීමට නොහැකි විය. නැවත උත්සාහ කරන්න.");
        }
    });
}