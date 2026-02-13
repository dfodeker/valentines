// Snake Game Configuration
const GRID_SIZE = 20;
const GAME_WIDTH = 700;
const GAME_HEIGHT = 500;
const GAME_SPEED = 100; // milliseconds between moves

const INCREASE_WIDTH_INTERVAL = 30;
const INCREASE_SPEED_INTERVAL = 60;
const BASE_SEGMENT_SIZE = 20;
const BASE_SPEED = 100;
const MIN_SPEED = 30; // Minimum speed (fastest)
const FRUIT_HITBOX = 15; // Extra hitbox radius around fruit center

// Game state
let snake = [];
let direction = 'right';
let nextDirection = 'right';
let fruit = { x: 0, y: 0 };
let score = 0;
let gameLoop = null;
let gameOver = false;
let paused = false;
let currentSegmentSize = BASE_SEGMENT_SIZE;
let currentSpeed = BASE_SPEED;
let segmentElements = []; // Store DOM references for smooth updates

// DOM elements
const gameContainer = document.getElementById('game-container');
const fruitContainer = document.getElementById('fruit-container');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');

// Initialize the game
function initGame() {
    // Clear existing snake segments
    document.querySelectorAll('.snake-segment').forEach(seg => seg.remove());
    
    // Reset game state
    snake = [
        { x: 100, y: 100 },
        { x: 80, y: 100 },
        { x: 60, y: 100 }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    gameOver = false;
    currentSegmentSize = BASE_SEGMENT_SIZE;
    currentSpeed = BASE_SPEED;
    segmentElements = [];
    
    // Update score display
    scoreElement.textContent = 'Score: ' + score;
    gameOverElement.style.display = 'none';
    
    // Create snake segments
    snake.forEach((segment, index) => {
        createSnakeSegment(segment.x, segment.y, index === 0);
    });
    
    // Place fruit
    placeFruit();
    
    // Start game loop
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, GAME_SPEED);
}

// Create a snake segment element
function createSnakeSegment(x, y, isHead = false) {
    const segment = document.createElement('div');
    segment.className = 'snake-segment' + (isHead ? ' snake-head' : '');
    segment.style.left = x + 'px';
    segment.style.top = y + 'px';
    segment.style.width = currentSegmentSize + 'px';
    segment.style.height = currentSegmentSize + 'px';
    gameContainer.appendChild(segment);
    segmentElements.push(segment);
    return segment;
}

// Place fruit at random position
function placeFruit() {
    const maxX = (GAME_WIDTH / GRID_SIZE) - 1;
    const maxY = (GAME_HEIGHT / GRID_SIZE) - 1;
    
    let newX, newY;
    let validPosition = false;
    
    // Make sure fruit doesn't spawn on snake
    while (!validPosition) {
        newX = Math.floor(Math.random() * maxX) * GRID_SIZE;
        newY = Math.floor(Math.random() * maxY) * GRID_SIZE;
        
        validPosition = !snake.some(segment => 
            segment.x === newX && segment.y === newY
        );
    }
    
    fruit.x = newX;
    fruit.y = newY;
    fruitContainer.style.left = fruit.x + 'px';
    fruitContainer.style.top = fruit.y + 'px';
}

// Main game step
function gameStep() {
    if (gameOver || paused) return;
    
    // Update direction
    direction = nextDirection;
    
    // Calculate new head position
    const head = { ...snake[0] };
    const prevHead = { ...snake[0] };
    
    switch (direction) {
        case 'up':
            head.y -= GRID_SIZE;
            break;
        case 'down':
            head.y += GRID_SIZE;
            break;
        case 'left':
            head.x -= GRID_SIZE;
            break;
        case 'right':
            head.x += GRID_SIZE;
            break;
    }
    
    // Track if we're wrapping
    let wrapping = false;
    
    // Wrap around edges
    if (head.x < 0) {
        head.x = GAME_WIDTH - GRID_SIZE;
        wrapping = true;
    }
    if (head.x >= GAME_WIDTH) {
        head.x = 0;
        wrapping = true;
    }
    if (head.y < 0) {
        head.y = GAME_HEIGHT - GRID_SIZE;
        wrapping = true;
    }
    if (head.y >= GAME_HEIGHT) {
        head.y = 0;
        wrapping = true;
    }
    
    // Check self-collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check if eating fruit (expanded hitbox)
    const headCenterX = head.x + currentSegmentSize / 2;
    const headCenterY = head.y + currentSegmentSize / 2;
    const fruitCenterX = fruit.x + GRID_SIZE / 2;
    const fruitCenterY = fruit.y + GRID_SIZE / 2;
    const distance = Math.sqrt(Math.pow(headCenterX - fruitCenterX, 2) + Math.pow(headCenterY - fruitCenterY, 2));
    
    if (distance < FRUIT_HITBOX + currentSegmentSize / 2) {
        score += 10;
        scoreElement.textContent = 'Score: ' + score;
        placeFruit();
        
        // Increase snake width at intervals
        if (score % INCREASE_WIDTH_INTERVAL === 0) {
            currentSegmentSize += 5;
            updateSegmentStyles();
        }
        
        // Increase speed at intervals
        if (score % INCREASE_SPEED_INTERVAL === 0 && currentSpeed > MIN_SPEED) {
            currentSpeed -= 10;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameStep, currentSpeed);
        }
        // Don't remove tail - snake grows!
    } else {
        // Remove tail
        snake.pop();
    }
    
    // Render snake
    renderSnake(wrapping);
}

// Render the snake
function renderSnake(wrapping = false) {
    // Add new segments if needed
    while (segmentElements.length < snake.length) {
        const segment = document.createElement('div');
        segment.className = 'snake-segment smooth';
        gameContainer.appendChild(segment);
        segmentElements.push(segment);
    }
    
    // Remove extra segments if needed
    while (segmentElements.length > snake.length) {
        const segment = segmentElements.pop();
        segment.remove();
    }
    
    // Calculate taper - tail segments get progressively smaller
    const minTaperRatio = 0.4; // Tail is 40% of head size
    const taperStartIndex = Math.max(3, Math.floor(snake.length * 0.3)); // Start tapering after 30% of body
    
    // Update positions
    snake.forEach((pos, index) => {
        const segment = segmentElements[index];
        
        // Calculate size with taper effect
        let segmentSize = currentSegmentSize;
        if (index >= taperStartIndex) {
            const taperProgress = (index - taperStartIndex) / (snake.length - taperStartIndex);
            const taperRatio = 1 - (taperProgress * (1 - minTaperRatio));
            segmentSize = currentSegmentSize * taperRatio;
        }
        
        // Center the smaller segments on the grid position
        const offset = (currentSegmentSize - segmentSize) / 2;
        
        segment.style.width = segmentSize + 'px';
        segment.style.height = segmentSize + 'px';
        
        // Disable transition for head when wrapping to prevent sliding across screen
        if (index === 0 && wrapping) {
            segment.classList.remove('smooth');
        } else {
            segment.classList.add('smooth');
        }
        
        segment.style.left = (pos.x + offset) + 'px';
        segment.style.top = (pos.y + offset) + 'px';
        
        // Gradient color from head to tail
        const colorProgress = index / Math.max(1, snake.length - 1);
        const green = Math.floor(200 - (colorProgress * 60)); // 200 to 140
        const lightness = Math.floor(76 - (colorProgress * 20)); // Darker towards tail
        segment.style.backgroundColor = `hsl(122, 39%, ${lightness}%)`;
        
        // Update head styling
        if (index === 0) {
            segment.classList.add('snake-head', 'snake-eyes');
            segment.style.backgroundColor = '#66BB6A';
        } else {
            segment.classList.remove('snake-head', 'snake-eyes');
        }
    });
}

// Update segment styles for new size
function updateSegmentStyles() {
    document.querySelectorAll('.snake-segment').forEach(seg => {
        seg.style.width = currentSegmentSize + 'px';
        seg.style.height = currentSegmentSize + 'px';
    });
    fruitElement.style.width = currentSegmentSize + 'px';
    fruitElement.style.height = currentSegmentSize + 'px';
}

// End the game
function endGame() {
    gameOver = true;
    clearInterval(gameLoop);
    gameOverElement.style.display = 'block';
}

function valentineEasterEgg() {
    const today = new Date();
    if (today.getMonth() === 1 && today.getDate() === 13) { // Tommorow is Valentine's Day
        document.body.style.backgroundColor = '#ffe6e6';
        gameContainer.style.borderColor = '#ff4d4d';
        scoreElement.style.color = '#ff4d4d';
        gameOverElement.style.color = '#ff4d4d';
    }
}
//we trigger the valentines proposal modal if tommorow is valentines day and the hit 10 points
function checkValentineProposal() {
   
    if (score >= 10 ) { // Tommorow is Valentine's Day
        valentineEasterEgg();
        valentineProposalModal();
    }
}
//if tommorow is valentines ask them to be your valentine
function valentineProposalModal() {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.backgroundColor = '#fff';
    modal.style.border = '2px solid #ff4d4d';
    modal.style.padding = '20px';
    modal.style.zIndex = 1000;
    modal.innerHTML = `
        <h2>Will you be my Valentine?</h2>
        <button id="yes-btn">Yes</button>
        <button id="no-btn">No</button>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('yes-btn').addEventListener('click', () => {
        alert('Yay! Happy Valentine\'s Day! ❤️');
        modal.remove();
    });
    
    //as mouse approaches no we drag the mouse to the right to make it harder to click no
    const noBtn = document.getElementById('no-btn');
    noBtn.addEventListener('mousemove', (e) => {
        const rect = noBtn.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // If mouse is within 50px of the no button, move it to the right
        if (mouseX > rect.left - 50 && mouseX < rect.right + 50 && 
            mouseY > rect.top - 50 && mouseY < rect.bottom + 50) {
            noBtn.style.position = 'absolute';
            noBtn.style.left = (rect.left + 100) + 'px'; // Move right by 100px
            noBtn.style.top = rect.top + 'px';
        }
    });

}

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') nextDirection = 'right';
            break;
        case 'Enter':
            if (gameOver) initGame();
            break;
        case 'Space':
        case ' ':
            checkValentineProposal();
            if (!gameOver) {
                paused = !paused;
                scoreElement.textContent = paused ? 'PAUSED' : 'Score: ' + score;
            }
            break;
    }
    
    // Prevent arrow keys from scrolling the page
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
    }
});

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);