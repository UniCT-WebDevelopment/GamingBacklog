function showErrorModal(title, message) {
    const modal = document.getElementById("message-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalMessage.style.color = "red";

    //Show modal
    modal.style.display = "block";
    modal.style.zIndex = "2";
}

function closeErrorModal() {
    const modal = document.getElementById("message-modal");
    //Hide modal
    modal.style.display = "none";
}
