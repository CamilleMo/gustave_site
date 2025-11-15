// Game Loader System for Gustave's Games
class GameLoader {
    constructor() {
        this.games = new Map();
        this.currentGame = null;
        this.gameContainer = null;
    }

    // Discover and load all games from the games folder
    async loadGames() {
        try {
            // Get list of game directories
            const gameDirectories = await this.getGameDirectories();
            
            for (const gameDir of gameDirectories) {
                await this.loadGame(gameDir);
            }
            
            this.updateGameMenu();
        } catch (error) {
            console.error('Error loading games:', error);
        }
    }

    // Get available game directories (for now, we'll hardcode this)
    async getGameDirectories() {
        // In a real filesystem, this would scan the games directory
        // For now, we'll return known games
        return ['snake', 'kart'];
    }

    // Load a single game's configuration
    async loadGame(gameDir) {
        try {
            const configResponse = await fetch(`games/${gameDir}/game.json`);
            if (!configResponse.ok) {
                throw new Error(`Failed to load game config for ${gameDir}`);
            }
            
            const config = await configResponse.json();
            config.directory = gameDir;
            
            this.games.set(gameDir, config);
            console.log(`Loaded game: ${config.name}`);
        } catch (error) {
            console.error(`Error loading game ${gameDir}:`, error);
        }
    }

    // Update the navigation menu with available games
    updateGameMenu() {
        const gamesList = document.querySelector('nav ul');
        if (!gamesList) return;

        // Clear existing game links (keep home)
        const links = gamesList.querySelectorAll('li');
        links.forEach((li, index) => {
            if (index > 0) { // Keep first link (Home)
                li.remove();
            }
        });

        // Add games to menu
        this.games.forEach((game, gameId) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = `${game.icon || '🎮'} ${game.name}`;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                this.playGame(gameId);
            });
            li.appendChild(a);
            gamesList.appendChild(li);
        });

        // Add coming soon placeholders
        for (let i = 0; i < 1; i++) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = `🚀 Game ${this.games.size + i + 1} (Coming Soon)`;
            a.style.opacity = '0.6';
            a.addEventListener('click', (e) => e.preventDefault());
            li.appendChild(a);
            gamesList.appendChild(li);
        }
    }

    // Play a specific game
    async playGame(gameId) {
        const game = this.games.get(gameId);
        if (!game) {
            console.error(`Game ${gameId} not found`);
            return;
        }

        // Clean up previous game
        this.cleanupCurrentGame();

        // Get or create game container
        const main = document.querySelector('main');
        if (!main) return;

        // Update page title
        document.title = `GG - ${game.name}`;

        // Update main content header
        const mainHeader = main.querySelector('h2');
        if (mainHeader) {
            mainHeader.textContent = `${game.icon || '🎮'} ${game.name}`;
        }

        // Create game container
        this.gameContainer = document.createElement('div');
        this.gameContainer.className = 'game-frame';
        
        const iframe = document.createElement('iframe');
        iframe.src = `games/${game.directory}/${game.entry}`;
        iframe.frameBorder = '0';
        iframe.width = '100%';
        iframe.height = '650';
        iframe.style.cssText = 'border-radius: 10px; box-shadow: 0 0 20px rgba(138, 43, 226, 0.4); border: none;';
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('tabindex', '0');
        
        // Simple iframe setup with aggressive focus management
        iframe.onload = () => {
            console.log('Game iframe loaded');
            
            // Focus the iframe immediately
            setTimeout(() => {
                iframe.focus();
                iframe.contentWindow.focus();
                console.log('Iframe focused');
            }, 100);
            
            // Create a global key listener that always forwards to the iframe
            const keyListener = (e) => {
                console.log('Parent caught key:', e.key);
                
                // Try multiple methods to forward the event
                if (iframe.contentWindow && this.currentGame) {
                    // Method 1: PostMessage
                    try {
                        iframe.contentWindow.postMessage({
                            type: 'keydown',
                            key: e.key,
                            code: e.code,
                            keyCode: e.keyCode
                        }, '*');
                        console.log('Sent postMessage for key:', e.key);
                    } catch (err) {
                        console.log('PostMessage failed:', err);
                    }
                    
                    // Method 2: Direct event dispatch (same origin)
                    try {
                        const syntheticEvent = new KeyboardEvent('keydown', {
                            key: e.key,
                            code: e.code,
                            keyCode: e.keyCode,
                            bubbles: true,
                            cancelable: true
                        });
                        iframe.contentWindow.document.dispatchEvent(syntheticEvent);
                        console.log('Dispatched synthetic event for key:', e.key);
                    } catch (fallbackErr) {
                        console.log('Direct dispatch failed:', fallbackErr);
                    }
                    
                    // Method 3: Call game method directly if available
                    try {
                        if (iframe.contentWindow.game && iframe.contentWindow.game.handleKeyPress) {
                            iframe.contentWindow.game.handleKeyPress({
                                key: e.key,
                                code: e.code,
                                preventDefault: () => {},
                                stopPropagation: () => {}
                            });
                            console.log('Called game method directly for key:', e.key);
                        }
                    } catch (directErr) {
                        console.log('Direct method call failed:', directErr);
                    }
                }
                
                // Prevent default for game keys
                if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
                    e.preventDefault();
                }
            };
            
            document.addEventListener('keydown', keyListener);
            
            // Store the listener for cleanup
            this.keyListener = keyListener;
        };
        
        this.gameContainer.appendChild(iframe);

        // Clear main content and add game
        const existingContent = main.querySelectorAll('p, .game-frame');
        existingContent.forEach(el => el.remove());
        
        main.appendChild(this.gameContainer);
        this.currentGame = gameId;

        console.log(`Playing game: ${game.name}`);
    }

    // Return to home page
    showHome() {
        this.cleanupCurrentGame();
        
        const main = document.querySelector('main');
        if (!main) return;

        // Update page title
        document.title = 'GG - Gustave\'s Games';

        // Update main content header
        const mainHeader = main.querySelector('h2');
        if (mainHeader) {
            mainHeader.textContent = 'Welcome to Gustave\'s Arcade!';
        }

        // Clear game content and restore home content
        const existingContent = main.querySelectorAll('.game-frame, .game-info');
        existingContent.forEach(el => el.remove());

        // Add home content if it doesn't exist
        if (!main.querySelector('p')) {
            const welcomeText = document.createElement('p');
            welcomeText.textContent = 'Get ready for some retro-futuristic fun!';
            main.appendChild(welcomeText);

            const instructionText = document.createElement('p');
            instructionText.textContent = 'Choose a game from the menu on the left to start playing.';
            main.appendChild(instructionText);
        }

        this.currentGame = null;
    }

    // Clean up current game resources
    cleanupCurrentGame() {
        if (this.gameContainer) {
            // If the game has a cleanup function, call it
            const iframe = this.gameContainer.querySelector('iframe');
            if (iframe && iframe.contentWindow && iframe.contentWindow.gameCleanup) {
                try {
                    iframe.contentWindow.gameCleanup();
                } catch (error) {
                    console.log('Game cleanup function not available or failed');
                }
            }
            
            // Remove key listener
            if (this.keyListener) {
                document.removeEventListener('keydown', this.keyListener);
                this.keyListener = null;
            }
            
            this.gameContainer.remove();
            this.gameContainer = null;
        }
    }

    // Get list of available games
    getAvailableGames() {
        return Array.from(this.games.values());
    }

    // Check if a game is currently playing
    isGameActive() {
        return this.currentGame !== null;
    }
}

// Global game loader instance
window.gameLoader = new GameLoader();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await window.gameLoader.loadGames();
    
    // Set up home button
    const homeLink = document.querySelector('nav ul li:first-child a');
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.gameLoader.showHome();
        });
    }

    console.log('Game loader initialized');
});