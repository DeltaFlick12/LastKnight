<template>
  <div class="floresta-view" style="position: relative;">
    <canvas ref="canvasRef" class="game-canvas"></canvas>

    <!-- HUD Component -->
    <HUD class="hud" />

    <!-- Enter Prompt -->
    <div v-if="showEnterPrompt" class="enter-prompt">
      Pressione <span class="key">E</span> ou <span class="key">ESPAÇO</span> para atacar
    </div>

    <!-- Dialogs -->
    <div v-if="showIntroDialog" class="dialog-box intro-dialog">
      <div class="dialog-content">
        <p v-for="(line, index) in introDialogLines" :key="index" class="dialog-line">
          {{ line }}
        </p>
        <button @click="closeIntroDialog">Iniciar a Jornada</button>
      </div>
    </div>
    <div v-if="showForestDialog" class="dialog-box forest-dialog">
      <div class="dialog-content">
        <p class="dialog-line">{{ forestDialogLine }}</p>
      </div>
    </div>
    <div v-if="showVictoryDialog" class="dialog-box victory-dialog">
      <div class="dialog-content">
        <p v-for="(line, index) in victoryDialogLines" :key="index" class="dialog-line">
          {{ line }}
        </p>
        <button @click="closeVictoryDialog">Continuar</button>
      </div>
    </div>
    <div v-if="showGameOverDialog" class="dialog-box game-over-dialog">
      <div class="dialog-content">
        <p v-for="(line, index) in gameOverDialogLines" :key="index" class="dialog-line">
          {{ line }}
        </p>
        <button @click="restartGame">Tentar Novamente</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useGameState, ITEMS } from '@/stores/gameState.js';
import HUD from '@/components/HUD.vue';

const gameState = useGameState();
const canvasRef = ref(null);
const ctxRef = ref(null);
const showIntroDialog = ref(true);
const showForestDialog = ref(false);
const showVictoryDialog = ref(false);
const showGameOverDialog = ref(false);
const showEnterPrompt = ref(false);

const defeatedEnemiesCount = ref(0);
const totalEnemiesToDefeat = 6;
const enemiesPerWave = 2;
const currentWave = ref(0);
const SPRITE_SCALE = 4;
const attackCooldown = 350; // ms
const staminaRecoveryRate = 10; // per second
let lastAttackTime = 0;

// Player animation and movement variables
const frameTimer = ref(0);
const staminaTimer = ref(0);
const frameWidth = 96;
const frameHeight = 96;
const moving = ref({ jump: false, left: false, right: false });
const isSprinting = ref(false);
const lastDirection = ref('right');
const isAttacking = ref(false);
const isJumping = ref(false);
const jumpVelocity = -15; // Upward velocity for jump
const gravity = 0.8; // Gravity force
const groundY = ref(0); // Will be set in onMounted

// Sprite assets
const backgroundImage = new Image();
backgroundImage.src = '/img/Floresta/floresta-bg.png';
const playerSprite = new Image();
playerSprite.src = '/img/sprites/player/player_sprite.png';

// Player animations
const animations = {
  idle: { row: 3, frames: [7, 1, 2, 3, 4, 5], frameInterval: 150 },
  walk_left: { row: 20.1, frames: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0], frameInterval: 70 },
  walk_right: { row: 5, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 },
  attack_left: { row: 12, frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11], frameInterval: 110 },
  attack_right: { row: 14, frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11], frameInterval: 100 },
};

// Computed player animation
const currentAnimation = computed(() => {
  if (isAttacking.value) {
    return lastDirection.value === 'left' ? 'attack_left' : 'attack_right';
  }
  if (moving.value.left) return 'walk_left';
  if (moving.value.right) return 'walk_right';
  return 'idle';
});

// Player state
const player = {
  x: 100,
  y: 0, // Set in onMounted
  width: 96,
  height: 96,
  frameIndex: 0,
  dy: 0, // Vertical velocity for jumping
};

// Input state
const keys = { e: false, space: false };
const enemies = ref([]);
const lastAttackTimes = new Map();

// Dialog Lines
const introDialogLines = [
  'As brumas da Floresta Sombria envolvem-te, viajante.',
  'Lobos amaldiçoados surgem em ondas, frutos de um feitiço antigo.',
  'Enfrenta ondas de duas feras até derrotar seis ao total.',
  'Toma tua arma e quebra a maldição que assola este lugar!',
];
const forestDialogLines = [
  '🐺 Um lobo surge das sombras, olhos brilhando com fome!',
  '🐺 Garras raspam o chão enquanto o lobo se aproxima!',
  '🐺 O uivo do lobo ecoa, desafiando-te a lutar!',
  '🐺 A fera fareja o ar, pronta para o ataque!',
];
const forestDialogLine = ref(forestDialogLines[0]);
const victoryDialogLines = [
  '✨ A floresta silencia, a maldição foi quebrada!',
  'Os lobos jazem derrotados, e a paz retorna às árvores.',
  'Tua bravura rendeu-te 60 ouros e a gratidão da vila.',
  'Novos desafios aguardam-te além destas matas...',
];
const gameOverDialogLines = [
  '💀 As garras dos lobos prevaleceram, e a escuridão te engoliu.',
  'A floresta não perdoa os incautos, mas tua alma persiste.',
  'Levanta-te, herói, e enfrenta as feras novamente!',
];

// Resize canvas to window size
const resizeCanvas = (canvas) => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  groundY.value = canvas.height - 40 * SPRITE_SCALE - 20 - 100; // Move ground up by 100px
};

// Spawn a wave of enemies
const spawnWave = (canvas) => {
  for (let i = 0; i < enemiesPerWave; i++) {
    let x;
    do {
      x = 500 + Math.random() * 1000;
    } while (Math.abs(x - player.x) < 200);
    enemies.value.push({
      x,
      y: groundY.value+100,
      width: 50,
      height: 40,
      dx: 0,
      name: 'LOBO',
      life: 50,
      maxLife: 50,
    });
  }
  currentWave.value++;
  console.log(`Spawned wave ${currentWave.value} with ${enemies.value.length} wolves`);
};

// Check if current wave is complete
const checkWaveCompletion = (canvas) => {
  if (enemies.value.length === 0 && defeatedEnemiesCount.value < totalEnemiesToDefeat) {
    spawnWave(canvas);
  }
};

// Close intro dialog
const closeIntroDialog = () => {
  showIntroDialog.value = false;
};

// Player attack logic
const attackEnemy = () => {
  const now = Date.now();
  if (now - lastAttackTime < attackCooldown) {
    console.log('Player attack on cooldown:', now - lastAttackTime);
    return;
  }
  if (gameState.player.stamina < 10) {
    console.log('Not enough stamina to attack!');
    return;
  }

  const attack = gameState.playerAttackAction();
  if (!attack.success) {
    console.log('Player attack failed:', attack.message);
    return;
  }

  lastAttackTime = now;
  isAttacking.value = true;
  player.frameIndex = 0;
  gameState.useStamina(10);
  console.log(`Player attacked, stamina reduced to ${gameState.player.stamina}`);

  const playerBox = {
    x: player.x,
    y: player.y,
    width: player.width * SPRITE_SCALE,
    height: player.height * SPRITE_SCALE,
  };

  const enemyIndex = enemies.value.findIndex((enemy) => {
    const enemyBox = {
      x: enemy.x,
      y: enemy.y,
      width: enemy.width * SPRITE_SCALE,
      height: enemy.height * SPRITE_SCALE,
    };
    const distX = (playerBox.x + playerBox.width / 2) - (enemyBox.x + enemyBox.width / 2);
    return Math.abs(distX) < 100;
  });

  if (enemyIndex !== -1) {
    const enemy = enemies.value[enemyIndex];
    const damage = attack.damage || 10;
    console.log(`Player deals ${damage} damage to ${enemy.name}`);
    enemy.life -= damage;
    if (enemy.life <= 0) {
      console.log(`${enemy.name} defeated`);
      enemies.value.splice(enemyIndex, 1);
      defeatedEnemiesCount.value++;
      gameState.addGold(10);
      showForestDialog.value = false;
      showEnterPrompt.value = false;
      checkWaveCompletion(canvasRef.value);
      if (defeatedEnemiesCount.value >= totalEnemiesToDefeat) {
        showVictoryDialog.value = true;
        gameState.addGold(60); // Reward for completing the mission
      }
    }
  }
};

// Use or equip item
const useOrEquipItem = (itemId) => {
  const item = ITEMS[itemId];
  if (!item) return;
  if (item.type === 'Arma' && item.slot === 'weapon') {
    gameState.equipItem(itemId);
  } else if (item.type === 'Consumível' || item.type === 'Consumível Especial') {
    gameState.useItem(itemId);
  }
};

// Close victory dialog
const closeVictoryDialog = () => {
  showVictoryDialog.value = false;
};

// Draw enemies
const drawEnemies = (ctx) => {
  enemies.value.forEach((enemy) => {
    ctx.fillStyle = 'blue';
    ctx.fillRect(enemy.x, enemy.y, enemy.width * SPRITE_SCALE, enemy.height * SPRITE_SCALE);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(enemy.name, enemy.x + (enemy.width * SPRITE_SCALE) / 2, enemy.y - 25);

    const barWidth = enemy.width * SPRITE_SCALE;
    const barHeight = 6;
    const lifeRatio = enemy.life / enemy.maxLife;

    ctx.fillStyle = 'red';
    ctx.fillRect(enemy.x, enemy.y - 20, barWidth, barHeight);

    ctx.fillStyle = 'limegreen';
    ctx.fillRect(enemy.x, enemy.y - 20, barWidth * lifeRatio, barHeight);

    ctx.strokeStyle = 'black';
    ctx.strokeRect(enemy.x, enemy.y - 20, barWidth, barHeight);
  });
};

// Draw player
const drawPlayer = (ctx, now) => {
  const anim = animations[currentAnimation.value];
  if (now - frameTimer.value > anim.frameInterval) {
    frameTimer.value = now;
    player.frameIndex = (player.frameIndex + 1) % anim.frames.length;
    if (isAttacking.value && player.frameIndex === 0) {
      isAttacking.value = false;
    }
  }

  if (playerSprite.complete) {
    ctx.save();
    const isLeftFacing = currentAnimation.value === 'walk_left' || currentAnimation.value === 'attack_left';
    if (isLeftFacing) {
      ctx.scale(-1, 1);
      ctx.drawImage(
        playerSprite,
        anim.frames[player.frameIndex] * frameWidth,
        anim.row * frameHeight,
        frameWidth,
        frameHeight,
        -(player.x + frameWidth * SPRITE_SCALE),
        player.y,
        frameWidth * SPRITE_SCALE,
        frameHeight * SPRITE_SCALE
      );
    } else {
      ctx.drawImage(
        playerSprite,
        anim.frames[player.frameIndex] * frameWidth,
        anim.row * frameHeight,
        frameWidth,
        frameHeight,
        player.x,
        player.y,
        frameWidth * SPRITE_SCALE,
        frameHeight * SPRITE_SCALE
      );
    }
    ctx.restore();
  } else {
    ctx.fillStyle = 'red';
    ctx.fillRect(player.x, player.y, frameWidth * SPRITE_SCALE, frameHeight * SPRITE_SCALE);
  }
};

// Update player position
const updatePlayer = (canvas, now) => {
  const normalStep = 3;
  const sprintStep = 5;
  let nextPos = { x: player.x, y: player.y };

  if (!(showIntroDialog.value || showVictoryDialog.value || showGameOverDialog.value)) {
    let dx = 0;
    let moved = false;
    const step = isSprinting.value ? sprintStep : normalStep;
    const staminaCost = isSprinting.value ? 2 : 1;

    if (moving.value.left && gameState.player.stamina >= staminaCost) {
      dx -= step;
      lastDirection.value = 'left';
      moved = true;
    }
    if (moving.value.right && gameState.player.stamina >= staminaCost) {
      dx += step;
      lastDirection.value = 'right';
      moved = true;
    }

    if (moved) {
      const magnitude = Math.abs(dx);
      if (magnitude > 0) {
        dx = (dx / magnitude) * step;
      }
      nextPos.x += dx;
      // Confine player to canvas horizontally
      if (nextPos.x >= 0 && nextPos.x <= canvas.width - frameWidth * SPRITE_SCALE) {
        player.x = nextPos.x;
      }
    }

    // Handle jumping
    if (moving.value.jump && !isJumping.value && gameState.player.stamina >= 10) {
      isJumping.value = true;
      player.dy = jumpVelocity;
      gameState.useStamina(10);
      console.log('Player jumped, stamina reduced to', gameState.player.stamina);
    }

    if (isJumping.value) {
      player.dy += gravity;
      nextPos.y += player.dy;
      if (nextPos.y >= groundY.value) {
        nextPos.y = groundY.value;
        player.dy = 0;
        isJumping.value = false;
      }
      player.y = nextPos.y;
    }
  }

  // Stamina recovery
  if (now - staminaTimer.value >= 1000 && gameState.player.stamina < gameState.player.maxStamina) {
    gameState.recoverStamina(staminaRecoveryRate);
    staminaTimer.value = now;
  }
};

// Check enemy proximity for dialogs
const checkProximity = () => {
  if (showIntroDialog.value) {
    showForestDialog.value = false;
    showEnterPrompt.value = false;
    return;
  }

  const playerCenterX = player.x + (frameWidth * SPRITE_SCALE) / 2;
  const nearEnemy = enemies.value.some((enemy) => {
    const enemyCenterX = enemy.x + (enemy.width * SPRITE_SCALE) / 2;
    return Math.abs(playerCenterX - enemyCenterX) < 100;
  });

  if (nearEnemy && !showForestDialog.value) {
    forestDialogLine.value = forestDialogLines[Math.floor(Math.random() * forestDialogLines.length)];
  }

  showForestDialog.value = nearEnemy;
  showEnterPrompt.value = nearEnemy;
};

// Enemy movement and attack logic
const enemyLogic = (canvas, now) => {
  if (gameState.player.lives <= 0) return;
  const playerCenterX = player.x + (frameWidth * SPRITE_SCALE) / 2;

  enemies.value.forEach((enemy) => {
    const enemyCenterX = enemy.x + (enemy.width * SPRITE_SCALE) / 2;
    const distX = enemyCenterX - playerCenterX;
    const distance = Math.abs(distX);

    // Detection range: 600px
    if (distance < 600) {
      // Attack range: 50px
      if (distance < 50 && enemy.y >= groundY.value - 10) {
        const lastAttack = lastAttackTimes.get(enemy) || 0;
        if (now - lastAttack > 2000) {
          console.log(`${enemy.name} attacks player for 10 damage`);
          gameState.takeDamage(10);
          lastAttackTimes.set(enemy, now);
          if (gameState.player.health <= 0) {
            showGameOverDialog.value = true;
          }
        }
      } else {
        // Move toward player
        enemy.dx = distX > 0 ? -3 : 3;
        const nextX = enemy.x + enemy.dx;
        // Confine enemy to canvas
        if (nextX >= 0 && nextX <= canvas.width - enemy.width * SPRITE_SCALE) {
          enemy.x = nextX;
        }
      }
    } else {
      enemy.dx = 0;
    }
  });
};

// Restart game
const restartGame = () => {
  gameState.resetGame();
  player.x = 100;
  player.y = groundY.value;
  player.frameIndex = 0;
  player.dy = 0;
  isJumping.value = false;
  defeatedEnemiesCount.value = 0;
  currentWave.value = 0;
  showGameOverDialog.value = false;
  enemies.value = [];
  spawnWave(canvasRef.value);
};

onMounted(() => {
  // Initialize player stats
  gameState.player.health = gameState.player.maxHealth || 100;
  gameState.player.stamina = gameState.player.maxStamina || 100;
  gameState.player.lives = gameState.player.lives || 3;
  console.log('Initial state:', gameState.player);

  const canvas = canvasRef.value;
  ctxRef.value = canvas.getContext('2d');
  if (!ctxRef.value) {
    console.error('Failed to get 2D context');
    return;
  }
  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));

  const startGame = () => {
    player.y = groundY.value;
    spawnWave(canvas);
    frameTimer.value = performance.now();
    staminaTimer.value = performance.now();
    loop();
  };

  // Wait for images to load
  let imagesLoaded = 0;
  const totalImages = 2;
  const onImageLoad = () => {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
      startGame();
    }
  };

  [backgroundImage, playerSprite].forEach((img) => {
    img.onload = onImageLoad;
    if (img.complete) onImageLoad();
  });

  const clear = () => {
    ctxRef.value.clearRect(0, 0, canvas.width, canvas.height);
  };

  const drawBackground = () => {
    if (backgroundImage.complete) {
      ctxRef.value.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
  };

  let animationFrameId = null;
  const loop = (timestamp) => {
    if (showIntroDialog.value || showVictoryDialog.value || showGameOverDialog.value) {
      frameTimer.value = timestamp;
      staminaTimer.value = timestamp;
      animationFrameId = requestAnimationFrame(loop);
      return;
    }
    clear();
    drawBackground();
    updatePlayer(canvas, timestamp);
    drawPlayer(ctxRef.value, timestamp);
    drawEnemies(ctxRef.value);
    checkProximity();
    enemyLogic(canvas, timestamp);
    animationFrameId = requestAnimationFrame(loop);
  };

  window.addEventListener('keydown', (e) => {
    if (gameState.player.lives <= 0) return;
    const key = e.key.toLowerCase();
    if (key === 'w') moving.value.jump = true;
    if (key === 'a') moving.value.left = true;
    if (key === 'd') moving.value.right = true;
    if (key === 'shift') isSprinting.value = true;
    if (key === 'e' || e.code === 'Space') {
      keys.e = key === 'e';
      keys.space = e.code === 'Space';
      if (showEnterPrompt.value || showForestDialog.value) {
        attackEnemy();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') moving.value.jump = false;
    if (key === 'a') moving.value.left = false;
    if (key === 'd') moving.value.right = false;
    if (key === 'shift') isSprinting.value = false;
    if (key === 'e') keys.e = false;
    if (e.code === 'Space') keys.space = false;
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', () => resizeCanvas(canvasRef.value));
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');

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

.hud {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 10px;
  border-radius: 6px;
}

.enter-prompt {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 10, 10, 0.7);
  padding: 8px 14px;
  border-radius: 6px;
  color: #f0d0a0;
  font-weight: 600;
  font-size: 18px;
  font-family: 'MedievalSharp', cursive;
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

.dialog-box {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.dialog-content {
  background: rgba(26, 47, 26, 0.95);
  border: 4px solid #4a2f1a;
  padding: 20px;
  max-width: 600px;
  max-height: 60vh;
  text-align: center;
  color: #f0d0a0;
  font-family: 'MedievalSharp', cursive;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  overflow-y: auto;
}

.dialog-line {
  line-height: 1.6;
  margin-bottom: 10px;
}

.dialog-content button {
  background: linear-gradient(to bottom, #3b5e3b, #2a3f2a);
  border: 3px solid #4a2f1a;
  color: #f0d0a0;
  padding: 8px 16px;
  font-size: 16px;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'MedievalSharp', cursive;
  text-shadow: 1px 1px 2px #000;
  box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.1), 2px 2px 6px rgba(0, 0, 0, 0.5);
  transition: filter 0.2s, transform 0.1s;
}

.dialog-content button:hover {
  filter: brightness(1.2);
  background: linear-gradient(to bottom, #4a7e4a, #3a5e3b);
}

.dialog-content button:active {
  transform: scale(0.97);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.6);
}
</style>