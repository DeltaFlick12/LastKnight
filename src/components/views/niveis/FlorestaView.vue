<template>
  <div class="floresta-view" style="position: relative;">
    <canvas ref="canvasRef" class="game-canvas"></canvas>

    <!-- HUD Component -->
    <HUD />

    <!-- Enter Prompt -->
    <div v-if="showEnterPrompt" class="enter-prompt">
      Pressione <span class="key">E</span> ou <span class="key">ESPAÇO</span> para atacar
    </div>

    <!-- Diálogos -->
    <div v-if="showIntroDialog" class="intro-dialog">
      <h2>Bem-vindo à Floresta!</h2>
      <p>Derrote 6 lobos para vencer.</p>
      <button @click="closeIntroDialog">Começar</button>
    </div>
    <div v-if="showForestDialog" class="forest-dialog">
      <h2>Inimigo Próximo!</h2>
      <p>Pressione ESPAÇO ou E para atacar.</p>
    </div>
    <div v-if="showVictoryDialog" class="victory-dialog">
      <h2>Parabéns!</h2>
      <p>Você derrotou todos os inimigos!</p>
      <button @click="closeVictoryDialog">Fechar</button>
    </div>
    <div v-if="showGameOverDialog" class="game-over-dialog">
      <h2>Game Over</h2>
      <p>Você foi derrotado.</p>
      <button @click="restartGame">Reiniciar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useGameState, ITEMS } from '@/stores/gameState.js'; // Adjust path as needed
import HUD from '@/components/HUD.vue';

const gameState = useGameState();
const canvasRef = ref(null);
const showIntroDialog = ref(true);
const showForestDialog = ref(false);
const showVictoryDialog = ref(false);
const showGameOverDialog = ref(false);
const showEnterPrompt = ref(false);

const defeatedEnemiesCount = ref(0);
const totalEnemiesToDefeat = 6;
const tileSize = 40;
const SPRITE_SCALE = 2;
let cameraX = 0;
const staminaRecoveryRate = 10;
const attackCooldown = 250;
let lastAttackTime = 0;

const player = {
  x: 100,
  y: 100,
  width: 40,
  height: 50,
  dx: 0,
  dy: 0,
  speed: 3,
  jumpStrength: 20,
  gravity: 0.7,
  maxGravity: 10,
  friction: 0.85,
  isOnGround: false,
};

const keys = { left: false, right: false, up: false, e: false, space: false };
const enemies = [];
const lastAttackTimes = new Map();

const backgroundImage = new Image();
backgroundImage.src = '/img/Floresta/floresta-bg.png';

function resizeCanvas(canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function getTileAtWorld(x, y, canvas) {
  const col = Math.floor(x / tileSize);
  const floorY = canvas.height - tileSize;
  return y >= floorY && col >= 0 ? 1 : 0;
}

function generateEnemies(canvas, count = 10) {
  enemies.length = 0;
  for (let i = 0; i < count; i++) {
    enemies.push({
      x: 1000 + i * 900, // Moved from 700 to 1000
      y: canvas.height - tileSize - 40 * SPRITE_SCALE,
      width: 60,
      height: 40,
      dx: 0,
      dy: 0,
      isOnGround: true,
      name: 'LOBO',
      life: 50,
      maxLife: 50,
    });
  }
}

function closeIntroDialog() {
  showIntroDialog.value = false;
}

function enfrentarInimigo() {
  const now = Date.now();
  if (now - lastAttackTime < attackCooldown) {
    console.log('Attack on cooldown:', now - lastAttackTime);
    return;
  }

  console.log('Attempting attack. Stamina:', gameState.player.stamina);
  const attack = gameState.playerAttackAction();
  console.log('Attack result:', attack);
  if (!attack.success) {
    console.log('Attack failed:', attack.message);
    return;
  }

  lastAttackTime = now;

  const playerBox = {
    x: player.x + cameraX - 10,
    y: player.y - 10,
    width: player.width * SPRITE_SCALE + 20,
    height: player.height * SPRITE_SCALE + 20,
  };

  const enemyIndex = enemies.findIndex((enemy) => {
    const enemyBox = {
      x: enemy.x,
      y: enemy.y,
      width: enemy.width * SPRITE_SCALE,
      height: enemy.height * SPRITE_SCALE,
    };
    const collision = (
      playerBox.x < enemyBox.x + enemyBox.width &&
      playerBox.x + playerBox.width > enemyBox.x &&
      playerBox.y < enemyBox.y + enemyBox.height &&
      playerBox.y + playerBox.height > enemyBox.y
    );
    if (!collision) {
      console.log('No collision with enemy at:', enemyBox);
    }
    return collision;
  });

  console.log('Enemy index:', enemyIndex);
  if (enemyIndex !== -1) {
    const enemy = enemies[enemyIndex];
    const damage = attack.damage || 10;
    console.log('Dealing damage:', damage, 'to enemy:', enemy);
    enemy.life -= damage;
    if (enemy.life <= 0) {
      console.log('Enemy defeated:', enemy);
      enemies.splice(enemyIndex, 1);
      defeatedEnemiesCount.value++;
      gameState.addGold(10);
      showForestDialog.value = false;
      showEnterPrompt.value = false;
      if (defeatedEnemiesCount.value >= totalEnemiesToDefeat) {
        showVictoryDialog.value = true;
      }
    }
  }
}

function useOrEquipItem(itemId) {
  const item = ITEMS[itemId];
  if (!item) return;
  if (item.type === 'Arma' && item.slot === 'weapon') {
    gameState.equipItem(itemId);
  } else if (item.type === 'Consumível' || item.type === 'Consumível Especial') {
    gameState.useItem(itemId);
  }
}

function closeVictoryDialog() {
  showVictoryDialog.value = false;
}

function drawEnemies(ctx) {
  enemies.forEach((enemy) => {
    const screenX = enemy.x - cameraX;
    ctx.fillStyle = 'blue';
    ctx.fillRect(screenX, enemy.y, enemy.width * SPRITE_SCALE, enemy.height * SPRITE_SCALE);
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
  ctx.fillRect(player.x, player.y, player.width * SPRITE_SCALE, player.height * SPRITE_SCALE);
}

function updatePlayer(canvas, deltaSeconds) {
  player.dy += player.gravity;
  if (player.dy > player.maxGravity) player.dy = player.maxGravity;
  if (keys.left) player.dx -= 1;
  else if (keys.right) player.dx += 1;
  else player.dx *= player.friction;
  if (player.dx > player.speed) player.dx = player.speed;
  if (player.dx < -player.speed) player.dx = -player.speed;
  player.x += player.dx;

  const halfScreen = canvas.width / 2;
  if (player.x > halfScreen) {
    cameraX += player.x - halfScreen;
    player.x = halfScreen;
  } else if (player.x < halfScreen && cameraX > 0) {
    cameraX -= halfScreen - player.x;
    player.x = halfScreen;
    if (cameraX < 0) cameraX = 0;
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

  // Stamina recovery
  gameState.recoverStamina(staminaRecoveryRate * deltaSeconds);
  // Log health for debugging
  console.log('Player health:', gameState.player.health);
}

function checkProximity() {
  if (showIntroDialog.value) {
    showForestDialog.value = false;
    showEnterPrompt.value = false;
    return;
  }

  const playerBox = {
    x: player.x + cameraX,
    y: player.y,
    width: player.width * SPRITE_SCALE,
    height: player.height * SPRITE_SCALE,
  };

  const nearEnemy = enemies.some((enemy) => {
    const enemyBox = {
      x: enemy.x,
      y: enemy.y,
      width: enemy.width * SPRITE_SCALE,
      height: enemy.height * SPRITE_SCALE,
    };
    return (
      playerBox.x < enemyBox.x + enemyBox.width &&
      playerBox.x + playerBox.width > enemyBox.x &&
      playerBox.y < enemyBox.y + enemyBox.height &&
      playerBox.y + playerBox.height > enemyBox.y
    );
  });

  showForestDialog.value = nearEnemy;
  showEnterPrompt.value = nearEnemy;
}

function enemyAttackLogic() {
  if (gameState.player.lives <= 0) return;
  const now = Date.now();

  enemies.forEach((enemy) => {
    const enemyCenterX = enemy.x + (enemy.width * SPRITE_SCALE) / 2;
    const playerCenterX = player.x + cameraX + (player.width * SPRITE_SCALE) / 2;
    const distX = enemyCenterX - playerCenterX;
    const distY = enemy.y - player.y;
    const distance = Math.sqrt(distX * distX + distY * distY);

    if (distance < 50) { // Increased from 70 to 150
      const lastAttack = lastAttackTimes.get(enemy) || 0;
      if (now - lastAttack > 2000) {
        console.log('Enemy attacking! Distance:', distance, 'Enemy pos:', enemy.x, 'Player pos:', player.x + cameraX);
        gameState.takeDamage(10);
        lastAttackTimes.set(enemy, now);
        if (gameState.player.health <= 0) {
          showGameOverDialog.value = true;
        }
      }
    } else if (distance < 600 && distance > 150) { // Only move if outside attack range
      if (distX > 5) enemy.x -= 3;
      else if (distX < -5) enemy.x += 3;
    }
  });
}

function restartGame() {
  gameState.resetGame();
  player.x = 100;
  player.y = canvasRef.value.height - tileSize - player.height * SPRITE_SCALE;
  player.dx = 0;
  player.dy = 0;
  defeatedEnemiesCount.value = 0;
  showGameOverDialog.value = false;
  generateEnemies(canvasRef.value, totalEnemiesToDefeat);
  loop();
}

onMounted(() => {
  // Ensure initial stamina and health
  if (gameState.player.stamina < 10) {
    console.log('Resetting stamina to max:', gameState.player.maxStamina);
    gameState.player.stamina = gameState.player.maxStamina;
  }
  console.log('Initial player health:', gameState.player.health);

  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));

  backgroundImage.onload = () => {
    player.y = canvas.height - tileSize - player.height * SPRITE_SCALE;
    generateEnemies(canvas, totalEnemiesToDefeat);
    loop();
  };

  if (backgroundImage.complete) backgroundImage.onload();

  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawBackground() {
    const zoomFactor = 1.1;
    const w = canvas.width * zoomFactor;
    const h = (canvas.height + 70) * zoomFactor;
    const offsetX = (canvas.width - w) / 2;
    const offsetY = (canvas.height - h) / 2;
    ctx.drawImage(backgroundImage, offsetX, offsetY, w, h);
  }

  let lastUpdateTime = 0;
  function loop(timestamp) {
    if (
      showIntroDialog.value ||
      showVictoryDialog.value ||
      showGameOverDialog.value
    ) {
      requestAnimationFrame(loop);
      return;
    }
    if (!lastUpdateTime) lastUpdateTime = timestamp;
    const deltaSeconds = (timestamp - lastUpdateTime) / 1000;
    clear();
    if (backgroundImage.complete) drawBackground();
    updatePlayer(canvas, deltaSeconds);
    drawPlayer(ctx);
    drawEnemies(ctx);
    checkProximity();
    enemyAttackLogic();
    lastUpdateTime = timestamp;
    requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', (e) => {
    if (gameState.player.lives <= 0) return;
    const key = e.key.toLowerCase();
    console.log('Key pressed:', key, 'Code:', e.code);
    if (key === 'a') keys.left = true;
    else if (key === 'd') keys.right = true;
    else if (key === 'w') keys.up = true;
    else if (key === 'e' || e.code === 'Space') {
      keys.e = key === 'e';
      keys.space = e.code === 'Space';
      console.log('Attack triggered. Prompt:', showEnterPrompt.value, 'Dialog:', showForestDialog.value);
      if (showEnterPrompt.value || showForestDialog.value) enfrentarInimigo();
    }
  });

  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'a') keys.left = false;
    else if (key === 'd') keys.right = false;
    else if (key === 'w') keys.up = false;
    else if (key === 'e') keys.e = false;
    else if (e.code === 'Space') keys.space = false;
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', () => resizeCanvas(canvas));
  });
});
</script>

<style scoped>
.floresta-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.game-canvas {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  background-color: #000;
  width: 100vw;
  height: 100vh;
  z-index: 0;
}

.enter-prompt {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 10, 10, 0.7);
  padding: 8px 14px;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  font-size: 18px;
  user-select: none;
  pointer-events: none;
  z-index: 100;
}

.enter-prompt .key {
  font-weight: 700;
  font-size: 22px;
  color: #aaffaa;
  padding: 0 6px;
  border: 2px solid #aaffaa;
  border-radius: 4px;
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