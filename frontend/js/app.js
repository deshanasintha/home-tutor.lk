import { db, auth } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Get the booking form element from HTML
const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent page refresh and 405 HTTP error

        // Get current authenticated user details
        const currentUser = auth.currentUser;

        if (!currentUser) {
            alert("Please log in first to send a booking request!");
            return;
        }

        // Fetch inputs from HTML form elements
        const tutorId = document.getElementById("tutorId") ? document.getElementById("tutorId").value : "UNKNOWN_TUTOR";
        const tutorName = document.getElementById("tutorName") ? document.getElementById("tutorName").value : "Nadeesha Perera";
        const subject = document.getElementById("subject").value;
        const grade = document.getElementById("grade").value;
        const date = document.getElementById("date").value;
        const time = document.getElementById("time").value;
        const location = document.getElementById("location").value;
        const message = document.getElementById("message").value;

        try {
            // Save booking document to 'bookings' collection in Firestore
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

            alert("Booking request sent successfully! Booking ID: " + docRef.id);
            bookingForm.reset();

            // Redirect user to the Parent Dashboard page
            window.location.href = "parent-dashboard.html";

        } catch (error) {
            console.error("Error adding booking request: ", error);
            alert("Failed to send request: " + error.message);
        }
    });
}