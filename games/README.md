# Games Plugin System

This folder contains all the games for Gustave's gaming site. Each game is completely self-contained in its own folder.

## Game Structure

Each game folder should contain:

- `game.json` - Game configuration file
- `game.html` - Main game HTML file
- `game.css` - Game-specific styles
- `game.js` - Game logic and functionality

## Creating a New Game

1. Create a new folder in the `games` directory with your game name
2. Add the required files (game.json, game.html, game.css, game.js)
3. The game will automatically appear in the main site menu

### game.json Format

```json
{
  "name": "Your Game Name",
  "description": "Brief description of your game",
  "author": "Your Name",
  "version": "1.0.0",
  "entry": "game.html",
  "icon": "🎮",
  "category": "arcade"
}
```

### Example Game Structure

```
games/
├── your-game/
│   ├── game.json
│   ├── game.html
│   ├── game.css
│   └── game.js
└── snake/
    ├── game.json
    ├── game.html
    ├── game.css
    └── game.js
```

## Features

- **Plug-and-play**: Games are automatically detected and loaded
- **Isolated**: Each game runs in its own iframe for security
- **Responsive**: Games inherit the site's responsive design
- **Cleanup**: Automatic resource cleanup when switching games

## Development Tips

- Use the same retro/brutalist styling as the main site
- Include mobile touch controls where appropriate
- Add a cleanup function (`window.gameCleanup`) to properly clean up resources
- Test your game both standalone and within the main site iframe