import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const bookingForm = document.getElementById("bookingForm");
    let currentUser = null;
    let authStateResolved = false;

    const bookingDetails = new URLSearchParams(window.location.search);
    const tutorId = document.getElementById("tutorId");
    const tutorName = document.getElementById("tutorName");
    const tutorNameDisplay = document.getElementById("tutorNameDisplay");
    const subject = document.getElementById("subject");

    if (bookingDetails.has("tutorId") && tutorId) {
        tutorId.value = bookingDetails.get("tutorId");
    }
    if (bookingDetails.has("tutorName")) {
        const selectedTutorName = bookingDetails.get("tutorName");
        if (tutorName) tutorName.value = selectedTutorName;
        if (tutorNameDisplay) tutorNameDisplay.textContent = selectedTutorName;
    }
    if (bookingDetails.has("subject") && subject) {
        const requestedSubject = bookingDetails.get("subject").toLowerCase();
        if (subject instanceof HTMLSelectElement) {
            const matchingSubject = Array.from(subject.options).find(
                (option) =>
                    option.value.toLowerCase() === requestedSubject ||
                    option.textContent.toLowerCase() === requestedSubject,
            );
            if (matchingSubject) subject.value = matchingSubject.value;
        } else {
            subject.value = bookingDetails.get("subject");
        }
    }

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        authStateResolved = true;
    }, (error) => {
        console.error("Unable to determine the current user:", error);
        alert("Unable to verify your login. Please refresh the page and try again.");
    });

    if (bookingForm) {
        bookingForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!authStateResolved || !currentUser) {
                alert("කරුණාකර Booking Request එක යැවීමට පළමුව Log in වන්න!");
                return;
            }

            const submitBtn = bookingForm.querySelector("button[type='submit']");
            if (submitBtn) submitBtn.disabled = true;

            try {
                const idToken = await currentUser.getIdToken();
                const response = await fetch("http://localhost:5000/api/bookings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        parentId: currentUser.uid,
                        parentName: document.getElementById("parentName")?.value.trim() ||
                            currentUser.displayName ||
                            currentUser.email ||
                            "Parent User",
                        tutorId: document.getElementById("tutorId")?.value.trim() || "",
                        tutorName: document.getElementById("tutorName")?.value.trim() || "",
                        subject: document.getElementById("subject")?.value.trim() || "",
                        grade: document.getElementById("grade")?.value.trim() || "",
                        preferredDate: document.getElementById("date")?.value || "",
                        preferredTime: document.getElementById("time")?.value || "",
                        location: document.getElementById("location")?.value.trim() || "",
                        message: document.getElementById("message")?.value.trim() || "",
                    }),
                });

                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || "Booking request could not be submitted.");
                }

                alert("Booking Request එක සාර්ථකව යැවුවා! Booking ID: " + result.bookingId);
                bookingForm.reset();
                window.location.href = "parent-dashboard.html";
            } catch (error) {
                console.error("Booking Error:", error);
                alert("Request එක යැවීමට නොහැකි විය: " + error.message);
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
});