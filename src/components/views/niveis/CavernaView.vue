<template>
  <div class="cave-view" :style="showCutscene ? cutsceneBackgroundStyle : backgroundStyle">
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
        <p>O calor sufocante da caverna queima sua pele.</p>
        <p><strong>Inimigo Final:</strong> O Dragão de Fogo aguarda nas profundezas.</p>
        <div class="interaction-buttons">
          <button @click="confrontBoss">Enfrentar o Dragão de Fogo</button>
          <button @click="fleeArea">Fugir</button>
        </div>
      </div>
      
      <!-- Post-Battle Interactions -->
      <div v-if="!inBattle && bossDefeated && !showCutscene" class="interactions">
        <p>O Dragão de Fogo foi derrotado. As chamas se extinguem lentamente.</p>
        <p v-if="!gameState.player.keys.fire">Uma Chave Incandescente brilha entre as cinzas.</p>
        <button v-if="!gameState.player.keys.fire" @click="collectKey">Pegar Chave Incandescente</button>
      </div>

      <!-- Battle System -->
      <div v-if="inBattle && !showCutscene" class="medieval-battle-container">
        <div class="battle-arena">
          <div class="game-status-top">
            <div v-if="!gameOver && !victory">{{ battleStatus }}</div>
            <div v-if="victory" class="victory-message">✨ Triunfo! Dragão de Fogo caiu! ✨</div>
            <div v-if="gameOver" class="game-over-message">💀 Derrota! As chamas prevaleceram... 💀</div>
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

          <!-- Enemy (Fire Dragon) -->
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
import caveImage1 from '@/assets/backviews/caverna-entrada.png';
import caveImage2 from '@/assets/backviews/caverna-confronto.png';
import caveBattleImage from '@/assets/backviews/caverna-cenario.png';
import dragonIceSprite from '@/assets/sprites/dragon-ice-sprite.png';
// import playerSprite from '@/assets/sprites/player-sprite.png';
// import attackEffectSprite from '@/assets/sprites/attack-effect.png';
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { gameState, actions } from '@/stores/game.js';
import { playAudio } from '@/utils/audioManager.js';

const router = useRouter();

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

// Game State
const showFeedback = ref(false);
const feedbackMessage = ref('');
const bossDefeated = ref(false);
const inBattle = ref(false);
const currentEnemyIndex = ref(0);

// Background Styles
const backgroundStyle = computed(() => {
  let backgroundImage;
  
  if (inBattle.value) {
    backgroundImage = caveBattleImage;
  } else if (!bossDefeated.value) {
    backgroundImage = caveImage2;
  } else {
    backgroundImage = caveImage2;
  }
  
  return {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: isFading.value ? 0 : 1,
    transition: 'opacity 0.5s ease',
  };
});

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

// Enemy Configuration (Fire Dragon)
const enemiesConfig = [
  {
    name: 'Dragão de Fogo',
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
  'Dragão de Fogo': dragonIceSprite,
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
  });
  
  setTimeout(() => Object.assign(attackEffect, { active: false }), 300);
};

// Cutscene Logic
const playCutscene = async () => {
  playAudio('/sfx/cave_ambient.wav');
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
      if (j > 0) playAudio('/sfx/typewriter_click.wav');
      await sleep(50);
    }

    if (i === 4) {
      playAudio('/sfx/dragon_roar.wav');
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
  playAudio('/sfx/ui_confirm.wav');
  isFading.value = true;
  await sleep(500);
  isFading.value = false;
  cutsceneBackgroundImage.value = caveImage2;
  showCutscene.value = false;
};

// Game Functions
const confrontBoss = () => {
  inBattle.value = true;
  playAudio('/sfx/battle_start_dragon.wav');
  feedbackMessage.value = 'O Dragão de Fogo desperta!';
  showFeedback.value = true;
  addLogMessage('🔥 O Dragão de Fogo ruge, lançando chamas!');
  
  // Reset battle state
  enemies[0].hpPercent = 100;
  enemies[0].currentHp = enemies[0].maxHp;
  gameOver.value = false;
  victory.value = false;
  isPlayerTurn.value = true;
  battleLog.value = [];
};

const attackEnemy = async () => {
  if (activeEnemies.value.length === 0 || playerCharacter.currentStamina < 10 || isAttacking.value) return;

  isAttacking.value = true;
  isPlayerTurn.value = false;
  playerCharacter.currentStamina = Math.max(0, playerCharacter.currentStamina - 10);
  gameState.player.stamina = playerCharacter.currentStamina;

  const playerElement = document.querySelector('.player-character');
  const enemyElement = document.querySelector('.enemy-character');

  playerAttacking.value = true;
  await showAttackEffect(playerElement, enemyElement);

  const baseDamage = Math.floor(Math.random() * 15 + playerCharacter.attackPower);
  let damage = baseDamage;
  const isCritical = Math.random() < 0.2;
  
  if (isCritical) {
    damage *= 2;
    addLogMessage(`💥 <strong>Acerto crítico!</strong> Você causou ${damage} de dano!`);
  } else {
    addLogMessage(`⚔️ Você causou ${damage} de dano ao Dragão de Fogo!`);
  }

  const enemy = enemies[currentEnemyIndex.value];
  enemy.currentHp = Math.max(0, enemy.currentHp - damage);
  enemy.hpPercent = (enemy.currentHp / enemy.maxHp) * 100;

  damagedEnemy.value = currentEnemyIndex.value;
  showPopup(damage, enemyElement, 'enemy-damage');

  setTimeout(() => {
    damagedEnemy.value = null;
    playerAttacking.value = false;
  }, 300);

  if (enemy.currentHp <= 0) {
    victory.value = true;
    addLogMessage('✨ <strong>Vitória!</strong> O Dragão de Fogo foi derrotado!');
    setTimeout(() => finishBattle(), 2000);
  } else {
    setTimeout(() => enemyAttack(), 1000);
  }

  isAttacking.value = false;
};

const enemyAttack = async () => {
  if (victory.value || gameOver.value) return;

  const enemy = enemies[currentEnemyIndex.value];
  const playerElement = document.querySelector('.player-character');
  const enemyElement = document.querySelector('.enemy-character');

  enemyAttacking.value = currentEnemyIndex.value;
  await showAttackEffect(enemyElement, playerElement);

  const isLavaAttack = Math.random() < 0.3;
  let damage;

  if (isLavaAttack) {
    damage = Math.floor(Math.random() * 10 + 30);
    addLogMessage(`🔥 <strong>Explosão de Lava!</strong> O Dragão causou ${damage} de dano!`);
  } else {
    damage = Math.floor(Math.random() * 8 + enemy.attackPower);
    addLogMessage(`🔥 O Dragão de Fogo atacou! Causou ${damage} de dano!`);
  }

  playerCharacter.currentHp = Math.max(0, playerCharacter.currentHp - damage);
  playerCharacter.hpPercent = (playerCharacter.currentHp / playerCharacter.maxHp) * 100;
  gameState.player.health = playerCharacter.currentHp;

  damagedPlayer.value = true;
  showPopup(damage, playerElement, 'player-damage');

  setTimeout(() => {
    damagedPlayer.value = false;
    enemyAttacking.value = null;
  }, 400);

  if (playerCharacter.currentHp <= 0) {
    gameOver.value = true;
    addLogMessage('💀 <strong>Derrota!</strong> Você foi consumido pelas chamas!');
    setTimeout(() => router.push('/'), 3000);
  } else {
    isPlayerTurn.value = true;
  }
};

const usePotion = () => {
  if (!canUsePotion.value || playerCharacter.currentStamina < 5) return;

  playerCharacter.currentStamina = Math.max(0, playerCharacter.currentStamina - 5);
  gameState.player.stamina = playerCharacter.currentStamina;

  const healAmount = 30;
  playerCharacter.currentHp = Math.min(playerCharacter.maxHp, playerCharacter.currentHp + healAmount);
  playerCharacter.hpPercent = (playerCharacter.currentHp / playerCharacter.maxHp) * 100;
  gameState.player.health = playerCharacter.currentHp;
  gameState.player.potions--;

  const playerElement = document.querySelector('.player-character');
  showPopup(healAmount, playerElement, 'hp-heal');
  addLogMessage(`🧪 Você usou uma poção! Recuperou ${healAmount} de vida!`);
  playAudio('/sfx/potion.wav');
};

const collectKey = () => {
  if (bossDefeated.value && !gameState.player.keys.fire) {
    gameState.player.keys.fire = true;
    localStorage.setItem('fireKey', 'true');
    playAudio('/sfx/collect_key.wav');
    feedbackMessage.value = 'Chave Incandescente obtida!';
    showFeedback.value = true;
  }
};

const fleeArea = () => {
  playAudio('/sfx/ui_back.wav');
  router.push('/map');
};

const finishBattle = () => {
  playAudio('/sfx/victory.wav');
  localStorage.setItem('progress', 'caverna-concluida');
  bossDefeated.value = true;
  inBattle.value = false;
  feedbackMessage.value = 'Dragão de Fogo derrotado!';
  showFeedback.value = true;
};

// Watchers
watch(() => gameState.player.health, (newHealth) => {
  playerCharacter.currentHp = newHealth;
  playerCharacter.hpPercent = (newHealth / playerCharacter.maxHp) * 100;
});

watch(() => gameState.player.stamina, (newStamina) => {
  playerCharacter.currentStamina = newStamina;
});

// Lifecycle Hooks
onMounted(() => {
  showCutscene.value = true;
  playCutscene();
  
  // Initialize player character from game state
  playerCharacter.currentHp = gameState.player.health;
  playerCharacter.maxHp = gameState.player.maxHealth;
  playerCharacter.currentStamina = gameState.player.stamina;
  playerCharacter.maxStamina = gameState.player.maxStamina;
  playerCharacter.hpPercent = (gameState.player.health / gameState.player.maxHealth) * 100;
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');

html, body {
  overflow: hidden;
  height: 100%;
  margin: 0;
}

.cave-view {
  position: relative;
  height: 100vh;
  width: 100vw;
  color: white;
  font-family: 'MedievalSharp', cursive;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 30px;
  overflow: hidden;
  animation: fadeInSmooth 0.6s ease-out;
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
  background: rgba(40, 20, 10, 0.85);
  border: 4px solid #b64e1a;
  padding: 8px 14px;
  max-width: 700px;
  margin-bottom: 30px;
  text-align: left;
  color: #f0d0a0;
  font-family: 'MedievalSharp', cursive;
  font-size: 13px;
  line-height: 1.3;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
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

/* HUD Styles */
.main-hud {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 50;
}

.panel-frame {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #8b4513;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
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
  align-items: center;
  justify-content: center;
}

.icon {
  width: 24px;
  height: 24px;
}

.bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
}

.bar-container.segmented {
  display: flex;
  gap: 2px;
}

.segment {
  width: 16px;
  height: 20px;
  background: rgba(100, 100, 100, 0.3);
  border: 1px solid #555;
  border-radius: 2px;
}

.segment.filled {
  background: linear-gradient(to bottom, #ff6b6b, #ee5a52);
}

.stat.energia .segment.filled {
  background: linear-gradient(to bottom, #4ecdc4, #44a08d);
}

.bar-label {
  font-size: 12px;
  color: #fff;
  min-width: 60px;
  text-align: right;
}

.content-area {
  flex-grow: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.interactions {
  background-color: rgba(40, 20, 10, 0.85);
  padding: 20px;
  border: 2px solid #b64e1a;
  border-radius: 3px;
  text-align: center;
  max-width: 400px;
  color: #f0d0a0;
  font-family: 'MedievalSharp', cursive;
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
}

.interaction-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
}

.feedback-box {
  background-color: rgba(40, 20, 10, 0.85);
  padding: 20px;
  border: 2px solid #b64e1a;
  border-radius: 3px;
  text-align: center;
  max-width: 400px;
  color: #f0d0a0;
  font-family: 'MedievalSharp', cursive;
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

/* Battle System Styles */
.medieval-battle-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.battle-arena {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin: 20px;
}

.game-status-top {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  z-index: 10;
}

.victory-message {
  color: #ffd700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.game-over-message {
  color: #ff4444;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.character-info {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #8b4513;
  border-radius: 8px;
  padding: 10px;
  min-width: 200px;
  z-index: 5;
}

.player-info {
  top: 20px;
  left: 20px;
}

.enemy-info {
  top: 20px;
  right: 20px;
}

.character-name {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
  color: #fff;
}

.resource-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hp-bar-label {
  font-size: 12px;
  color: #fff;
  min-width: 30px;
}

.hp-bar {
  width: 120px;
  height: 16px;
  background: rgba(100, 100, 100, 0.3);
  border: 1px solid #555;
  border-radius: 8px;
  overflow: hidden;
}

.hp {
  height: 100%;
  background: linear-gradient(to right, #ff6b6b, #ee5a52);
  transition: width 0.3s ease;
}

.enemy-hp {
  background: linear-gradient(to right, #ff4444, #cc0000);
}

.resource-value {
  font-size: 11px;
  color: #fff;
  min-width: 60px;
}

.unit {
  position: absolute;
  transition: all 0.3s ease;
}

.character-sprite {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.unit.is-attacking {
  transform: scale(1.1);
  filter: brightness(1.3);
}

.unit.is-damaged {
  animation: damage-flash 0.3s ease;
}

.unit.fainted {
  opacity: 0.3;
  transform: scale(0.8);
}

@keyframes damage-flash {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(2) hue-rotate(0deg); }
}

.damage-popup {
  position: absolute;
  font-size: 20px;
  font-weight: bold;
  pointer-events: none;
  z-index: 20;
  animation: damage-popup 0.8s ease-out forwards;
}

.damage-popup.enemy-damage {
  color: #ff4444;
}

.damage-popup.player-damage {
  color: #ff6666;
}

.damage-popup.hp-heal {
  color: #44ff44;
}

@keyframes damage-popup {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-50px) scale(1.2);
  }
}

.attack-effect {
  position: absolute;
  pointer-events: none;
  z-index: 15;
  transition: all 0.3s ease;
}

.effect-sprite {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.battle-log-container {
  background: rgba(0, 0, 0, 0.8);
  border-top: 2px solid #8b4513;
  padding: 20px;
  max-height: 200px;
  display: flex;
  flex-direction: column;
}

.battle-log {
  flex: 1;
  max-height: 120px;
  overflow-y: auto;
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
}

.battle-log p {
  margin: 5px 0;
  font-size: 14px;
  line-height: 1.4;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.actions-placeholder {
  text-align: center;
  font-style: italic;
  color: #ccc;
  padding: 10px;
}

.action-btn {
  background: linear-gradient(to bottom, #8b4513, #654321);
  color: white;
  border: 2px solid #5d2f0a;
  border-radius: 6px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'MedievalSharp', cursive;
}

.action-btn:hover:not(:disabled) {
  background: linear-gradient(to bottom, #a0522d, #8b4513);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.action-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.attack-btn {
  background: linear-gradient(to bottom, #dc143c, #b91c3c);
  border-color: #8b0000;
}

.attack-btn:hover:not(:disabled) {
  background: linear-gradient(to bottom, #ff1744, #dc143c);
}

.potion-btn {
  background: linear-gradient(to bottom, #228b22, #006400);
  border-color: #004d00;
}

.potion-btn:hover:not(:disabled) {
  background: linear-gradient(to bottom, #32cd32, #228b22);
}

button {
  background-color: #b64e1a;
  color: rgb(182, 165, 158);
  padding: 10px 16px;
  border: none;
  border-radius: 1px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
  font-family: 'MedievalSharp', cursive;
}

button:hover {
  background-color: #c85d27;
  transform: scale(1.05);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes fadeInSmooth {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

