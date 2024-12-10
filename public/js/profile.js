async function loadUserGames() {
    //Check Token
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        return;
    }

    try {
        //Fetch user added games 
        const response = await fetch("/user-games", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        //Response
        if (response.ok) {
            const data = await response.json();

            //Show want to play list
            const wantToPlayList = document.getElementById("want-to-play-list");
            wantToPlayList.innerHTML = "";
            //If empty
            if (data.wantToPlayGames.length === 0) {
                const noGamesMessage = document.createElement("p");
                noGamesMessage.innerHTML = '<span class="no-game">No games in this list</span>';
                wantToPlayList.appendChild(noGamesMessage);
            } else {
                //Populate list
                data.wantToPlayGames.forEach((game) => {
                    const gameItem = document.createElement("div");
                    gameItem.classList.add("game-item");
                    gameItem.innerHTML = `
                        <div class="game-cover">
                            <img src="${game.cover}" alt="${game.name} Cover">
                        </div>
                        <div class="game-info">
                            <h3>${game.name}</h3>
                            <p><span class="info-label">Genre:</span> ${game.genre}</p>
                            <p><span class="info-label">Release:</span> ${new Date(game.releaseDate).toLocaleDateString()}</p>
                            <p><span class="info-label">Rating:</span> pending</p>
                            <button onclick="markAsPlayed('${game.gameId}')">Mark as Played</button>
                            <button class="remove-button" onclick="openRemoveModal('${game.gameId}')">Remove</button>
                        </div>
                    `;
                    wantToPlayList.appendChild(gameItem);

                    
                    //Click on Name or Img for Game page
                    gameItem.querySelector('.game-info>h3').addEventListener('click', () => {
                        window.location.href = `/game/${game.gameId}`;
                    });
                    gameItem.querySelector('.game-cover>img').addEventListener('click', () => {
                        window.location.href = `/game/${game.gameId}`;
                    });
                });
            }

            //Show played list
            const playedList = document.getElementById("played-list");
            playedList.innerHTML = "";
            //If empty
            if (data.playedGames.length === 0) {
                const noGamesMessage = document.createElement("p");
                noGamesMessage.innerHTML = '<span class="no-game">No games in this list</span>';
                playedList.appendChild(noGamesMessage);
            } else {
                //Populate list
                data.playedGames.forEach((game) => {
                    const gameItem = document.createElement("div");
                    gameItem.classList.add("game-item");
                    gameItem.innerHTML = `
                        <div class="game-cover">
                            <img src="${game.cover}" alt="${game.name} Cover">
                        </div>
                        <div class="game-info">
                            <h3>${game.name}</h3>
                            <p><span class="info-label">Genre:</span> ${game.genre}</p>
                            <p><span class="info-label">Release:</span> ${new Date(game.releaseDate).toLocaleDateString()}</p>
                            <p><span class="info-label">Rating:</span> ${game.rating}</p>
                            <button onclick="openEditRatingModal('${game.gameId}', ${game.rating})">Edit Rating</button>
                            <button class="remove-button" onclick="openRemoveModal('${game.gameId}')">Remove</button>
                        </div>
                    `;
                    playedList.appendChild(gameItem);

                    //Click on Name or Img for Game page
                    gameItem.querySelector('.game-info>h3').addEventListener('click', () => {
                        window.location.href = `/game/${game.gameId}`;
                    });
                    gameItem.querySelector('.game-cover>img').addEventListener('click', () => {
                        window.location.href = `/game/${game.gameId}`;
                    });
                });
            }
        } else {
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Error fetching user games:", error);
        window.location.href = "/login";
    }
}

async function markAsPlayed(gameId) {
    const token = localStorage.getItem("token");
    const response = await fetch(`/user-games/${gameId}/mark-played`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.ok) {
        loadUserGames();
    } else {
        showErrorModal("Error", "Failed to mark game as played");
    }
}

function openEditRatingModal(gameId, currentRating) {
    document.getElementById("new-rating").value = currentRating;
    document.getElementById("game-id").value = gameId;
    document.getElementById("edit-rating-modal").style.display = "block";
}

async function submitEditRating(event) {
    event.preventDefault();

    const gameId = document.getElementById("game-id").value;
    const newRating = document.getElementById("new-rating").value;

    if (newRating >= 0 && newRating <= 10) {
        const token = localStorage.getItem("token");
        const response = await fetch(`/user-games/${gameId}/rating`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ rating: newRating }),
        });

        if (response.ok) {
            closeModal('edit-rating-modal');
            loadUserGames();
        } else {
            showErrorModal("Error", "Failed to update rating");
        }
    } else {
        showErrorModal("Error", "Please enter a valid rating (0-10)");
    }
}

function openRemoveModal(gameId) {
    document.getElementById("remove-game-id").value = gameId;
    document.getElementById("confirm-remove-modal").style.display = "block";
}

async function confirmRemoveGame() {
    const gameId = document.getElementById("remove-game-id").value;
    const token = localStorage.getItem("token");
    const response = await fetch(`/user-games/${gameId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.ok) {
        closeModal('confirm-remove-modal');
        loadUserGames();
    } else {
        showErrorModal("Error", "Failed to remove game");
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}