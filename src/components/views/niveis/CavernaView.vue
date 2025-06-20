<template>
  <div class="caverna-view" :style="showCutscene ? cutsceneBackgroundStyle : backgroundStyle">
    <!-- Heat Overlay -->
    <div v-if="showHeatEffect" class="heat-overlay"></div>

    <!-- Cutscene -->
    <div v-if="showCutscene" class="cutscene-container" tabindex="0" @click="advanceCutscene" @keydown="advanceCutscene">
      <div class="cutscene-content">
        <div v-for="(line, index) in cutsceneLines" :key="index" class="cutscene-line" :class="{ visible: index < currentCutsceneLine }">
          <span class="typewriter">{{ displayedLines[index] || '' }}</span>
        </div>
        <div
          v-if="currentCutsceneLine >= cutsceneLines.length"
          class="cutscene-arrow"
          @click.stop="endCutscene"
          role="button"
          aria-label="Avançar para a interação"
        >
          ➤
        </div>
      </div>
    </div>

    <!-- HUD -->
    <div v-if="inBattle && !showCutscene" class="main-hud">
      <div class="panel-frame">
        <div class="stat vida" aria-label="Vida do jogador">
          <div class="icon-container" aria-hidden="true">
            <img src="/icons/life-icon.png" alt="" class="icon" />
            <span class="lives-overlay">{{ gameState.player.lives }}</span>
          </div>
          <div class="bar-container segmented" role="progressbar" :aria-valuenow="gameState.player.health" :aria-valuemax="gameState.player.maxHealth" aria-label="Barra de vida">
            <div
              v-for="i in maxBarSegments"
              :key="`vida-${i}`"
              class="segment"
              :class="{ filled: i <= filledHealthSegments }"
            ></div>
            <span class="bar-label">
              {{ Math.floor(gameState.player.health) }}/{{ Math.floor(gameState.player.maxHealth) }}
            </span>
          </div>
        </div>
        <div class="stat energia" aria-label="Energia do jogador">
          <div class="icon-container" aria-hidden="true">
            <img src="/icons/stam-icon.png" alt="" class="icon" />
          </div>
          <div class="bar-container segmented" role="progressbar" :aria-valuenow="gameState.player.stamina" :aria-valuemax="gameState.player.maxStamina" aria-label="Barra de energia">
            <div
              v-for="i in maxBarSegments"
              :key="`energia-${i}`"
              class="segment"
              :class="{ filled: i <= filledStaminaSegments }"
            ></div>
            <span class="bar-label">
              {{ Math.floor(gameState.player.stamina) }}/{{ Math.floor(gameState.player.maxStamina) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area">
      <!-- Interactions -->
      <div v-if="!bossDefeated && !inBattle && !showCutscene" class="interactions">
        <p>O calor sufocante da caverna queima sua pele.</p>
        <p><strong>Inimigo Final:</strong> O Dragão de Fogo aguarda nas profundezas.</p>
        <div class="interaction-buttons">
          <button @click="confrontBoss">Enfrentar o Dragão de Fogo</button>
          <button @click="fleeArea">Fugir</button>
        </div>
      </div>

      <!-- Battle System -->
      <div v-if="inBattle && !showCutscene" class="medieval-battle-container">
        <div class="battle-arena">
          <div class="game-status-top">
            <div v-if="!gameOver && !victory">{{ battleStatus }}</div>
            <div v-if="victory" class="victory-message">✨ Triunfo! Dragão de Fogo caiu! ✨</div>
            <div v-if="gameOver" class="game-over-message">💀 Derrota! As chamas prevaleceram... 💀</div>
          </div>

          <!-- Player -->
          <div
            class="unit player-character"
            :class="{ 'is-attacking': playerAttacking, 'is-damaged': damagedPlayer }"
            :style="{
              top: `${playerCharacter.top}px`,
              left: `${playerCharacter.left}px`,
              backgroundImage: `url(${playerSprite})`,
              backgroundPosition: `-${animations[currentAnimation].frames[currentFrame] * frameWidth}px -${animations[currentAnimation].row * frameHeight}px`,
              width: `${frameWidth}px`,
              height: `${frameHeight}px`
            }"
          ></div>
          <div class="character-info player-info">
            <span class="character-name">{{ gameState.player.name || 'Herói' }} ({{ weaponName }})</span>
          </div>

          <!-- Enemy -->
          <div v-for="(enemy, index) in activeEnemies" :key="`enemy-${index}`">
            <div class="character-info enemy-info" :style="enemyInfoStyle(index)">
              <span class="character-name">{{ enemy.name }}</span>
              <div class="resource-bar-container">
                <div class="hp-bar-label">Vida:</div>
                <div class="hp-bar enemy-hp-bar">
                  <div class="hp enemy-hp" :style="{ width: `${enemy.hpPercent}%` }"></div>
                </div>
                <span class="resource-value">{{ enemy.currentHp }}/{{ enemy.maxHp }}</span>
              </div>
            </div>
            <div
              class="unit enemy-character dragao-fogo"
              :class="{ 'is-attacking': enemyAttacking === index, 'is-damaged': damagedEnemy === index, fainted: enemy.hpPercent <= 0 }"
              :style="enemyStyle(index, enemy)"
            >
              <img :src="enemySprites[enemy.name]" alt="Enemy" class="character-sprite" />
            </div>
          </div>

          <!-- Damage Popup -->
          <div
            v-if="damagePopup.active"
            class="damage-popup"
            :class="damagePopup.type"
            :style="{ top: `${damagePopup.top}px`, left: `${damagePopup.left}px` }"
          >
            {{ damagePopup.prefix }}{{ damagePopup.value }}
          </div>

          <!-- Attack Effect -->
          <div v-if="attackEffect.active" class="attack-effect" :style="attackEffect.style">
            <img :src="attackEffect.sprite" alt="Attack Effect" class="effect-sprite" />
          </div>

          <!-- Projectile Effect -->
          <div v-if="projectile.active" class="projectile-effect" :style="projectile.style"></div>
        </div>

        <!-- Battle Log and Actions -->
        <div class="battle-log-container">
          <div class="battle-log">
            <p v-for="(message, index) in battleLog" :key="index" v-html="message"></p>
          </div>
          <div class="actions" v-if="isPlayerTurn && !isAttacking && !gameOver && !victory">
            <button class="action-btn attack-btn" @click="attackEnemy" :disabled="activeEnemies.length === 0 || gameState.player.stamina < 10">
              Atacar
            </button>
            <button class="action-btn potion-btn" @click="usePotion" :disabled="!canUsePotion || gameState.player.stamina < 5">
              Poção ({{ potionCount }})
            </button>
          </div>
          <div class="actions-placeholder" v-else>
            Dragão de Fogo prepara um ataque...
          </div>
        </div>
      </div>

      <!-- Feedback Box -->
      <div v-if="showFeedback && !showCutscene" class="dialog-box feedback-box">
        <p>{{ feedbackMessage }}</p>
        <button @click="showFeedback = false">Ok</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameState, ITEMS } from '@/stores/gameState.js';
import { playAudio } from '@/utils/audioManager.js';

// Import assets
import caveImage1 from '@/assets/backviews/caverna-entrada.png';
import caveImage2 from '@/assets/backviews/caverna-confronto.png';
import caveBattleImage from '@/assets/backviews/caverna-cenario.png';
import dragonFireSprite from '@/assets/sprites/dragao-fogo.png';
import attackEffectSpritePlayer from '@/assets/sprites/ataque-efeito.png';
import attackEffectSpriteDragon from '@/assets/sprites/ataque-dragao.png';

// Player Sprite Sheet
const playerSprite = new URL('/img/sprites/player/player_sprite.png', import.meta.url).href;

// Animation Variables
const currentFrame = ref(0);
const frameTimer = ref(0);
const frameWidth = 96;
const frameHeight = 96;
const animations = {
  idle: { row: 2, frames: [0, 1, 2, 3, 4, 5, 6, 7], frameInterval: 150 },
  attack_right: {
    row: 14,
    frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11],
    frameInterval: 100
  }
};
const currentAnimation = computed(() => playerAttacking.value ? 'attack_right' : 'idle');
let animationFrameId = null;

const router = useRouter();
const gameState = useGameState();
const battleMusic = new Audio('/audio/musica-combate.mp3');
battleMusic.loop = true;
battleMusic.volume = 0.3;
const backgroundMusic = new Audio(new URL('/sounds/lavafundo.mp3', import.meta.url).href);
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

backgroundMusic.play().catch(error => {
  console.error('Failed to play background music:', error);
});

// Audio Management
const cutsceneMusic = ref(null);
const initializeAudio = () => {
  cutsceneMusic.value = new Audio('/audio/musica-sus.mp3');
  cutsceneMusic.value.loop = true;
  cutsceneMusic.value.volume = 0.3;
  cutsceneMusic.value.preload = 'auto';
};
const stopAllAudio = () => {
  if (cutsceneMusic.value) {
    cutsceneMusic.value.pause();
    cutsceneMusic.value.currentTime = 0;
  }
  if (battleMusic) {
    battleMusic.pause();
    battleMusic.currentTime = 0;
  }
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  }
  playAudio('cave_ambient', { stop: true, volume: 0.3 });
};

// Cutscene State
const showCutscene = ref(true);
const currentCutsceneLine = ref(0);
const cutsceneLines = [
  'A escuridão úmida da caverna engole seus passos, o ar pesado cheira a enxofre.',
  'Gotas d\'água ecoam pelas paredes rochosas, misturadas ao brilho de um rio de lava.',
  'O calor aumenta, e o som de rochas estalando quebra o silêncio opressivo.',
  'A caverna se abre em uma câmara vasta, iluminada por reflexos avermelhados.',
  'No centro, sobre uma ilha de pedra, o Dragão de Fogo observa com olhos flamejantes.',
  'Um rugido ensurdecedor ecoa, e chamas iluminam a caverna. A batalha começa!',
];
const displayedLines = ref(cutsceneLines.map(() => ''));
const cutsceneBackgroundImage = ref(caveImage1);
const isFading = ref(false);
const isCutscenePlaying = ref(false);
const showHeatEffect = ref(false);

// Background Styles
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${inBattle.value ? caveBattleImage : caveImage2})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: isFading.value ? 0 : 1,
  transition: 'opacity 0.5s ease',
}));
const cutsceneBackgroundStyle = computed(() => ({
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${cutsceneBackgroundImage.value})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: isFading.value ? 0 : 1,
  transition: 'opacity 0.5s ease',
}));

// Game State
const showFeedback = ref(false);
const feedbackMessage = ref('');
const bossDefeated = ref(false);
const inBattle = ref(false);

// HUD
const maxBarSegments = 10;
const filledHealthSegments = computed(() =>
  Math.round((gameState.player.health / gameState.player.maxHealth) * maxBarSegments)
);
const filledStaminaSegments = computed(() =>
  Math.round((gameState.player.stamina / gameState.player.maxStamina) * maxBarSegments)
);

// Player Character
const playerCharacter = reactive({
  name: computed(() => gameState.player.name || 'Herói'),
  className: computed(() => gameState.player.classe || 'Guerreiro'),
  top: 300,
  left: 50,
});

// Weapon Properties
const weaponName = computed(() => {
  const weaponId = gameState.player.equipment.weapon;
  return weaponId && ITEMS[weaponId] ? ITEMS[weaponId].name : 'Punhos';
});
const weaponSprite = computed(() => {
  const weaponId = gameState.player.equipment.weapon;
  return weaponId && ITEMS[weaponId]?.icon ? ITEMS[weaponId].icon : null;
});

// Enemy Configuration
const enemiesConfig = [
  {
    name: 'Dragão de Fogo',
    hpPercent: 100,
    currentHp: 200,
    maxHp: 200,
    top: 200,
    left: 'calc(100% - 200px)',
    attackPower: 25,
  },
];
const initialEnemyPositions = enemiesConfig.map(enemy => ({
  top: enemy.top,
  left: enemy.left,
}));
const enemies = reactive(enemiesConfig.map(enemy => ({ ...enemy })));
const enemySprites = { 'Dragão de Fogo': dragonFireSprite };

// Battle State
const damagedEnemy = ref(null);
const damagedPlayer = ref(false);
const playerAttacking = ref(false);
const enemyAttacking = ref(null);
const isPlayerTurn = ref(true);
const isAttacking = ref(false);
const battleLog = ref(['Batalha contra o Dragão de Fogo!']);
const battleStatus = ref('Desfira seu golpe!');
const gameOver = ref(false);
const victory = ref(false);
const damagePopup = reactive({ active: false, value: 0, top: 0, left: 0, type: 'enemy-damage', prefix: '-' });
const attackEffect = reactive({ active: false, style: {}, sprite: null });
const projectile = reactive({ active: false, style: {} });

// Computed Properties
const potionCount = computed(() => gameState.getItemQuantity('potion_health'));
const canUsePotion = computed(() => potionCount.value > 0 && gameState.player.health < gameState.player.maxHealth);
const activeEnemies = computed(() => enemies.filter(enemy => enemy.hpPercent > 0));
const enemyInfoStyle = index => ({
  top: `${initialEnemyPositions[index].top - 90}px`,
  left: `calc(${initialEnemyPositions[index].left} - 120px)`,
});
const enemyStyle = (index, enemy) => ({
  top: `${(enemy.hpPercent > 0 ? enemy.top : initialEnemyPositions[index].top) + 100}px`,
  left: enemy.hpPercent > 0 ? enemy.left : initialEnemyPositions[index].left,
  transform: 'scale(3.5)',
  transformOrigin: 'center center',
});

// Animation Loop
const updateAnimation = (now) => {
  if (!inBattle.value) return;
  const anim = animations[currentAnimation.value];
  if (now - frameTimer.value > anim.frameInterval) {
    frameTimer.value = now;
    currentFrame.value++;
    if (currentFrame.value >= anim.frames.length) {
      currentFrame.value = 0;
      if (playerAttacking.value) {
        playerAttacking.value = false;
      }
    }
  }
  animationFrameId = requestAnimationFrame(updateAnimation);
};

// Utility Functions
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const addLogMessage = message => {
  battleLog.value.push(message);
  if (battleLog.value.length > 5) battleLog.value.shift();
  requestAnimationFrame(() => {
    const logContainer = document.querySelector('.battle-log');
    if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
  });
};

const showPopup = (value, targetElement, type = 'enemy-damage') => {
  try {
    const rect = targetElement.getBoundingClientRect();
    const containerRect = document.querySelector('.battle-arena').getBoundingClientRect();
    damagePopup.active = true;
    damagePopup.value = value;
    damagePopup.top = rect.top - containerRect.top + rect.height / 2 - 20;
    damagePopup.left = rect.left - containerRect.left + rect.width / 2;
    damagePopup.type = type;
    damagePopup.prefix = type === 'hp-heal' ? '+' : '-';
    setTimeout(() => { damagePopup.active = false; }, 800);
  } catch (err) {
    console.warn('Error in showPopup:', err);
  }
};

const showAttackEffect = async (attackerElement, targetElement, isPlayer = true) => {
  try {
    const startRect = attackerElement.getBoundingClientRect();
    const endRect = targetElement.getBoundingClientRect();
    const containerRect = document.querySelector('.battle-arena').getBoundingClientRect();
    const spriteToUse = isPlayer ? attackEffectSpritePlayer : attackEffectSpriteDragon;
    attackEffect.active = true;
    attackEffect.style = {
      top: `${startRect.top - containerRect.top + startRect.height / 2}px`,
      left: `${startRect.left - containerRect.left + startRect.width / 2}px`,
      opacity: 1,
    };
    attackEffect.sprite = spriteToUse;
    await sleep(50);
    attackEffect.style = {
      top: `${endRect.top - containerRect.top + endRect.height / 2}px`,
      left: `${endRect.left - containerRect.left + endRect.width / 2}px`,
      opacity: 0,
      transition: 'top 0.3s ease-out, left 0.3s ease-out, opacity 0.3s ease-out',
    };
    await sleep(300);
    attackEffect.active = false;
    attackEffect.style = {};
    attackEffect.sprite = null;
  } catch (err) {
    console.warn('Error in showAttackEffect:', err);
  }
};

const showProjectile = async (attackerElement, targetElement) => {
  try {
    const startRect = attackerElement.getBoundingClientRect();
    const endRect = targetElement.getBoundingClientRect();
    const containerRect = document.querySelector('.battle-arena').getBoundingClientRect();
    projectile.active = true;
    projectile.style = {
      top: `${startRect.top - containerRect.top + startRect.height / 2}px`,
      left: `${startRect.left - containerRect.left + startRect.width / 2}px`,
      opacity: 1,
    };
    await sleep(50);
    projectile.style = {
      top: `${endRect.top - containerRect.top + endRect.height / 2}px`,
      left: `${endRect.left - containerRect.left + endRect.width / 2}px`,
      opacity: 0,
      transition: 'top 0.5s ease-out, left 0.5s ease-out, opacity 0.5s ease-out',
    };
    await sleep(500);
    projectile.active = false;
    projectile.style = {};
  } catch (err) {
    console.warn('Error in showProjectile:', err);
  }
};

// Cutscene Logic
const playCutscene = async () => {
  isCutscenePlaying.value = true;
  displayedLines.value = cutsceneLines.map(() => '');
  for (let i = 0; i < cutsceneLines.length && isCutscenePlaying.value; i++) {
    currentCutsceneLine.value = i + 1;
    const text = cutsceneLines[i];
    if (i === 4) {
      isFading.value = true;
      await sleep(500);
      cutsceneBackgroundImage.value = caveImage2;
      isFading.value = false;
    }
    for (let j = 0; j <= text.length && isCutscenePlaying.value; j++) {
      await sleep(50);
      displayedLines.value[i] = text.slice(0, j);
      displayedLines.value = [...displayedLines.value];
      if (j > 0) playAudio('typewriter_click', { volume: 0.3 });
    }
    if (i === 4 && isCutscenePlaying.value) {
      playAudio('dragon_fire_roar', { volume: 0.3 });
      showHeatEffect.value = true;
      await sleep(2000);
      showHeatEffect.value = false;
    } else {
      await sleep(1500);
    }
  }
  isCutscenePlaying.value = false;
};

const startCutsceneWithAudio = async () => {
  initializeAudio();
  try {
    await cutsceneMusic.value.play();
    await playCutscene();
  } catch (err) {
    console.warn('Failed to play cutscene music:', err);
    await playCutscene();
  }
};

const advanceCutscene = (event) => {
  if (event.type === 'click' || (event.type === 'keydown' && ['Enter', 'Space'].includes(event.key))) {
    if (isCutscenePlaying.value) {
      const currentIndex = currentCutsceneLine.value - 1;
      if (currentIndex < cutsceneLines.length) {
        displayedLines.value[currentIndex] = cutsceneLines[currentIndex];
        displayedLines.value = [...displayedLines.value];
      }
    }
  }
};

const endCutscene = async () => {
  isCutscenePlaying.value = false;
  isFading.value = true;
  await sleep(500);
  isFading.value = false;
  showCutscene.value = false;
  gameState.player.hasViewedCavernaCutscene = true;
  gameState.saveState();
};

// Game Functions
const confrontBoss = () => {
  inBattle.value = true;
  battleLog.value = [`${gameState.player.name || 'Herói'} enfrenta o Dragão de Fogo!`];
  battleMusic.play().catch(err => console.warn('Erro ao tocar música de batalha:', err));
  playAudio('battle_start_dragon_fire', { volume: 0.3 });
  feedbackMessage.value = 'O Dragão de Fogo surge rugindo das chamas!';
  showFeedback.value = true;
  frameTimer.value = performance.now();
  animationFrameId = requestAnimationFrame(updateAnimation);
};

const attackEnemy = async () => {
  if (!activeEnemies.value.length || !isPlayerTurn.value || isAttacking.value || gameState.player.stamina < 10) {
    if (gameState.player.stamina < 10) {
      addLogMessage(`<span style="color: #ff6666;">⚡ Energia insuficiente!</span>`);
    }
    return;
  }
  isAttacking.value = true;
  playerAttacking.value = true;
  currentFrame.value = 0;
  frameTimer.value = performance.now();

  backgroundMusic.play().catch(error => {
    console.error('Failed to play background music:', error)
  })

  gameState.recoverStamina(20);
  addLogMessage(`<span style="color: #33cc33;">⚡ +20 energia restaurada!</span>`);

  const attackResult = gameState.playerAttackAction();
  if (!attackResult.success) {
    addLogMessage(`<span style="color: #ff6666;">${attackResult.message}</span>`);
    playerAttacking.value = false;
    isAttacking.value = false;
    return;
  }

  const enemyIndex = 0;
  const enemy = enemies[enemyIndex];
  const playerElement = document.querySelector('.player-character');
  const enemyElement = document.querySelectorAll('.enemy-character')[0];
  if (!playerElement || !enemyElement) {
    console.warn('Elementos do jogador ou inimigo não encontrados');
    isAttacking.value = false;
    playerAttacking.value = false;
    return;
  }

  battleStatus.value = `${gameState.player.name || 'Herói'} ataca!`;
  addLogMessage(`⚔️ ${attackResult.message}`);
  playAudio('attack', { volume: 0.3 });

  const originalLeft = playerCharacter.left;
  playerCharacter.left += 40;
  await sleep(200);
  await showAttackEffect(playerElement, enemyElement, true);
  playerCharacter.left = originalLeft;

  damagedEnemy.value = enemyIndex;
  const damageDealt = attackResult.damage || 0;
  if (damageDealt > 0) {
    enemies[enemyIndex].currentHp = Math.max(0, enemies[enemyIndex].currentHp - damageDealt);
    enemies[enemyIndex].hpPercent = (enemies[enemyIndex].currentHp / enemies[enemyIndex].maxHp) * 100;
    showPopup(damageDealt, enemyElement, 'enemy-damage');
    addLogMessage(`<span style="color: #d0a070;">💥 ${damageDealt} de dano ao Dragão de Fogo!</span>`);
  } else {
    addLogMessage(`<span style="color: #ff6666;">⚠️ Nenhum dano causado!</span>`);
  }

  await sleep(500);
  damagedEnemy.value = null;

  if (enemy.hpPercent <= 0) {
    addLogMessage(`<span style="color: #a09080;">☠️ O Dragão de Fogo caiu!</span>`);
    victory.value = true;
    battleStatus.value = 'Triunfo!';
    await handleVictory();
    isAttacking.value = false;
    return;
  }

  isPlayerTurn.value = false;
  await enemyTurn();
  if (!gameOver.value && !victory.value) {
    isPlayerTurn.value = true;
    battleStatus.value = 'Desfira seu golpe!';
  }
  isAttacking.value = false;
};

const usePotion = async () => {
  if (!canUsePotion.value || !isPlayerTurn.value || isAttacking.value || gameState.player.stamina < 5) {
    if (gameState.player.stamina < 5) {
      addLogMessage(`<span style="color: #ff6666;">⚡ Energia insuficiente!</span>`);
    }
    return;
  }
  isAttacking.value = true;

  gameState.recoverStamina(20);
  addLogMessage(`<span style="color: #33cc33;">⚡ +20 energia restaurada!</span>`);

  gameState.useStamina(10);
  addLogMessage(`<span style="color: #33cc33;">⚡ -10 energia</span>`);
  const playerElement = document.querySelector('.player-character');
  if (gameState.getItemQuantity('potion_health') > 0) {
    gameState.useItem('potion_health');
    const healAmount = ITEMS['potion_health'].effect.heal;
    showPopup(healAmount, playerElement, 'hp-heal');
    addLogMessage(`<span style="color: #90c090;">🧪 +${healAmount} vida!</span>`);
    playAudio('potion', { volume: 0.3 });
  } else {
    addLogMessage(`<span style="color: #ff6666;">🧪 Sem poções!</span>`);
  }
  await sleep(1000);
  isPlayerTurn.value = false;
  battleStatus.value = 'Dragão de Fogo prepara um ataque!';
  await sleep(1000);
  await enemyTurn();
  if (!gameOver.value && !victory.value) {
    isPlayerTurn.value = true;
    battleStatus.value = 'Desfira seu golpe!';
  }
  isAttacking.value = false;
};

const enemyTurn = async () => {
  if (!activeEnemies.value.length || gameState.player.health <= 0) return;
  const enemy = enemies[0];
  const playerElement = document.querySelector('.player-character');
  const enemyElement = document.querySelectorAll('.enemy-character')[0];
  battleStatus.value = 'Dragão de Fogo ataca!';
  addLogMessage(`<b>🐉 Dragão de Fogo</b> lança um projétil flamejante!`);
  playAudio('hit', { volume: 0.3 });
  await sleep(800);
  enemyAttacking.value = 0;
  await showProjectile(enemyElement, playerElement);
  const damageTaken = enemy.attackPower;
  gameState.takeDamage(damageTaken);
  showPopup(damageTaken, playerElement, 'player-damage');
  addLogMessage(`<span style="color: #c06060;">💥 ${gameState.player.name || 'Herói'} sofre ${damageTaken} de dano!</span>`);
  await sleep(500);
  enemyAttacking.value = null;
  damagedPlayer.value = true;
  await sleep(300);
  damagedPlayer.value = false;
  if (gameState.player.health <= 0) {
    addLogMessage(`<b>💀 ${gameState.player.name || 'Herói'} foi derrotado!</b>`);
    await handleDefeat();
    return;
  }
  await sleep(1000);
  if (!gameOver.value && !victory.value) {
    isPlayerTurn.value = true;
    battleStatus.value = 'Desfira seu golpe!';
  }
};

const handleVictory = async () => {
  bossDefeated.value = true;
  gameState.completeLevel('caverna_boss');
  inBattle.value = false;
  gameState.addItemToInventory('fire_shard', 1);
  gameState.addGold(100);
  if (!gameState.player.keys.fire) {
    gameState.collectKey('fire');
    addLogMessage(`<span style="color: #d0a070;">🔥 Chave Incandescente obtida!</span>`);
  }
  addLogMessage(`<span style="color: #d0a070;">🎁 Fragmento de Fogo!</span>`);
  addLogMessage(`<span style="color: #d0a070;">💰 +100 ouro!</span>`);
  playAudio('boss_defeat', { volume: 0.3 });
  feedbackMessage.value = 'Dragão de Fogo derrotado! Chave Incandescente obtida!';
  showFeedback.value = true;
  stopAllAudio();
  await sleep(2000); // Wait 2 seconds to show feedback
  gameState.setCurrentArea('Albadia');
  router.push('/level/albadia');
};

const handleDefeat = async () => {
  playAudio('player_defeat', { volume: 0.3 });
  gameState.handleDeath();
  if (gameState.player.lives > 0) {
    feedbackMessage.value = `Você foi derrotado! Vidas restantes: ${gameState.player.lives}`;
    showFeedback.value = true;
    enemies.forEach((enemy, index) => {
      enemy.currentHp = enemiesConfig[index].maxHp;
      enemy.hpPercent = 100;
    });
    inBattle.value = true;
    isPlayerTurn.value = true;
    gameOver.value = false;
    battleStatus.value = 'Desfira seu golpe!';
    battleLog.value = [`${gameState.player.name || 'Herói'} retorna para enfrentar o Dragão de Fogo!`];
    battleMusic.play().catch(err => console.warn('Erro ao tocar música de batalha:', err));
  } else {
    gameOver.value = true;
    stopAllAudio();
    router.push('/gameOver');
  }
};

const fleeArea = () => {
  playAudio('ui_back', { volume: 0.3 });
  stopAllAudio();
  router.push({ name: 'Map' });
};

const returnToMenu = () => {
  playAudio('ui_confirm', { volume: 0.3 });
  stopAllAudio();
  router.push('/');
};

// Lifecycle Hooks
onMounted(() => {
  gameState.setCurrentArea('Caverna de Fogo');
  if (!gameState.player.keys) {
    gameState.player.keys = reactive({ ancestral: false, ice: false, fire: false });
  }
  if (!gameState.player.lives) {
    gameState.player.lives = 3;
  }
  if (!gameState.player.hasViewedCavernaCutscene) {
    gameState.player.hasViewedCavernaCutscene = false;
  }
  if (!gameState.levelsCompleted) {
    gameState.levelsCompleted = reactive([]);
  }
  if (!gameState.player.equipment) {
    gameState.player.equipment = { weapon: 'sword_iron' };
  }
  if (!gameState.player.inventory) {
    gameState.player.inventory = reactive({ potion_health: 3, fire_shard: 0 });
  }
  bossDefeated.value = gameState.levelsCompleted.includes('caverna_boss');

  if (!bossDefeated.value && !gameState.player.hasViewedCavernaCutscene) {
    showCutscene.value = true;
    startCutsceneWithAudio();
  } else {
    showCutscene.value = false;
  }
});

onUnmounted(() => {
  console.log('Component unmounted');
  stopAllAudio();
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');

.caverna-view {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #3c2f2f;
}

/* Heat Overlay */
.heat-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 69, 0, 0.3);
  animation: heatPulse 2s ease-in-out infinite;
  pointer-events: none;
  z-index: 8;
}

@keyframes heatPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

/* Cutscene */
.cutscene-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 100;
  outline: none;
  cursor: pointer;
}

.cutscene-content {
  background: rgba(40, 20, 10, 0.95);
  border: 4px solid #b64e1a;
  padding: 20px;
  max-width: 800px;
  max-height: 60vh;
  margin-bottom: 10px;
  text-align: left;
  color: #f0d0a0;
  font-family: 'MedievalSharp', cursive;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  overflow-y: auto;
}

.cutscene-line {
  line-height: 1.6;
  margin-bottom: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cutscene-line.visible {
  opacity: 1;
}

.typewriter {
  display: inline-block;
  white-space: pre-wrap;
}

.cutscene-arrow {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(to bottom, #b64e1a, #8b3e15);
  border: 2px solid #8b3e15;
  color: #f0d0a0;
  font-size: 24px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.1s;
  margin: 10px auto 0;
}

.cutscene-arrow:hover {
  background: linear-gradient(to bottom, #c85d27, #9b4e22);
}

.cutscene-arrow:active {
  transform: translate(1px, 1px);
}

/* HUD */
.main-hud {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 90;
  font-size: 14px;
}

.panel-frame {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-container {
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}

.lives-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #f0d0a0;
  font-family: 'MedievalSharp', cursive;
  text-shadow: 1px 1px 2px #000;
  font-weight: bold;
}

.bar-container {
  position: relative;
  width: 200px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #8b3e15;
  border-radius: 4px;
  overflow: hidden;
}

.bar-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #f0d0a0;
  text-shadow: 1px 1px 0 #000;
  font-family: 'MedievalSharp', cursive;
}

.bar-container.segmented {
  display: flex;
  gap: 2px;
  padding: 2px;
}

.segment {
  flex: 1;
  height: 20px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #8b3e15;
}

.vida .segment.filled {
  background: linear-gradient(to bottom, #ff3333, #6a0f0f);
}

.energia .segment.filled {
  background: linear-gradient(to bottom, #33cc33, #0ff);
}

/* Content Area */
.content-area {
  flex-grow: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 60px);
  box-sizing: border-box;
}

.interactions, .feedback-box {
  background: rgba(40, 20, 10, 0.85);
  padding: 15px;
  border: 2px solid #b64e1a;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
  color: #f0d0a0;
  font-family: 'MedievalSharp', cursive;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}

.interactions {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
}

.interaction-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feedback-box {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
}

.feedback-box p {
  margin-bottom: 10px;
  font-size: 16px;
}

.feedback-box button, .interactions button, .action-btn {
  background: linear-gradient(to bottom, #b64e1a, #8b3e15);
  border: 3px solid #8b3e15;
  color: #f0d0a0;
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'MedievalSharp', cursive;
  text-shadow: 1px 1px 2px #000;
  box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.1), 2px 2px 6px rgba(0, 0, 0, 0.5);
  transition: filter 0.2s, transform 0.1s;
}

.feedback-box button:hover:not(:disabled), .interactions button:hover:not(:disabled), .action-btn:hover:not(:disabled) {
  filter: brightness(1.2);
}

.feedback-box button:active:not(:disabled), .interactions button:active:not(:disabled), .action-btn:active:not(:disabled) {
  transform: scale(0.97);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.6);
}

.potion-btn {
  background: linear-gradient(to bottom, #c85d27, #9b4e22);
}

/* Battle */
.medieval-battle-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100vh - 50px);
  display: flex;
  flex-direction: column;
}

.battle-arena {
  position: relative;
  width: 100%;
  height: calc(80vh - 40px);
  overflow: hidden;
}

.game-status-top {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  color: #f0d0a0;
  background: rgba(40, 20, 10, 0.9);
  padding: 8px 16px;
  border-radius: 5px;
  z-index: 20;
  border: 2px solid #b64e1a;
  font-family: 'MedievalSharp', cursive;
}

.victory-message, .game-over-message {
  font-size: 16px;
  animation: pulseGlow 1.5s infinite;
}

.victory-message { color: #ffd700; }
.game-over-message { color: #a04040; }

@keyframes pulseGlow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

.unit {
  position: absolute;
  transition: top 0.3s ease, left 0.3s ease;
}

.player-character {
  z-index: 10;
  transform: scale(4);
  transform-origin: center center;
  image-rendering: pixelated;
  margin-top: 15%;
}

.player-character.is-damaged {
  animation: damageBrighten 1s linear forwards;
}

@keyframes damageBrighten {
  0% { filter: brightness(1); }
  30% { filter: brightness(1.2); }
  50% { filter: brightness(1.5); }
  90% { filter: brightness(1.2); }
  100% { filter: brightness(1); }
}

.player-character.is-attacking {
  scale: 1.01;
}

.weapon-sprite {
  position: absolute;
  width: 30px;
  height: 30px;
  top: 50%;
  left: 80%;
  transform: translate(-50%, -50%);
  object-fit: contain;
  image-rendering: pixelated;
}

.enemy-character {
  z-index: 9;
}

.enemy-character.fainted {
  filter: grayscale(100%) opacity(40%);
}

.enemy-character.dragao-fogo {
  transform: scale(4.5);
  transform-origin: center center;
}

.enemy-character.dragao-fogo.is-attacking {
  animation: dragonShake 0.4s ease-in-out;
}

.character-sprite {
  width: 110%;
  height: 130%;
  object-fit: contain;
  image-rendering: pixelated;
  margin-left: -60%;
  margin-top: 20%;
}

.character-info {
  position: absolute;
  background: rgba(40, 20, 10, 0.9);
  border: 2px solid #b64e1a;
  border-radius: 8px;
  padding: 8px;
  color: #f0d0a0;
  font-size: 12px;
  min-width: 180px;
}

.player-info {
  bottom: 60px;
  left: 20px;
  z-index: 5;
}

.enemy-info {
  text-align: center;
}

.character-name {
  font-weight: bold;
  font-size: 14px;
  color: #f0d0a0;
  margin-bottom: 6px;
  display: block;
}

.resource-bar-container {
  display: flex;
  align-items: center;
  height: 16px;
}

.hp-bar-label {
  font-size: 12px;
  font-weight: bold;
  margin-right: 8px;
  width: 40px;
  color: #f0d0a0;
}

.hp-bar {
  flex-grow: 1;
  height: 12px;
  border: 2px solid #b64e1a;
  border-radius: 5px;
  background: #1e2a38;
  overflow: hidden;
}

.hp {
  height: 100%;
  background: linear-gradient(to right, #b64e1a, #ff4500);
  transition: width 0.5s ease;
}

.resource-value {
  font-size: 12px;
  margin-left: 8px;
  font-weight: bold;
  color: #f0d0a0;
}

.battle-log-container {
  width: 100%;
  height: 30vh;
  background: rgba(40, 20, 10, 0.95);
  border-top: 4px solid #b64e1a;
  display: flex;
  justify-content: space-between;
  padding: 5px;
  box-sizing: border-box;
  margin-bottom: -10%;
}

.battle-log {
  width: 60%;
  height: 100%;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.5;
  padding: 8px;
  border: 2px solid #b64e1a;
  border-radius: 5px;
  color: #f0d0a0;
}

.battle-log p {
  margin: 0 0 4px 0;
}

.battle-log::-webkit-scrollbar {
  width: 6px;
}

.battle-log::-webkit-scrollbar-track {
  background: #1e2a38;
  border-radius: 5px;
}

.battle-log::-webkit-scrollbar-thumb {
  background: #b64e1a;
  border-radius: 5px;
}

.actions, .actions-placeholder {
  width: 40%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.actions-placeholder {
  color: #f0d0a0;
  font-size: 12px;
  font-style: italic;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes dragonShake {
  0%, 100% { transform: scale(4.5) translateX(0); }
  25% { transform: scale(4.5) translateX(-5px); }
  75% { transform: scale(4.5) translateX(5px); }
}

@keyframes attackShake {
  0%, 100% { transform: scale(4) translateX(0); }
  25% { transform: scale(4) translateX(-5px); }
  75% { transform: scale(4) translateX(5px); }
}

.damage-popup {
  position: absolute;
  font-size: 16px;
  font-weight: bold;
  animation: floatUp 0.8s ease-out forwards;
  pointer-events: none;
  transform: translateX(-50%);
  z-index: 25;
  text-shadow: 1px 1px 3px black;
}

.damage-popup.player-damage { color: #c06060; }
.damage-popup.enemy-damage { color: #d0a070; }
.damage-popup.hp-heal { color: #90c090; }

@keyframes floatUp {
  0% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -50px); }
}

.attack-effect {
  position: absolute;
  z-index: 20;
  pointer-events: none;
}

.effect-sprite {
  width: 50px;
  height: 50px;
  object-fit: contain;
  image-rendering: pixelated;
}

.projectile-effect {
  position: absolute;
  z-index: 20;
  pointer-events: none;
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, #ff4500 30%, #ff8c00 60%, transparent 80%);
  border-radius: 50%;
  box-shadow: 0 0 15px #ff4500, 0 0 25px #ff8c00;
  animation: pulseProjectile 0.5s infinite alternate;
}

@keyframes pulseProjectile {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.2); opacity: 0.8; }
}
</style>