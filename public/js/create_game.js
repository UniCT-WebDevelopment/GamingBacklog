document.getElementById("add-game-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const token = localStorage.getItem("token");

    const formData = new FormData(this);

    //Check Cover Dimension
    const coverPicture = formData.get('cover');
    if (coverPicture && coverPicture.size > 2 * 1024 * 1024) {
        showErrorModal("Error", "The cover picture is too large. (Max size 2MB)");
        return;
    }

    try {
        //Add Game
        const response = await fetch("/create-game", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const result = await response.json();

        if (response.ok) {
            window.location.href = "/add_game.html";
        } else {
            showErrorModal("Error", result.message || "Error adding game");
        }
    } catch (error) {
        console.error("Error:", error);
        console.log(
            "Something went wrong, please try again later"
        );
    }
});