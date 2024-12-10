async function loadSettingsPage() {
    //Check Token
    const token = localStorage.getItem("token");
    if (token) {
        try {
            const response = await fetch("/settings", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            //Fill form
            if (response.ok) {
                const settingsData = await response.json();
                document.getElementById("username-input").value =
                    settingsData.username || "";
                document.getElementById("description-input").value =
                    settingsData.description || "";
            } else {
                console.error("Error fetching settings:", response);
                window.location.href = "/login";
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    } else {
        window.location.href = "/login";
    }
}

function showSuccessModal() {
    const modal = document.getElementById("success-modal");
    modal.style.display = "block"; 
}

function closeSuccessModal() {
    const modal = document.getElementById("success-modal");
    modal.style.display = "none";
}

async function handleSaveChanges(event) {
    event.preventDefault();

    //Check Token
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("Token is missing");
        window.location.href = "/login";
        return;
    }

    const formData = new FormData(event.target);
    //Check for changes
    const newUsername = document.getElementById("username-input").value;
    const newDescription = document.getElementById("description-input").value;
    const newProfilePicture = document.getElementById("picture").files[0] ? true : false;
    const hasChanges = 
        newUsername !== localStorage.getItem("username") ||
        newDescription !== localStorage.getItem("description") ||
        newProfilePicture;
    if (!hasChanges) {
        showErrorModal("Error", "No changes were made.");
        return;
    }
    //Check profile picure size
    const profilePicture = formData.get('picture');
    if (profilePicture && profilePicture.size > 2 * 1024 * 1024) {
        showErrorModal("Error", "The profile picture is too large. (Max size 2MB)");
        return;
    }

    try {
        //Submit changes
        const response = await fetch("/settings/update", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
                body: formData,
        });
        //Replace old localstorage data
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("username", formData.get('username'));
            localStorage.setItem("description", formData.get('description'));

            if (data.token) {
                localStorage.setItem("token", data.token);
            }

            loadProfile();
            loadSettingsPage();
            showSuccessModal();
            clearProfilePictureInput();
        } else {
            showErrorModal("Error", "Failed to update settings: " + data.message);
        }
    } catch (error) {
        console.error("Error saving changes:", error);
    }
}

function handleDeleteAccount() {
    const modal = document.getElementById('delete-account-modal');
    modal.style.display = 'block';
}

function closeDeleteAccountModal() {
    const modal = document.getElementById('delete-account-modal');
    modal.style.display = 'none';
}

async function confirmDeleteAccount() {
    //Check Token
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("Token is missing");
        window.location.href = "/login";
        return;
    }

    try {
        //Delete account
        const response = await fetch("/settings/delete-account", {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        //Clear localstorage
        const data = await response.json();
        if (response.ok) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        } else {
            showErrorModal("Error", "Failed to delete account: " + data.message);
        }
    } catch (error) {
        console.error("Error deleting account:", error);
    }
}

function clearProfilePictureInput() {
    document.getElementById("picture").value = "";
}