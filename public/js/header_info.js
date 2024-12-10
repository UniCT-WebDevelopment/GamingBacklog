async function loadProfile() {
    //Check Token
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        return;
    }

    try {
        //Fetch profile info
        const response = await fetch("/profile", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        //Response
        if (response.ok) {
            const userData = await response.json();
            console.log(userData);
            document.getElementById("username").textContent = userData.username;
            document.getElementById("description").textContent = userData.description;
            const profilePictureUrl = userData.profilePicture && userData.profilePicture.data
            ? `/image/user/${userData.userId}`
            : '/img/profile.jpg'         

            document.getElementById("profile-picture").setAttribute("src", profilePictureUrl);
        } else {
            console.error("Failed to fetch user profile");
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        window.location.href = "/login";
    }
}