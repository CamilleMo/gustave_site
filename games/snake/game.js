// Enhanced Snake Game - Fixed and Improved
class SnakeGame {
    constructor() {
        // Canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // UI elements
        this.scoreElement = document.getElementById('scoreValue');
        this.highScoreElement = document.getElementById('highScore');
        this.overlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        
        // Buttons
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        
        // Game settings
        this.gridSize = 24;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // Game state
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
        this.snake = [];
        this.food = {};
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.gameSpeed = 120;
        this.gameLoop = null;
        
        // Visual effects
        this.particles = [];
        this.foodPulse = 0;
        
        this.init();
    }
    
    init() {
        // Load high score
        this.highScoreElement.textContent = this.highScore;
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Show initial screen
        this.showMenu();
        
        // Start render loop
        this.render();
    }
    
    setupEventListeners() {
        // Keyboard controls - direct
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Listen for keyboard events from parent window (iframe case)
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'keydown') {
                console.log('Received postMessage:', e.data.key);
                this.handleKeyPress({
                    key: e.data.key,
                    code: e.data.code,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                });
            }
        });
        
        // Button controls
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        // Touch controls for mobile
        this.setupTouchControls();
        
        // Prevent arrow keys from scrolling the page
        window.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        // Focus management for iframe
        window.addEventListener('focus', () => {
            console.log('Window focused');
            if (this.gameState === 'menu') {
                setTimeout(() => {
                    this.canvas.focus();
                }, 100);
            }
        });
        
        // Make canvas focusable
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.addEventListener('focus', () => {
            console.log('Canvas focused - ready for input!');
        });
        
        // Click to focus and potentially start
        this.canvas.addEventListener('click', () => {
            this.canvas.focus();
            if (this.gameState === 'menu') {
                console.log('Canvas clicked, starting game');
                this.startGame();
            }
        });
    }
    
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            if (this.gameState === 'menu') {
                this.startGame();
                return;
            }
            
            if (this.gameState === 'gameOver') {
                this.restartGame();
                return;
            }
            
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            const minSwipe = 30;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipe) {
                    if (deltaX > 0) this.setDirection(1, 0); // Right
                    else this.setDirection(-1, 0); // Left
                }
            } else {
                if (Math.abs(deltaY) > minSwipe) {
                    if (deltaY > 0) this.setDirection(0, 1); // Down
                    else this.setDirection(0, -1); // Up
                }
            }
        });
    }
    
    handleKeyPress(e) {
        console.log('Key pressed:', e.key, 'Game state:', this.gameState);
        
        // Prevent event bubbling to parent window
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
        
        switch (e.key) {
            case ' ':
            case 'Space':
            case 'Enter':
                console.log('Space/Enter detected, current state:', this.gameState);
                if (this.gameState === 'menu') {
                    console.log('Starting game...');
                    this.startGame();
                } else if (this.gameState === 'gameOver') {
                    console.log('Restarting game...');
                    this.restartGame();
                } else if (this.gameState === 'playing') {
                    console.log('Toggling pause...');
                    this.togglePause();
                }
                break;
                
            case 'r':
            case 'R':
                // Only restart if game is over or paused, never navigate to home
                if (this.gameState === 'gameOver' || this.gameState === 'paused') {
                    this.restartGame();
                }
                break;
                
            // Movement controls
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.setDirection(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.setDirection(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.setDirection(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.setDirection(1, 0);
                break;
        }
    }
    
    setDirection(x, y) {
        if (this.gameState !== 'playing') return;
        
        // Prevent reversing into itself
        if (this.direction.x === -x && this.direction.y === -y) return;
        
        this.nextDirection = { x, y };
    }
    
    startGame() {
        console.log('startGame() called');
        this.gameState = 'playing';
        this.score = 0;
        this.gameSpeed = 120;
        
        // Initialize snake in center
        const centerX = Math.floor(this.tileCount / 2);
        const centerY = Math.floor(this.tileCount / 2);
        
        this.snake = [
            { x: centerX, y: centerY },
            { x: centerX - 1, y: centerY },
            { x: centerX - 2, y: centerY }
        ];
        
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        this.generateFood();
        this.updateUI();
        this.hideOverlay();
        
        // Start game loop
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
        console.log('Game started successfully');
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            clearInterval(this.gameLoop);
            this.showPauseScreen();
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.hideOverlay();
            this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
        }
    }
    
    restartGame() {
        clearInterval(this.gameLoop);
        this.startGame();
    }
    
    generateFood() {
        let newFood;
        let validPosition = false;
        
        // Keep generating until we find a position not occupied by snake
        while (!validPosition) {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            
            validPosition = !this.snake.some(segment => 
                segment.x === newFood.x && segment.y === newFood.y
            );
        }
        
        this.food = newFood;
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update direction
        this.direction = { ...this.nextDirection };
        
        // Move snake head
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.createFoodParticles();
            this.generateFood();
            
            // Increase speed slightly
            if (this.score % 5 === 0 && this.gameSpeed > 60) {
                this.gameSpeed -= 5;
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
            }
        } else {
            this.snake.pop();
        }
        
        this.updateUI();
    }
    
    createFoodParticles() {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: (this.food.x + 0.5) * this.gridSize,
                y: (this.food.y + 0.5) * this.gridSize,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                decay: 0.02
            });
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        clearInterval(this.gameLoop);
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore.toString());
            this.highScoreElement.textContent = this.highScore;
        }
        
        this.showGameOverScreen();
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        
        // Update button states
        this.startBtn.disabled = this.gameState === 'playing';
        this.pauseBtn.disabled = this.gameState !== 'playing' && this.gameState !== 'paused';
        this.pauseBtn.textContent = this.gameState === 'paused' ? 'RESUME' : 'PAUSE';
    }
    
    showMenu() {
        this.overlayTitle.textContent = '🐍 SNAKE';
        this.overlayMessage.textContent = 'Click canvas or press SPACE to start!';
        this.showOverlay();
    }
    
    showPauseScreen() {
        this.overlayTitle.textContent = '⏸️ PAUSED';
        this.overlayMessage.textContent = 'Press SPACE to continue';
        this.showOverlay();
    }
    
    showGameOverScreen() {
        this.overlayTitle.textContent = '💀 GAME OVER';
        this.overlayMessage.textContent = `Final Score: ${this.score}`;
        this.showOverlay();
    }
    
    showOverlay() {
        this.overlay.style.display = 'flex';
    }
    
    hideOverlay() {
        this.overlay.style.display = 'none';
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (subtle)
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.tileCount; i++) {
            const pos = i * this.gridSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.drawSnake();
            this.drawFood();
        }
        
        this.drawParticles();
        
        requestAnimationFrame(() => this.render());
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            if (index === 0) {
                // Head - bright green with glow
                this.ctx.fillStyle = '#00ff00';
                this.ctx.shadowColor = '#00ff00';
                this.ctx.shadowBlur = 10;
                this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
                this.ctx.shadowBlur = 0;
                
                // Eyes
                this.ctx.fillStyle = '#000';
                const eyeSize = 3;
                if (this.direction.x === 1) {
                    this.ctx.fillRect(x + this.gridSize - 8, y + 6, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.gridSize - 8, y + this.gridSize - 9, eyeSize, eyeSize);
                } else if (this.direction.x === -1) {
                    this.ctx.fillRect(x + 5, y + 6, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 5, y + this.gridSize - 9, eyeSize, eyeSize);
                } else if (this.direction.y === -1) {
                    this.ctx.fillRect(x + 6, y + 5, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.gridSize - 9, y + 5, eyeSize, eyeSize);
                } else {
                    this.ctx.fillRect(x + 6, y + this.gridSize - 8, eyeSize, eyeSize);
                    this.ctx.fillRect(x + this.gridSize - 9, y + this.gridSize - 8, eyeSize, eyeSize);
                }
            } else {
                // Body - gradient green
                const alpha = 1 - (index * 0.05);
                this.ctx.fillStyle = `rgba(0, 255, 0, ${Math.max(alpha, 0.3)})`;
                this.ctx.fillRect(x + 3, y + 3, this.gridSize - 6, this.gridSize - 6);
            }
            
            // Border
            this.ctx.strokeStyle = '#004400';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
        });
    }
    
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        
        // Pulsing effect
        this.foodPulse += 0.1;
        const pulse = Math.sin(this.foodPulse) * 0.3 + 0.7;
        
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 15 * pulse;
        
        const size = this.gridSize - 6;
        const offset = 3;
        this.ctx.fillRect(x + offset, y + offset, size, size);
        
        this.ctx.shadowBlur = 0;
        
        // Highlight
        this.ctx.fillStyle = '#ff88ff';
        this.ctx.fillRect(x + offset + 2, y + offset + 2, size - 8, size - 8);
    }
    
    drawParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            this.ctx.fillStyle = `rgba(255, 0, 255, ${p.life})`;
            this.ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
            
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    console.log('Snake game initializing...');
    game = new SnakeGame();
    
    // Make game globally accessible for iframe communication
    window.game = game;
    console.log('Snake game initialized and made global');
});

// Cleanup function
window.gameCleanup = function() {
    console.log('Cleaning up snake game...');
    if (game && game.gameLoop) {
        clearInterval(game.gameLoop);
    }
};