async function handleRegister(event) {
    event.preventDefault();

    //Retrieve registration data
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    //Hide error
    const errorDiv = document.getElementById("error-message");
    const successDiv = document.getElementById("success-message");
    errorDiv.textContent = "";
    successDiv.textContent = "";

    try {
        //Register
        const response = await fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData,
        });
        //Response
        if (response.ok) {
            successDiv.textContent =
                "Registration successful! Redirecting...";
            showMessage(successDiv);
            //Redirect after 0,5s
            setTimeout(() => (window.location.href = "/login"), 500);
        } else {
            const errorText = await response.text();
            errorDiv.textContent = errorText;
            showMessage(errorDiv);
        }
    } catch (error) {
        errorDiv.textContent =
            "An unexpected error occurred: " + error.message;
        showMessage(errorDiv);
    }
}

function showMessage(div) {
    div.classList.add("visible");
}