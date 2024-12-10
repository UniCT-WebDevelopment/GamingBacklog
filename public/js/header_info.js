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
            document.getElementById("username").textContent = userData.username;
            document.getElementById("description").textContent = userData.description;
            if(userData.profilePicture !== "default-profile-pic.jpg")
                document.getElementById("profile-picture").setAttribute("src", userData.profilePicture);
        } else {
            console.error("Failed to fetch user profile");
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        window.location.href = "/login";
    }
}