```vue
<template>
  <div class="ruinas-view" :style="showCutscene ? cutsceneBackgroundStyle : backgroundStyle">
    <!-- Cutscene -->
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
        <button @click="confrontBoss">Enfrentar o Dragão Ancestral</button>
        <button @click="fleeArea">Fugir</button>
      </div>
      <div v-if="!inBattle && bossDefeated && !showCutscene" class="interactions">
        <p>O Dragão Ancestral foi derrotado.</p>
        <p v-if="!gameState.player.keys.ancestral">Uma chave repousa nas cinzas.</p>
        <button v-if="!gameState.player.keys.ancestral" @click="collectKey">Pegar Chave Ancestral</button>
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
              class="unit enemy-character"
              :class="{ 'is-attacking': enemyAttacking === index, 'is-damaged': damagedEnemy === index, fainted: enemy.hpPercent <= 0 }"
              :style="enemyStyle(index, enemy)"
            >
              <img :src="enemySprite" alt="Enemy" class="character-sprite" />
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
            Aguarde sua vez...
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
import ruinasDragonImage from '@/assets/backviews/ruinas-dragon.png';
import ruinasBattleImage from '@/assets/backviews/ruinas-battle.png';
import warriorImage from '@/assets/backviews/warrior.png';
import warriorScaredImage from '@/assets/backviews/warrior-scared.png';
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameState } from '@/stores/gamestate.js'; // Import useGameState instead of gameState and actions
import { playAudio } from '@/utils/audioManager.js';

const router = useRouter();
const gameState = useGameState(); // Initialize the Pinia store

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
const displayedLines = ref([]);
const cutsceneBackgroundImage = ref(warriorImage);
const isFading = ref(false);

// Background Styles
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${
    inBattle.value && !showCutscene.value
      ? ruinasBattleImage
      : ruinasDragonImage // Default to dragon background
  })`,
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
  hpPercent: (gameState.player.health / gameState.player.maxHealth) * 100,
  currentHp: gameState.player.health || 100,
  maxHp: gameState.player.maxHealth || 100,
  currentStamina: gameState.player.stamina || 100,
  maxStamina: gameState.player.maxStamina || 100,
  top: 300,
  left: 50,
  attackPower: 15,
});

// Enemy Configuration
const enemiesConfig = [{
  name: 'Dragão Ancestral',
  hpPercent: 100,
  currentHp: 200,
  maxHp: 200,
  top: 200,
  left: 1100,
  attackPower: 20,
}];
const initialEnemyPositions = enemiesConfig.map(enemy => ({ top: enemy.top, left: enemy.left }));
const enemies = reactive(enemiesConfig.map(enemy => ({ ...enemy, hpPercent: 100 })));

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
const attackEffect = reactive({ active: false, style: {} });

// Computed Properties
const potionCount = computed(() => gameState.player.potions || 0);
const canUsePotion = computed(() => potionCount.value > 0 && playerCharacter.currentHp < playerCharacter.maxHp);
const activeEnemies = computed(() => enemies.filter(enemy => enemy.hpPercent > 0));
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

// Cutscene Logic with Background Transitions and Audio
const typewriterSpans = ref([]);
const playCutscene = async () => {
  playAudio('ruins_ambient', { loop: true });
  playAudio('cutscene_ruins_intro');
  displayedLines.value = new Array(cutsceneLines.length).fill('');
  cutsceneBackgroundImage.value = warriorImage;
  for (let i = 0; i < cutsceneLines.length; i++) {
    currentCutsceneLine.value = i + 1;
    const text = cutsceneLines[i];
    for (let j = 0; j <= text.length; j++) {
      displayedLines.value[i] = text.slice(0, j);
      displayedLines.value = [...displayedLines.value];
      if (j > 0) playAudio('typewriter_click');
      await sleep(50);
    }
    if (i === 3) {
      playAudio('dragon_roar');
      isFading.value = true;
      await sleep(500);
      cutsceneBackgroundImage.value = warriorScaredImage;
      isFading.value = false;
      await sleep(2000);
    } else {
      await sleep(1500);
    }
  }
};

const endCutscene = async () => {
  playAudio('ruins_ambient', { stop: true });
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
  playAudio('battle_start_dragon_ancestral');
  feedbackMessage.value = 'O Dragão Ancestral desperta!';
  showFeedback.value = true;
};

const collectKey = () => {
  if (bossDefeated.value && !gameState.player.keys.ancestral) {
    gameState.collectKey('ancestral'); // Use gameState instead of actions
    playAudio('collect_key_ancient');
    feedbackMessage.value = 'Chave Ancestral obtida!';
    showFeedback.value = true;
  } else {
    feedbackMessage.value = 'Nenhuma chave disponível.';
    showFeedback.value = true;
  }
};

const fleeArea = () => {
  playAudio('ui_back');
  router.push({ name: 'Acampamento' });
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
  const enemyElement = document.querySelectorAll('.enemy-character')[enemyIndex];
  battleStatus.value = `${playerCharacter.name} ataca!`;
  addLogMessage(`⚔️ ${playerCharacter.name} golpeia!`);
  const originalLeft = playerCharacter.left;
  playerCharacter.left += 40;
  await sleep(200);
  await showAttackEffect(playerElement, enemyElement);
  playerCharacter.left = originalLeft;
  damagedEnemy.value = enemyIndex;
  const damageDealt = playerCharacter.attackPower + Math.floor(Math.random() * 5);
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
  battleStatus.value = 'O dragão ruge!';
  await sleep(1000);
  isPlayerTurn.value = true;
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
  await sleep(1000);
  isPlayerTurn.value = false;
  battleStatus.value = 'O dragão ruge!';
  await sleep(1000);
  isPlayerTurn.value = true;
  isAttacking.value = false;
};

const handleVictory = () => {
  bossDefeated.value = true;
  gameState.completeLevel('ruinas_boss'); // Use gameState instead of actions
  inBattle.value = false;
  gameState.player.gold += 100;
  gameState.addItemToInventory('dragon_scale', 1); // Use gameState instead of actions
  addLogMessage(`<span style="color: #d0a070;">💰 +100 ouro!</span>`);
  addLogMessage(`<span style="color: #d0a070;">🎁 Escama de Dragão!</span>`);
  feedbackMessage.value = 'Dragão Ancestral derrotado!';
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
  router.push({ name: 'Acampamento' });
};

// Lifecycle Hooks
onMounted(() => {
  gameState.setCurrentArea('Ruínas Ancestrais'); // Use gameState instead of actions
  if (!gameState.player.keys) {
    gameState.player.keys = reactive({ ancestral: false, ice: false, fire: false });
  }
  if (!gameState.player.stamina) {
    gameState.player.stamina = 100;
    gameState.player.maxStamina = 100;
  }
  if (!gameState.player.hasViewedRuinasCutscene) {
    gameState.player.hasViewedRuinasCutscene = false;
  }
  if (!gameState.levelsCompleted) {
    gameState.levelsCompleted = reactive([]);
  }
  playerCharacter.currentStamina = gameState.player.stamina;
  playerCharacter.currentHp = gameState.player.health;
  bossDefeated.value = gameState.levelsCompleted.includes('ruinas_boss');
  if (!bossDefeated.value && !gameState.player.hasViewedRuinasCutscene) {
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
@import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=UnifrakturMaguntia&display=swap');

.ruinas-view {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: auto;
  transition: opacity 0.5s ease;
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
  background: rgba(40, 20, 10, 0.95);
  border: 4px solid #a07c50;
  padding: 20px;
  max-width: 800px;
  margin-bottom: 100px;
  text-align: left;
  color: #f0f0e0;
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
  background-color: #704d3a;
  border: 2px solid #5c4033;
  color: #d0b090;
  font-size: 24px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.1s;
  margin: 10px auto 0;
}

.cutscene-arrow:hover {
  background-color: #8b6a47;
}

.cutscene-arrow:active {
  transform: translate(1px, 1px);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Dialog Transition */
.feedback-box {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.feedback-box.fade-enter, .feedback-box.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -60%);
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
  border: 2px solid #333;
  border-radius: 4px;
  overflow: hidden;
}

.bar-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #fff9d6;
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
  border: 1px solid #222;
}

.vida .segment.filled {
  background: linear-gradient(to bottom, #ff3333, #6a0f0f);
}

.energia .segment.filled {
  background: linear-gradient(to bottom, #33cc33, #0b700b);
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
  background-color: rgba(10, 5, 15, 0.85);
  padding: 20px;
  border: 2px solid #a07c4f;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
  color: #e0d8c0;
  font-family: 'MedievalSharp', cursive;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}

.interactions {
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px; /* Add spacing between buttons */
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
  background-color: #704d3a;
  border: 2px solid #5c4033;
  color: #d0b090;
  padding: 8px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-family: 'UnifrakturMaguntia', cursive;
  transition: filter 0.2s, transform 0.1s;
}

.feedback-box button:hover, .interactions button:hover, .action-btn:hover:not(:disabled), .nav-btn:hover:not(:disabled) {
  filter: brightness(1.2);
}

.feedback-box button:active, .interactions button:active, .action-btn:active:not(:disabled), .nav-btn:active:not(:disabled) {
  transform: translate(1px, 1px);
}

/* Navigation Bar */
.navigation-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(40, 25, 15, 0.9);
  border-top: 4px solid #5c4033;
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

/* Battle Styles */
.medieval-battle-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(20, 10, 5, 0.9), rgba(20, 10, 5, 0.9));
}

.battle-arena {
  position: relative;
  width: 100%;
  height: 80vh;
  background: rgba(20, 10, 5, 0.95);
  overflow: hidden;
}

.game-status-top {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  color: #d0b090;
  background: rgba(40, 25, 15, 0.9);
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 20;
  border: 2px solid #8b6a47;
  font-family: 'MedievalSharp', cursive;
}

.victory-message, .game-over-message {
  font-size: 18px;
  animation: pulseGlow 1.5s infinite;
}

.victory-message { color: #b09050; }
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
  background: rgba(40, 25, 15, 0.9);
  border: 2px solid #8b6a47;
  border-radius: 8px;
  padding: 10px;
  color: #d0b090;
  font-size: 12px;
  min-width: 180px;
}

.player-info { bottom: 50px; left: 20px; }
.enemy-info { text-align: right; }

.character-name {
  font-weight: bold;
  font-size: 14px;
  color: #e0c0a0;
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
  border: 2px solid #5c4033;
  border-radius: 5px;
  background: #3c2a1d;
  overflow: hidden;
}

.hp {
  height: 100%;
  background: linear-gradient(to right, #804040, #a06060);
  transition: width 0.5s ease-out;
}

.resource-value {
  font-size: 12px;
  margin-left: 8px;
  font-weight: bold;
}

.battle-log-container {
  width: 100%;
  height: 20vh;
  background: rgba(40, 25, 15, 0.95);
  border-top: 4px solid #5c4033;
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
  border: 2px solid #8b6a47;
  border-radius: 5px;
  color: #c0a080;
}

.battle-log p { margin: 0 0 6px 0; }

.battle-log::-webkit-scrollbar {
  width: 6px;
}

.battle-log::-webkit-scrollbar-track {
  background: #3c2a1d;
  border-radius: 5px;
}

.battle-log::-webkit-scrollbar-thumb {
  background: #8b6a47;
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
  color: #a09070;
  font-size: 14px;
  font-style: italic;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.potion-btn {
  background-color: #5a704d;
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