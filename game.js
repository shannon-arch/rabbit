'use strict';

const TILE = 40;
const COLS = 20;
const ROWS = 15;
const W = COLS * TILE;
const H = ROWS * TILE;

// Maze layout: 1 = wall, 0 = open
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,0,1],
  [1,0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,1],
  [1,0,1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,0,1,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,0,1,0,1,1,0,1,1,1,1,0,1,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,1,1,1,0,1,0,0,0,1,1,1,0,1,0,1,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

function isSolid(col, row) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return true;
  return MAZE[row][col] === 1;
}

// ---- BFS pathfinding ----
function bfsPath(startCol, startRow, goalCol, goalRow) {
  const visited = new Uint8Array(COLS * ROWS);
  const parent = new Int16Array(COLS * ROWS).fill(-1);
  const queue = [startRow * COLS + startCol];
  let head = 0;
  visited[startRow * COLS + startCol] = 1;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  let found = false;
  while (head < queue.length) {
    const cur = queue[head++];
    const cr = (cur / COLS) | 0;
    const cc = cur % COLS;
    if (cr === goalRow && cc === goalCol) { found = true; break; }
    for (const [dc, dr] of dirs) {
      const nc = cc + dc, nr = cr + dr;
      if (!isSolid(nc, nr) && !visited[nr * COLS + nc]) {
        visited[nr * COLS + nc] = 1;
        parent[nr * COLS + nc] = cur;
        queue.push(nr * COLS + nc);
      }
    }
  }
  if (!found) return null;
  const path = [];
  let node = goalRow * COLS + goalCol;
  while (node !== startRow * COLS + startCol) {
    path.unshift({ col: node % COLS, row: (node / COLS) | 0 });
    node = parent[node];
  }
  return path;
}

// ---- Entity base ----
class Entity {
  constructor(col, row, color) {
    this.col = col;
    this.row = row;
    this.x = col * TILE + TILE / 2;
    this.y = row * TILE + TILE / 2;
    this.color = color;
    this.speed = 0;
    this.dx = 0;
    this.dy = 0;
  }

  get tileCol() { return Math.round((this.x - TILE / 2) / TILE); }
  get tileRow() { return Math.round((this.y - TILE / 2) / TILE); }

  tryMove(dx, dy) {
    const nx = this.x + dx;
    const ny = this.y + dy;
    const r = TILE * 0.38;
    const left = Math.floor((nx - r) / TILE);
    const right = Math.floor((nx + r) / TILE);
    const top = Math.floor((ny - r) / TILE);
    const bottom = Math.floor((ny + r) / TILE);
    const blocked = isSolid(left, top) || isSolid(right, top) ||
                    isSolid(left, bottom) || isSolid(right, bottom);
    if (!blocked) { this.x = nx; this.y = ny; }
    else {
      // try sliding
      const nx2 = this.x + dx;
      const left2 = Math.floor((nx2 - r) / TILE);
      const right2 = Math.floor((nx2 + r) / TILE);
      const cy = this.y;
      const top2 = Math.floor((cy - r) / TILE);
      const bot2 = Math.floor((cy + r) / TILE);
      if (!(isSolid(left2, top2) || isSolid(right2, top2) || isSolid(left2, bot2) || isSolid(right2, bot2))) {
        this.x = nx2;
      }
      const ny2 = this.y + dy;
      const cx = this.x;
      const left3 = Math.floor((cx - r) / TILE);
      const right3 = Math.floor((cx + r) / TILE);
      const top3 = Math.floor((ny2 - r) / TILE);
      const bot3 = Math.floor((ny2 + r) / TILE);
      if (!(isSolid(left3, top3) || isSolid(right3, top3) || isSolid(left3, bot3) || isSolid(right3, bot3))) {
        this.y = ny2;
      }
    }
  }
}

// ---- Player ----
class Player extends Entity {
  constructor() {
    super(1, 1, '#4fc3f7');
    this.speed = 3.2;
    this.alive = true;
    this.facingRight = true;
    this.legAnim = 0;
  }

  update(keys) {
    if (!this.alive) return;
    let dx = 0, dy = 0;
    if (keys['ArrowLeft']  || keys['KeyA']) dx -= this.speed;
    if (keys['ArrowRight'] || keys['KeyD']) dx += this.speed;
    if (keys['ArrowUp']    || keys['KeyW']) dy -= this.speed;
    if (keys['ArrowDown']  || keys['KeyS']) dy += this.speed;
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
    if (dx > 0) this.facingRight = true;
    if (dx < 0) this.facingRight = false;
    if (dx !== 0 || dy !== 0) this.legAnim += 0.25;
    this.tryMove(dx, dy);
  }

  draw(ctx) {
    const x = this.x, y = this.y;
    const dir = this.facingRight ? 1 : -1;
    const leg = Math.sin(this.legAnim) * 6;
    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 17, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = '#1565c0';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 4, y + 6); ctx.lineTo(x - 4, y + 17 + leg); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 4, y + 6); ctx.lineTo(x + 4, y + 17 - leg); ctx.stroke();

    // Body
    ctx.fillStyle = '#1976d2';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 9, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 7, y - 4); ctx.lineTo(x - 13 * dir - 2, y + 4 + leg * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 7, y - 4); ctx.lineTo(x + 13 * dir - 2, y + 4 - leg * 0.5); ctx.stroke();

    // Head
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(x, y - 12, 9, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(x + 3 * dir, y - 13, 2, 0, Math.PI * 2); ctx.fill();

    // Mouth (smile)
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + 1 * dir, y - 9, 4, 0, Math.PI);
    ctx.stroke();

    // Hair
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.ellipse(x, y - 20, 9, 4, 0, Math.PI, 0);
    ctx.fill();

    ctx.restore();
  }
}

// ---- Scary Rabbit ----
class Rabbit extends Entity {
  constructor() {
    super(COLS - 2, ROWS - 2, '#d32f2f');
    this.baseSpeed = 1.6;
    this.speed = this.baseSpeed;
    this.path = [];
    this.pathTimer = 0;
    this.pathInterval = 24; // frames between pathfinding updates
    this.eyeAnim = 0;
    this.bounceAnim = 0;
    this.angry = false;
    this.scareRadius = 5 * TILE; // within this distance, rabbit speeds up
    this.facingRight = false;
  }

  update(player, elapsed) {
    this.bounceAnim += 0.18;
    this.eyeAnim += 0.04;
    this.speed = this.baseSpeed + elapsed * 0.0003;

    // Check proximity for angry mode
    const dist = Math.hypot(this.x - player.x, this.y - player.y);
    this.angry = dist < this.scareRadius;

    this.pathTimer++;
    if (this.pathTimer >= this.pathInterval) {
      this.pathTimer = 0;
      this.path = bfsPath(this.tileCol, this.tileRow, player.tileCol, player.tileRow) || [];
    }

    // Move toward next waypoint
    if (this.path.length > 0) {
      const target = this.path[0];
      const tx = target.col * TILE + TILE / 2;
      const ty = target.row * TILE + TILE / 2;
      const ddx = tx - this.x;
      const ddy = ty - this.y;
      const len = Math.hypot(ddx, ddy);
      const spd = this.angry ? this.speed * 1.5 : this.speed;
      if (len < spd + 1) {
        this.x = tx;
        this.y = ty;
        this.path.shift();
      } else {
        const mx = (ddx / len) * spd;
        const my = (ddy / len) * spd;
        if (mx > 0.5) this.facingRight = true;
        if (mx < -0.5) this.facingRight = false;
        this.tryMove(mx, my);
      }
    }
  }

  draw(ctx) {
    const x = this.x;
    const bounce = Math.abs(Math.sin(this.bounceAnim)) * 4;
    const y = this.y - bounce;
    const dir = this.facingRight ? 1 : -1;
    const eyePulse = Math.sin(this.eyeAnim) * 0.5 + 0.5;

    ctx.save();

    // Glow effect when angry
    if (this.angry) {
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20 + eyePulse * 15;
    }

    // Shadow
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, this.y + 18, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.angry) {
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20 + eyePulse * 15;
    }

    // Body
    ctx.fillStyle = this.angry ? '#b71c1c' : '#c62828';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 11, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail (fluffy white pom-pom)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 9 * dir, y + 8, 5, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = this.angry ? '#b71c1c' : '#c62828';
    ctx.beginPath();
    ctx.arc(x, y - 11, 10, 0, Math.PI * 2);
    ctx.fill();

    // Ears (tall pointy scary ears)
    const earWobble = Math.sin(this.bounceAnim * 1.3) * 3;
    ctx.fillStyle = this.angry ? '#880e0e' : '#8b0000';
    // Left ear
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 18);
    ctx.quadraticCurveTo(x - 10 + earWobble, y - 42, x - 5, y - 38);
    ctx.quadraticCurveTo(x - 2, y - 24, x - 2, y - 18);
    ctx.closePath();
    ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.moveTo(x + 2, y - 18);
    ctx.quadraticCurveTo(x + 10 - earWobble, y - 42, x + 5, y - 38);
    ctx.quadraticCurveTo(x + 2, y - 24, x + 6, y - 18);
    ctx.closePath();
    ctx.fill();

    // Inner ear (pink)
    ctx.fillStyle = '#ff8a80';
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 20);
    ctx.quadraticCurveTo(x - 8 + earWobble, y - 38, x - 5, y - 35);
    ctx.quadraticCurveTo(x - 3, y - 26, x - 3, y - 20);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 3, y - 20);
    ctx.quadraticCurveTo(x + 8 - earWobble, y - 38, x + 5, y - 35);
    ctx.quadraticCurveTo(x + 3, y - 26, x + 5, y - 20);
    ctx.closePath();
    ctx.fill();

    // Eyes (glowing red evil eyes)
    const eyeGlow = 6 + eyePulse * 4;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = eyeGlow;
    ctx.fillStyle = '#ff1744';
    ctx.beginPath(); ctx.arc(x - 4, y - 12, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 4, y - 12, 3.5, 0, Math.PI * 2); ctx.fill();

    // Pupils (slit pupils like a demon)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(x - 4, y - 12, 1, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 4, y - 12, 1, 3, 0, 0, Math.PI * 2); ctx.fill();

    // Nose
    ctx.fillStyle = '#ff8a80';
    ctx.beginPath();
    ctx.arc(x, y - 7, 2, 0, Math.PI * 2);
    ctx.fill();

    // Scary mouth / fangs
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 4);
    ctx.quadraticCurveTo(x, y, x + 5, y - 4);
    ctx.stroke();
    // Fangs
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 4);
    ctx.lineTo(x - 5, y + 1);
    ctx.lineTo(x - 1, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 1, y - 4);
    ctx.lineTo(x + 5, y + 1);
    ctx.lineTo(x + 3, y - 4);
    ctx.closePath();
    ctx.fill();

    // Claws/paws
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8b0000';
    ctx.beginPath(); ctx.ellipse(x - 12, y + 2, 6, 4, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 12, y + 2, 6, 4, 0.3, 0, Math.PI * 2); ctx.fill();
    // Claw marks
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 12 + i * 3, y + 1);
      ctx.lineTo(x - 14 + i * 3, y + 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 12 + i * 3, y + 1);
      ctx.lineTo(x + 10 + i * 3, y + 7);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ---- Particle system ----
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const spd = 1 + Math.random() * 4;
    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;
    this.life = 1;
    this.decay = 0.02 + Math.random() * 0.03;
    this.size = 3 + Math.random() * 6;
    this.color = ['#ff1744','#ff6d00','#ffea00','#ff4444'][Math.floor(Math.random() * 4)];
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ---- Stars / collectibles ----
class Star {
  constructor(col, row) {
    this.col = col;
    this.row = row;
    this.x = col * TILE + TILE / 2;
    this.y = row * TILE + TILE / 2;
    this.collected = false;
    this.anim = Math.random() * Math.PI * 2;
  }

  update() { this.anim += 0.05; }

  draw(ctx) {
    if (this.collected) return;
    const x = this.x, y = this.y + Math.sin(this.anim) * 3;
    ctx.save();
    ctx.fillStyle = '#ffea00';
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', x, y);
    ctx.restore();
  }
}

// ---- Game ----
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'menu'; // menu | playing | gameover
    this.keys = {};
    this.particles = [];
    this.elapsed = 0;
    this.score = 0;
    this.bestScore = 0;
    this.stars = [];
    this.screenShake = 0;

    this._setupInput();
    this._buildStars();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _buildStars() {
    this.stars = [];
    const positions = [
      [3,3],[7,5],[12,2],[17,3],[5,8],[10,7],[15,9],[2,11],[9,12],[16,12],
      [13,5],[6,11],[18,6],[1,6],[14,11],
    ];
    for (const [c, r] of positions) {
      if (!isSolid(c, r)) this.stars.push(new Star(c, r));
    }
  }

  _setupInput() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'Enter') this._onAction();
      e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    this.canvas.addEventListener('click', () => this._onAction());
  }

  _onAction() {
    if (this.state === 'menu') this._startGame();
    else if (this.state === 'gameover') this._startGame();
  }

  _startGame() {
    this.state = 'playing';
    this.player = new Player();
    this.rabbit = new Rabbit();
    this.particles = [];
    this.elapsed = 0;
    this.score = 0;
    this._buildStars();
  }

  _update() {
    if (this.state !== 'playing') return;
    this.elapsed++;
    this.score = Math.floor(this.elapsed / 60);

    this.player.update(this.keys);
    this.rabbit.update(this.player, this.elapsed);

    // Star collection
    for (const star of this.stars) {
      if (!star.collected) {
        star.update();
        const dist = Math.hypot(this.player.x - star.x, this.player.y - star.y);
        if (dist < TILE * 0.6) {
          star.collected = true;
          this.score += 5;
          // burst particles
          for (let i = 0; i < 12; i++) this.particles.push(new Particle(star.x, star.y));
        }
      }
    }

    // Update particles
    this.particles = this.particles.filter(p => { p.update(); return p.life > 0; });

    // Collision detection
    const dist = Math.hypot(this.player.x - this.rabbit.x, this.player.y - this.rabbit.y);
    if (dist < TILE * 0.65) {
      this.player.alive = false;
      this.state = 'gameover';
      this.screenShake = 30;
      if (this.score > this.bestScore) this.bestScore = this.score;
      for (let i = 0; i < 30; i++) this.particles.push(new Particle(this.player.x, this.player.y));
    }

    if (this.screenShake > 0) this.screenShake--;
  }

  _drawMaze(ctx) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE, y = r * TILE;
        if (MAZE[r][c] === 1) {
          // Wall
          ctx.fillStyle = '#1b0033';
          ctx.fillRect(x, y, TILE, TILE);
          // Wall highlight
          ctx.fillStyle = '#2d004d';
          ctx.fillRect(x + 1, y + 1, TILE - 2, 4);
          ctx.fillRect(x + 1, y + 1, 4, TILE - 2);
          // Wall border glow
          ctx.strokeStyle = '#4a0072';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
        } else {
          // Floor
          const shade = (r + c) % 2 === 0 ? '#2a1f3d' : '#231a35';
          ctx.fillStyle = shade;
          ctx.fillRect(x, y, TILE, TILE);
        }
      }
    }
  }

  _drawHUD(ctx) {
    // Score
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 140, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#ffea00';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⭐ Score: ${this.score}`, 18, 27);

    // Time
    const secs = Math.floor(this.elapsed / 60);
    const mins = Math.floor(secs / 60);
    const ss = secs % 60;
    const timeStr = `${String(mins).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(W - 148, 8, 140, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#80deea';
    ctx.textAlign = 'right';
    ctx.fillText(`⏱ ${timeStr}`, W - 18, 27);
    ctx.restore();
  }

  _drawMenu(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 0, 20, 0.82)';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px Arial';
    ctx.fillStyle = '#ff1744';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 30;
    ctx.fillText('🐰 RABBIT CHASE', W / 2, H / 2 - 100);
    ctx.shadowBlur = 0;

    ctx.font = '22px Arial';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('Run from the scary rabbit!', W / 2, H / 2 - 55);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#aaaaff';
    ctx.fillText('Move: Arrow Keys or WASD', W / 2, H / 2);
    ctx.fillText('Collect ⭐ for bonus points', W / 2, H / 2 + 30);
    ctx.fillText('Survive as long as you can!', W / 2, H / 2 + 60);

    // Start button
    const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.9;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 110, H / 2 + 95, 220, 50, 25);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('▶  START GAME', W / 2, H / 2 + 126);

    ctx.restore();
  }

  _drawGameOver(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 0, 0, 0.85)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.font = 'bold 54px Arial';
    ctx.fillStyle = '#ff1744';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 40;
    ctx.fillText('CAUGHT! 😱', W / 2, H / 2 - 100);
    ctx.shadowBlur = 0;

    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`Score: ${this.score}`, W / 2, H / 2 - 45);

    ctx.fillStyle = '#80deea';
    ctx.fillText(`Best:  ${this.bestScore}`, W / 2, H / 2 - 5);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('The scary rabbit got you!', W / 2, H / 2 + 40);

    // Restart
    const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.9;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 110, H / 2 + 70, 220, 50, 25);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('▶  PLAY AGAIN', W / 2, H / 2 + 101);

    ctx.restore();
  }

  _draw() {
    const ctx = this.ctx;
    const shake = this.screenShake > 0;
    if (shake) {
      ctx.save();
      const sx = (Math.random() - 0.5) * 8;
      const sy = (Math.random() - 0.5) * 8;
      ctx.translate(sx, sy);
    }

    this._drawMaze(ctx);

    for (const star of this.stars) star.draw(ctx);
    for (const p of this.particles) p.draw(ctx);

    if (this.state === 'playing' || this.state === 'gameover') {
      this.player.draw(ctx);
      this.rabbit.draw(ctx);
      this._drawHUD(ctx);
    }

    if (this.state === 'menu') this._drawMenu(ctx);
    if (this.state === 'gameover') {
      for (const p of this.particles) p.draw(ctx);
      this._drawGameOver(ctx);
    }

    if (shake) ctx.restore();
  }

  _loop() {
    this._update();
    this._draw();
    requestAnimationFrame(this._loop);
  }
}

// ---- Init ----
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  canvas.width = W;
  canvas.height = H;
  new Game(canvas);
});
