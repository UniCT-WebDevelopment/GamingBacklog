document.addEventListener('DOMContentLoaded', async () => {
    const gameId = window.location.pathname.split('/').pop();

    //Load game data
    try {
        const response = await fetch(`/game-info/${gameId}`);
        const game = await response.json();

        document.getElementById('game-name').innerText = game.name;
        document.getElementById('game-cover').src = game.cover;
        document.getElementById('game-genre').innerHTML = `<span class=info-label>Genre:</span> ${game.genre}`;
        document.getElementById('game-release-date').innerHTML = `<span class=info-label>Release Date:</span> ${new Date(game.releaseDate).toLocaleDateString()}`;
        document.getElementById('game-description').innerText = game.description;

        initChat(gameId);
    } catch (error) {
        console.error('Error fetching game details:', error);
    }
});

function initChat(gameId) {
    const socket = io();
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendMessageButton = document.getElementById('send-message');

    //Join game room
    socket.emit('join', gameId);

    //Display previous messages
    socket.on('previousMessages', (messages) => {
        chatMessages.innerHTML = messages.map(msg => {
            const messageHtml = getMessageHtml(msg);
            return messageHtml;
        }).join('');
    });

    //Display new received message
    socket.on('newMessage', (message) => {
        const messageHtml = getMessageHtml(message);
        chatMessages.insertAdjacentHTML('afterbegin', messageHtml);
    });

    //Send new message
    sendMessageButton.addEventListener('click', () => {
        const username = localStorage.getItem('username');
        const message = chatInput.value.trim();
        if (message) {
            socket.emit('sendMessage', { gameId, sender: username, message });
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });

    //Format Message
    function getMessageHtml(message) {
        //Check mention
        const mentioned = message.message.includes(`@${localStorage.getItem('username')}`);
        const messageClass = mentioned ? 'mention' : '';

        //Format timestamp
        const options = {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          };
        return `
            <p class="${messageClass}">
                <strong>${message.sender}:</strong> 
                ${message.message} 
                <small class="timestamp">${new Date(message.timestamp).toLocaleTimeString([], options)}</small>
            </p>
        `;
    }
}