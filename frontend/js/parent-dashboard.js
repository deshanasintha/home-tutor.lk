document.addEventListener("DOMContentLoaded", () => {
    // 1. User Authentication Check (Logged in user ගේ token/ID එක ලබා ගැනීම)
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    if (!token) {
        // Log වී නොමැති නම් Login page එකට Redirect කිරීම
        window.location.href = "login.html";
        return;
    }

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
            throw new Error("Failed to load dashboard data");
        }

        const data = await response.json();

        // 2. User Info Update කිරීම
        document.getElementById("welcomeUserName").textContent = data.parent.name || "Parent";
        document.getElementById("parentName").textContent = data.parent.name || "Parent Name";
        document.getElementById("parentMeta").textContent = 
            `Parent account · ${data.parent.district || "Sri Lanka"} · Member since ${data.parent.joinedDate || ""}`;

        // 3. Stats Counts Update කිරීම
        document.getElementById("statPendingCount").textContent = data.stats.pendingRequests || 0;
        document.getElementById("statAcceptedCount").textContent = data.stats.acceptedRequests || 0;
        document.getElementById("statUpcomingCount").textContent = data.stats.upcomingSessions || 0;
        document.getElementById("statFavouriteCount").textContent = data.stats.favouriteTutors || 0;

        // 4. Pending Requests Render කිරීම
        renderRequests("pendingRequestsContainer", data.pendingRequests, "Pending", "bg-warning");

        // 5. Accepted Requests Render කිරීම
        renderRequests("acceptedRequestsContainer", data.acceptedRequests, "Accepted", "bg-success");

        // 6. Rejected Requests Render කිරීම
        renderRequests("rejectedRequestsContainer", data.rejectedRequests, "Rejected", "bg-danger");

        // 7. Upcoming Sessions Render කිරීම
        renderUpcomingSessions("upcomingSessionsContainer", data.upcomingSessions);

        // 8. Favourite Tutors Render කිරීම
        renderFavouriteTutors("favouriteTutorsContainer", data.favouriteTutors);

    } catch (error) {
        console.error("Dashboard error:", error);
    }
}

// Request Cards dynamically නිර්මාණය කරන Function එක
function renderRequests(containerId, requestsList, statusLabel, badgeClass) {
    const container = document.getElementById(containerId);
    if (!requestsList || requestsList.length === 0) {
        container.innerHTML = `<p class="text-muted">No ${statusLabel.toLowerCase()} requests found.</p>`;
        return;
    }

    container.innerHTML = requestsList.map(req => `
        <div class="request-card-item">
            <div class="avatar">${req.tutorInitials || 'TU'}</div>
            <div class="info">
                <h4>${req.tutorName}</h4>
                <p>${req.subject} · Grade ${req.grade} · ${req.note || ''}</p>
            </div>
            <div class="rate">Rs. ${req.rate}/hr</div>
            <span class="badge ${badgeClass}">${statusLabel}</span>
        </div>
    `).join("");
}

// Upcoming Sessions Render කරන Function එක
function renderUpcomingSessions(containerId, sessions) {
    const container = document.getElementById(containerId);
    if (!sessions || sessions.length === 0) {
        container.innerHTML = `<p class="text-muted">No upcoming sessions scheduled.</p>`;
        return;
    }

    container.innerHTML = sessions.map(session => `
        <div class="session-card">
            <div class="date-badge">
                <strong>${session.day}</strong>
                <span>${session.month}</span>
            </div>
            <div class="session-info">
                <h4>${session.tutorName} — ${session.subject}</h4>
                <p>${session.time} · ${session.mode} · ${session.location}</p>
            </div>
            <span class="badge bg-success">Confirmed</span>
        </div>
    `).join("");
}

// Favourite Tutors Render කරන Function එක
function renderFavouriteTutors(containerId, tutors) {
    const container = document.getElementById(containerId);
    if (!tutors || tutors.length === 0) {
        container.innerHTML = `<p class="text-muted">No favourite tutors saved yet.</p>`;
        return;
    }

    container.innerHTML = tutors.map(tutor => `
        <div class="favourite-card">
            <div class="avatar">${tutor.initials}</div>
            <h4>${tutor.name}</h4>
            <p>${tutor.subject} · ★ ${tutor.rating}</p>
            <a href="tutor-profile.html?id=${tutor.id}" class="btn btn-outline-sm">View Profile</a>
        </div>
    `).join("");
}