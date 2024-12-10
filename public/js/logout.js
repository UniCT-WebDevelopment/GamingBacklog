function logout() {
    openLogoutModal();
}

function openLogoutModal() {
    //Show confirm modal
    document.getElementById("logout-modal").style.display = "block";
}

function confirmLogout() {
    //Logout
    localStorage.removeItem('username');
    localStorage.removeItem("token");
    window.location.href = "/login";
}

function closeLogoutModal() {
    //Hide confirm modal
    document.getElementById("logout-modal").style.display = "none";
}