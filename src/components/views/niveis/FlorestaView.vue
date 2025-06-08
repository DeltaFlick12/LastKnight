<template>
  <canvas ref="canvasRef"></canvas>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';



let inBattle = false;
let battleState = null;
let playerHP = 100;
let enemyHP = 50;
let battleMessage = '';

function startBattle() {
  inBattle = true;
  playerHP = 100;
  enemyHP = 50;
  battleMessage = 'Um inimigo apareceu!';
  battleState = 'playerTurn';
}

function updateBattle() {
  if (!inBattle) return;

  clear();
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText(battleMessage, 50, 50);
  ctx.fillText(`Player HP: ${playerHP}`, 50, 100);
  ctx.fillText(`Inimigo HP: ${enemyHP}`, 50, 140);

  if (battleState === 'playerTurn') {
    ctx.fillText('Pressione [Enter] para atacar', 50, 200);
  }

  if (playerHP <= 0) {
    battleMessage = 'Você perdeu!';
    battleState = 'gameOver';
  } else if (enemyHP <= 0) {
    battleMessage = 'Você venceu!';
    battleState = 'win';
  }
}

function handleBattleInput(e) {
  if (!inBattle) return;

  if (e.key === 'Enter' && battleState === 'playerTurn') {
    const dmg = Math.floor(Math.random() * 20 + 5);
    enemyHP -= dmg;
    battleMessage = `Você atacou e causou ${dmg} de dano!`;
    battleState = 'enemyTurn';

    setTimeout(() => {
      if (enemyHP > 0) {
        const enemyDmg = Math.floor(Math.random() * 15 + 5);
        playerHP -= enemyDmg;
        battleMessage = `O inimigo atacou e causou ${enemyDmg} de dano!`;
        battleState = 'playerTurn';
      }
    }, 1000);
  }

  if ((battleState === 'gameOver' || battleState === 'win') && e.key === 'Enter') {
    inBattle = false;
    player.x = 100;
    player.y = 0;
    player.dx = 0;
    player.dy = 0;
    cameraX = 0;
  }
}

// Substitua checkPlayerEnemyCollision por:
function checkPlayerEnemyCollision() {
  for (const enemy of enemies) {
    const enemyX = enemy.x - cameraX;
    if (
      player.x < enemyX + enemy.width * SPRITE_SCALE &&
      player.x + player.width * SPRITE_SCALE > enemyX &&
      player.y < enemy.y + enemy.height * SPRITE_SCALE &&
      player.y + player.height * SPRITE_SCALE > enemy.y
    ) {
      startBattle();
      break;
    }
  }
}

// Substitua gameLoop por:
function gameLoop() {
  if (inBattle) {
    updateBattle();
  } else {
    clear();
    if (backgroundImage.complete) drawBackground();
    drawMap();
    drawPlayer();
    drawEnemies();

    updatePlayer();
    updateEnemies();
    checkPlayerEnemyCollision();
  }
  requestAnimationFrame(gameLoop);
}

// Adicione:
window.addEventListener('keydown', handleBattleInput);


const canvasRef = ref(null);

onMounted(() => {
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  const tileSize = 40;
  const SPRITE_SCALE = 2; // Aumenta o tamanho das sprites na tela

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const playerImage = new Image();
  playerImage.src = '/img/sprites/player/walk_right-floresta.png'; // 4 frames
  
  const enemyImage = new Image();
  enemyImage.src = '/img/sprites/player/walk_left.png-floresta'; // 4 frames

  const player = {
    x: 100,
    y: -10,
    width: 80,
    height: 110,
    dx: 0,
    dy: 0,
    speed: 5,
    jumpStrength: 20,
    gravity: 0.7,
    maxGravity: 10,
    friction: 0.8,
    isOnGround: false,
    frame: 0,
    frameCount: 4,
    frameTimer: 0,
    frameInterval: 8
  };

  let cameraX = 0;
  const keys = { left: false, right: false, up: false };

  const enemies = [
    // { x: 500, y: 0, width: 80, height: 220, dx: 3, leftLimit: 500, rightLimit: 900, dy: 0, isOnGround: false, frame: 0, frameCount: 4, frameTimer: 0, frameInterval: 10 },
    // { x: 1300, y: 0, width: 80, height: 220, dx: 3, leftLimit: 1300, rightLimit: 1700, dy: 0, isOnGround: false, frame: 0, frameCount: 4, frameTimer: 0, frameInterval: 10 }
  ];

  const backgroundImage = new Image();
  backgroundImage.src = '/img/Floresta/floresta-bg.png';

  function getTileAtWorld(x, y) {
    const col = Math.floor(x / tileSize);
    const floorY = canvas.height - tileSize;
    if (y >= floorY) return col >= 0 ? 1 : 0;
    return 0;
  }

  function updateEnemies() {
    enemies.forEach(enemy => {
      enemy.dy += player.gravity;
      if (enemy.dy > player.maxGravity) enemy.dy = player.maxGravity;

      enemy.x += enemy.dx;

      if (enemy.x < enemy.leftLimit || enemy.x + enemy.width > enemy.rightLimit) {
        enemy.dx *= -1;
      }

      enemy.y += enemy.dy;

      const bottom = enemy.y + enemy.height;
      const floorY = canvas.height - tileSize;
      if (bottom >= floorY) {
        enemy.y = floorY - enemy.height;
        enemy.dy = 0;
        enemy.isOnGround = true;
      } else {
        enemy.isOnGround = false;
      }

      enemy.frameTimer++;
      if (enemy.frameTimer >= enemy.frameInterval) {
        enemy.frame = (enemy.frame + 1) % enemy.frameCount;
        enemy.frameTimer = 0;
      }
    });
  }

  function drawEnemies() {
    enemies.forEach(enemy => {
      const screenX = enemy.x - cameraX;
      ctx.drawImage(
        enemyImage,
        enemy.frame * enemy.width, 0, enemy.width, enemy.height,
        screenX, enemy.y,
        enemy.width * SPRITE_SCALE,
        enemy.height * SPRITE_SCALE
      );
    });
  }

  function checkPlayerEnemyCollision() {
    for (const enemy of enemies) {
      const enemyX = enemy.x - cameraX;
      if (
        player.x < enemyX + enemy.width * SPRITE_SCALE &&
        player.x + player.width * SPRITE_SCALE > enemyX &&
        player.y < enemy.y + enemy.height * SPRITE_SCALE &&
        player.y + player.height * SPRITE_SCALE > enemy.y
      ) {
        player.x = 100;
        player.y = 0;
        player.dx = 0;
        player.dy = 0;
        cameraX = 0;
        break;
      }
    }
  }

  function updatePlayer() {
    player.dy += player.gravity;
    if (player.dy > player.maxGravity) player.dy = player.maxGravity;

    if (keys.left) player.dx -= 1;
    else if (keys.right) player.dx += 1;
    else {
      player.dx *= player.friction;
      if (Math.abs(player.dx) < 0.1) player.dx = 0;
    }

    if (player.dx > player.speed) player.dx = player.speed;
    if (player.dx < -player.speed) player.dx = -player.speed;

    player.x += player.dx;

    const halfScreen = canvas.width / 2;
    if (player.x > halfScreen) {
      cameraX += player.x - halfScreen;
      player.x = halfScreen;
    }

    if (keys.up && player.isOnGround) {
      player.dy = -player.jumpStrength;
      player.isOnGround = false;
    }

    player.y += player.dy;

    const bottom = player.y + player.height * SPRITE_SCALE;
    const worldX = player.x + cameraX + (player.width * SPRITE_SCALE) / 2;
    const tile = getTileAtWorld(worldX, bottom);
    if (tile === 1 && player.dy >= 0) {
      player.y = canvas.height - tileSize - player.height * SPRITE_SCALE;
      player.dy = 0;
      player.isOnGround = true;
    } else {
      player.isOnGround = false;
    }

    if (Math.abs(player.dx) > 0.5) {
      player.frameTimer++;
      if (player.frameTimer >= player.frameInterval) {
        player.frame = (player.frame + 1) % player.frameCount;
        player.frameTimer = 0;
      }
    } else {
      player.frame = 0;
    }
  }

  function drawPlayer() {
    ctx.drawImage(
      playerImage,
      player.frame * player.width, 0, player.width, player.height,
      player.x, player.y,
      player.width * SPRITE_SCALE,
      player.height * SPRITE_SCALE
    );
  }

  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function gameLoop() {
    clear();
    if (backgroundImage.complete) drawBackground();
    drawMap();
    drawPlayer();
    drawEnemies();

    updatePlayer();
    updateEnemies();
    checkPlayerEnemyCollision();

    requestAnimationFrame(gameLoop);
  }

  function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height + 70);
  }

  function drawMap() {}

  function keyDown(e) {
    const key = e.key.toLowerCase();
    if (key === 'a') keys.left = true;
    else if (key === 'd') keys.right = true;
    else if (key === 'w') keys.up = true;
  }

  function keyUp(e) {
    const key = e.key.toLowerCase();
    if (key === 'a') keys.left = false;
    else if (key === 'd') keys.right = false;
    else if (key === 'w') keys.up = false;
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  backgroundImage.onload = () => {
    player.y = canvas.height - tileSize - player.height * SPRITE_SCALE;
    gameLoop();
  };

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeCanvas);
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
  });
});
</script>

<style>
canvas {
  border: 2px solid #000;
  display: block;
  margin: 20px auto;
  background: transparent;
}
</style>
