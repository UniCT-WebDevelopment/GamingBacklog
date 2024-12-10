async function handleLogin(event) {
    event.preventDefault();

    //Retrieve login data
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    //Hide error
    const errorDiv = document.getElementById("error-message");
    errorDiv.textContent = "";
    errorDiv.classList.remove("visible");

    try {
        //Login
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData,
        });

        const responseData = await response.json();
        console.log(responseData);

        //Response
        if (response.ok) {
            localStorage.setItem('username', username);
            localStorage.setItem("token", responseData.token);
            console.log(
                "Token saved to localStorage:",
                responseData.token
            );

            window.location.href = "/profile.html";
        } else {
            errorDiv.textContent =
                responseData.message ||
                "Login failed. Please try again.";
            errorDiv.style.color = "red";
            errorDiv.classList.add("visible");
        }
    } catch (error) {
        errorDiv.textContent =
            "An unexpected error occurred: " + error.message;
        errorDiv.style.color = "red";
        errorDiv.classList.add("visible");
    }
}