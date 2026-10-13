import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const form = document.getElementById("bookingForm");
if (!form) {
    throw new Error("Booking form was not found.");
}

const submitButton = form.querySelector('button[type="submit"]');
const statusElement = document.getElementById("tutorLoadStatus");
const showStatus = (message, isError = false) => {
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.setAttribute("role", isError ? "alert" : "status");
    }
};

let currentUser = null;
let currentProfile = null;
let selectedTutor = null;
let authStateResolved = false;

if (submitButton) submitButton.disabled = true;

const setValue = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value || "Not provided";
};

const tutorId = new URLSearchParams(window.location.search).get("tutorId");
if (!tutorId) {
    showStatus("Select a tutor from the tutor search page before requesting a session.", true);
} else {
    onAuthStateChanged(auth, async (user) => {
        authStateResolved = true;

        if (!user) {
            showStatus("Please log in before submitting a booking request.", true);
            window.location.href = "login.html";
            return;
        }

        currentUser = user;

        try {
            const [profileSnapshot, tutorSnapshot] = await Promise.all([
                getDoc(doc(db, "users", user.uid)),
                getDoc(doc(db, "users", tutorId)),
            ]);

            if (!profileSnapshot.exists()) {
                throw new Error("Your user profile could not be found.");
            }
            currentProfile = profileSnapshot.data();

            if (!["parent", "student"].includes(currentProfile.role)) {
                throw new Error("Only parent and student accounts can request a tutor.");
            }
            if (!tutorSnapshot.exists() || tutorSnapshot.data().role !== "tutor") {
                throw new Error("The selected tutor profile could not be found.");
            }

            selectedTutor = { id: tutorSnapshot.id, ...tutorSnapshot.data() };
            const tutorName = typeof selectedTutor.name === "string" ? selectedTutor.name : "";
            const subjects = typeof selectedTutor.subjects === "string" ? selectedTutor.subjects : "";
            const grades = typeof selectedTutor.gradeLevels === "string" ? selectedTutor.gradeLevels : "";
            const rate = Number(selectedTutor.hourlyRate);

            const tutorIdInput = document.getElementById("tutorId");
            const tutorNameInput = document.getElementById("tutorName");
            const subjectInput = document.getElementById("subject");
            const gradeInput = document.getElementById("grade");
            const parentNameInput = document.getElementById("parentName");
            const parentContactInput = document.getElementById("parentContact");

            if (tutorIdInput) tutorIdInput.value = selectedTutor.id;
            if (tutorNameInput) tutorNameInput.value = tutorName;
            if (subjectInput) subjectInput.value = subjects;
            if (gradeInput) gradeInput.value = grades;
            if (parentNameInput) parentNameInput.value = currentProfile.name || "";
            if (parentContactInput) parentContactInput.value = currentProfile.phone || "";

            setValue("tutorNameDisplay", tutorName || "Tutor name not provided");
            setValue("tutorSummaryName", tutorName || "Tutor name not provided");
            setValue("tutorSummaryQualification", selectedTutor.qualification || selectedTutor.institution);
            setValue("tutorSummarySubject", subjects);
            setValue("tutorSummaryGrades", grades);
            setValue("tutorSummaryDistrict", selectedTutor.district);
            setValue("tutorSummaryExperience", selectedTutor.experience);
            setValue("tutorSummaryMode", selectedTutor.teachingMode);
            setValue("tutorSummaryRate", Number.isFinite(rate) && rate > 0 ? `Rs. ${rate.toLocaleString()}` : "Not set");
            setValue(
                "tutorSummaryAvatar",
                tutorName
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase(),
            );

            showStatus("Tutor profile loaded.");
            if (submitButton) submitButton.disabled = false;
        } catch (error) {
            console.error("Error preparing booking request:", error);
            showStatus(error.message || "Unable to load the selected tutor. Please try again later.", true);
        }
    });
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!authStateResolved || !currentUser || !currentProfile || !selectedTutor) {
        showStatus("A valid signed-in parent account and selected tutor are required.", true);
        return;
    }

    if (!form.reportValidity()) return;
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
    }

    try {
        const idToken = await currentUser.getIdToken();
        const response = await fetch("http://localhost:5000/api/bookings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                parentId: currentUser.uid,
                parentName:
                    document.getElementById("parentName")?.value.trim() ||
                    currentProfile.name ||
                    currentUser.email ||
                    "Parent User",
                tutorId: selectedTutor.id,
                tutorName: selectedTutor.name || "",
                subject: document.getElementById("subject")?.value.trim() || selectedTutor.subjects || "",
                grade: document.getElementById("grade")?.value.trim() || selectedTutor.gradeLevels || "",
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

        showStatus("Booking request submitted successfully. Redirecting to your dashboard.");
        form.reset();
        window.location.href = "parent-dashboard.html";
    } catch (error) {
        console.error("Booking request failed:", error);
        alert("Request එක යැවීමට නොහැකි විය: " + error.message);
        showStatus("Unable to submit your booking request. Please try again later.", true);
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Submit Request";
        }
    }
});
    }
  }
});
