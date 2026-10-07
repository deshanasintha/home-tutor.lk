document.addEventListener("DOMContentLoaded", () => {
    // 1. User Authentication Check (Token එක නැත්නම් Test Token එකක් ලබා ගනී)
    const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "test_token";

    // Testing / Development සඳහා Redirect වෙන කොටස Comment කර ඇත. 
    // Backend Authentication සූදානම් වූ පසු පහත lines 4 Un-comment කරන්න.
    /*
    if (!token || token === "test_token") {
        window.location.href = "login.html";
        return;
    }
    */

    fetchDashboardData(token);
});

async function fetchDashboardData(token) {
    try {
        // Backend API Call - Parent Dashboard Data
        const response = await fetch("/api/parent/dashboard", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to load dashboard data from API");
        }

        const data = await response.json();
        updateDashboardUI(data);

    } catch (error) {
        console.warn("Backend API not connected yet. Loading fallback data for UI testing...", error);
        
        // Backend API එක තාම වැඩ නැති නම් UI එක පෙනීමට Fallback / Mock Data:
        const mockData = {
            parent: { name: "Chamari Perera", district: "Colombo", joinedDate: "Jan 2026" },
            stats: { pendingRequests: 2, acceptedRequests: 3, upcomingSessions: 1, favouriteTutors: 4 },
            pendingRequests: [
                { tutorInitials: "KJ", tutorName: "Kasun Jayasuriya", subject: "Mathematics", grade: "10-11 (O/L)", rate: 2200, note: "Requested 8 Sep 2026" },
                { tutorInitials: "IF", tutorName: "Ishara Fernando", subject: "English", grade: "1-5", rate: 1200, note: "Requested 6 Sep 2026" }
            ],
            acceptedRequests: [
                { tutorInitials: "NP", tutorName: "Nadeesha Perera", subject: "Mathematics", grade: "6-9", rate: 1800, note: "Tue & Thu, 5:00 PM" },
                { tutorInitials: "SR", tutorName: "Sanjaya Rathnayake", subject: "Science", grade: "6-9", rate: 1500, note: "Saturdays, 9:00 AM" }
            ],
            rejectedRequests: [
                { tutorInitials: "MG", tutorName: "Manoj Gunasekara", subject: "ICT", grade: "10-11 (O/L)", rate: 1600, note: "Not available on requested days" }
            ],
            upcomingSessions: [
                { day: "10", month: "SEP", tutorName: "Nadeesha Perera", subject: "Mathematics", time: "Thursday, 5:00 PM", mode: "Home visit", location: "Colombo 05" },
                { day: "13", month: "SEP", tutorName: "Sanjaya Rathnayake", subject: "Science", time: "Saturday, 9:00 AM", mode: "Home visit", location: "Colombo 05" }
            ],
            favouriteTutors: [
                { id: "1", initials: "NP", name: "Nadeesha Perera", subject: "Mathematics", rating: "4.9" },
                { id: "2", initials: "DW", name: "Dilani Wickramasinghe", subject: "Combined Maths", rating: "4.8" },
                { id: "3", initials: "SR", name: "Sanjaya Rathnayake", subject: "Science", rating: "4.6" }
            ]
        };

        updateDashboardUI(mockData);
    }
}

// UI එක Update කරන Main Function එක
function updateDashboardUI(data) {
    // 1. User Info
    setElementText("welcomeUserName", data.parent?.name || "Parent");
    setElementText("parentName", data.parent?.name || "Parent Name");
    setElementText("parentMeta", `Parent account · ${data.parent?.district || "Colombo"} · Member since ${data.parent?.joinedDate || "2026"}`);

    // 2. Stats Counts
    setElementText("statPendingCount", data.stats?.pendingRequests || 0);
    setElementText("statAcceptedCount", data.stats?.acceptedRequests || 0);
    setElementText("statUpcomingCount", data.stats?.upcomingSessions || 0);
    setElementText("statFavouriteCount", data.stats?.favouriteTutors || 0);

    // 3. Render Requests Lists
    renderRequests("pendingRequestsContainer", data.pendingRequests, "Pending", "badge-warning");
    renderRequests("acceptedRequestsContainer", data.acceptedRequests, "Accepted", "badge-success");
    renderRequests("rejectedRequestsContainer", data.rejectedRequests, "Rejected", "badge-danger");

    // 4. Render Upcoming Sessions
    renderUpcomingSessions("upcomingSessionsContainer", data.upcomingSessions);

    // 5. Render Favourite Tutors
    renderFavouriteTutors("favouriteTutorsContainer", data.favouriteTutors);
}

// Safe Element Text Updater
function setElementText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Request Cards dynamically නිර්මාණය කරන Function එක
function renderRequests(containerId, requestsList, statusLabel, badgeClass) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!requestsList || requestsList.length === 0) {
        container.innerHTML = `<p class="text-muted">No ${statusLabel.toLowerCase()} requests found.</p>`;
        return;
    }

    container.innerHTML = requestsList.map(req => `
        <div class="request-card-item card p-3 mb-2 flex-row align-items-center">
            <div class="user-avatar me-3">${req.tutorInitials || 'TU'}</div>
            <div class="info flex-grow-1">
                <h4 class="m-0">${req.tutorName}</h4>
                <p class="text-muted m-0">${req.subject} · Grade ${req.grade} ${req.note ? '· ' + req.note : ''}</p>
            </div>
            <div class="rate fw-bold me-3">Rs. ${req.rate}/hr</div>
            <span class="badge ${badgeClass}">${statusLabel}</span>
        </div>
    `).join("");
}

// Upcoming Sessions Render කරන Function එක
function renderUpcomingSessions(containerId, sessions) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!sessions || sessions.length === 0) {
        container.innerHTML = `<p class="text-muted">No upcoming sessions scheduled.</p>`;
        return;
    }

    container.innerHTML = sessions.map(session => `
        <div class="session-card card p-3 mb-2 flex-row align-items-center">
            <div class="date-badge me-3 text-center bg-light p-2 rounded">
                <strong>${session.day}</strong><br>
                <small>${session.month}</small>
            </div>
            <div class="session-info flex-grow-1">
                <h4 class="m-0">${session.tutorName} — ${session.subject}</h4>
                <p class="text-muted m-0">${session.time} · ${session.mode} · ${session.location}</p>
            </div>
            <span class="badge badge-success">Confirmed</span>
        </div>
    `).join("");
}

// Favourite Tutors Render කරන Function එක
function renderFavouriteTutors(containerId, tutors) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!tutors || tutors.length === 0) {
        container.innerHTML = `<p class="text-muted">No favourite tutors saved yet.</p>`;
        return;
    }

    container.innerHTML = tutors.map(tutor => `
        <div class="favourite-card card p-3 text-center">
            <div class="user-avatar mx-auto mb-2">${tutor.initials}</div>
            <h4>${tutor.name}</h4>
            <p class="text-muted">${tutor.subject} · ★ ${tutor.rating}</p>
            <a href="tutor-profile.html?id=${tutor.id}" class="btn btn-outline-sm">View Profile</a>
        </div>
    `).join("");
}