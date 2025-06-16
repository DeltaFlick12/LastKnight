```vue
<template>
  <div class="ruinas-view" :style="showCutscene ? cutsceneBackgroundStyle : backgroundStyle">
    <!-- Cutscene -->
    <div v-if="showCutscene" class="cutscene-container" tabindex="0" @click="advanceCutscene">
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
        <div v-if="showAudioPrompt" class="audio-prompt">
          <p>Áudio não iniciado automaticamente. Clique para iniciar a cutscene com música.</p>
          <button @click.stop="startCutsceneWithAudio">Iniciar</button>
        </div>
      </div>
    </div>

    <!-- HUD (visible during battle) -->
    <div v-if="inBattle && !showCutscene" class="main-hud">
      <div class="panel-frame">
        <div class="stat vida">
          <div class="icon-container">
            <img src="/icons/life-icon.png" alt="Vida" class="icon" />
            <span class="lives-overlay">{{ gameState.player.lives }}</span>
          </div>
          <div class="bar-container segmented">
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
        <div class="stat energia">
          <div class="icon-container">
            <img src="/icons/stam-icon.png" alt="Energia" class="icon" />
          </div>
          <div class="bar-container segmented">
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
        <p>As ruínas ecoam com um rugido ancestral.</p>
        <p><strong>Inimigo Final:</strong> O Dragão Ancestral aguarda.</p>
        <div class="interaction-buttons">
          <button @click="confrontBoss">Enfrentar o Dragão Ancestral</button>
          <button @click="fleeArea">Fugir</button>
        </div>
      </div>
      <div v-if="!inBattle && bossDefeated && !showCutscene" class="interactions">
        <p>O Dragão Ancestral foi derrotado.</p>
        <p v-if="!gameState.player.keys.ancestral">Uma chave e um punhado de ouro repousam nas cinzas.</p>
        <button v-if="!gameState.player.keys.ancestral" @click="collectRewards">Coletar Recompensas</button>
      </div>

      <!-- Battle System -->
      <div v-if="inBattle && !showCutscene" class="medieval-battle-container">
        <div class="battle-arena">
          <div class="game-status-top">
            <div v-if="!gameOver && !victory">{{ battleStatus }}</div>
            <div v-if="victory" class="victory-message">✨ Triunfo! O Dragão Ancestral caiu! ✨</div>
            <div v-if="gameOver" class="game-over-message">💀 Derrota! A escuridão prevaleceu... 💀</div>
          </div>

          <!-- Player Character -->
          <div
            class="unit player-character"
            :class="{ 'is-attacking': playerAttacking, 'is-damaged': damagedPlayer }"
            :style="{ top: `${playerCharacter.top}px`, left: `${playerCharacter.left}px` }"
          >
            <img :src="playerSprite" alt="Player" class="character-sprite" />
            <img v-if="weaponSprite" :src="weaponSprite" alt="Weapon" class="weapon-sprite" />
          </div>
          <div class="character-info player-info">
            <span class="character-name">{{ playerCharacter.name }} ({{ playerCharacter.className }}{{ weaponName ? ', ' + weaponName : '' }})</span>
          </div>

          <!-- Enemy (Ancestral Dragon) -->
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
              class="unit enemy-character dragao-ruina"
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
        </div>

        <!-- Battle Log and Actions -->
        <div class="battle-log-container">
          <div class="battle-log">
            <p v-for="(message, index) in battleLog" :key="index" v-html="message"></p>
          </div>
          <div class="actions" v-if="isPlayerTurn && !isAttacking && !gameOver && !victory">
            <button class="action-btn attack-btn" @click="attackEnemy" :disabled="activeEnemies.length === 0 || playerCharacter.currentStamina < 10">
              Atacar
            </button>
            <button class="action-btn potion-btn" @click="usePotion" :disabled="!canUsePotion || playerCharacter.currentStamina < 5">
              Poção ({{ potionCount }})
            </button>
          </div>
          <div class="actions-placeholder" v-else>
            Dragão Ancestral prepara um ataque...
          </div>
        </div>
      </div>

      <!-- Feedback Box -->
      <div v-if="showFeedback && !showCutscene" class="dialog-box feedback-box">
        <p>{{ feedbackMessage }}</p>
        <button @click="showFeedback = false">Ok</button>
      </div>
    </div>

    <!-- Navigation Bar -->
    <div class="navigation-bar" v-if="!showCutscene">
      <button
        v-if="bossDefeated"
        class="nav-btn"
        @click="goToNextArea"
        aria-label="Seguir para a próxima área (Acampamento)"
        :disabled="!bossDefeated"
      >
        Seguir para Acampamento
      </button>
    </div>
  </div>
</template>

<script setup>
import attackEffectSpritePlayer from '@/assets/sprites/ataque-efeito.png';
import attackEffectSpriteDragon from '@/assets/sprites/ataque-dragao.png';
import playerIdleSprite from '@/assets/sprites/player/player_idle.png';
import dragonRuinaSprite from '@/assets/sprites/dragao-ruina.png';
import ruinasDragonImage from '@/assets/backviews/ruinas-dragon.png';
import ruinasBattleImage from '@/assets/backviews/ruinas-battle.png';
import warriorImage from '@/assets/backviews/warrior.png';
import warriorScaredImage from '@/assets/backviews/warrior-scared.png';
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameState } from '@/stores/gameState.js';
import { playAudio } from '@/utils/audioManager.js';

const router = useRouter();
const gameState = useGameState();
const battleMusic = new Audio('/audio/musica-combate.mp3');
battleMusic.loop = true;
battleMusic.volume = 0.3;

const playerSprite = playerIdleSprite;
const enemySprites = {
  'Dragão Ancestral': dragonRuinaSprite,
};

// Cutscene State
const showCutscene = ref(false);
const currentCutsceneLine = ref(0);
const cutsceneLines = [
  'A névoa sufoca as Ruínas Ancestrais, um túmulo de pedra onde o tempo parou.',
  'Sombras dançam entre colunas partidas, sussurrando segredos de um reino perdido.',
  'Cada passo ecoa, como se o chão guardasse memórias de sangue e traição.',
  'Um rugido primal rasga o silêncio, estremecendo a terra sob seus pés.',
  'O Dragão Ancestral desperta, seus olhos de fogo perfurando a escuridão.',
  'Seu destino está selado: enfrentar a fera ou ser consumido por sua ira.',
];
const displayedLines = ref(cutsceneLines.map(() => ''));
const cutsceneBackgroundImage = ref(warriorImage);
const isFading = ref(false);
const showAudioPrompt = ref(false);
const isCutscenePlaying = ref(false);
const cutsceneMusic = ref(null);

// Background Styles
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${inBattle.value ? ruinasBattleImage : ruinasDragonImage})`,
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

// State
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
  name: gameState.player.name || 'Herói',
  className: gameState.player.className || 'Guerreiro',
  hpPercent: computed(() => (gameState.player.health / gameState.player.maxHealth) * 100),
  currentHp: gameState.player.health || 100,
  maxHp: gameState.player.maxHealth || 100,
  currentStamina: gameState.player.stamina || 100,
  maxStamina: gameState.player.maxStamina || 100,
  top: 300,
  left: 50,
});

// Weapon Properties
const weaponName = computed(() => gameState.player.equippedWeapon?.name || 'Punhos');
const weaponDamage = computed(() => gameState.player.equippedWeapon?.damage || 5);
const weaponSprite = computed(() => gameState.player.equippedWeapon?.sprite || null);

// Enemy Configuration
const enemiesConfig = [{
  name: 'Dragão Ancestral',
  hpPercent: 100,
  currentHp: 200,
  maxHp: 200,
  top: 300,
  left: '80vw',
  attackPower: 20,
}];
const initialEnemyPositions = enemiesConfig.map(enemy => ({
  top: enemy.top,
  left: typeof enemy.left === 'string' ? enemy.left : `${enemy.left}px`,
}));
const enemies = reactive(enemiesConfig.map(enemy => ({ ...enemy })));

// Battle State
const damagedEnemy = ref(null);
const damagedPlayer = ref(false);
const playerAttacking = ref(false);
const enemyAttacking = ref(null);
const isPlayerTurn = ref(true);
const isAttacking = ref(false);
const battleLog = ref(['Batalha contra o Dragão Ancestral!']);
const battleStatus = ref('Desfira seu golpe!');
const gameOver = ref(false);
const victory = ref(false);
const damagePopup = reactive({ active: false, value: 0, top: 0, left: 0, type: 'enemy-damage', prefix: '-' });
const attackEffect = reactive({ active: false, style: {}, sprite: null });

// Stamina Regeneration
let staminaRegenInterval = null;

const startStaminaRegeneration = () => {
  if (staminaRegenInterval) return; // Prevent multiple intervals
  staminaRegenInterval = setInterval(() => {
    if (inBattle.value && !gameOver.value && !victory.value) {
      playerCharacter.currentStamina = Math.min(
        playerCharacter.maxStamina,
        playerCharacter.currentStamina + 5
      );
      gameState.player.stamina = playerCharacter.currentStamina;
      if (playerCharacter.currentStamina === playerCharacter.maxStamina) {
        addLogMessage(`<span style="color: #33cc33;">⚡ Energia totalmente restaurada!</span>`);
      }
    }
  }, 1000); // Regenerate 5 stamina every 1000ms (1 second)
};

const stopStaminaRegeneration = () => {
  if (staminaRegenInterval) {
    clearInterval(staminaRegenInterval);
    staminaRegenInterval = null;
  }
};

// Computed Properties
const potionCount = computed(() => gameState.player.potions || 0);
const canUsePotion = computed(() => potionCount.value > 0 && gameState.player.health < gameState.player.maxHealth);
const activeEnemies = computed(() => enemies.filter(enemy => enemy.hpPercent > 0));
const enemyInfoStyle = index => ({
  top: `${initialEnemyPositions[index].top - 120}px`, // Changed from -90px to -120px to raise HUD
  left: `calc(${initialEnemyPositions[index].left} - 120px)`,
});
const enemyStyle = (index, enemy) => ({
  top: `${(enemy.hpPercent > 0 ? enemy.top : initialEnemyPositions[index].top) + 100}px`,
  left: enemy.hpPercent > 0 ? enemy.left : initialEnemyPositions[index].left,
  transform: 'scale(5.5)',
  transformOrigin: 'center center',
});

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
  const rect = targetElement.getBoundingClientRect();
  const containerRect = document.querySelector('.battle-arena').getBoundingClientRect();
  Object.assign(damagePopup, {
    active: true,
    value,
    top: rect.top - containerRect.top + rect.height / 2 - 20,
    left: rect.left - containerRect.left + rect.width / 2,
    type,
    prefix: type === 'hp-heal' ? '+' : '-',
  });
  setTimeout(() => Object.assign(damagePopup, { active: false }), 800);
};

const showAttackEffect = async (attackerElement, targetElement, isPlayer = true) => {
  const startRect = attackerElement.getBoundingClientRect();
  const endRect = targetElement.getBoundingClientRect();
  const containerRect = document.querySelector('.battle-arena').getBoundingClientRect();
  const spriteToUse = isPlayer ? attackEffectSpritePlayer : attackEffectSpriteDragon;
  Object.assign(attackEffect, {
    active: true,
    style: {
      top: `${startRect.top - containerRect.top + startRect.height / 2}px`,
      left: `${startRect.left - containerRect.left + startRect.width / 2}px`,
      opacity: 1,
    },
    sprite: spriteToUse,
  });
  await sleep(50);
  Object.assign(attackEffect.style, {
    top: `${endRect.top - containerRect.top + endRect.height / 2}px`,
    left: `${endRect.left - containerRect.left + endRect.width / 2}px`,
    opacity: 0,
    transition: 'top 0.3s ease-out, left 0.3s ease-out, opacity 0.3s ease-out',
  });
  await sleep(300);
  Object.assign(attackEffect, { active: false, style: {}, sprite: null });
};

// Audio Cleanup
const stopAllAudio = () => {
  if (cutsceneMusic.value) {
    cutsceneMusic.value.pause();
    cutsceneMusic.value.currentTime = 0;
    cutsceneMusic.value = null;
  }
  if (battleMusic) {
    battleMusic.pause();
    battleMusic.currentTime = 0;
  }
  playAudio('ruins_ambient', { stop: true, volume: 0.3 });
};

// Cutscene Logic
const playCutscene = async () => {
  console.log('Starting playCutscene');
  isCutscenePlaying.value = true;
  currentCutsceneLine.value = 0;
  displayedLines.value = cutsceneLines.map(() => ''); // Reset displayed lines
  cutsceneBackgroundImage.value = warriorImage;

  for (let i = 0; i < cutsceneLines.length && isCutscenePlaying.value; i++) {
    console.log(`Processing line ${i}: ${cutsceneLines[i]}`);
    currentCutsceneLine.value = i + 1;
    const text = cutsceneLines[i];
    for (let j = 0; j <= text.length && isCutscenePlaying.value; j++) {
      displayedLines.value[i] = text.slice(0, j);
      displayedLines.value = [...displayedLines.value]; // Force re-render
      if (j > 0) playAudio('typewriter_click', { volume: 0.3 });
      await sleep(50);
    }
    if (i === 3 && isCutscenePlaying.value) {
      playAudio('dragon_roar', { volume: 0.3 });
      isFading.value = true;
      await sleep(500);
      cutsceneBackgroundImage.value = warriorScaredImage;
      playAudio('warrior_fear', { volume: 0.3 });
      isFading.value = false;
      await sleep(2000);
    } else {
      await sleep(1500);
    }
  }
  console.log('Finished playCutscene');
  isCutscenePlaying.value = false;
};

const startCutsceneWithAudio = async () => {
  console.log('Starting cutscene with audio');
  showAudioPrompt.value = false;
  if (cutsceneMusic.value && !isCutscenePlaying.value) {
    try {
      cutsceneMusic.value.volume = 0.3;
      await cutsceneMusic.value.play();
      console.log('Cutscene music started');
    } catch (err) {
      console.error('Failed to play cutscene music:', err);
      showAudioPrompt.value = true;
      return;
    }
    await playCutscene();
  }
};

const advanceCutscene = () => {
  console.log('Advancing cutscene, showAudioPrompt:', showAudioPrompt.value);
  if (showAudioPrompt.value) {
    startCutsceneWithAudio();
    return;
  }
  if (isCutscenePlaying.value) {
    const currentIndex = currentCutsceneLine.value - 1;
    if (currentIndex < cutsceneLines.length) {
      displayedLines.value[currentIndex] = cutsceneLines[currentIndex];
      displayedLines.value = [...displayedLines.value]; // Force re-render
      console.log(`Advanced to line ${currentIndex}: ${displayedLines.value[currentIndex]}`);
    }
  }
};

const endCutscene = async () => {
  console.log('Ending cutscene');
  isCutscenePlaying.value = false;
  stopAllAudio();
  isFading.value = true;
  await sleep(500);
  cutsceneBackgroundImage.value = ruinasDragonImage;
  isFading.value = false;
  showCutscene.value = false;
  gameState.player.hasViewedRuinasCutscene = true;
};

// Game Functions
const confrontBoss = () => {
  inBattle.value = true;
  battleLog.value = [`${playerCharacter.name} enfrenta o Dragão Ancestral!`];
  stopAllAudio();
  battleMusic.play().catch(err => console.warn('Erro ao tocar música de batalha:', err));
  playAudio('battle_start_dragon_ancestral', { volume: 0.3 });
  feedbackMessage.value = 'O Dragão Ancestral desperta!';
  showFeedback.value = true;
  startStaminaRegeneration();
};

const collectRewards = () => {
  if (bossDefeated.value && !gameState.player.keys.ancestral) {
    gameState.collectKey('ancestral');
    gameState.player.gold += 50;
    playAudio('collect_key_ancient', { volume: 0.3 });
    feedbackMessage.value = 'Chave Ancestral e 50 de ouro obtidos!';
    showFeedback.value = true;
  } else {
    feedbackMessage.value = 'Nenhuma recompensa disponível.';
    showFeedback.value = true;
  }
};

const fleeArea = () => {
  playAudio('ui_back', { volume: 0.3 });
  stopAllAudio();
  router.push({ name: 'Map' });
};

const attackEnemy = async () => {
  if (!activeEnemies.value.length || !isPlayerTurn.value || isAttacking.value || playerCharacter.currentStamina < 10) {
    if (playerCharacter.currentStamina < 10) {
      addLogMessage(`<span style="color: #ff6666;">⚡ Energia insuficiente!</span>`);
    }
    return;
  }
  isAttacking.value = true;
  playerAttacking.value = true;
  playerCharacter.currentStamina = Math.max(0, playerCharacter.currentStamina - 10);
  gameState.player.stamina = playerCharacter.currentStamina;
  addLogMessage(`<span style="color: #33cc33;">⚡ -10 energia</span>`);
  const enemyIndex = 0;
  const enemy = enemies[enemyIndex];
  const playerElement = document.querySelector('.player-character');
  const enemyElement = document.querySelectorAll('.enemy-character')[0];
  battleStatus.value = `${playerCharacter.name} ataca!`;
  addLogMessage(`⚔️ ${playerCharacter.name} golpeia com ${weaponName.value}!`);
  playAudio('attack', { volume: 0.3 });
  const originalLeft = playerCharacter.left;
  playerCharacter.left += 40;
  await sleep(200);
  await showAttackEffect(playerElement, enemyElement, true);
  playerCharacter.left = originalLeft;
  damagedEnemy.value = enemyIndex;
  const damageDealt = weaponDamage.value + Math.floor(Math.random() * 6 + 10);
  enemy.currentHp = Math.max(0, enemy.currentHp - damageDealt);
  enemy.hpPercent = (enemy.currentHp / enemy.maxHp) * 100;
  showPopup(damageDealt, enemyElement, 'enemy-damage');
  addLogMessage(`<span style="color: #d0a070;">💥 ${damageDealt} de dano!</span>`);
  await sleep(500);
  damagedEnemy.value = null;
  playerAttacking.value = false;
  if (enemy.hpPercent <= 0) {
    addLogMessage(`<span style="color: #a09080;">☠️ O Dragão Ancestral caiu!</span>`);
    victory.value = true;
    battleStatus.value = 'Triunfo!';
    handleVictory();
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
  if (!canUsePotion.value || !isPlayerTurn.value || isAttacking.value || playerCharacter.currentStamina < 5) {
    if (playerCharacter.currentStamina < 5) {
      addLogMessage(`<span style="color: #ff6666;">⚡ Energia insuficiente!</span>`);
    }
    return;
  }
  isAttacking.value = true;
  playerCharacter.currentStamina = Math.max(0, playerCharacter.currentStamina - 5);
  gameState.player.stamina = playerCharacter.currentStamina;
  addLogMessage(`<span style="color: #33cc33;">⚡ -5 energia</span>`);
  const playerElement = document.querySelector('.player-character');
  if (gameState.player.potions > 0) {
    gameState.removeItemFromInventory('potion', 1);
    gameState.player.potions -= 1;
    const healAmount = 30;
    playerCharacter.currentHp = Math.min(playerCharacter.maxHp, playerCharacter.currentHp + healAmount);
    gameState.player.health = playerCharacter.currentHp;
    playerCharacter.hpPercent = (playerCharacter.currentHp / playerCharacter.maxHp) * 100;
    showPopup(healAmount, playerElement, 'hp-heal');
    addLogMessage(`<span style="color: #90c090;">🧪 +${healAmount} vida!</span>`);
    playAudio('potion', { volume: 0.3 });
  } else {
    addLogMessage(`<span style="color: #ff6666;">🧪 Sem poções!</span>`);
  }
  await sleep(1000);
  isPlayerTurn.value = false;
  battleStatus.value = 'Dragão Ancestral prepara um ataque!';
  await sleep(1000);
  await enemyTurn();
  if (!gameOver.value && !victory.value) {
    isPlayerTurn.value = true;
    battleStatus.value = 'Desfira seu golpe!';
  }
  isAttacking.value = false;
};

const enemyTurn = async () => {
  if (!activeEnemies.value.length || playerCharacter.hpPercent <= 0 || isAttacking.value) return;
  const enemy = enemies[0];
  const playerElement = document.querySelector('.player-character');
  const enemyElement = document.querySelectorAll('.enemy-character')[0];
  addLogMessage(`<b>🐉 Dragão Ancestral</b> ataca!`);
  playAudio('hit', { volume: 0.3 });
  await sleep(800);
  enemyAttacking.value = 0;
  const damageTaken = enemy.attackPower + Math.floor(Math.random() * 6 + 5);
  playerCharacter.currentHp = Math.max(0, playerCharacter.currentHp - damageTaken);
  gameState.player.health = playerCharacter.currentHp;
  playerCharacter.hpPercent = (playerCharacter.currentHp / playerCharacter.maxHp) * 100;
  showPopup(damageTaken, playerElement, 'player-damage');
  addLogMessage(`<span style="color: #c06060;">💥 ${playerCharacter.name} sofre ${damageTaken} de dano!</span>`);
  await showAttackEffect(enemyElement, playerElement, false);
  await sleep(500);
  enemyAttacking.value = null;
  damagedPlayer.value = true;
  await sleep(300);
  damagedPlayer.value = false;
  if (playerCharacter.hpPercent <= 0) {
    addLogMessage(`<b>💀 ${playerCharacter.name} foi derrotado!</b>`);
    handleDefeat();
    isAttacking.value = false;
    return;
  }
  await sleep(1000);
  if (!gameOver.value && !victory.value && !isPlayerTurn.value) {
    await enemyTurn();
  }
};

const handleVictory = () => {
  bossDefeated.value = true;
  gameState.completeLevel('ruinas_boss');
  inBattle.value = false;
  gameState.addItemToInventory('dragon_scale', 1);
  gameState.player.gold += 100;
  addLogMessage(`<span style="color: #d0a070;">🎁 Escama de Dragão!</span>`);
  playAudio('boss_defeat', { volume: 0.3 });
  feedbackMessage.value = 'Dragão Ancestral derrotado!';
  showFeedback.value = true;
  stopAllAudio();
};

const handleDefeat = async () => {
  playAudio('player_defeat', { volume: 0.3 });
  gameState.handleDeath();
  if (gameState.player.lives > 0) {
    feedbackMessage.value = `Você foi derrotado! Vidas restantes: ${gameState.player.lives}`;
    showFeedback.value = true;
    playerCharacter.currentHp = gameState.player.maxHealth;
    playerCharacter.currentStamina = gameState.player.maxStamina;
    gameState.player.health = playerCharacter.currentHp;
    gameState.player.stamina = playerCharacter.currentStamina;
    enemies.forEach((enemy, index) => {
      enemy.currentHp = enemiesConfig[index].maxHp;
      enemy.hpPercent = 100;
    });
    inBattle.value = true;
    isPlayerTurn.value = true;
    gameOver.value = false;
    battleStatus.value = 'Desfira seu golpe!';
    battleLog.value = [`${playerCharacter.name} retorna para enfrentar o Dragão Ancestral!`];
    battleMusic.play().catch(err => console.warn('Erro ao tocar música de batalha:', err));
  } else {
    gameOver.value = true;
    feedbackMessage.value = 'Você foi derrotado! Sem vidas restantes.';
    showFeedback.value = true;
    stopAllAudio();
    setTimeout(() => router.push('/'), 2000);
  }
};

const goToNextArea = () => {
  if (!bossDefeated.value) return;
  playAudio('ui_confirm', { volume: 0.3 });
  stopAllAudio();
  router.push({ name: 'Acampamento' });
};

// Lifecycle Hooks
onMounted(() => {
  gameState.setCurrentArea('Ruínas Ancestrais');
  if (!gameState.player.keys) {
    gameState.player.keys = reactive({ ancestral: false, ice: false, fire: false });
  }
  if (!gameState.player.stamina) {
    gameState.player.stamina = 100;
    gameState.player.maxStamina = 100;
  }
  if (!gameState.player.lives) {
    gameState.player.lives = 3;
  }
  if (!gameState.player.hasViewedRuinasCutscene) {
    gameState.player.hasViewedRuinasCutscene = false;
  }
  if (!gameState.levelsCompleted) {
    gameState.levelsCompleted = reactive([]);
  }
  if (!gameState.player.equippedWeapon) {
    gameState.player.equippedWeapon = null;
  }
  if (!gameState.player.potions) {
    gameState.player.potions = 0;
  }
  playerCharacter.currentStamina = gameState.player.stamina;
  playerCharacter.currentHp = gameState.player.health;
  bossDefeated.value = gameState.levelsCompleted.includes('ruinas_boss');

  cutsceneMusic.value = new Audio('/audio/musica-sus.mp3');
  cutsceneMusic.value.loop = true;
  cutsceneMusic.value.preload = 'auto';
  cutsceneMusic.value.volume = 0.3;
  try {
    cutsceneMusic.value.play().then(() => {
      console.log('Cutscene music started successfully on mount');
    }).catch(err => {
      console.error('Failed to play cutscene music on mount:', err);
      showAudioPrompt.value = true;
    });
  } catch (err) {
    console.error('Error initializing cutscene music:', err);
    showAudioPrompt.value = true;
  }

  if (!bossDefeated.value && !gameState.player.hasViewedRuinasCutscene) {
    showCutscene.value = true;
    startCutsceneWithAudio();
  } else {
    showCutscene.value = false;
  }

  startStaminaRegeneration();
});

onUnmounted(() => {
  stopAllAudio();
  stopStaminaRegeneration();
});

// Watch for health and stamina changes
watch(
  () => [gameState.player.health, gameState.player.stamina],
  ([newHealth, newStamina]) => {
    playerCharacter.currentHp = newHealth;
    playerCharacter.currentStamina = newStamina;
  }
);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=UnifrakturMaguntia&display=swap');

.ruinas-view {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow-y: hidden;
  background-color: #1c2526;
}

/* Cutscene Style */
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
  position: relative;
  background: rgba(40, 44, 52, 0.95);
  border: 4px solid #4a4e57;
  padding: 15px;
  max-width: 600px;
  max-height: 60vh;
  margin-bottom: 10px;
  text-align: left;
  color: #d3d7e0;
  font-family: 'MedievalSharp', cursive;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7);
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
  color: #d3d7e0;
}

.cutscene-arrow {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(to bottom, #4a4e57, #2e323a);
  border: 2px solid #4a4e57;
  color: #d3d7e0;
  font-size: 24px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.1s;
  margin: 10px auto 0;
}

.cutscene-arrow:hover {
  background: linear-gradient(to bottom, #5a5e67, #3e424a);
}

.cutscene-arrow:active {
  transform: translate(1px, 1px);
}

.audio-prompt {
  background: rgba(40, 44, 52, 0.95);
  border: 2px solid #4a4e57;
  padding: 10px;
  margin-top: 10px;
  text-align: center;
}

.audio-prompt p {
  margin-bottom: 10px;
  font-size: 14px;
  color: #d3d7e0;
}

.audio-prompt button {
  background: linear-gradient(to bottom, #4a4e57, #2e323a);
  border: 2px solid #4a4e57;
  color: #d3d7e0;
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 5px;
  cursor: pointer;
  font-family: 'MedievalSharp', cursive;
  transition: filter 0.2s, transform 0.1s;
}

.audio-prompt button:hover {
  filter: brightness(1.2);
}

.audio-prompt button:active {
  transform: scale(0.97);
}

/* HUD Styles */
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
  color: #d3d7e0;
  font-family: 'MedievalSharp', cursive;
  text-shadow: 1px 1px 2px #000;
  font-weight: bold;
}

.bar-container {
  position: relative;
  width: 200px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #4a4e57;
  border-radius: 4px;
  overflow: hidden;
}

.bar-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #d3d7e0;
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
  border: 1px solid #4a4e57;
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
  background-color: rgba(40, 44, 52, 0.85);
  padding: 15px;
  border: 2px solid #4a4e57;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
  color: #d3d7e0;
  font-family: 'MedievalSharp', cursive;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.7);
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

.feedback-box button, .interactions button, .action-btn, .nav-btn {
  background: linear-gradient(to bottom, #4a4e57, #2e323a);
  border: 3px solid #4a4e57;
  color: #d3d7e0;
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'MedievalSharp', cursive;
  text-shadow: 1px 1px 2px #000;
  box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.1), 2px 2px 6px rgba(0, 0, 0, 0.7);
  transition: filter 0.2s, transform 0.1s;
}

.feedback-box button:hover:not(:disabled), .interactions button:hover:not(:disabled), .action-btn:hover:not(:disabled), .nav-btn:hover:not(:disabled) {
  filter: brightness(1.2);
}

.feedback-box button:active:not(:disabled), .interactions button:active:not(:disabled), .action-btn:active:not(:disabled), .nav-btn:active:not(:disabled) {
  transform: scale(0.97);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.6);
}

.potion-btn {
  background: linear-gradient(to bottom, #5a5e67, #3e424a);
}

/* Navigation Bar */
.navigation-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(40, 44, 52, 0.95);
  border-top: 4px solid #4a4e57;
  padding: 5px 10px;
  display: flex;
  justify-content: center;
  gap: 10px;
  z-index: 10;
  height: 50px;
  box-sizing: border-box;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Battle Styles */
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
  color: #d3d7e0;
  background: rgba(40, 44, 52, 0.9);
  padding: 8px 16px;
  border-radius: 5px;
  z-index: 20;
  border: 2px solid #4a4e57;
  font-family: 'MedievalSharp', cursive;
}

.victory-message, .game-over-message {
  font-size: 16px;
  animation: pulseGlow 1.5s infinite;
}

.victory-message { color: #b0c4de; }
.game-over-message { color: #a04040; }

@keyframes pulseGlow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

.unit {
  position: absolute;
  width: 100px;
  height: 100px;
  transition: top 0.3s ease, left 0.3s ease;
}

.character-sprite {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
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

.player-character { z-index: 10; }
.enemy-character { z-index: 9; }
.enemy-character.fainted { filter: grayscale(100%) opacity(40%); }

.character-info {
  position: absolute;
  background: rgba(40, 44, 52, 0.9);
  border: 2px solid #4a4e57;
  border-radius: 8px;
  padding: 8px;
  color: #d3d7e0;
  font-size: 12px;
  min-width: 180px;
}

.player-info {
  bottom: 60px;
  left: 20px;
  z-index: 5;
}
.enemy-info { text-align: right; }

.character-name {
  font-weight: bold;
  font-size: 14px;
  color: #d3d7e0;
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
  color: #d3d7e0;
}

.hp-bar {
  flex-grow: 1;
  height: 12px;
  border: 2px solid #4a4e57;
  border-radius: 5px;
  background: #2e323a;
  overflow: hidden;
}

.hp {
  height: 100%;
  background: linear-gradient(to right, #4682b4, #87ceeb);
  transition: width 0.5s ease;
}

.resource-value {
  font-size: 12px;
  margin-left: 8px;
  font-weight: bold;
  color: #d3d7e0;
}

.battle-log-container {
  width: 100%;
  height: 20vh;
  background: rgba(40, 44, 52, 0.95);
  border-top: 4px solid #4a4e57;
  display: flex;
  justify-content: space-between;
  padding: 5px;
  box-sizing: border-box;
}

.battle-log {
  width: 60%;
  height: 100%;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.5;
  padding: 8px;
  border: 2px solid #4a4e57;
  border-radius: 5px;
  color: #d3d7e0;
}

.battle-log p { margin: 0 0 4px 0; }

.battle-log::-webkit-scrollbar {
  width: 6px;
}

.battle-log::-webkit-scrollbar-track {
  background: #2e323a;
  border-radius: 5px;
}

.battle-log::-webkit-scrollbar-thumb {
  background: #4a4e57;
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
  color: #d3d7e0;
  font-size: 12px;
  font-style: italic;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.enemy-character.dragao-ruina {
  transform: scale(5.5);
  transform-origin: center center;
}

.enemy-character.dragao-ruina.is-attacking {
  animation: dragonShake 0.4s ease-in-out;
  transform: scale(5.5);
}

.unit.is-attacking { animation: attackShake 0.4s ease-in-out; }
.unit.is-damaged { animation: damageFlash 0.3s linear 2; }

@keyframes dragonShake {
  0%, 100% { transform: scale(5.5) translateX(0); }
  25% { transform: scale(5.5) translateX(-5px); }
  75% { transform: scale(5.5) translateX(5px); }
}

@keyframes attackShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes damageFlash {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.5) saturate(1.2); }
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
</style>
```