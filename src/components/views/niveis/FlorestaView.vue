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
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';

const canvasRef = ref(null);
const showIntroDialog = ref(true);
const showForestDialog = ref(false);
const showVictoryDialog = ref(false);

const defeatedEnemiesCount = ref(0);
const totalEnemiesToDefeat = 6;

const tileSize = 40;
const SPRITE_SCALE = 2;
let cameraX = 0;

const player = {
  x: 100,
  y: 0,
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

const keys = { left: false, right: false, up: false };

const enemies = [];

function generateEnemies(canvas, count = 10) {
  enemies.length = 0;
  for (let i = 0; i < count; i++) {
    enemies.push({
      x: 500 + i * 1500,
      y: canvas.height - tileSize - 110 * SPRITE_SCALE,
      width: 80,
      height: 110,
      dx: 0,
      dy: 0,
      isOnGround: true,
      frame: 0,
      frameCount: 4,
      frameTimer: 0,
      frameInterval: 10,
      name: "Goblin",
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
    enemy.life -= 50; // dano simulado

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

onMounted(() => {
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');

  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));

  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height + 70);
  }

  function loop() {
    clear();
    if (backgroundImage.complete) drawBackground();
    updatePlayer(canvas);
    drawPlayer(ctx);
    drawEnemies(ctx);
    checkProximity();
    requestAnimationFrame(loop);
  }

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
    generateEnemies(canvas, totalEnemiesToDefeat);
    loop();
  };

  onBeforeUnmount(() => {
    window.removeEventListener('resize', () => resizeCanvas(canvas));
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
  });
});
</script>

<style scoped>
canvas {
  border: 2px solid #000;
  display: block;
  margin: 20px auto;
  background: transparent;
}

/* Caixa de diálogo ao entrar na floresta */
.intro-dialog {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 50, 10, 0.9);
  padding: 20px 30px;
  border-radius: 15px;
  color: #fff;
  text-align: center;
  box-shadow: 0 0 15px #0a0;
  z-index: 100;
}

.intro-dialog h2 {
  margin-bottom: 10px;
  font-size: 28px;
}

/* Caixa de diálogo contextual perto do inimigo */
.forest-dialog {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 50, 0, 0.8);
  padding: 16px 24px;
  border-radius: 12px;
  color: white;
  box-shadow: 0 0 10px #000;
  z-index: 100;
}

/* Caixa de diálogo de vitória */
.victory-dialog {
  position: absolute;
  top: 25%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 100, 0, 0.9);
  padding: 20px 30px;
  border-radius: 15px;
  color: #fff;
  text-align: center;
  box-shadow: 0 0 20px #0f0;
  z-index: 110;
}
</style>