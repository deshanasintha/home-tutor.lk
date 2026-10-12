import { auth, db } from './firebase-config.js';  
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";  
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";  
  
const protectedPageRoles = {
  'tutor-dashboard.html': ['tutor'],
  'parent-dashboard.html': ['parent', 'student'],
  'admin-dashboard.html': ['admin']
};
const currentPage = window.location.pathname.split('/').pop();  

onAuthStateChanged(auth, async (user) => {  
  if (user) {  
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));  
      if (!userDoc.exists()) {
        alert("Your account profile could not be found. Please log in again.");
        window.location.href = 'login.html';
        return;
      }

      const role = userDoc.data().role;
      const requiredRoles = protectedPageRoles[currentPage];
      if (requiredRoles && !requiredRoles.includes(role)) {
        const destination = {
          tutor: 'tutor-dashboard.html',
          parent: 'parent-dashboard.html',
          student: 'parent-dashboard.html',
          admin: 'admin-dashboard.html'
        }[role];
        alert("You are not authorized to access this dashboard.");
        window.location.href = destination || 'index.html';
        return;
      }
      updateUI(user, role);  
    } catch (error) {
      console.error("Error fetching user role:", error);
      if (protectedPageRoles[currentPage]) {
        alert("Unable to verify your account. Please try again later.");
        window.location.href = 'login.html';
      } else {
        updateUI(user, null);
      }
    }
  } else {
    updateUI(null, null);
    if (protectedPageRoles[currentPage]) {
      alert("Please log in to access this page!");
      window.location.href = 'login.html';
    }
  }  
});  
  
function updateUI(user, role) {  
  const actionsContainer = document.querySelector('.header-actions');  
  if (!actionsContainer) return;  

  if (user) {  
    // 1. User Role එක අනුව නිවැරදි Dashboard එක තෝරා ගැනීම
    let dashLink = 'index.html';
    if (role === 'tutor') {
      dashLink = 'tutor-dashboard.html';
    } else if (role === 'parent' || role === 'student') {
      dashLink = 'parent-dashboard.html';
    } else if (role === 'admin') {
      dashLink = 'admin-dashboard.html';
    }

    // 2. UI එක Logged-in State එකට Update කිරීම
    actionsContainer.innerHTML = `  
      <a href="${dashLink}" class="btn btn-outline btn-sm">Dashboard</a>  
      <button id="logoutBtn" class="btn btn-primary btn-sm">Log Out</button>  
    `;  
  
    // 3. Log Out Button එක සඳහා Event Listener එක එකතු කිරීම
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {  
      try {
        await signOut(auth);  
        window.location.href = 'login.html';  
      } catch (error) {
        alert("Logout failed: " + error.message);
      }
    });  

  } else {  
    // 4. User Log වී නැත්නම් Login / Register Buttons පෙන්වීම
    actionsContainer.innerHTML = `  
      <a href="login.html" class="btn btn-outline btn-sm">Log In</a>  
      <a href="parent-register.html" class="btn btn-primary btn-sm">Register</a>  
    `;  
  }  
}