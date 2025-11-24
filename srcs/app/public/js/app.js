// srcs/app/public/js/app.js
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const gameArea = document.getElementById('game-area');

    startButton.addEventListener('click', () => {
        gameArea.style.display = 'block';
        startGame();
    });

    function startGame() {
        // Oyun başlatma mantığı burada yer alacak
        console.log('Oyun başladı!');
    }
});