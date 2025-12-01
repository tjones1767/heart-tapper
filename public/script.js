const socket = io();

// DOM Elements
const tapArea = document.getElementById('tap-area');
const blueHeartBtn = document.getElementById('blue-heart-btn');
const app = document.getElementById('app');

// State
let tapCount = parseInt(localStorage.getItem('tapCount') || '0');
let selectedHeartType = localStorage.getItem('selectedHeartType') || 'red';

const tapCounter = document.getElementById('tap-counter');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

// Modal Elements
const skinBtn = document.getElementById('skin-btn');
const skinModal = document.getElementById('skin-modal');
const closeModal = document.getElementById('close-modal');
const skinList = document.getElementById('skin-list');

// Levels configuration
const LEVELS = [
    { threshold: 0, type: 'red', name: 'Red Heart', color: '#ff4d4d', icon: '❤️' },
    { threshold: 1000, type: 'blue', name: 'Blue Heart', color: '#4d94ff', icon: '💙' },
    { threshold: 5000, type: 'gold', name: 'Gold Heart', color: '#ffd700', icon: '💛' },
    { threshold: 10000, type: 'diamond', name: 'Diamond Heart', color: '#b9f2ff', icon: '💎' }
];

function updateProgress() {
    tapCounter.textContent = `Taps: ${tapCount}`;

    // Find current level
    let currentLevelIndex = 0;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (tapCount >= LEVELS[i].threshold) {
            currentLevelIndex = i;
            break;
        }
    }

    const currentLevel = LEVELS[currentLevelIndex];
    const nextLevel = LEVELS[currentLevelIndex + 1];

    if (nextLevel) {
        const tapsNeeded = nextLevel.threshold - currentLevel.threshold;
        const tapsDone = tapCount - currentLevel.threshold;
        const percentage = Math.min(100, Math.max(0, (tapsDone / tapsNeeded) * 100));

        progressFill.style.width = `${percentage}%`;
        progressFill.style.background = `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})`;
        progressText.textContent = `Next upgrade: ${nextLevel.threshold - tapCount} taps`;
    } else {
        // Max level reached
        progressFill.style.width = '100%';
        progressFill.style.background = `linear-gradient(90deg, ${currentLevel.color}, #ffffff)`;
        progressText.textContent = 'Max Level Reached!';
    }
}

// Skin Selection Logic
function renderSkinModal() {
    skinList.innerHTML = '';

    LEVELS.forEach(level => {
        const isUnlocked = tapCount >= level.threshold;
        const isSelected = selectedHeartType === level.type;

        const option = document.createElement('div');
        option.className = `skin-option ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;

        option.innerHTML = `
            <div class="skin-preview" style="color: ${level.color}">${level.icon}</div>
            <div class="skin-name">${level.name}</div>
            ${!isUnlocked ? `<div style="font-size: 0.8rem; opacity: 0.7">Unlocks at ${level.threshold}</div>` : ''}
        `;

        if (isUnlocked) {
            option.onclick = () => {
                selectedHeartType = level.type;
                localStorage.setItem('selectedHeartType', selectedHeartType);
                renderSkinModal(); // Re-render to update selection
            };
        }

        skinList.appendChild(option);
    });
}

skinBtn.onclick = () => {
    renderSkinModal();
    skinModal.classList.remove('hidden');
};

closeModal.onclick = () => {
    skinModal.classList.add('hidden');
};

// Initialize
updateProgress();

// Handle Taps
function handleTap(x, y) {
    // Increment and save tap count
    tapCount++;
    localStorage.setItem('tapCount', tapCount.toString());
    updateProgress();

    // Use selected heart type
    const type = selectedHeartType;

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
