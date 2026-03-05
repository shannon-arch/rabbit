# 🐰 Rabbit Chase

A kids game featuring a scary rabbit that chases you through a spooky maze!

## ▶️ Play Online

**Live preview → https://shannon-arch.github.io/rabbit/**

_(Automatically deployed to GitHub Pages on every push to `main`.)_

## 💻 Run Locally

Just open `index.html` directly in any modern web browser — no build step or
server required:

```bash
# Option 1 – double-click index.html in your file manager, or drag it into your browser

# Option 2 – one-line local server with Python (already installed on most systems)
python3 -m http.server 8080
# then open http://localhost:8080 in your browser

# Option 3 – one-line local server with Node.js
npx serve .
# then open the URL shown in your terminal
```

## How to Play

Play online or open `index.html` locally, then try to survive as long as possible.

- **Move**: Arrow Keys or WASD
- **Goal**: Run from the scary rabbit — don't get caught!
- **Collect ⭐** stars scattered around the maze for bonus points
- Your score increases the longer you survive
- The rabbit gets faster the longer the game goes on

## Features

- Maze-based arena with obstacles to hide behind
- BFS pathfinding — the rabbit always finds the shortest route to you
- Glowing red evil eyes and fangs on the scary rabbit
- The rabbit speeds up and glows when it gets close to you
- Screen shake and particle explosion when caught
- Collectible stars for bonus points
- Best score tracking across rounds
