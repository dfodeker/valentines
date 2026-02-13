// Winter Heart Chase Game Configuration
let GAME_WIDTH = 800;
let GAME_HEIGHT = 600;
const PLAYER_SIZE = 48;
const BASE_PLAYER_SPEED = 4;
const SPRITE_FRAME_SIZE = 48;
const ANIMATION_SPEED = 150;

// Dynamic sizing - call after DOM is ready
function updateGameDimensions() {
    const container = document.getElementById('game-container');
    if (container) {
        GAME_WIDTH = container.clientWidth;
        GAME_HEIGHT = container.clientHeight;
    }
}

// Asset paths (simplified for deployment)
const ASSETS_PATH = 'assets/animals/';
const BUSHES_PATH = 'assets/bushes/';
const TREES_PATH = 'assets/trees/';
const RUINS_PATH = 'assets/ruins/';

// Animal sprite configurations
const ANIMALS = {
    Fox: {
        idle: ASSETS_PATH + 'Fox/Fox_Idle.png',
        walk: ASSETS_PATH + 'Fox/Fox_walk.png',
        run: ASSETS_PATH + 'Fox/Fox_Run.png',
        frameCount: 4,
        frameSize: 48
    },
    Deer: {
        idle: ASSETS_PATH + 'Deer/Deer_Idle.png',
        walk: ASSETS_PATH + 'Deer/Deer_Walk.png',
        run: ASSETS_PATH + 'Deer/Deer_Run.png',
        frameCount: 4,
        frameSize: 48
    },
    Boar: {
        idle: ASSETS_PATH + 'Boar/Boar_Idle.png',
        walk: ASSETS_PATH + 'Boar/Boar_Walk.png',
        run: ASSETS_PATH + 'Boar/Boar_Run.png',
        frameCount: 4,
        frameSize: 48
    },
    Hare: {
        idle: ASSETS_PATH + 'Hare/Hare_Idle.png',
        walk: ASSETS_PATH + 'Hare/Hare_Walk.png',
        run: ASSETS_PATH + 'Hare/Hare_Run.png',
        frameCount: 4,
        frameSize: 48
    }
};

// Winter obstacle configurations (snow-covered assets)
const OBSTACLE_TYPES = [
    { file: BUSHES_PATH + 'Snow_bush1.png', width: 32, height: 32, hitbox: { x: 4, y: 8, w: 24, h: 20 } },
    { file: BUSHES_PATH + 'Snow_bush2.png', width: 32, height: 32, hitbox: { x: 4, y: 8, w: 24, h: 20 } },
    { file: BUSHES_PATH + 'Snow_bush3.png', width: 32, height: 32, hitbox: { x: 4, y: 8, w: 24, h: 20 } },
    { file: TREES_PATH + 'Snow_tree1.png', width: 64, height: 80, hitbox: { x: 16, y: 50, w: 32, h: 26 } },
    { file: TREES_PATH + 'Snow_tree2.png', width: 64, height: 80, hitbox: { x: 16, y: 50, w: 32, h: 26 } },
    { file: TREES_PATH + 'Snow_tree3.png', width: 64, height: 80, hitbox: { x: 16, y: 50, w: 32, h: 26 } },
    { file: TREES_PATH + 'Snow_christmass_tree1.png', width: 64, height: 80, hitbox: { x: 16, y: 50, w: 32, h: 26 } },
    { file: TREES_PATH + 'Snow_christmass_tree2.png', width: 64, height: 80, hitbox: { x: 16, y: 50, w: 32, h: 26 } }
];

// Central ruins configuration
const RUINS_CONFIG = {
    file: RUINS_PATH + 'Snow_ruins1.png',
    width: 128,
    height: 96,
    hitbox: { x: 10, y: 40, w: 108, h: 50 }
};

// Direction mappings for sprite rows
const DIRECTIONS = {
    down: 0,
    left: 1,
    right: 2,
    up: 3
};

// Game state
let selectedAnimal = null;
let player = { x: 400, y: 300 };
let playerSpeed = BASE_PLAYER_SPEED;
let direction = 'down';
let isMoving = false;
let currentFrame = 0;
let score = 0;
let lives = 3;
let level = 1;
let heartsCollectedThisLevel = 0;
let gameOver = false;
let paused = false;
let gameLoop = null;
let animationLoop = null;
let hearts = [];
let obstacles = [];
let keysPressed = {};
let heartStreak = 0; // consecutive hearts collected without missing
const STREAK_FOR_LIFE = 2; // collect this many in a row to earn a life
const STREAK_FOR_CLIMB = 3; // collect this many in a row to climb obstacles
const CLIMB_DURATION = 5000; // climbing lasts 5 seconds
const MAX_LIVES = 5;
let canClimb = false;
let climbTimer = null;

// Level progression configuration
const HEARTS_PER_LEVEL = 5;
const LEVEL_BONUSES = {
    speedIncrease: 0.3,
    heartLifetimeDecrease: 300,
    spawnRateDecrease: 150,
    bonusHeartChance: 0.1
};

// Heart configuration (base values, modified by level)
let heartLifetime = 8000;
let heartSpawnInterval = 2500;
const MAX_HEARTS = 5;
let lastHeartSpawn = 0;

// DOM elements
const gameContainer = document.getElementById('game-container');
const playerElement = document.getElementById('player');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const progressBar = document.getElementById('progress-bar');
const gameOverElement = document.getElementById('game-over');
const finalStatsElement = document.getElementById('final-stats');
const animalSelectElement = document.getElementById('animal-select');
const levelUpElement = document.getElementById('level-up');
const ruinsElement = document.getElementById('ruins');
const snowfallElement = document.getElementById('snowfall');

// Initialize preview images for animal selection
function initPreviews() {
    Object.keys(ANIMALS).forEach(animal => {
        const preview = document.getElementById('preview-' + animal.toLowerCase());
        if (preview) {
            preview.style.backgroundImage = `url('${ANIMALS[animal].idle}')`;
        }
    });
}

// Create snowfall effect
function createSnowfall() {
    snowfallElement.innerHTML = '';
    const numFlakes = 30;

    for (let i = 0; i < numFlakes; i++) {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.innerHTML = '*';
        flake.style.left = Math.random() * 100 + '%';
        flake.style.animationDuration = (3 + Math.random() * 4) + 's';
        flake.style.animationDelay = Math.random() * 5 + 's';
        flake.style.fontSize = (8 + Math.random() * 8) + 'px';
        flake.style.opacity = 0.4 + Math.random() * 0.4;
        snowfallElement.appendChild(flake);
    }
}

// Set up animal selection handlers
function setupAnimalSelection() {
    document.querySelectorAll('.animal-option').forEach(option => {
        option.addEventListener('click', () => {
            selectedAnimal = option.dataset.animal;
            animalSelectElement.style.display = 'none';
            startGame();
        });
    });
}

// Place central ruins
function placeRuins() {
    const centerX = (GAME_WIDTH - RUINS_CONFIG.width) / 2;
    const centerY = (GAME_HEIGHT - RUINS_CONFIG.height) / 2;

    ruinsElement.src = RUINS_CONFIG.file;
    ruinsElement.style.left = centerX + 'px';
    ruinsElement.style.top = centerY + 'px';
    ruinsElement.style.width = RUINS_CONFIG.width + 'px';
    ruinsElement.style.height = RUINS_CONFIG.height + 'px';

    return {
        x: centerX,
        y: centerY,
        width: RUINS_CONFIG.width,
        height: RUINS_CONFIG.height,
        hitbox: RUINS_CONFIG.hitbox
    };
}

// Generate random obstacles around the map
function generateObstacles() {
    obstacles = [];

    const ruins = placeRuins();
    obstacles.push({
        x: ruins.x,
        y: ruins.y,
        width: ruins.width,
        height: ruins.height,
        hitbox: ruins.hitbox,
        isRuins: true
    });

    const baseObstacles = 12;
    const extraObstacles = Math.min(level * 2, 10);
    const numObstacles = baseObstacles + extraObstacles;

    for (let i = 0; i < numObstacles; i++) {
        const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
        let x, y;
        let validPosition = false;
        let attempts = 0;

        while (!validPosition && attempts < 50) {
            x = Math.floor(Math.random() * (GAME_WIDTH - type.width));
            y = Math.floor(Math.random() * (GAME_HEIGHT - type.height));

            const corners = [
                { x: 50, y: 50 },
                { x: GAME_WIDTH - 100, y: 50 },
                { x: 50, y: GAME_HEIGHT - 100 },
                { x: GAME_WIDTH - 100, y: GAME_HEIGHT - 100 }
            ];

            let tooCloseToCorner = corners.some(corner => {
                const dist = Math.sqrt(Math.pow(x - corner.x, 2) + Math.pow(y - corner.y, 2));
                return dist < 80;
            });

            if (tooCloseToCorner) {
                attempts++;
                continue;
            }

            const distToCenter = Math.sqrt(
                Math.pow((x + type.width/2) - GAME_WIDTH/2, 2) +
                Math.pow((y + type.height/2) - GAME_HEIGHT/2, 2)
            );
            if (distToCenter < 120) {
                attempts++;
                continue;
            }

            validPosition = !obstacles.some(obs => {
                return x < obs.x + obs.width + 15 &&
                       x + type.width + 15 > obs.x &&
                       y < obs.y + obs.height + 15 &&
                       y + type.height + 15 > obs.y;
            });
            attempts++;
        }

        if (validPosition) {
            obstacles.push({
                x: x,
                y: y,
                width: type.width,
                height: type.height,
                hitbox: type.hitbox,
                file: type.file
            });
        }
    }

    renderObstacles();
}

// Render obstacles to the DOM
function renderObstacles() {
    document.querySelectorAll('.obstacle').forEach(el => el.remove());

    obstacles.forEach(obs => {
        if (obs.isRuins) return;

        const el = document.createElement('img');
        el.className = 'obstacle';
        el.src = obs.file;
        el.style.left = obs.x + 'px';
        el.style.top = obs.y + 'px';
        el.style.width = obs.width + 'px';
        el.style.height = obs.height + 'px';
        gameContainer.appendChild(el);
    });
}

// Check collision with obstacles
function checkObstacleCollision(newX, newY) {
    const playerHitbox = {
        x: newX + 12,
        y: newY + 24,
        w: 24,
        h: 20
    };

    for (const obs of obstacles) {
        const obsHitbox = {
            x: obs.x + obs.hitbox.x,
            y: obs.y + obs.hitbox.y,
            w: obs.hitbox.w,
            h: obs.hitbox.h
        };

        if (playerHitbox.x < obsHitbox.x + obsHitbox.w &&
            playerHitbox.x + playerHitbox.w > obsHitbox.x &&
            playerHitbox.y < obsHitbox.y + obsHitbox.h &&
            playerHitbox.y + playerHitbox.h > obsHitbox.y) {
            return true;
        }
    }
    return false;
}

// Calculate level-based parameters
function updateLevelParams() {
    playerSpeed = BASE_PLAYER_SPEED + (level - 1) * LEVEL_BONUSES.speedIncrease;

    // Difficulty ramps up gradually:
    // Levels 1-3: very forgiving (8s → ~7s heart timer)
    // Levels 4-6: moderate (6.5s → 5s)
    // Levels 7+: challenging (~4s → 2.5s min)
    const difficultyLevel = Math.max(0, level - 1);
    const lifetimeReduction = difficultyLevel <= 3
        ? difficultyLevel * 150        // gentle: -150ms per level
        : 450 + (difficultyLevel - 3) * 400; // steeper after level 3

    heartLifetime = Math.max(2500, 8000 - lifetimeReduction);

    // Spawn rate also eases in slowly then speeds up
    const spawnReduction = difficultyLevel <= 3
        ? difficultyLevel * 80
        : 240 + (difficultyLevel - 3) * 200;

    heartSpawnInterval = Math.max(800, 2500 - spawnReduction);
}

// Level up!
function levelUp() {
    level++;
    heartsCollectedThisLevel = 0;

    levelUpElement.textContent = `Level ${level}!`;
    levelUpElement.style.display = 'block';
    setTimeout(() => {
        levelUpElement.style.display = 'none';
    }, 1500);

    updateLevelParams();

    if (level % 3 === 0) {
        lives = Math.min(lives + 1, MAX_LIVES);
        updateLives();
    }

    generateObstacles();
    updateLevel();
    updateProgress();
}

// Start the game
function startGame() {
    updateGameDimensions();
    player = { x: 50, y: 50 };
    direction = 'down';
    isMoving = false;
    currentFrame = 0;
    score = 0;
    lives = 6;
    level = 1;
    heartsCollectedThisLevel = 0;
    heartStreak = 0;
    canClimb = false;
    if (climbTimer) clearTimeout(climbTimer);
    climbTimer = null;
    playerElement.classList.remove('climbing');
    gameOver = false;
    paused = false;
    hearts = [];
    keysPressed = {};
    lastHeartSpawn = 0;

    updateLevelParams();
    updateScore();
    updateLives();
    updateLevel();
    updateProgress();
    gameOverElement.style.display = 'none';

    const animal = ANIMALS[selectedAnimal];
    playerElement.style.backgroundImage = `url('${animal.idle}')`;
    playerElement.style.backgroundSize = `${animal.frameSize * animal.frameCount}px ${animal.frameSize * 4}px`;
    playerElement.style.width = PLAYER_SIZE + 'px';
    playerElement.style.height = PLAYER_SIZE + 'px';
    updatePlayerSprite();

    createSnowfall();
    generateObstacles();
    document.querySelectorAll('.heart').forEach(el => el.remove());

    if (gameLoop) cancelAnimationFrame(gameLoop);
    if (animationLoop) clearInterval(animationLoop);

    lastHeartSpawn = Date.now();
    gameLoop = requestAnimationFrame(gameStep);
    animationLoop = setInterval(animateSprite, ANIMATION_SPEED);

    spawnHeart();
}

// Update player sprite
function updatePlayerSprite() {
    const animal = ANIMALS[selectedAnimal];
    const row = DIRECTIONS[direction];
    const spriteX = currentFrame * animal.frameSize;
    const spriteY = row * animal.frameSize;

    playerElement.style.backgroundPosition = `-${spriteX}px -${spriteY}px`;
    playerElement.style.left = player.x + 'px';
    playerElement.style.top = player.y + 'px';
}

// Animate sprite frames
function animateSprite() {
    if (gameOver || paused) return;

    const animal = ANIMALS[selectedAnimal];
    if (isMoving) {
        currentFrame = (currentFrame + 1) % animal.frameCount;
        playerElement.style.backgroundImage = `url('${animal.walk}')`;
    } else {
        currentFrame = (currentFrame + 1) % animal.frameCount;
        playerElement.style.backgroundImage = `url('${animal.idle}')`;
    }
    updatePlayerSprite();
}

// Spawn a new heart
function spawnHeart() {
    if (hearts.length >= MAX_HEARTS) return;

    let x, y;
    let validPosition = false;
    let attempts = 0;

    while (!validPosition && attempts < 100) {
        x = 30 + Math.floor(Math.random() * (GAME_WIDTH - 60));
        y = 30 + Math.floor(Math.random() * (GAME_HEIGHT - 60));

        const heartHitbox = { x: x, y: y, w: 30, h: 30 };
        let blocked = obstacles.some(obs => {
            const obsHitbox = {
                x: obs.x + obs.hitbox.x - 10,
                y: obs.y + obs.hitbox.y - 10,
                w: obs.hitbox.w + 20,
                h: obs.hitbox.h + 20
            };
            return heartHitbox.x < obsHitbox.x + obsHitbox.w &&
                   heartHitbox.x + heartHitbox.w > obsHitbox.x &&
                   heartHitbox.y < obsHitbox.y + obsHitbox.h &&
                   heartHitbox.y + heartHitbox.h > obsHitbox.y;
        });

        const distToPlayer = Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2));
        if (distToPlayer < 80) blocked = true;

        const tooClose = hearts.some(h => {
            const dist = Math.sqrt(Math.pow(x - h.x, 2) + Math.pow(y - h.y, 2));
            return dist < 50;
        });

        validPosition = !blocked && !tooClose;
        attempts++;
    }

    if (validPosition) {
        const bonusChance = LEVEL_BONUSES.bonusHeartChance + (level - 1) * 0.02;
        const isBonus = Math.random() < bonusChance;

        const heart = {
            x: x,
            y: y,
            spawnTime: Date.now(),
            isBonus: isBonus,
            element: null
        };

        const el = document.createElement('div');
        el.className = 'heart spawning' + (isBonus ? ' bonus' : '');
        el.innerHTML = '&#10084;';
        el.style.left = x + 'px';
        el.style.top = y + 'px';

        const timer = document.createElement('div');
        timer.className = 'heart-timer';
        const timerFill = document.createElement('div');
        timerFill.className = 'heart-timer-fill';
        timerFill.style.width = '100%';
        timer.appendChild(timerFill);
        el.appendChild(timer);

        heart.element = el;
        heart.timerFill = timerFill;
        hearts.push(heart);
        gameContainer.appendChild(el);

        setTimeout(() => el.classList.remove('spawning'), 300);
    }
}

// Update hearts
function updateHearts() {
    const now = Date.now();

    if (now - lastHeartSpawn > heartSpawnInterval) {
        spawnHeart();
        lastHeartSpawn = now;
    }

    hearts = hearts.filter(heart => {
        const age = now - heart.spawnTime;
        const lifetime = heart.isBonus ? heartLifetime * 0.7 : heartLifetime;
        const remaining = lifetime - age;
        const percent = (remaining / lifetime) * 100;

        heart.timerFill.style.width = Math.max(0, percent) + '%';

        if (remaining < 1500 && !heart.element.classList.contains('expiring')) {
            heart.element.classList.add('expiring');
        }

        if (remaining <= 0) {
            heart.element.classList.remove('expiring');
            heart.element.classList.add('missed');
            setTimeout(() => heart.element.remove(), 500);
            loseLife();
            return false;
        }

        return true;
    });
}

// Check if player collected a heart
function checkHeartCollection() {
    const playerCenterX = player.x + PLAYER_SIZE / 2;
    const playerCenterY = player.y + PLAYER_SIZE / 2;

    hearts = hearts.filter(heart => {
        const heartCenterX = heart.x + 15;
        const heartCenterY = heart.y + 15;
        const dist = Math.sqrt(Math.pow(playerCenterX - heartCenterX, 2) + Math.pow(playerCenterY - heartCenterY, 2));

        if (dist < 35) {
            heart.element.classList.remove('expiring', 'bonus');
            heart.element.classList.add('collected');
            setTimeout(() => heart.element.remove(), 300);

            const basePoints = heart.isBonus ? 25 : 10;
            const levelBonus = Math.floor(level * 2);
            score += basePoints + levelBonus;

            heartsCollectedThisLevel++;
            heartStreak++;

            // Streak of 2: earn an extra life
            if (heartStreak === STREAK_FOR_LIFE && lives < MAX_LIVES) {
                lives++;
                updateLives();
                showStreakReward('+1 ❤️');
            }

            // Streak of 3+: gain ability to climb over obstacles
            if (heartStreak >= STREAK_FOR_CLIMB && !canClimb) {
                activateClimbing();
            } else if (heartStreak >= STREAK_FOR_CLIMB && canClimb) {
                // Refresh climb duration if already climbing
                refreshClimbing();
            }

            updateScore();
            updateProgress();

            if (heartsCollectedThisLevel >= HEARTS_PER_LEVEL) {
                levelUp();
            }

            return false;
        }
        return true;
    });
}

// Lose a life
function loseLife() {
    heartStreak = 0; // reset streak on miss
    deactivateClimbing();
    lives--;
    updateLives();

    if (lives <= 0) {
        endGame();
    }
}

// Activate climbing ability
function activateClimbing() {
    canClimb = true;
    playerElement.classList.add('climbing');
    showStreakReward('🧗 Climb!');

    // Start/restart timer
    if (climbTimer) clearTimeout(climbTimer);
    climbTimer = setTimeout(() => {
        deactivateClimbing();
    }, CLIMB_DURATION);
}

// Refresh climbing duration (when collecting more hearts while climbing)
function refreshClimbing() {
    if (climbTimer) clearTimeout(climbTimer);
    climbTimer = setTimeout(() => {
        deactivateClimbing();
    }, CLIMB_DURATION);
}

// Deactivate climbing ability
function deactivateClimbing() {
    canClimb = false;
    if (climbTimer) clearTimeout(climbTimer);
    climbTimer = null;
    playerElement.classList.remove('climbing');
}

// Show streak reward notification
function showStreakReward(text) {
    const msg = document.createElement('div');
    msg.textContent = text || '+1 ❤️';
    msg.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #ff6b9d;
        font-size: 32px;
        font-weight: bold;
        text-shadow: 0 0 20px rgba(255,107,157,0.8), 2px 2px 4px rgba(0,0,0,0.5);
        z-index: 60;
        pointer-events: none;
        animation: streak-reward 1.2s ease-out forwards;
    `;
    gameContainer.appendChild(msg);
    setTimeout(() => msg.remove(), 1200);
}

// Update displays
function updateScore() {
    scoreElement.textContent = 'Score: ' + score;
}

function updateLives() {
    livesElement.innerHTML = 'Lives: ' + '&#10084;'.repeat(Math.max(0, lives));
}

function updateLevel() {
    levelElement.textContent = 'Level ' + level;
}

function updateProgress() {
    const progress = (heartsCollectedThisLevel / HEARTS_PER_LEVEL) * 100;
    progressBar.style.width = progress + '%';
}

// End the game
function endGame() {
    gameOver = true;
    cancelAnimationFrame(gameLoop);
    clearInterval(animationLoop);

    finalStatsElement.innerHTML = `Final Score: ${score}<br>Level Reached: ${level}`;
    gameOverElement.style.display = 'block';
}

// Main game step
function gameStep() {
    if (gameOver) return;

    if (!paused) {
        let dx = 0;
        let dy = 0;

        if (keysPressed['ArrowUp'] || keysPressed['KeyW']) {
            dy = -playerSpeed;
            direction = 'up';
        }
        if (keysPressed['ArrowDown'] || keysPressed['KeyS']) {
            dy = playerSpeed;
            direction = 'down';
        }
        if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) {
            dx = -playerSpeed;
            direction = 'left';
        }
        if (keysPressed['ArrowRight'] || keysPressed['KeyD']) {
            dx = playerSpeed;
            direction = 'right';
        }

        isMoving = dx !== 0 || dy !== 0;

        if (dx !== 0 || dy !== 0) {
            let newX = player.x + dx;
            let newY = player.y + dy;

            newX = Math.max(0, Math.min(newX, GAME_WIDTH - PLAYER_SIZE));
            newY = Math.max(0, Math.min(newY, GAME_HEIGHT - PLAYER_SIZE));

            if (!canClimb && !checkObstacleCollision(newX, player.y)) {
                player.x = newX;
            } else if (canClimb) {
                player.x = newX;
            }

            if (!canClimb && !checkObstacleCollision(player.x, newY)) {
                player.y = newY;
            } else if (canClimb) {
                player.y = newY;
            }

            updatePlayerSprite();
        }

        updateHearts();
        checkHeartCollection();
    }

    gameLoop = requestAnimationFrame(gameStep);
}

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    keysPressed[event.code] = true;

    if (event.code === 'Enter' && gameOver) {
        animalSelectElement.style.display = 'flex';
        gameOver = false;
    }

    if (event.code === 'Space' && !gameOver && selectedAnimal) {
        paused = !paused;
        if (paused) {
            scoreElement.textContent = 'PAUSED';
        } else {
            updateScore();
        }
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
    }
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.code] = false;
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    updateGameDimensions();
    initPreviews();
    setupAnimalSelection();
});

// Handle resize — recalculate game area
window.addEventListener('resize', () => {
    updateGameDimensions();
    // Clamp player inside new bounds
    if (selectedAnimal && !gameOver) {
        player.x = Math.max(0, Math.min(player.x, GAME_WIDTH - PLAYER_SIZE));
        player.y = Math.max(0, Math.min(player.y, GAME_HEIGHT - PLAYER_SIZE));
        updatePlayerSprite();
    }
});
