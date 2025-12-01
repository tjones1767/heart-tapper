const socket = io();

// DOM Elements
const tapArea = document.getElementById('tap-area');
const blueHeartBtn = document.getElementById('blue-heart-btn');
const app = document.getElementById('app');

// State
let isBlueUnlocked = localStorage.getItem('blueHeartUnlocked') === 'true';

// Check for unlock parameter in URL
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('unlocked') === 'true') {
    isBlueUnlocked = true;
    localStorage.setItem('blueHeartUnlocked', 'true');
    // Clean up URL
    window.history.replaceState({}, document.title, "/");
}

// Update UI based on unlock state
if (isBlueUnlocked) {
    blueHeartBtn.style.display = 'none'; // Hide the buy button if already unlocked
    // Optional: Add a visual indicator that Blue Heart is active
    const indicator = document.createElement('div');
    indicator.textContent = "💙 Blue Heart Unlocked";
    indicator.style.cssText = "position: absolute; top: 80px; color: #4d94ff; font-weight: bold; pointer-events: none;";
    document.querySelector('.controls').appendChild(indicator);
}

// Handle Taps
tapArea.addEventListener('click', (e) => {
    const x = e.clientX;
    const y = e.clientY;

    // Determine heart type
    // If unlocked, 50% chance of blue, 50% red? Or just Blue?
    // Let's go with a mix to show off, or purely Blue to show status.
    // Let's do 50/50 if unlocked, so it's a "Blue Heart" feature but you still contribute to the red sea.
    // Actually, let's make it purely Blue if unlocked for maximum flex.
    const type = isBlueUnlocked ? 'blue' : 'red';

    // Emit event to server
    socket.emit('tap', { type, x, y });
});

// Listen for hearts from server
socket.on('heart', (data) => {
    createHeart(data.x, data.y, data.type);
});

function createHeart(x, y, type) {
    const heart = document.createElement('div');
    heart.classList.add('heart', type);
    heart.textContent = type === 'blue' ? '💙' : '❤️';

    // Randomize rotation for more natural feel
    const rotation = Math.random() * 60 - 30; // -30 to 30 degrees
    heart.style.setProperty('--rotation', `${rotation}deg`);

    // Position
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;

    app.appendChild(heart);

    // Cleanup after animation
    // Animation is 3s
    setTimeout(() => {
        heart.remove();
    }, 3000);
}
