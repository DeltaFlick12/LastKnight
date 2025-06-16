<template>
  <div class="caverna-view" :style="showCutscene ? cutsceneBackgroundStyle : backgroundStyle">
    <!-- Heat Overlay -->
    <div v-if="showHeatEffect" class="heat-overlay"></div>

    <!-- Cutscene -->
    <div v-if="showCutscene" class="cutscene-container" tabindex="0">
      <div class="cutscene-content">
        <div v-for="(line, index) in cutsceneLines" :key="index" class="cutscene-line" :class="{ visible: index < currentCutsceneLine }">
          <span class="typewriter">{{ displayedLines[index] || '' }}</span>
        </div>
        <div
          v-if="currentCutsceneLine >= cutsceneLines.length"
          class="cutscene-arrow"
          @click.stop="endCutscene"
          role="button"
          aria-label="Avançar"
        >
          ➤
        </div>
      </div>
    </div>

    <!-- HUD -->
    <div v-if="inBattle && !showCutscene" class="main-hud">
      <div class="panel-frame">
        <div class="stat vida">
          <div class="icon-container">
            <img src="/icons/life-icon.png" alt="Vida" class="icon" />
          </div>
          <div class="bar-container segmented">
            <div
              v-for="i in maxBarSegments"
              :key="`vida-${i}`"
              class="segment"
              :class="{ filled: i <= filledHealthSegments }"
            ></div>
            <span class="bar-label">
              {{ Math.floor(playerCharacter.currentHp) }}/{{ Math.floor(playerCharacter.maxHp) }}
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
              {{ Math.floor(playerCharacter.currentStamina) }}/{{ Math.floor(playerCharacter.maxStamina) }}
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

      <!-- Post-Battle -->
      <div v-if="!inBattle && bossDefeated && !showCutscene" class="interactions">
        <p>O Dragão de Fogo foi derrotado. As chamas se extinguem lentamente.</p>
        <p v-if="!hasFireKey">Uma Chave Incandescente brilha entre as cinzas.</p>
        <button v-if="!hasFireKey" @click="collectKey">Pegar Chave Incandescente</button>
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
            :style="{ top: `${playerCharacter.top}px`, left: `${playerCharacter.left}px` }"
          >
            <img :src="playerSprite" alt="Player" class="character-sprite" />
          </div>
          <div class="character-info player-info">
            <span class="character-name">{{ playerCharacter.name }} ({{ playerCharacter.className }})</span>
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

    <!-- Navigation Bar -->
    <div class="navigation-bar" v-if="!showCutscene">
      <button
        v-if="bossDefeated"
        class="nav-btn"
        @click="goToNextArea"
        aria-label="Seguir para próxima área"
        :disabled="!bossDefeated"
      >
        Seguir para Próxima Área
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { playAudio } from '@/utils/audioManager.js';

// Import assets
import caveImage1 from '@/assets/backviews/caverna-entrada.png';
import caveImage2 from '@/assets/backviews/caverna-confronto.png';
import caveBattleImage from '@/assets/backviews/caverna-cenario.png';
import dragonFireSprite from '@/assets/sprites/dragao-fogo.png';
import playerSprite from '@/assets/sprites/player/player_idle.png';
import attackEffectSpritePlayer from '@/assets/sprites/ataque-efeito.png';
import attackEffectSpriteDragon from '@/assets/sprites/ataque-dragao.png';

const battleMusic = new Audio('/audio/musica-combate.mp3');
battleMusic.loop = true;

const router = useRouter();

// Direct audio handling for cutscene music
const suspenseMusic = ref(null);

// Game State Store (Mock, replace with actual store)
const gameState = reactive({
  player: {
    name: 'Herói',
    classe: 'Guerreiro',
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    potions: 3,
    gold: 0,
    keys: { ancestral: false, ice: false, fire: false },
    hasViewedCavernaCutscene: false,
    levelsCompleted: [],
  },
});
const actions = {
  setCurrentArea(area) { gameState.player.currentArea = area; },
  collectKey(key) { gameState.player.keys[key] = true; },
  completeLevel(level) {
    if (!gameState.player.levelsCompleted.includes(level)) {
      gameState.player.levelsCompleted.push(level);
    }
  },
  addItemFromInventory(item, quantity) {
    gameState.player[item] = (gameState.player[item] || 0) + quantity;
  },
  removeItemFromInventory(item, quantity) {
    if (gameState.player[item]) {
      gameState.player[item] = Math.max(0, gameState.player[item] - quantity);
    }
  },
  getItemQuantity(item) { return gameState.player[item] || 0; },
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
const displayedLines = ref([]);
const cutsceneBackgroundImage = ref(caveImage1);
const isFading = ref(false);

// Heat Effect State
const showHeatEffect = ref(false);

// Game State
const showFeedback = ref(false);
const feedbackMessage = ref('');
const bossDefeated = ref(false);
const inBattle = ref(false);
const currentEnemyIndex = ref(0);
const hasFireKey = computed(() => gameState.player.keys.fire);

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

// HUD
const maxBarSegments = 10;
const filledHealthSegments = computed(() =>
  Math.round((playerCharacter.currentHp / playerCharacter.maxHp) * maxBarSegments)
);
const filledStaminaSegments = computed(() =>
  Math.round((playerCharacter.currentStamina / playerCharacter.maxStamina) * maxBarSegments)
);

// Player Character
const playerCharacter = reactive({
  name: gameState.player.name,
  className: gameState.player.classe,
  hpPercent: 100,
  currentHp: gameState.player.health,
  maxHp: gameState.player.maxHealth,
  currentStamina: gameState.player.stamina,
  maxStamina: gameState.player.maxStamina,
  top: 300,
  left: 50,
  attackPower: 20,
});

// Enemy Configuration
const enemiesConfig = [
  {
    name: 'Dragão de Fogo',
    hpPercent: 100,
    currentHp: 200,
    maxHp: 200,
    top: 200,
    left: '80vw',
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
const battleLog = ref([]);
const battleStatus = ref('Desfira seu golpe!');
const gameOver = ref(false);
const victory = ref(false);
const damagePopup = reactive({ active: false, value: 0, top: 0, left: 0, type: 'enemy-damage', prefix: '-' });
const attackEffect = reactive({ active: false, style: {}, sprite: null });

// Computed Properties
const potionCount = computed(() => actions.getItemQuantity('potions'));
const canUsePotion = computed(() => potionCount.value > 0 && playerCharacter.currentHp < playerCharacter.maxHp);
const activeEnemies = computed(() => enemies.filter(enemy => enemy.hpPercent > 0 && enemies.indexOf(enemy) === currentEnemyIndex.value));
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
    Object.assign(damagePopup, {
      active: true,
      value,
      top: rect.top - containerRect.top + rect.height / 2 - 20,
      left: rect.left - containerRect.left + rect.width / 2,
      type,
      prefix: type === 'hp-heal' ? '+' : '-',
    });
    setTimeout(() => Object.assign(damagePopup, { active: false }), 800);
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
  } catch (err) {
    console.warn('Error in showAttackEffect:', err);
  }
};

// Cutscene Logic
const playCutscene = async () => {
  try {
    suspenseMusic.value = new Audio('/audio/musica-sus.mp3');
    suspenseMusic.value.loop = true;
    console.log('Attempting to play musica-sus.mp3 directly');
    await suspenseMusic.value.play();
    console.log('musica-sus.mp3 started playing');
  } catch (err) {
    console.error('Failed to play musica-sus.mp3 directly:', err);
    feedbackMessage.value = 'Não foi possível tocar a música de suspense. Verifique se há interação do usuário.';
    showFeedback.value = true;
  }
  try {
    playAudio('cave_ambient', { loop: true });
    console.log('Playing cave_ambient');
  } catch (err) {
    console.error('Failed to play cave_ambient:', err);
  }
  playAudio('fire_crackle');
  displayedLines.value = new Array(cutsceneLines.length).fill('');
  for (let i = 0; i < cutsceneLines.length; i++) {
    currentCutsceneLine.value = i + 1;
    const text = cutsceneLines[i];
    if (i === 4) {
      cutsceneBackgroundImage.value = caveImage2;
    }
    for (let j = 0; j <= text.length; j++) {
      displayedLines.value[i] = text.slice(0, j);
      displayedLines.value = [...displayedLines.value];
      if (j > 0) playAudio('typewriter_click');
      await sleep(50);
    }
    if (i === 4) {
      playAudio('dragon_fire_roar');
      isFading.value = true;
      await sleep(500);
      isFading.value = false;
      await sleep(2000);
    } else {
      await sleep(1500);
    }
  }
};

const endCutscene = async () => {
  try {
    if (suspenseMusic.value) {
      suspenseMusic.value.pause();
      suspenseMusic.value.currentTime = 0;
      console.log('Stopped musica-sus.mp3 directly');
      suspenseMusic.value = null;
    }
  } catch (err) {
    console.error('Failed to stop musica-sus.mp3 directly:', err);
  }
  try {
    playAudio('cave_ambient', { stop: true });
    console.log('Stopped cave_ambient');
  } catch (err) {
    console.error('Failed to stop cave_ambient:', err);
  }
  isFading.value = true;
  await sleep(500);
  isFading.value = false;
  showCutscene.value = false;
  gameState.player.hasViewedCavernaCutscene = true;
};

// Game Functions
const confrontBoss = () => {
  inBattle.value = true;
  currentEnemyIndex.value = 0;
  battleLog.value = [`${playerCharacter.name} enfrenta o Dragão de Fogo!`];
  playAudio('battle_start_dragon_fire');
  feedbackMessage.value = 'O Dragão de Fogo surge rugindo das chamas!';
  showFeedback.value = true;
  battleMusic.pause();
  battleMusic.currentTime = 0;
  battleMusic.play().catch(err => console.warn('Error playing battle music:', err));
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
  const enemyIndex = currentEnemyIndex.value;
  const enemy = enemies[enemyIndex];
  const playerElement = document.querySelector('.player-character');
  const enemyElement = document.querySelectorAll('.enemy-character')[0];
  battleStatus.value = `${playerCharacter.name} ataca!`;
  addLogMessage(`⚔️ ${playerCharacter.name} golpeia!`);
  playAudio('attack');
  const originalLeft = playerCharacter.left;
  playerCharacter.left += 40;
  await sleep(200);
  await showAttackEffect(playerElement, enemyElement, true);
  playerCharacter.left = originalLeft;
  damagedEnemy.value = enemyIndex;
  const damageDealt = playerCharacter.attackPower + Math.floor(Math.random() * 6 + 10);
  enemy.currentHp = Math.max(0, enemy.currentHp - damageDealt);
  enemy.hpPercent = (enemy.currentHp / enemy.maxHp) * 100;
  showPopup(damageDealt, enemyElement, 'enemy-damage');
  addLogMessage(`<span style="color: #d0a070;">💥 ${damageDealt} de dano!</span>`);
  await sleep(500);
  damagedEnemy.value = null;
  playerAttacking.value = false;
  if (enemy.hpPercent <= 0) {
    addLogMessage(`<span style="color: #a09080;">☠️ Dragão de Fogo caiu!</span>`);
    victory.value = true;
    battleStatus.value = 'Triunfo!';
    handleVictory();
    isAttacking.value = false;
    return;
  }
  isPlayerTurn.value = false;
  battleStatus.value = `Dragão de Fogo prepara um ataque!`;
  await sleep(1000);
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
  actions.removeItemFromInventory('potions', 1);
  const healAmount = 30;
  playerCharacter.currentHp = Math.min(playerCharacter.maxHp, playerCharacter.currentHp + healAmount);
  playerCharacter.hpPercent = (playerCharacter.currentHp / playerCharacter.maxHp) * 100;
  gameState.player.health = playerCharacter.currentHp;
  showPopup(healAmount, playerElement, 'hp-heal');
  addLogMessage(`<span style="color: #90c090;">🧪 +${healAmount} vida!</span>`);
  playAudio('potion');
  await sleep(1000);
  isPlayerTurn.value = false;
  battleStatus.value = `Dragão de Fogo prepara um ataque!`;
  await sleep(1000);
  await enemyTurn();
  if (!gameOver.value && !victory.value) {
    isPlayerTurn.value = true;
    battleStatus.value = 'Desfira seu golpe!';
  }
  isAttacking.value = false;
};

const enemyTurn = async () => {
  if (!activeEnemies.value.length || playerCharacter.hpPercent <= 0) return;
  const enemy = enemies[currentEnemyIndex.value];
  const playerElement = document.querySelector('.player-character');
  const enemyElement = document.querySelectorAll('.enemy-character')[0];
  addLogMessage(`<b>🐉 Dragão de Fogo</b> ataca!`);
  playAudio('hit');
  await sleep(800);
  enemyAttacking.value = currentEnemyIndex.value;
  const damageTaken = enemy.attackPower + Math.floor(Math.random() * 6 + 5);
  playerCharacter.currentHp = Math.max(0, playerCharacter.currentHp - damageTaken);
  playerCharacter.hpPercent = (playerCharacter.currentHp / playerCharacter.maxHp) * 100;
  gameState.player.health = playerCharacter.currentHp;
  showPopup(damageTaken, playerElement, 'player-damage');
  addLogMessage(`<span style="color: #c06060;">💥 ${playerCharacter.name} sofre ${damageTaken} de dano!</span>`);
  await sleep(500);
  enemyAttacking.value = null;
  damagedPlayer.value = true;
  await sleep(300);
  damagedPlayer.value = false;
  if (playerCharacter.hpPercent <= 0) {
    gameOver.value = true;
    addLogMessage(`<b>💀 ${playerCharacter.name} foi derrotado!</b>`);
    handleDefeat();
    isAttacking.value = false;
    return;
  }
};

const handleVictory = () => {
  bossDefeated.value = true;
  actions.completeLevel('caverna_boss');
  inBattle.value = false;
  gameState.player.gold += 100;
  actions.addItemFromInventory('fire_shard', 1);
  addLogMessage(`<span style="color: #d0a070;">💰 +100 ouro!</span>`);
  addLogMessage(`<span style="color: #d0a070;">🎁 Fragmento de Fogo!</span>`);
  playAudio('boss_defeat');
  feedbackMessage.value = 'Dragão de Fogo derrotado!';
  showFeedback.value = true;
  battleMusic.pause();
  battleMusic.currentTime = 0;
};

const handleDefeat = () => {
  gameState.player.health = 0;
  inBattle.value = false;
  playAudio('player_defeat');
  feedbackMessage.value = 'Você foi derrotado!';
  showFeedback.value = true;
  battleMusic.pause();
  battleMusic.currentTime = 0;
  setTimeout(() => router.push('/'), 2000);
};

const collectKey = () => {
  if (bossDefeated.value && !gameState.player.keys.fire) {
    actions.collectKey('fire');
    playAudio('collect_key_fire');
    feedbackMessage.value = 'Chave Incandescente obtida!';
    showFeedback.value = true;
  } else {
    feedbackMessage.value = 'Não há chave aqui ou você já a pegou.';
    showFeedback.value = true;
  }
};

const fleeArea = () => {
  playAudio('ui_confirm');
  router.push('/map');
};

const goToNextArea = () => {
  if (!bossDefeated.value) return;
  playAudio('ui_confirm');
  router.push({ name: 'NextArea' });
};

// Lifecycle Hooks
onMounted(() => {
  actions.setCurrentArea('Caverna de Fogo');
  bossDefeated.value = gameState.player.levelsCompleted.includes('caverna_boss');
  if (!bossDefeated.value && !gameState.player.hasViewedCavernaCutscene) {
    showCutscene.value = true;
    playCutscene();
  } else {
    showCutscene.value = false;
  }
});

// Watch for health and stamina changes
watch(
  () => [gameState.player.health, gameState.player.stamina],
  ([newHealth, newStamina]) => {
    playerCharacter.currentHp = newHealth;
    playerCharacter.hpPercent = (newHealth / playerCharacter.maxHp) * 100;
    playerCharacter.currentStamina = newStamina;
  }
);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');

.caverna-view {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: auto;
  transition: opacity 0.5s ease;
  background-color: #3c2f2f; /* Fallback color */
}

/* Heat Overlay */
.heat-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 69, 0, 0.3);
  animation: heatPulse 2s ease-in-out;
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
}

.cutscene-content {
  position: relative;
  background: rgba(40, 20, 10, 0.95);
  border: 4px solid #b64e1a;
  padding: 20px;
  max-width: 800px;
  margin-bottom: 100px;
  text-align: left;
  color: #f0d0a0;
  font-family: 'MedievalSharp', cursive;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.cutscene-line {
  line-height: 1.6;
  margin-bottom: 10px;
  display: block;
  opacity: 0;
}

.cutscene-line.visible {
  opacity: 1;
  display: block;
}

.typewriter {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
}

.cutscene-arrow {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background-color: #b64e1a;
  border: 2px solid #8b3e15;
  color: #f0d0a0;
  font-size: 24px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.1s;
  margin: 10px auto 0;
}

.cutscene-arrow:hover {
  background-color: #c85d27;
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
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.interactions, .feedback-box {
  background-color: rgba(70, 30, 20, 0.85);
  padding: 20px;
  border: 2px solid #b64e1a;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
  color: #f0d0a0;
  font-family: 'MedievalSharp', serif;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}

.interactions {
  position: absolute;
  bottom: 15%;
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
  margin-bottom: 15px;
  font-size: 16px;
}

.feedback-box button, .interactions button, .action-btn, .nav-btn {
  background-color: #b64e1a;
  border: 2px solid #8b3e15;
  color: #f0d0a0;
  padding: 8px;
  border-radius: 12px;
  cursor: pointer;
  font-family: 'Arial', sans-serif;
  font-size: 18px;
  transition: filter 0.2s, transform 0.1s;
}

.feedback-box button:hover:not(:disabled), .interactions button:hover:not(:disabled), .action-btn:hover:not(:disabled), .nav-btn:hover:not(:disabled) {
  filter: brightness(1.2);
}

.feedback-box button:active:not(:disabled), .interactions button:active:not(:disabled), .action-btn:active:not(:disabled), .nav-btn:active:not(:disabled) {
  transform: scale(0.95);
}

/* Navigation Bar */
.navigation-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: rgba(40, 20, 10, 0.95);
  border-top: 4px solid #8b3e15;
  padding: 10px 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
  z-index: 10;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Battle */
.medieval-battle-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.battle-arena {
  position: relative;
  width: 100%;
  height: 80vh;
  overflow: hidden;
}

.game-status-top {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  color: #f0d0a0;
  background: rgba(40, 20, 10, 0.9);
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 20;
  border: 2px solid #b64e1a;
  font-family: 'MedievalSharp', cursive;
}

.victory-message, .game-over-message {
  font-size: 18px;
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

.player-character { z-index: 10; }
.enemy-character { z-index: 9; }
.enemy-character.fainted { filter: grayscale(100%) opacity(40%); }

.character-info {
  position: absolute;
  background: rgba(40, 20, 10, 0.9);
  border: 8px solid #b64e1a;
  border-radius: 8px;
  padding: 10px;
  color: #f0d0a0;
  font-size: 12px;
  min-width: 180px;
}

.player-info {
  bottom: 20px;
  left: 20px;
  z-index: 5;
}

.enemy-info { text-align: right; }

.character-name {
  font-weight: bold;
  font-size: 14px;
  color: #ffd700;
  margin-bottom: 8px;
  display: block;
}

.resource-bar-container {
  display: flex;
  align-items: center;
  height: 18px;
}

.hp-bar-label {
  font-size: 12px;
  font-weight: bold;
  margin-right: 8px;
  width: 40px;
}

.hp-bar {
  flex-grow: 1;
  height: 14px;
  border: 2px solid #8b3e15;
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
}

.battle-log-container {
  width: 100%;
  height: 20vh;
  background: rgba(40, 20, 10, 0.95);
  border-top: 4px solid #8b3e15;
  display: flex;
  justify-content: space-between;
  padding: 10px;
}

.battle-log {
  width: 60%;
  height: 100%;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.5;
  padding: 10px;
  border: 2px solid #b64e1a;
  border-radius: 5px;
  color: #f0d0a0;
}

.battle-log p { margin: 0 0 6px 0; }

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
  font-size: 14px;
  font-style: italic;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.potion-btn {
  background-color: #c85d27;
}

.enemy-character.dragao-fogo {
  transform: scale(3.5);
  transform-origin: center bottom;
}

.enemy-character.dragao-fogo.is-attacking {
  animation: dragonShake 0.4s ease-in-out;
  transform: scale(3.5);
}

.unit.is-attacking { animation: attackShake 0.4s ease-in-out; }
.unit.is-damaged { animation: damageFlash 0.3s linear 2; }

@keyframes dragonShake {
  0%, 100% { transform: scale(3.5) translateX(0); }
  25% { transform: scale(3.5) translateX(-5px); }
  75% { transform: scale(3.5) translateX(5px); }
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
  font-size: 18px;
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

.action-btn {
  font-family: 'MedievalSharp', cursive;
  background: linear-gradient(to bottom, #b64e1a, #8b3e15);
  border: 3px solid #5d2f0a;
  color: #f0d0a0;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 8px;
  text-shadow: 1px 1px 2px #000;
  box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.1), 2px 2px 6px rgba(0, 0, 0, 0.5);
  transition: transform 0.1s, filter 0.2s;
}

.action-btn:hover:not(:disabled) {
  filter: brightness(1.2);
}

.action-btn:active:not(:disabled) {
  transform: scale(0.97);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.6);
}
</style>