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
        <p v-for="(line, index) in currentDialogText" :key="index" class="dialog-line">
          {{ line }}
        </p>
        <button v-if="isTypingComplete" @click="closeIntroDialog">Iniciar a Jornada</button>
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

    <!-- Audio Elements -->
    <audio ref="bgAudio" loop>
      <source src="/audio/albadia_noite.wav" type="audio/wav" />
    </audio>
    <audio ref="playerAttackAudio">
      <source src="/sounds/hit_sound.mp3" type="audio/mp3" />
    </audio>
    <audio ref="enemyAttackAudio">
      <source src="/sounds/hit_rat.mp3" type="audio/mp3" />
    </audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useGameState, ITEMS } from '@/stores/gameState.js';
import HUD from '@/components/HUD.vue';

const gameState = useGameState();
const router = useRouter();
const canvasRef = ref(null);
const ctxRef = ref(null);
const bgAudio = ref(null);
const playerAttackAudio = ref(null);
const enemyAttackAudio = ref(null);
const typewriterAudio = ref(null);
const victoryAudio = ref(null);
const gameOverAudio = ref(null);
const promptAudio = ref(null);
const showIntroDialog = ref(true);
const showForestDialog = ref(false);
const showVictoryDialog = ref(false);
const showGameOverDialog = ref(false);
const showEnterPrompt = ref(false);

const defeatedEnemiesCount = ref(0);
const totalEnemiesToDefeat = 6;
const enemiesPerWave = 2;
const currentWave = ref(0);
const SPRITE_SCALE = 5;
const attackCooldown = 1000;
const staminaRecoveryRate = 20;
let lastAttackTime = 0;

const frameTimer = ref(0);
const staminaTimer = ref(0);
const frameWidth = 96;
const frameHeight = 96;
const moving = ref({ jump: false, left: false, right: false });
const isSprinting = ref(false);
const lastDirection = ref('right');
const isAttacking = ref(false);
const isJumping = ref(false);
const jumpVelocity = -25;
const gravity = 1;
const groundY = ref(0);

const keys = ref({ e: false, space: false });
const currentDialogText = ref([]);
const currentLineIndex = ref(0);
const currentCharIndex = ref(0);
const isTypingComplete = ref(false);
let typingInterval = null;
let animationFrameId = null;

const backgroundImage = new Image();
backgroundImage.src = '/img/Floresta/floresta-bg.png';
const playerSprite = new Image();
playerSprite.src = '/img/sprites/player/player_sprite.png';

const enemyImages = {
  idle: new Image(),
  run: new Image(),
  attack: new Image()
};
enemyImages.idle.src = '/img/sprites/rat/rat-idle.png';
enemyImages.run.src = '/img/sprites/rat/rat-run.png';
enemyImages.attack.src = '/img/sprites/rat/rat-attack.png';

const animations = {
  idle: { row: 2, frames: [7, 1, 2, 3, 4, 5], frameInterval: 150 },
  walk_left: { row: 5, frames: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0], frameInterval: 70 },
  walk_right: { row: 5, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 },
  attack_left: { row: 14, frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11], frameInterval: 110 },
  attack_right: { row: 14, frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11], frameInterval: 100 },
};

const enemyAnimations = {
  idle: { frames: [0, 1, 2, 3], frameInterval: 200, sprite: enemyImages.idle, frameWidth: 32, frameHeight: 32, scale: 2 },
  walk_left: { frames: [0, 1, 2, 3, 4], frameInterval: 100, sprite: enemyImages.run, frameWidth: 32, frameHeight: 32, scale: 2 },
  walk_right: { frames: [0, 1, 2, 3, 4], frameInterval: 100, sprite: enemyImages.run, frameWidth: 32, frameHeight: 32, scale: 2 },
  attack: { frames: [0, 1, 2, 3], frameInterval: 100, sprite: enemyImages.attack, frameWidth: 32, frameHeight: 32, scale: 2 }
};

const currentAnimation = computed(() => {
  if (isAttacking.value) {
    return lastDirection.value === 'left' ? 'attack_left' : 'attack_right';
  }
  if (moving.value.left) return 'walk_left';
  if (moving.value.right) return 'walk_right';
  return 'idle';
});

const player = {
  x: 80,
  y: 0,
  width: 96,
  height: 96,
  frameIndex: 0,
  dy: 0,
};

const enemies = ref([]);
const lastAttackTimes = new Map();

const introDialogLines = [
  'Floresta Escura',
];
const forestDialogLines = [
  'Um Rato guincha nas sombras... cuidado!',
  'A fera te encara com olhos famintos!',
  'Prepare sua arma, herói!',
];
const forestDialogLine = ref('');
const victoryDialogLines = [
  '✨ A floresta silencia, a maldição foi quebrada!',
  'Os Ratos jazem derrotados, e a paz retorna às árvores.',
  'Novos desafios aguardam-te além destas matas...',
];
const gameOverDialogLines = [
  '💀 As garras dos Ratos prevaleceram, e a escuridão te engoliu.',
  'A floresta não perdoa os incautos, mas tua alma persiste.',
  'Levanta-te, herói, e enfrenta as feras novamente!',
];

// Função para garantir o AudioContext
const ensureAudioContext = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    const context = new AudioContext();
    if (context.state === 'suspended') {
      return context.resume().then(() => {
        console.log('AudioContext resumed');
      }).catch(error => console.error('Erro ao retomar AudioContext:', error));
    }
  }
  return Promise.resolve();
};

// Pré-carregar áudios
const preloadAudio = (audioRef, src) => {
  if (audioRef.value) {
    audioRef.value.src = src;
    audioRef.value.load();
    audioRef.value.onerror = () => console.error(`Erro ao carregar áudio: ${src}`);
  }
};

// Tocar som
const playSound = (audioRef, volume = 1.0, loop = false) => {
  if (audioRef.value) {
    ensureAudioContext().then(() => {
      audioRef.value.currentTime = 0;
      audioRef.value.volume = volume;
      audioRef.value.loop = loop;
      audioRef.value.play().catch(error => console.error(`Erro ao reproduzir áudio ${audioRef.value.src}:`, error));
    });
  }
};

// Parar som
const stopSound = (audioRef) => {
  if (audioRef.value) {
    audioRef.value.pause();
    audioRef.value.currentTime = 0;
  }
};

// Tocar música de fundo
const playBackgroundMusic = () => {
  playSound(bgAudio, 0.3, true);
};

// Parar música de fundo
const stopBackgroundMusic = () => {
  stopSound(bgAudio);
};

// Iniciar efeito de digitação
const startTypingEffect = () => {
  currentDialogText.value = introDialogLines.map(() => '');
  currentLineIndex.value = 0;
  currentCharIndex.value = 0;
  isTypingComplete.value = false;

  playSound(typewriterAudio, 0.5, true);
  typingInterval = setInterval(() => {
    if (currentLineIndex.value >= introDialogLines.length) {
      clearInterval(typingInterval);
      isTypingComplete.value = true;
      stopSound(typewriterAudio);
      return;
    }

    const currentLine = introDialogLines[currentLineIndex.value];
    if (currentCharIndex.value < currentLine.length) {
      currentDialogText.value[currentLineIndex.value] = currentLine.slice(0, currentCharIndex.value + 1);
      currentCharIndex.value++;
    } else {
      setTimeout(() => {
        currentLineIndex.value++;
        currentCharIndex.value = 0;
      }, 500);
    }
    currentDialogText.value = [...currentDialogText.value];
  }, 50);
};

// Fechar diálogo inicial
const closeIntroDialog = () => {
  clearInterval(typingInterval);
  stopSound(typewriterAudio);
  showIntroDialog.value = false;
  playBackgroundMusic();
};

// Redimensionar canvas
const resizeCanvas = (canvas) => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  groundY.value = canvas.height - 64 * SPRITE_SCALE - 20 - 100;
};

// Gerar onda de inimigos
const spawnWave = (canvas) => {
  for (let i = 0; i < enemiesPerWave; i++) {
    let x;
    do {
      x = 500 + Math.random() * 1000;
    } while (Math.abs(x - player.x) < 200);
    enemies.value.push({
      x,
      y: groundY.value + 96,
      width: 64,
      height: 60,
      dx: 0,
      name: 'Lobo',
      life: 50,
      maxLife: 50,
      frameIndex: 0,
      frameTimer: performance.now(),
      currentAnimation: 'idle',
      isAttacking: false,
    });
  }
  currentWave.value++;
  console.log(`Spawned wave ${currentWave.value} with ${enemies.value.length} rats`);
};

// Verificar conclusão da onda
const checkWaveCompletion = (canvas) => {
  if (enemies.value.length === 0 && defeatedEnemiesCount.value < totalEnemiesToDefeat) {
    spawnWave(canvas);
  }
};

// Lógica de ataque do jogador
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
  playSound(playerAttackAudio, 0.6);
  console.log(`Player attacked, stamina reduced to ${gameState.player.stamina}`);

  const playerBox = {
    x: player.x,
    y: player.y,
    width: player.width * SPRITE_SCALE,
    height: player.height * SPRITE_SCALE,
  };

  let closestEnemyIndex = -1;
  let minDistance = Infinity;
  enemies.value.forEach((enemy, index) => {
    const enemyBox = {
      x: enemy.x,
      y: enemy.y,
      width: enemy.width * SPRITE_SCALE,
      height: enemy.height * SPRITE_SCALE,
    };
    const distX = (playerBox.x + playerBox.width / 2) - (enemyBox.x + enemyBox.width / 2);
    const distance = Math.abs(distX);
    if (distance < minDistance) {
      minDistance = distance;
      closestEnemyIndex = index;
    }
  });

  if (closestEnemyIndex !== -1) {
    const enemy = enemies.value[closestEnemyIndex];
    const damage = attack.damage || 10;
    console.log(`Player deals ${damage} damage to ${enemy.name}`);
    enemy.life -= damage;
    if (enemy.life <= 0) {
      console.log(`${enemy.name} defeated`);
      enemies.value.splice(closestEnemyIndex, 1);
      defeatedEnemiesCount.value++;
      gameState.addGold(10);
      showForestDialog.value = false;
      showEnterPrompt.value = false;
      stopSound(promptAudio);
      checkWaveCompletion(canvasRef.value);
      if (defeatedEnemiesCount.value >= totalEnemiesToDefeat) {
        showVictoryDialog.value = true;
        stopBackgroundMusic();
        playSound(victoryAudio, 0.8);
        gameState.addGold(60);
      }
    }
  }
};

// Usar ou equipar item
const useOrEquipItem = (itemId) => {
  const item = постараются[itemId];
  if (!item) return;
  if (item.type === 'Arma' && item.slot === 'weapon') {
    gameState.equipItem(itemId);
  } else if (item.type === 'Consumível' || item.type === 'Consumível Especial') {
    gameState.useItem(itemId);
  }
};

// Fechar diálogo de vitória
const closeVictoryDialog = () => {
  showVictoryDialog.value = false;
  stopSound(victoryAudio);
  router.push('/level/albadia');
};

// Desenhar inimigos
const drawEnemies = (ctx) => {
  enemies.value.forEach((enemy) => {
    const anim = enemyAnimations[enemy.currentAnimation];
    const frameX = anim.frames[enemy.frameIndex] * anim.frameWidth;
    if (anim.sprite.complete) {
      ctx.save();
      const isLeftFacing = enemy.currentAnimation === 'walk_left';
      const scaledWidth = enemy.width * SPRITE_SCALE;
      const scaledHeight = enemy.height * SPRITE_SCALE;
      if (isLeftFacing) {
        ctx.scale(-1, 1);
        ctx.drawImage(
          anim.sprite,
          frameX,
          0,
          anim.frameWidth,
          anim.frameHeight,
          -(enemy.x + scaledWidth),
          enemy.y,
          scaledWidth,
          scaledHeight
        );
      } else {
        ctx.drawImage(
          anim.sprite,
          frameX,
          0,
          anim.frameWidth,
          anim.frameHeight,
          enemy.x,
          enemy.y,
          scaledWidth,
          scaledHeight
        );
      }
      ctx.restore();
    } else {
      ctx.fillStyle = 'blue';
      ctx.fillRect(enemy.x, enemy.y, enemy.width * SPRITE_SCALE, enemy.height * SPRITE_SCALE);
    }

    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(enemy.name, enemy.x + (enemy.width * SPRITE_SCALE) / 2, enemy.y - 30);

    const barWidth = enemy.width * SPRITE_SCALE;
    const barHeight = 8;
    const lifeRatio = enemy.life / enemy.maxLife;

    ctx.fillStyle = 'red';
    ctx.fillRect(enemy.x, enemy.y - 25, barWidth, barHeight);

    ctx.fillStyle = 'limegreen';
    ctx.fillRect(enemy.x, enemy.y - 25, barWidth * lifeRatio, barHeight);

    ctx.strokeStyle = 'black';
    ctx.strokeRect(enemy.x, enemy.y - 25, barWidth, barHeight);
  });
};

// Desenhar jogador
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

// Atualizar posição do jogador
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
      if (nextPos.x >= 0 && nextPos.x <= canvas.width - frameWidth * SPRITE_SCALE) {
        player.x = nextPos.x;
      }
    }

    player.y = groundY.value + 96;
  }

  if (now - staminaTimer.value >= 1000 && gameState.player.stamina < gameState.player.maxStamina) {
    gameState.recoverStamina(staminaRecoveryRate);
    staminaTimer.value = now;
  }
};

// Verificar proximidade para diálogos
const checkProximity = () => {
  if (showIntroDialog.value || showVictoryDialog.value || showGameOverDialog.value) {
    showForestDialog.value = false;
    showEnterPrompt.value = false;
    stopSound(promptAudio);
    return;
  }

  const playerCenterX = player.x + (frameWidth * SPRITE_SCALE) / 2;
  const nearEnemy = enemies.value.some((enemy) => {
    const enemyCenterX = enemy.x + (enemy.width * SPRITE_SCALE) / 2;
    return Math.abs(playerCenterX - enemyCenterX) < 150;
  });

  if (nearEnemy && !showForestDialog.value) {
    forestDialogLine.value = forestDialogLines[Math.floor(Math.random() * forestDialogLines.length)];
    playSound(promptAudio, 0.5);
  }

  showForestDialog.value = nearEnemy;
  showEnterPrompt.value = nearEnemy;
};

// Lógica de movimento e ataque dos inimigos
const enemyLogic = (canvas, now) => {
  if (gameState.player.lives <= 0) {
    showGameOverDialog.value = true;
    stopBackgroundMusic();
    playSound(gameOverAudio, 0.8);
    return;
  }
  const playerCenterX = player.x + (frameWidth * SPRITE_SCALE) / 2;

  enemies.value.forEach((enemy) => {
    const enemyCenterX = enemy.x + (enemy.width * SPRITE_SCALE) / 2;
    const distX = enemyCenterX - playerCenterX;
    const distance = Math.abs(distX);

    if (now - enemy.frameTimer > enemyAnimations[enemy.currentAnimation].frameInterval) {
      enemy.frameTimer = now;
      enemy.frameIndex = (enemy.frameIndex + 1) % enemyAnimations[enemy.currentAnimation].frames.length;
      if (enemy.isAttacking && enemy.frameIndex === 0) {
        enemy.isAttacking = false;
        enemy.currentAnimation = 'idle';
      }
    }

    if (distance < 600) {
      if (distance < 80 && enemy.y >= groundY.value - 10) {
        const lastAttack = lastAttackTimes.get(enemy) || 0;
        if (now - lastAttack > 2000) {
          console.log(`${enemy.name} attacks player for 10 damage`);
          enemy.currentAnimation = 'attack';
          enemy.frameIndex = 0;
          enemy.isAttacking = true;
          playSound(enemyAttackAudio, 0.6);
          gameState.takeDamage(10);
          lastAttackTimes.set(enemy, now);
          if (gameState.player.health <= 0) {
            showGameOverDialog.value = true;
            stopBackgroundMusic();
            playSound(gameOverAudio, 0.8);
          }
        }
      } else {
        enemy.dx = distX > 0 ? -3 : 3;
        enemy.currentAnimation = distX > 0 ? 'walk_left' : 'walk_right';
        const nextX = enemy.x + enemy.dx;
        if (nextX >= 0 && nextX <= canvas.width - enemy.width * SPRITE_SCALE) {
          enemy.x = nextX;
        }
      }
    } else {
      enemy.dx = 0;
      enemy.currentAnimation = 'idle';
    }
  });
};

// Reiniciar jogo
const restartGame = () => {
  if (gameState.player.lives <= 0) {
    stopSound(gameOverAudio);
    router.push('/gameOver');
  } else {
    gameState.resetGame();
    player.x = 80;
    player.y = groundY.value + 96;
    player.frameIndex = 0;
    player.dy = 0;
    isJumping.value = false;
    defeatedEnemiesCount.value = 0;
    currentWave.value = 0;
    showGameOverDialog.value = false;
    showForestDialog.value = false;
    showEnterPrompt.value = false;
    enemies.value = [];
    lastAttackTimes.clear();
    stopSound(gameOverAudio);
    playBackgroundMusic();
    spawnWave(canvasRef.value);
  }
};

onMounted(() => {
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

  const handleResize = () => resizeCanvas(canvas);
  window.addEventListener('resize', handleResize);

  // Pré-carregar áudios
  preloadAudio(bgAudio, '/audio/albadia_noite.wav');
  preloadAudio(playerAttackAudio, '/sounds/hit_sound.mp3');
  preloadAudio(enemyAttackAudio, '/sounds/hit_rat.mp3');
  startTypingEffect();

  const startGame = () => {
    try {
      player.y = groundY.value + 96;
      spawnWave(canvas);
      frameTimer.value = performance.now();
      staminaTimer.value = performance.now();
      loop();
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  let imagesLoaded = 0;
  const totalImages = 5;
  const onImageLoad = () => {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
      startGame();
    }
  };

  [backgroundImage, playerSprite, enemyImages.idle, enemyImages.run, enemyImages.attack].forEach((img) => {
    img.onload = onImageLoad;
    if (img.complete) onImageLoad();
    img.onerror = () => console.error(`Failed to load image: ${img.src}`);
  });

  const clear = () => {
    ctxRef.value.clearRect(0, 0, canvas.width, canvas.height);
  };

  const drawBackground = () => {
    if (backgroundImage.complete) {
      ctxRef.value.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
  };

  const loop = (timestamp) => {
    try {
      if (showIntroDialog.value || showVictoryDialog.value || showGameOverDialog.value) {
        frameTimer.value = timestamp;
        staminaTimer.value = timestamp;
        animationFrameId = requestAnimationFrame(loop);
        return;
      }
      clear();
      drawBackground();
      drawEnemies(ctxRef.value);
      updatePlayer(canvas, timestamp);
      drawPlayer(ctxRef.value, timestamp);
      checkProximity();
      enemyLogic(canvas, timestamp);
      animationFrameId = requestAnimationFrame(loop);
    } catch (error) {
      console.error('Error in game loop:', error);
    }
  };

  const handleKeydown = (e) => {
    if (gameState.player.lives <= 0) return;
    const key = e.key.toLowerCase();
    if (key === 'a') moving.value.left = true;
    if (key === 'd') moving.value.right = true;
    if (key === 'shift') isSprinting.value = true;
    if (key === 'e' || e.code === 'Space') {
      keys.value.e = key === 'e';
      keys.value.space = e.code === 'Space';
      attackEnemy();
    }
  };

  const handleKeyup = (e) => {
    const key = e.key.toLowerCase();
    if (key === 'a') moving.value.left = false;
    if (key === 'd') moving.value.right = false;
    if (key === 'shift') isSprinting.value = false;
    if (key === 'e') keys.value.e = false;
    if (e.code === 'Space') keys.value.space = false;
  };

  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('keyup', handleKeyup);

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('keyup', handleKeyup);
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    clearInterval(typingInterval);
    stopBackgroundMusic();
    stopSound(playerAttackAudio);
    stopSound(enemyAttackAudio);
    stopSound(typewriterAudio);
    stopSound(victoryAudio);
    stopSound(gameOverAudio);
    stopSound(promptAudio);
    enemies.value = [];
    lastAttackTimes.clear();
    defeatedEnemiesCount.value = 0;
    currentWave.value = 0;
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
  background-color: rgba(10, 10, 10, 0.7);
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
  background: rgba(26, 47, 7, 0.95);
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
  text-shadow: 1px 1px 2px;
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