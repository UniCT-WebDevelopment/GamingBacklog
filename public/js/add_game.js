let allGames = [];
let userGames = [];
let currentSearchQuery = "";
let currentPage = 1;
const gamesPerPage = 5;
let currentSortOrder = "name_asc";

async function loadGames() {
    //Check Token
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        return;
    }

    try {
        //Construct URL
        const gamesUrl = currentSearchQuery
        ? `/games?query=${currentSearchQuery}&page=${currentPage}&limit=${gamesPerPage}&sort=${currentSortOrder}`
        : `/games?page=${currentPage}&limit=${gamesPerPage}&sort=${currentSortOrder}`;

        //Fetch games
        const gamesResponse = await fetch(gamesUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        //Fetch User-Game relations
        const userGamesResponse = await fetch("/user-added", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        //Response
        if (gamesResponse.ok && userGamesResponse.ok) {
            const gamesData = await gamesResponse.json();
            allGames = gamesData.games;
            userGames = await userGamesResponse.json();
            displayGames(allGames, gamesData.totalGames);
        } else {
            console.error("Failed to fetch games");
        }
    } catch (error) {
        console.error("Error fetching games:", error);
    }
}

function displayGames(games, totalGames) {
    //Clear List
    const gameList = document.getElementById("game-list");
    gameList.innerHTML = "";

    games.forEach((game) => {
        //Create Element
        const gameItem = document.createElement("div");
        gameItem.classList.add("game-item");
        
        //Check if it's in the User's List
        const isPlayed = userGames.some(userGame => userGame.game._id.toString() === game._id.toString() && userGame.played);
        const isToPlay = userGames.some(userGame => userGame.game._id.toString() === game._id.toString() && userGame.wantToPlay);

        //Fill Element
        gameItem.innerHTML = `
        <div class="game-cover">
                <img src="/game-cover/${game._id}" alt="${game.name} Cover">
        </div>
        <div class="game-info">
            <h3>${game.name}</h3>
            <p><span class="info-label">Genre:</span> ${game.genre}</p>
            <p><span class="info-label">Release:</span> ${new Date(
                game.releaseDate
            ).toLocaleDateString()}</p>
            <p class="description"><span class="info-label">Description:</span> ${game.description}</p>
            <button class="add-played" data-game-id="${game._id}" ${isPlayed ? 'disabled' : ''}>${isPlayed ? 'Added to Played' : 'Add to Played'}</button>
            <button class="add-to-play" data-game-id="${game._id}" ${isToPlay ? 'disabled' : ''}>${isToPlay ? 'Added to Want to Play' : 'Add to Want to Play'}</button>
        </div>
    `;
        gameList.appendChild(gameItem);

        //Click on Name or Img for Game page
        gameItem.querySelector('.game-info>h3').addEventListener('click', () => {
            window.location.href = `/game/${game._id}`;
        });
        gameItem.querySelector('.game-cover>img').addEventListener('click', () => {
            window.location.href = `/game/${game._id}`;
        });
    });

    //Click to Add to list
    document.querySelectorAll(".add-played").forEach((button) => {
        button.addEventListener("click", handleAddPlayed);
    });
    document.querySelectorAll(".add-to-play").forEach((button) => {
        button.addEventListener("click", handleAddToPlay);
    });

    renderPagination(totalGames);
}

async function handleAddPlayed(event) {
    const gameId = event.target.getAttribute("data-game-id");

    //Check Token
    const token = localStorage.getItem("token");
    if (!token) {
        showErrorModal("Error", "You must be logged in to add a game.");
        return;
    }

    try {
        //Add Game to Played
        const response = await fetch("/user-games", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                gameId: gameId,
                status: "played",
            }),
        });

        //Response
        if (response.ok) {
            const result = await response.json();
            const button = event.target;
            button.innerText = "Added to Played"; 
            button.disabled = true;

            //Enable opposite Button
            const oppositeButton = document.querySelector(`button[data-game-id="${gameId}"].add-to-play`);
            oppositeButton.disabled = false; 
            oppositeButton.innerText = "Add to Want to Play"; 
        } else {
            showErrorModal("Error", "Error adding game as played");
        }
    } catch (error) {
        console.error("Error:", error);
        showErrorModal("Error", "There was an error adding the game as played.");
    }
}

async function handleAddToPlay(event) {
    const gameId = event.target.getAttribute("data-game-id");
    
    //Check Token
    const token = localStorage.getItem("token");
    if (!token) {
        showErrorModal("Error", "You must be logged in to add a game.");
        return;
    }

    try {
        //Add Game to Want to Play
        const response = await fetch("/user-games", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                gameId: gameId,
                status: "to-play",
            }),
        });

        //Response
        if (response.ok) {
            //Disable Button
            const button = event.target;
            button.innerText = "Added to Want to Play"; 
            button.disabled = true; 

            //Enable opposite Button
            const oppositeButton = document.querySelector(`button[data-game-id="${gameId}"].add-played`);
            oppositeButton.disabled = false; 
            oppositeButton.innerText = "Add to Played"; 
        } else {
            showErrorModal("Error", "Error adding game to play list");
        }
    } catch (error) {
        console.error("Error:", error);
        showErrorModal("Error", "There was an error adding the game to your play list.");
    }
}

function renderPagination(totalGames) {
    //Empty pagination
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    //Calculate Total Pages
    const totalPages = Math.ceil(totalGames / gamesPerPage);

    //Check if in bounds
    if (currentPage < 1) {
        currentPage = 1;
    }
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    //Calculate Visible Pages
    const visiblePages = 3;
    let startPage = currentPage - 1;
    let endPage = currentPage + 1;
    if (totalPages <= visiblePages) {
        startPage = 1;
        endPage = totalPages;
    } else {
        if (currentPage <= 2) {
            endPage = Math.min(visiblePages, totalPages);
        } else if (currentPage >= totalPages - 1) {
            startPage = Math.max(totalPages - visiblePages + 1, 1);
        }
    }

    //"First" Button
    if (totalPages > visiblePages && currentPage > 2) {
        const firstButton = document.createElement("button");
        firstButton.innerText = "First";
        firstButton.classList.add("page-button");
        firstButton.addEventListener("click", () => {
            currentPage = 1;
            loadGames();
        });
        pagination.appendChild(firstButton);
    }

    //"Previous" Button
    if (currentPage > 1) {
        const prevButton = document.createElement("button");
        prevButton.innerText = "Previous";
        prevButton.classList.add("page-button");
        prevButton.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage -= 1;
                loadGames();
            }
        });
        pagination.appendChild(prevButton);
    }

    //Number Buttons
    for (let i = startPage; i <= endPage; i++) {
        if (i > 0 && i <= totalPages) {
            const pageButton = document.createElement("button");
            pageButton.innerText = i;
            pageButton.classList.add("page-button");
            if (i === currentPage) {
                pageButton.classList.add("active");
            }
            pageButton.addEventListener("click", () => {
                currentPage = i;
                loadGames();
            });
            pagination.appendChild(pageButton);
        }
    }

    //"Next" Button
    if (currentPage < totalPages) {
        const nextButton = document.createElement("button");
        nextButton.innerText = "Next";
        nextButton.classList.add("page-button");
        nextButton.addEventListener("click", () => {
            currentPage += 1;
            loadGames();
        });
        pagination.appendChild(nextButton);
    }
    
    //"Last" Button
    if (totalPages > visiblePages && currentPage < totalPages - 1) {
        const lastButton = document.createElement("button");
        lastButton.innerText = "Last";
        lastButton.classList.add("page-button");
        lastButton.addEventListener("click", () => {
            currentPage = totalPages;
            loadGames();
        });
        pagination.appendChild(lastButton);
    }
}

async function searchGames() {
    const searchQuery = document.getElementById("search-bar").value.toLowerCase();
    currentSearchQuery = searchQuery;
    currentPage = 1; 
    loadGames();
}

function changeSortOrder() {
    currentSortOrder = document.getElementById("sort-options").value;
    currentPage = 1; 
    loadGames();
}