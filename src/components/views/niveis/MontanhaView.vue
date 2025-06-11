```vue
<template>
  <div class="montanha-view" :style="showDialogue || showCutscene ? dialogueOrCutsceneBackgroundStyle : backgroundStyle">
    <!-- Cold Overlay -->
    <div v-if="showColdEffect" class="cold-overlay"></div>

    <!-- Dialogue (at mountain base) -->
    <div v-if="showDialogue" class="dialogue-container" tabindex="0">
      <div class="dialogue-content">
        <div v-for="(line, index) in dialogueLines" :key="index" class="dialogue-line" :class="{ visible: index < currentDialogueLine }">
          <span class="typewriter" ref="typewriterDialogueSpans">{{ displayedDialogueLines[index] || '' }}</span>
        </div>
        <div
          v-if="currentDialogueLine >= dialogueLines.length"
          class="dialogue-arrow"
          @click.stop="endDialogue"
          role="button"
          aria-label="Avançar para a interação"
        >
          ➤
        </div>
      </div>
    </div>

    <!-- Cutscene (at summit) -->
    <div v-if="showCutscene" class="cutscene-container" tabindex="0">
      <div class="cutscene-content">
        <div v-for="(line, index) in cutsceneLines" :key="index" class="cutscene-line" :class="{ visible: index < currentCutsceneLine }">
          <span class="typewriter" ref="typewriterSpans">{{ displayedLines[index] || '' }}</span>
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

    <!-- HUD (visible during battle) -->
    <div v-if="inBattle && !showDialogue && !showCutscene" class="main-hud">
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
      <!-- Interactions at Mountain Base -->
      <div v-if="atMountainBase && !showDialogue && !showCutscene && !inBattle" class="interactions">
        <p>O vento uiva ao redor da base da Montanha de Gelo.</p>
        <p>Escalar parece perigoso, mas o topo guarda segredos.</p>
        <div class="interaction-buttons">
          <button @click="climbMountain" :disabled="gameState.player.stamina < 20">
            Escalar Montanha
          </button>
          <button @click="fleeArea">Fugir</button>
        </div>
      </div>
      <!-- Interactions at Summit -->
      <div v-if="!atMountainBase && !bossDefeated && !inBattle && !showCutscene && !showDialogue" class="interactions">
        <p>O ar gélido corta seus pulmões. A montanha é traiçoeira.</p>
        <p><strong>Inimigo Final:</strong> O Dragão de Gelo aguarda no pico.</p>
        <div class="interaction-buttons">
          <button @click="confrontBoss">Enfrentar o Dragão de Gelo</button>
          <button @click="fleeArea">Fugir</button>
        </div>
      </div>
      <!-- Post-Battle Interactions -->
      <div v-if="!inBattle && bossDefeated && !showCutscene && !showDialogue" class="interactions">
        <p>O Dragão de Gelo foi derrotado. A nevasca parece diminuir.</p>
        <p v-if="!gameState.player.keys.ice">Uma chave congelada repousa onde o dragão caiu.</p>
        <button v-if="!gameState.player.keys.ice" @click="collectKey">Pegar a Chave de Gelo</button>
      </div>

      <!-- Battle System -->
      <div v-if="inBattle && !showDialogue && !showCutscene" class="medieval-battle-container">
        <div class="battle-arena">
          <div class="game-status-top">
            <div v-if="!gameOver && !victory">{{ battleStatus }}</div>
            <div v-if="victory" class="victory-message">✨ Triunfo! Dragão de Gelo caiu! ✨</div>
            <div v-if="gameOver" class="game-over-message">💀 Derrota! A escuridão prevaleceu... 💀</div>
          </div>

          <!-- Player Character -->
          <div class="character-info player-info">
            <span class="character-name">{{ playerCharacter.name }} ({{ playerCharacter.className }})</span>
            <div class="resource-bar-container">
              <div class="hp-bar-label">Vida:</div>
              <div class="hp-bar">
                <div class="hp" :style="{ width: `${playerCharacter.hpPercent}%` }"></div>
              </div>
              <span class="resource-value">{{ playerCharacter.currentHp }}/{{ playerCharacter.maxHp }}</span>
            </div>
          </div>
          <div
            class="unit player-character"
            :class="{ 'is-attacking': playerAttacking, 'is-damaged': damagedPlayer }"
            :style="{ top: `${playerCharacter.top}px`, left: `${playerCharacter.left}px` }"
          >
            <img :src="playerSprite" alt="Player" class="character-sprite" />
          </div>

          <!-- Enemy (Ice Dragon) -->
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
              class="unit enemy-character"
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
            <img :src="attackEffectSprite" alt="Attack Effect" class="effect-sprite" />
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
            Dragão de Gelo prepara um ataque...
          </div>
        </div>
      </div>

      <!-- Feedback Box -->
      <div v-if="showFeedback && !showDialogue && !showCutscene" class="dialog-box feedback-box">
        <p>{{ feedbackMessage }}</p>
        <button @click="showFeedback = false">Ok</button>
      </div>
    </div>

    <!-- Navigation Bar -->
    <div class="navigation-bar" v-if="!showDialogue && !showCutscene">
      <button
        v-if="bossDefeated"
        class="nav-btn"
        @click="goToNextArea"
        aria-label="Seguir para Caverna"
        :disabled="!bossDefeated"
      >
        Seguir para Caverna
      </button>
    </div>
  </div>
</template>

<script setup>
import montanhaBaseImage from '@/assets/backviews/montanha-base.png';
import montanhaImage from '@/assets/backviews/montanha.png';
import playerEmergingImage from '@/assets/backviews/player-emerging.png';
import dragonIceSprite from '@/assets/sprites/dragon-ice-sprite.png';
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameState } from '@/stores/gamestate.js'; // Import useGameState instead of gameState and actions
import { playAudio } from '@/utils/audioManager.js';

const router = useRouter();
const gameState = useGameState(); // Initialize the Pinia store

// Dialogue State (at mountain base)
const showDialogue = ref(true);
const currentDialogueLine = ref(0);
const dialogueLines = [
  'A Montanha de Gelo se ergue diante de você, implacável e gelada.',
  'O vento corta como lâminas, e a neve cobre qualquer traço de vida.',
  'Escalar será um desafio, mas o topo guarda algo poderoso.',
];
const displayedDialogueLines = ref([]);
const typewriterDialogueSpans = ref([]);

// Cutscene State (at summit)
const showCutscene = ref(false);
const currentCutsceneLine = ref(0);
const cutsceneLines = [
  'Você alcança o topo, exausto, o ar rarefeito queimando seus pulmões.',
  'Picos nevados se estendem até onde a vista alcança, cobertos por neve intocada.',
  'Um rugido ensurdecedor rasga o ar. O Dragão de Gelo desce, suas escamas brilhando.',
  'Seu destino é enfrentar a fera ou ser congelado por sua ira.',
];
const displayedLines = ref([]);
const cutsceneBackgroundImage = ref(playerEmergingImage);
const isFading = ref(false);

// Cold Effect State
const showColdEffect = ref(false);

// Game State
const atMountainBase = ref(true);
const showFeedback = ref(false);
const feedbackMessage = ref('');
const bossDefeated = ref(false);
const inBattle = ref(false);
const currentEnemyIndex = ref(0);

// Background Styles
const montanhaBattleDragonImage = montanhaImage; // Fallback since commented out
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${inBattle.value ? montanhaBattleDragonImage : montanhaImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: isFading.value ? 0 : 1,
  transition: 'opacity 0.5s ease',
}));
const dialogueOrCutsceneBackgroundStyle = computed(() => ({
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${
    showDialogue.value ? montanhaBaseImage : cutsceneBackgroundImage.value
  })`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: isFading.value ? 0 : 1,
  transition: 'opacity 0.5s ease',
}));

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
  hpPercent: (gameState.player.health / gameState.player.maxHealth) * 100,
  currentHp: gameState.player.health || 100,
  maxHp: gameState.player.maxHealth || 100,
  currentStamina: gameState.player.stamina || 100,
  maxStamina: gameState.player.maxStamina || 100,
  top: 300,
  left: 50,
  attackPower: 20,
});

// Enemy Configuration (only Ice Dragon)
const enemiesConfig = [
  {
    name: 'Dragão de Gelo',
    hpPercent: 100,
    currentHp: 200,
    maxHp: 200,
    top: 200,
    left: 1100,
    attackPower: 25,
  },
];
const initialEnemyPositions = enemiesConfig.map(enemy => ({ top: enemy.top, left: enemy.left }));
const enemies = reactive(enemiesConfig.map(enemy => ({ ...enemy })));
const enemySprites = {
  'Dragão de Gelo': dragonIceSprite,
};

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
const attackEffect = reactive({ active: false, style: {} });
const playerSprite = playerEmergingImage; // Fallback since commented out
const attackEffectSprite = dragonIceSprite; // Fallback since commented out

// Computed Properties
const potionCount = computed(() => gameState.player.potions || 0);
const canUsePotion = computed(() => potionCount.value > 0 && playerCharacter.currentHp < playerCharacter.maxHp);
const activeEnemies = computed(() => enemies.filter(enemy => enemy.hpPercent > 0 && enemies.indexOf(enemy) === currentEnemyIndex.value));
const enemyInfoStyle = index => ({
  top: `${initialEnemyPositions[index].top - 90}px`,
  left: `calc(80vw - ${120 + index * 50}px)`,
});
const enemyStyle = (index, enemy) => ({
  top: `${enemy.hpPercent > 0 ? enemy.top : initialEnemyPositions[index].top}px`,
  left: `${enemy.hpPercent > 0 ? `calc(80vw - ${index * 50}px)` : initialEnemyPositions[index].left}px`,
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

const showAttackEffect = async (attackerElement, targetElement) => {
  const startRect = attackerElement.getBoundingClientRect();
  const endRect = targetElement.getBoundingClientRect();
  const containerRect = document.querySelector('.battle-arena').getBoundingClientRect();
  Object.assign(attackEffect, {
    active: true,
    style: {
      top: `${startRect.top - containerRect.top + startRect.height / 2}px`,
      left: `${startRect.left - containerRect.left + startRect.width / 2}px`,
      opacity: 1,
    },
  });
  await sleep(50);
  Object.assign(attackEffect.style, {
    top: `${endRect.top - containerRect.top + endRect.height / 2}px`,
    left: `${endRect.left - containerRect.left + endRect.width / 2}px`,
    opacity: 0,
    transition: 'top 0.3s ease-out, left 0.3s ease-out, opacity 0.3s ease-out',
  });
  await sleep(300);
  Object.assign(attackEffect, { active: false, style: {} });
};

// Dialogue Logic
const playDialogue = async () => {
  playAudio('mountain_ambient', { loop: true });
  playAudio('wind_howl');
  displayedDialogueLines.value = new Array(dialogueLines.length).fill('');
  for (let i = 0; i < dialogueLines.length; i++) {
    currentDialogueLine.value = i + 1;
    const text = dialogueLines[i];
    for (let j = 0; j <= text.length; j++) {
      displayedDialogueLines.value[i] = text.slice(0, j);
      displayedDialogueLines.value = [...displayedDialogueLines.value];
      if (j > 0) playAudio('typewriter_click');
      await sleep(50);
    }
    await sleep(1500);
  }
};

const endDialogue = async () => {
  playAudio('mountain_ambient', { stop: true });
  isFading.value = true;
  await sleep(500);
  showDialogue.value = false;
  isFading.value = false;
  gameState.player.hasViewedMontanhaDialogue = true;
};

// Cutscene Logic
const typewriterSpans = ref([]);
const playCutscene = async () => {
  playAudio('mountain_ambient', { loop: true });
  playAudio('wind_howl');
  displayedLines.value = new Array(cutsceneLines.length).fill('');
  cutsceneBackgroundImage.value = playerEmergingImage;
  for (let i = 0; i < cutsceneLines.length; i++) {
    currentCutsceneLine.value = i + 1;
    const text = cutsceneLines[i];
    for (let j = 0; j <= text.length; j++) {
      displayedLines.value[i] = text.slice(0, j);
      displayedLines.value = [...displayedLines.value];
      if (j > 0) playAudio('typewriter_click');
      await sleep(50);
    }
    if (i === 2) {
      playAudio('dragon_ice_roar');
      isFading.value = true;
      await sleep(500);
      cutsceneBackgroundImage.value = montanhaBattleDragonImage;
      isFading.value = false;
      await sleep(2000);
    } else {
      await sleep(1500);
    }
  }
};

const endCutscene = async () => {
  playAudio('mountain_ambient', { stop: true });
  isFading.value = true;
  await sleep(500);
  cutsceneBackgroundImage.value = montanhaImage;
  isFading.value = false;
  showCutscene.value = false;
  gameState.player.hasViewedMontanhaCutscene = true;
};

// Game Functions
const climbMountain = async () => {
  if (gameState.player.stamina < 20) {
    feedbackMessage.value = 'Você está exausto para escalar! Recupere energia.';
    showFeedback.value = true;
    playAudio('ui_error');
    return;
  }
  playAudio('ui_confirm');
  playerCharacter.currentStamina = Math.max(0, playerCharacter.currentStamina - 20);
  gameState.player.stamina = playerCharacter.currentStamina;
  feedbackMessage.value = 'Você escala a montanha, mas o frio intenso castiga seu corpo!';
  showFeedback.value = true;
  showColdEffect.value = true;
  playAudio('cold_shiver');
  playerCharacter.currentHp = Math.max(1, playerCharacter.currentHp - 5);
  gameState.player.health = playerCharacter.currentHp;
  playerCharacter.hpPercent = (playerCharacter.currentHp / playerCharacter.maxHp) * 100;
  isFading.value = true;
  await sleep(2000);
  showColdEffect.value = false;
  isFading.value = false;
  atMountainBase.value = false;
  showCutscene.value = true;
  playCutscene();
};

const confrontBoss = () => {
  inBattle.value = true;
  currentEnemyIndex.value = 0; // Ice Dragon
  battleLog.value = [`${playerCharacter.name} enfrenta o Dragão de Gelo!`];
  playAudio('battle_start_dragon_ice');
  feedbackMessage.value = 'O Dragão de Gelo surge rugindo da nevasca!';
  showFeedback.value = true;
};

const fleeArea = () => {
  playAudio('ui_back');
  router.push({ name: 'Acampamento' });
};

const collectKey = () => {
  if (bossDefeated.value && !gameState.player.keys.ice) {
    gameState.collectKey('ice'); // Use gameState instead of actions
    playAudio('collect_key_ice');
    feedbackMessage.value = 'Você obteve a Chave de Gelo!';
    showFeedback.value = true;
  } else {
    feedbackMessage.value = 'Não há chave aqui ou você já a pegou.';
    showFeedback.value = true;
  }
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
  await showAttackEffect(playerElement, enemyElement);
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
    addLogMessage(`<span style="color: #a09080;">☠️ Dragão de Gelo caiu!</span>`);
    victory.value = true;
    battleStatus.value = 'Triunfo!';
    handleVictory();
    isAttacking.value = false;
    return;
  }
  isPlayerTurn.value = false;
  battleStatus.value = `Dragão de Gelo prepara um ataque!`;
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
  gameState.removeItemFromInventory('potion', 1); // Use gameState instead of actions
  gameState.player.potions -= 1;
  const healAmount = 30;
  playerCharacter.currentHp = Math.min(playerCharacter.maxHp, playerCharacter.currentHp + healAmount);
  playerCharacter.hpPercent = (playerCharacter.currentHp / playerCharacter.maxHp) * 100;
  gameState.player.health = playerCharacter.currentHp;
  showPopup(healAmount, playerElement, 'hp-heal');
  addLogMessage(`<span style="color: #90c090;">🧪 +${healAmount} vida!</span>`);
  playAudio('potion');
  await sleep(1000);
  isPlayerTurn.value = false;
  battleStatus.value = `Dragão de Gelo prepara um ataque!`;
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
  addLogMessage(`<b>🐉 Dragão de Gelo</b> ataca!`);
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
  gameState.completeLevel('montanha_boss'); // Use gameState instead of actions
  inBattle.value = false;
  gameState.player.gold += 100;
  gameState.addItemToInventory('ice_shard', 1); // Use gameState instead of actions
  addLogMessage(`<span style="color: #d0a070;">💰 +100 ouro!</span>`);
  addLogMessage(`<span style="color: #d0a070;">🎁 Fragmento de Gelo!</span>`);
  playAudio('boss_defeat');
  feedbackMessage.value = 'Dragão de Gelo derrotado!';
  showFeedback.value = true;
};

const handleDefeat = () => {
  gameState.player.health = 0;
  inBattle.value = false;
  playAudio('player_defeat');
  feedbackMessage.value = 'Você foi derrotado!';
  showFeedback.value = true;
  setTimeout(() => router.push('/'), 2000);
};

const goToNextArea = () => {
  if (!bossDefeated.value) return;
  playAudio('ui_confirm');
  router.push({ name: 'Caverna' });
};

// Lifecycle Hooks
onMounted(() => {
  gameState.setCurrentArea('Montanha Congelada'); // Use gameState instead of actions
  if (!gameState.player.keys) {
    gameState.player.keys = reactive({ ancestral: false, ice: false, fire: false });
  }
  if (!gameState.player.stamina) {
    gameState.player.stamina = 100;
    gameState.player.maxStamina = 100;
  }
  if (!gameState.player.hasViewedMontanhaCutscene) {
    gameState.player.hasViewedMontanhaCutscene = false;
  }
  if (!gameState.player.hasViewedMontanhaDialogue) {
    gameState.player.hasViewedMontanhaDialogue = false;
  }
  if (!gameState.levelsCompleted) {
    gameState.levelsCompleted = reactive([]);
  }
  playerCharacter.currentStamina = gameState.player.stamina;
  playerCharacter.currentHp = gameState.player.health;
  bossDefeated.value = gameState.levelsCompleted.includes('montanha_boss');
  if (!bossDefeated.value && atMountainBase.value && !gameState.player.hasViewedMontanhaDialogue) {
    showDialogue.value = true;
    playDialogue();
  } else if (!bossDefeated.value && !atMountainBase.value && !gameState.player.hasViewedMontanhaCutscene) {
    showCutscene.value = true;
    playCutscene();
  } else {
    showDialogue.value = false;
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
@import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=UnifrakturMaguntia&display=swap');

.montanha-view {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: auto;
  transition: opacity 0.5s ease;
  background-color: #e0ffff; /* Fallback color */
}

/* Cold Overlay */
.cold-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(70, 130, 180, 0.3);
  animation: coldPulse 2s ease-in-out;
  pointer-events: none;
  z-index: 8;
}

@keyframes coldPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

/* Dialogue Style */
.dialogue-container {
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

.dialogue-content {
  position: relative;
  background: rgba(40, 60, 80, 0.95);
  border: 4px solid #4682b4;
  padding: 20px;
  max-width: 800px;
 root: 4px solid #2f4f4f;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.1s;
  margin: 10px auto 0;
}

.dialogue-arrow:hover {
  background-color: #5f9ea0;
}

.dialogue-arrow:active {
  transform: translate(1px, 1px);
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
}

.cutscene-content {
  position: relative;
  background: rgba(40, 60, 80, 0.95);
  border: 4px solid #4682b4;
  padding: 20px;
  max-width: 800px;
  margin-bottom: 100px;
  text-align: left;
  color: #e0f0ff;
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
  background-color: #4682b4;
  border: 2px solid #2f4f4f;
  color: #e0f0ff;
  font-size: 24px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.1s;
  margin: 10px auto 0;
}

.cutscene-arrow:hover {
  background-color: #5f9ea0;
}

.cutscene-arrow:active {
  transform: translate(1px, 1px);
}

/* HUD Styles */
.main-hud {
  position: fixed;
  bottom: 10px;
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
  border: 2px solid #2f4f4f;
  border-radius: 4px;
  overflow: hidden;
}

.bar-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #e0f0ff;
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
  border: 1px solid #2f4f4f;
}

.vida .segment.filled {
  background: linear-gradient(to bottom, #ff3333, #6a0f0f);
}

.energia .segment.filled {
  background: linear-gradient(to bottom, #33cc33, #0ff);
}

.content-area {
  flex-grow: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.interactions, .feedback-box {
  background-color: rgba(70, 130, 180, 0.85);
  padding: 20px;
  border: 2px solid #4682b4;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
  color: #e0f0ff;
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
  background-color: #4682b4;
  border: 2px solid #2f4f4f;
  color: #e0f0ff;
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

.navigation-bar {
  position: fixed;
  bottom: 10px;
  left: 0;
  width: 100%;
  background-color: rgba(40, 60, 80, 0.95);
  border-top: 4px solid #2f4f4f;
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

.medieval-battle-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(20, 30, 40, 0.9), rgba(20, 30, 40, 0.9));
}

.battle-arena {
  position: relative;
  width: 100%;
  height: 80vh;
  background: rgba(20, 30, 40, 0.95);
  overflow: hidden;
}

.game-status-top {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  color: #e0f0ff;
  background: rgba(40, 60, 80, 0.9);
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 20;
  border: 2px solid #4682b4;
  font-family: 'MedievalSharp', cursive;
}

.victory-message, .game-over-message {
  font-size: 18px;
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

.player-character { z-index: 10; }
.enemy-character { z-index: 9; }
.enemy-character.fainted { filter: grayscale(100%) opacity(40%); }

.character-info {
  position: absolute;
  background: rgba(40, 60, 80, 0.9);
  border: 8px solid #4682b4;
  border-radius: 8px;
  padding: 10px;
  color: #e0f0ff;
  font-size: 12px;
  min-width: 180px;
}

.player-info { bottom: 50px; left: 20px; }
.enemy-info { text-align: right; }

.character-name {
  font-weight: bold;
  font-size: 14px;
  color: #b0c4de;
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
  border: 2px solid #2f4f4f;
  border-radius: 5px;
  background: #1e2a38;
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
}

.battle-log-container {
  width: 100%;
  height: 20vh;
  background: rgba(40, 60, 80, 0.95);
  border-top: 4px solid #2f4f4f;
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
  border: 2px solid #4682b4;
  border-radius: 5px;
  color: #b0c4de;
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
  background: #4682b4;
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
  color: #b0c4de;
  font-size: 14px;
  font-style: italic;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.potion-btn {
  background-color: #5f9ea0;
}

.unit.is-attacking { animation: attackShake 0.4s ease-in-out; }
.unit.is-damaged { animation: damageFlash 0.3s linear 2; }

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
</style>