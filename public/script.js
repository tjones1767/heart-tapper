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
function handleTap(x, y) {
    // Determine heart type
    const type = isBlueUnlocked ? 'blue' : 'red';

    // Convert to percentage for broadcasting
    const xPercent = x / window.innerWidth;
    const yPercent = y / window.innerHeight;

    // Emit event to server
    socket.emit('tap', { type, x: xPercent, y: yPercent });
}

tapArea.addEventListener('click', (e) => {
    handleTap(e.clientX, e.clientY);
});

tapArea.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling and ghost clicks
    // Handle multiple touches if needed, but for now just the first one
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        handleTap(touch.clientX, touch.clientY);
    }
}, { passive: false });

// Listen for hearts from server
socket.on('heart', (data) => {
    // Convert percentage back to pixels
    const x = data.x * window.innerWidth;
    const y = data.y * window.innerHeight;
    createHeart(x, y, data.type);
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
