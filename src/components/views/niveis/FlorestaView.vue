<template>
  <div class="floresta-view" style="position: relative;">
    <canvas ref="canvasRef"></canvas>

    <!-- Caixa de diálogo ao entrar na floresta -->
    <div v-if="showIntroDialog" class="intro-dialog">
      <h2>Bem-vindo à Floresta Sombria</h2>
      <p>Este lugar é cheio de perigos, fique atento!</p>
      <button @click="closeIntroDialog">Continuar</button>
    </div>

    <!-- Caixa de diálogo contextual perto do inimigo -->
    <div v-if="showForestDialog" class="forest-dialog">
      <p>Você sente uma presença estranha entre as árvores...</p>
      <p><strong>Inimigo à frente!</strong></p>
      <button @click="enfrentarInimigo">Enfrentar o inimigo</button>
    </div>

    <!-- Caixa de diálogo de vitória -->
    <div v-if="showVictoryDialog" class="victory-dialog">
      <h2>Parabéns!</h2>
      <p>Você derrotou os inimigos e terminou a floresta!</p>
      <button @click="closeVictoryDialog">Fechar</button>
    </div>

    <!-- Caixa de diálogo de Game Over -->
    <div v-if="showGameOverDialog" class="game-over-dialog">
      <h2>Game Over</h2>
      <p>Suas vidas acabaram!</p>
      <button @click="restartGame">Reiniciar</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';

const canvasRef = ref(null);
const showIntroDialog = ref(true);
const showForestDialog = ref(false);
const showVictoryDialog = ref(false);
const showGameOverDialog = ref(false);

const defeatedEnemiesCount = ref(0);
const totalEnemiesToDefeat = 6;

const playerLives = ref(3);
let gameOver = false;

const tileSize = 40;
const SPRITE_SCALE = 2;
let cameraX = 0;

const player = {
  x: 100,
  y: 100,
  width: 40,
  height: 50,
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

const keys = { left: false, right: false, up: false };

const enemies = [];

function generateEnemies(canvas, count = 10) {
  enemies.length = 0;
  for (let i = 0; i < count; i++) {
    enemies.push({
      x: 500 + i * 1500,
      y: canvas.height - tileSize - 40 * SPRITE_SCALE,
      width: 60,
      height: 40,
      dx: 0,
      dy: 0,
      isOnGround: true,
      frame: 0,
      frameCount: 4,
      frameTimer: 0,
      frameInterval: 10,
      name: "LOBO",
      life: 100,
      maxLife: 100
    });
  }
}

const backgroundImage = new Image();
backgroundImage.src = '/img/Floresta/floresta-bg.png';

function resizeCanvas(canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function getTileAtWorld(x, y, canvas) {
  const col = Math.floor(x / tileSize);
  const floorY = canvas.height - tileSize;
  if (y >= floorY) return col >= 0 ? 1 : 0;
  return 0;
}

function closeIntroDialog() {
  showIntroDialog.value = false;
}

function enfrentarInimigo() {
  const playerBox = {
    x: player.x + cameraX,
    y: player.y,
    width: player.width * SPRITE_SCALE,
    height: player.height * SPRITE_SCALE
  };

  const enemyIndex = enemies.findIndex(enemy => {
    const enemyBox = {
      x: enemy.x,
      y: enemy.y,
      width: enemy.width * SPRITE_SCALE,
      height: enemy.height * SPRITE_SCALE
    };
    return (
      playerBox.x < enemyBox.x + enemyBox.width &&
      playerBox.x + playerBox.width > enemyBox.x &&
      playerBox.y < enemyBox.y + enemyBox.height &&
      playerBox.y + playerBox.height > enemyBox.y
    );
  });

  if (enemyIndex !== -1) {
    const enemy = enemies[enemyIndex];
    enemy.life -= 25; // dano simulado

    if (enemy.life <= 0) {
      enemies.splice(enemyIndex, 1);
      defeatedEnemiesCount.value++;

      if (defeatedEnemiesCount.value >= totalEnemiesToDefeat) {
        showVictoryDialog.value = true;
      }
    }
  }

  showForestDialog.value = false;
}

function closeVictoryDialog() {
  showVictoryDialog.value = false;
}

function damagePlayer(amount) {
  if (gameOver) return;

  playerLives.value -= amount;
  if (playerLives.value <= 0) {
    playerLives.value = 0;
    gameOver = true;
    showGameOverDialog.value = true;
  }
}

function drawLives(ctx) {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Vidas: ${playerLives.value}`, 20, 30);
}

function drawEnemies(ctx) {
  enemies.forEach(enemy => {
    const screenX = enemy.x - cameraX;

    ctx.fillStyle = 'blue';
    ctx.fillRect(
      screenX, enemy.y,
      enemy.width * SPRITE_SCALE,
      enemy.height * SPRITE_SCALE
    );

    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';

    ctx.fillText(enemy.name, screenX + (enemy.width * SPRITE_SCALE) / 2, enemy.y - 25);

    const barWidth = enemy.width * SPRITE_SCALE;
    const barHeight = 6;
    const lifeRatio = enemy.life / enemy.maxLife;

    ctx.fillStyle = 'red';
    ctx.fillRect(screenX, enemy.y - 20, barWidth, barHeight);

    ctx.fillStyle = 'limegreen';
    ctx.fillRect(screenX, enemy.y - 20, barWidth * lifeRatio, barHeight);

    ctx.strokeStyle = 'black';
    ctx.strokeRect(screenX, enemy.y - 20, barWidth, barHeight);
  });
}

function drawPlayer(ctx) {
  ctx.fillStyle = 'red';
  ctx.fillRect(
    player.x, player.y,
    player.width * SPRITE_SCALE,
    player.height * SPRITE_SCALE
  );
}

function updatePlayer(canvas) {
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
  const tile = getTileAtWorld(worldX, bottom, canvas);
  if (tile === 1 && player.dy >= 0) {
    player.y = canvas.height - tileSize - player.height * SPRITE_SCALE;
    player.dy = 0;
    player.isOnGround = true;
  } else {
    player.isOnGround = false;
  }
}

function checkProximity() {
  if (showIntroDialog.value) {
    showForestDialog.value = false;
    return;
  }

  const playerBox = {
    x: player.x + cameraX,
    y: player.y,
    width: player.width * SPRITE_SCALE,
    height: player.height * SPRITE_SCALE
  };

  showForestDialog.value = enemies.some(enemy => {
    const enemyBox = {
      x: enemy.x,
      y: enemy.y,
      width: enemy.width * SPRITE_SCALE,
      height: enemy.height * SPRITE_SCALE
    };

    return (
      playerBox.x < enemyBox.x + enemyBox.width &&
      playerBox.x + playerBox.width > enemyBox.x &&
      playerBox.y < enemyBox.y + enemyBox.height &&
      playerBox.y + playerBox.height > enemyBox.y
    );
  });
}

const lastAttackTimes = new Map();

function enemyAttackLogic() {
  if (gameOver) return;

  const now = Date.now();

  enemies.forEach(enemy => {
    const enemyCenterX = enemy.x + (enemy.width * SPRITE_SCALE) / 2;
    const playerCenterX = player.x + cameraX + (player.width * SPRITE_SCALE) / 2;
    const distX = enemyCenterX - playerCenterX;
    const distY = enemy.y - player.y;
    const distance = Math.sqrt(distX * distX + distY * distY);

    // Atacar se perto (<70px)
    if (distance < 70) {
      const lastAttack = lastAttackTimes.get(enemy) || 0;
      if (now - lastAttack > 10000) {
        damagePlayer(5);
        lastAttackTimes.set(enemy, now);
      }
    }
    // Seguir o player se estiver a até 300 px, mas não atacar
    else if (distance < 600) {
      if (distX > 5) enemy.x -= 1.5; // inimigo anda para esquerda
      else if (distX < -5) enemy.x += 1.5; // inimigo anda para direita
    }
  });
}

function restartGame() {
  playerLives.value = 3;
  gameOver = false;
  showGameOverDialog.value = false;

  player.x = 100;
  player.y = canvasRef.value.height - tileSize - player.height * SPRITE_SCALE;
  player.dx = 0;
  player.dy = 0;

  generateEnemies(canvasRef.value, totalEnemiesToDefeat);

  defeatedEnemiesCount.value = 0;

  loop();
}

onMounted(() => {
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');

  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));

  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawBackground() {
    const zoomFactor = 1.19;
    const w = canvas.width * zoomFactor;
    const h = (canvas.height + 70) * zoomFactor;
    const offsetX = (canvas.width - w) / 2;
    const offsetY = (canvas.height - h) / 2;
    ctx.drawImage(backgroundImage, offsetX, offsetY, w, h);
  }

  function loop() {
    if (gameOver) {
      return; // trava o jogo
    }
    clear();
    if (backgroundImage.complete) drawBackground();
    updatePlayer(canvas);
    drawPlayer(ctx);
    drawEnemies(ctx);
    checkProximity();
    drawLives(ctx);
    enemyAttackLogic();

    requestAnimationFrame(loop);
  }

  function keyDown(e) {
    if (gameOver) return;

    const key = e.key.toLowerCase();
    if (key === 'a') keys.left = true;
    else if (key === 'd') keys.right = true;
    else if (key === 'w') keys.up = true;
    else if (e.code === 'Space') {
      e.preventDefault();
      enfrentarInimigo();
    }
  }

  function keyUp(e) {
    const key = e.key.toLowerCase();
    if (key === 'a') keys.left = false;
    else if (key === 'd') keys.right = false;
    else if (key === 'w') keys.up = false;
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  player.y = canvas.height - tileSize - player.height * SPRITE_SCALE;
  generateEnemies(canvas, totalEnemiesToDefeat);

  loop();

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
    window.removeEventListener('resize', () => resizeCanvas(canvas));
  });
});
</script>

<style scoped>
.floresta-view canvas {
  display: block;
  background-color: #000;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
}

.intro-dialog,
.forest-dialog,
.victory-dialog,
.game-over-dialog {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 30, 0.9);
  padding: 20px 30px;
  border-radius: 15px;
  color: #fff;
  text-align: center;
  z-index: 100;
  box-shadow: 0 0 15px #222;
}

.game-over-dialog {
  background: rgba(100, 0, 0, 0.95);
  box-shadow: 0 0 20px #f00;
}
button {
  cursor: pointer;
  margin-top: 15px;
  background-color: #2f86ff;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  padding: 10px 20px;
}
button:hover {
  background-color: #4da1ff;
}
</style>
