const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
let snake = [{ x: 10, y: 10 }];
let food = {};
let direction = 'right';
let score = 0;
let gameOver = false;
let gameInterval;

function generateFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    ctx.fillStyle = '#00ff00'; // Neon Green
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });

    // Draw food
    ctx.fillStyle = '#ff00ff'; // Neon Magenta
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

    // Display score
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '20px VT323';
    ctx.fillText('Score: ' + score, 10, 25);

    if (gameOver) {
        ctx.fillStyle = '#ff0000';
        ctx.font = '40px Press Start 2P';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '20px VT323';
        ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 40);
    }
}

function update() {
    if (gameOver) return;

    const head = { x: snake[0].x, y: snake[0].y };

    switch (direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }

    // Check for collision with walls
    if (head.x < 0 || head.x >= canvas.width / gridSize ||
        head.y < 0 || head.y >= canvas.height / gridSize) {
        gameOver = true;
        return;
    }

    // Check for collision with self
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver = true;
            return;
        }
    }

    snake.unshift(head);

    // Check for food collision
    if (head.x === food.x && head.y === food.y) {
        score++;
        generateFood();
    } else {
        snake.pop();
    }

    draw();
}

document.addEventListener('keydown', e => {
    if (gameOver && e.key === 'r') {
        resetGame();
        return;
    }

    switch (e.key) {
        case 'ArrowUp':
            if (direction !== 'down') direction = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') direction = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') direction = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') direction = 'right';
            break;
    }
});

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    direction = 'right';
    score = 0;
    gameOver = false;
    generateFood();
    clearInterval(gameInterval);
    gameInterval = setInterval(update, 100);
    draw();
}

// Initialize game
generateFood();
gameInterval = setInterval(update, 100);
draw();
