const socket = io();

// DOM Elements
const tapArea = document.getElementById('tap-area');
const blueHeartBtn = document.getElementById('blue-heart-btn');
const app = document.getElementById('app');

// State
let tapCount = parseInt(localStorage.getItem('tapCount') || '0');
const tapCounter = document.getElementById('tap-counter');
tapCounter.textContent = `Taps: ${tapCount}`;

// Handle Taps
function handleTap(x, y) {
    // Increment and save tap count
    tapCount++;
    localStorage.setItem('tapCount', tapCount.toString());
    tapCounter.textContent = `Taps: ${tapCount}`;

    // Determine heart type based on thresholds
    let type = 'red';
    if (tapCount >= 10000) {
        type = 'diamond';
    } else if (tapCount >= 5000) {
        type = 'gold';
    } else if (tapCount >= 1000) {
        type = 'blue';
    }

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
