import { db, auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const bookingForm = document.getElementById("bookingForm");
    let currentUser = null;

    // 1. Page එක Load වෙද්දීම Current User ව track කරගැනීම
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
    });

    if (bookingForm) {
        bookingForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Page Refresh වීම හා 405 Error වැළැක්වීම

            // User Log වී නැත්නම් Submit කිරීමට ඉඩ නොදීම
            if (!currentUser) {
                alert("කරුණාකර Booking Request එක යැවීමට පළමුව Log in වන්න!");
                return;
            }

            const submitBtn = bookingForm.querySelector("button[type='submit']");
            if (submitBtn) submitBtn.disabled = true;

            // Form Values ලබා ගැනීම
            const tutorId = document.getElementById("tutorId")?.value || "UNKNOWN_TUTOR";
            const tutorName = document.getElementById("tutorName")?.value || "Nadeesha Perera";
            const subject = document.getElementById("subject")?.value || "";
            const grade = document.getElementById("grade")?.value || "";
            const date = document.getElementById("date")?.value || "";
            const time = document.getElementById("time")?.value || "";
            const location = document.getElementById("location")?.value || "";
            const message = document.getElementById("message")?.value || "";

            try {
                // Firestore හි 'bookings' Collection එකට Save කිරීම
                const docRef = await addDoc(collection(db, "bookings"), {
                    parentId: currentUser.uid,
                    parentName: currentUser.displayName || currentUser.email || "Parent User",
                    tutorId: tutorId,
                    tutorName: tutorName,
                    subject: subject,
                    grade: grade,
                    preferredDate: date,
                    preferredTime: time,
                    location: location,
                    message: message,
                    status: "pending",
                    createdAt: serverTimestamp()
                });

                alert("Booking Request එක සාර්ථකව යැවුවා! Booking ID: " + docRef.id);
                bookingForm.reset();

                // Dashboard එකට Redirect කිරීම
                window.location.href = "parent-dashboard.html";

            } catch (error) {
                console.error("Booking Error: ", error);
                alert("Request එක යැවීමට නොහැකි විය: " + error.message);
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
});