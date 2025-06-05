```vue
<template>
  <div class="montanha-view" :style="backgroundStyle">
    <div class="game-hud-placeholder">
      <p>❤️ {{ gameState.player.health }}/{{ gameState.player.maxHealth }} | ⚡ {{ Math.round(gameState.player.stamina) }}/{{ gameState.player.maxStamina }} | 🪙 {{ gameState.player.gold }} | 🧪 {{ potionCount }}</p>
      <p>Área Atual: {{ gameState.currentArea }}</p>
      <p>Chaves: {{ getCollectedKeysStatus() }}</p>
    </div>

    <div class="content-area">
      <!-- Scenario -->
      <div class="scenario-placeholder">
        (Placeholder: Cenário da Montanha Congelada)
        <div class="snow-effect">❄️❄️❄️</div>
        <div v-if="!bossDefeated" class="boss-area-placeholder">
          (Placeholder: Covil do Dragão de Gelo)
        </div>
      </div>

      <!-- Interactions -->
      <div v-if="!bossDefeated && !inBattle" class="interactions">
        <p>O ar gélido corta seus pulmões. A montanha é traiçoeira.</p>
        <p><strong>Inimigos:</strong> O Dragão de Gelo aguarda no pico.</p>
        <p>Um poder congelante emana...</p>
        <button @click="confrontBoss">Enfrentar o Dragão de Gelo</button>
      </div>
      <div v-else-if="bossDefeated" class="interactions">
        <p>O Dragão de Gelo foi derrotado. A nevasca parece diminuir.</p>
        <p v-if="!gameState.player.keys.ice">Uma chave congelada repousa onde o dragão caiu.</p>
        <button v-if="!gameState.player.keys.ice" @click="collectKey">Pegar a Chave de Gelo</button>
      </div>

      <!-- Battle -->
      <div v-if="inBattle" class="battle-box">
        <!-- Enemy -->
        <div v-if="enemy.hpPercent > 0" :class="['enemy', { hit: damagedEnemy }]">
          <h2>🐉 {{ enemy.name }}</h2>
          <p>🩸 Vida: {{ enemy.currentHp }}/{{ enemy.maxHp }}</p>
        </div>
        <div v-else class="enemy fainted">
          <h2>💀 {{ enemy.name }}</h2>
          <p>🩸 Vida: 0/{{ enemy.maxHp }}</p>
        </div>

        <!-- Damage Popup -->
        <div
          v-if="damagePopup.active"
          class="damage-popup"
          :class="damagePopup.type"
          :style="{ top: damagePopup.top + 'px', left: damagePopup.left + 'px' }"
        >
          {{ damagePopup.prefix }}{{ damagePopup.value }}
        </div>

        <!-- Actions -->
        <div class="actions" v-if="isPlayerTurn && !isAttacking && !gameOver && !victory">
          <button @click="attackEnemy" :disabled="enemy.hpPercent <= 0">Atacar</button>
          <button
            @click="usePotion"
            :disabled="!canUsePotion"
            v-tooltip="'Cura 30 de Vida'"
          >
            Usar Poção ({{ potionCount }})
          </button>
        </div>
        <div class="actions-placeholder" v-else>
          O dragão prepara seu sopro gélido...
        </div>

        <!-- Battle Log -->
        <div class="battle-log">
          <p v-for="(message, index) in battleLog" :key="index" v-html="message" class="log animated-text"></p>
        </div>
      </div>

      <!-- Feedback Dialog -->
      <div v-if="showFeedback" class="dialog-box feedback-box">
        <p>{{ feedbackMessage }}</p>
        <button @click="showFeedback = false">Ok</button>
      </div>
    </div>

    <div class="navigation-placeholder">
      <button @click="goToPreviousArea">Voltar para Acampamento</button>
      <button v-if="bossDefeated" @click="goToNextArea">Seguir para Caverna</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { gameState, actions } from '@/stores/game.js';
import { playAudio } from '@/utils/audioManager.js';

const router = useRouter();

// Player setup
const playerCharacter = ref({
  name: gameState.player.name || 'Herói',
  currentHp: gameState.player.health || 100,
  maxHp: gameState.player.maxHealth || 100,
  hpPercent: 100,
  attackPower: 20, // Stronger for boss fight
});

// Enemy setup (Ice Dragon)
const enemy = ref({
  name: 'Dragão de Gelo',
  currentHp: 150,
  maxHp: 150,
  attackPower: 25,
  hpPercent: 100,
});

const rewards = {
  gold: 100,
  items: [{ itemId: 'ice_shard', quantity: 1 }],
};

// Battle state
const inBattle = ref(false);
const isPlayerTurn = ref(true);
const isAttacking = ref(false);
const damagedEnemy = ref(false);
const battleLog = ref(['O Dragão de Gelo surge da nevasca!']);
const victory = ref(false);
const gameOver = ref(false);
const damagePopup = ref({
  active: false,
  value: 0,
  top: 0,
  left: 0,
  type: 'enemy-damage',
  prefix: '-',
});

// Existing state
const showFeedback = ref(false);
const feedbackMessage = ref('');
const bossDefeated = ref(gameState.levelsCompleted.includes('montanha_boss'));

// Computed properties
const potionCount = computed(() => gameState.player.potions || 0);
const canUsePotion = computed(() => potionCount.value > 0 && playerCharacter.value.currentHp < playerCharacter.value.maxHp);
const getCollectedKeysStatus = () => {
  let keys = [];
  if (gameState.player.keys?.ancestral) keys.push('Ancestral');
  if (gameState.player.keys?.ice) keys.push('Gelo');
  if (gameState.player.keys?.fire) keys.push('Fogo');
  return keys.length > 0 ? keys.join(', ') : 'Nenhuma';
};

// Tooltip directive
const tooltip = {
  mounted(el, binding) {
    el.setAttribute('data-tooltip', binding.value);
    el.style.position = 'relative';
    el.addEventListener('mouseenter', () => {
      const tooltipEl = document.createElement('div');
      tooltipEl.className = 'tooltip-text';
      tooltipEl.textContent = el.getAttribute('data-tooltip');
      el.appendChild(tooltipEl);
    });
    el.addEventListener('mouseleave', () => {
      const tooltipEl = el.querySelector('.tooltip-text');
      if (tooltipEl) el.removeChild(tooltipEl);
    });
  },
  unmounted(el) {
    const tooltipEl = el.querySelector('.tooltip-text');
    if (tooltipEl) el.removeChild(tooltipEl);
  },
};

// Battle logic
const addLogMessage = (message) => {
  battleLog.value.push(message);
  if (battleLog.value.length > 5) {
    battleLog.value.shift();
  }
  setTimeout(() => {
    const logContainer = document.querySelector('.battle-log');
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }, 0);
};

const showPopup = (value, targetElement, type = 'enemy-damage') => {
  const rect = targetElement.getBoundingClientRect();
  const containerRect = document.querySelector('.battle-box').getBoundingClientRect();
  let prefix = '-';
  if (type === 'hp-heal') prefix = '+';

  damagePopup.value = {
    active: true,
    value,
    top: rect.top - containerRect.top - 20,
    left: rect.left - containerRect.left + rect.width / 2,
    type,
    prefix,
  };
  setTimeout(() => {
    damagePopup.value.active = false;
  }, 1000);
};

const attackEnemy = async () => {
  if (enemy.value.hpPercent <= 0 || !isPlayerTurn.value || isAttacking.value) return;

  isAttacking.value = true;
  const enemyElement = document.querySelector('.enemy');

  addLogMessage(`<b>⚔️ ${playerCharacter.value.name}</b> ataca o ${enemy.value.name}!`);

  const damage = playerCharacter.value.attackPower + Math.floor(Math.random() * 6 + 10);
  enemy.value.currentHp = Math.max(0, enemy.value.currentHp - damage);
  enemy.value.hpPercent = (enemy.value.currentHp / enemy.value.maxHp) * 100;
  damagedEnemy.value = true;
  showPopup(damage, enemyElement, 'enemy-damage');
  addLogMessage(`<span style="color: #d0a070;">💥 ${enemy.value.name} sofre ${damage} de dano!</span>`);
  playAudio('attack');

  await sleep(500);
  damagedEnemy.value = false;

  if (enemy.value.hpPercent <= 0) {
    addLogMessage(`<span style="color: #a09080;">☠️ ${enemy.value.name} foi derrotado!</span>`);
    victory.value = true;
    addLogMessage('<b>🏆 Vitória! O Dragão de Gelo foi vencido!</b>');
    handleVictory();
    isAttacking.value = false;
    return;
  }

  isPlayerTurn.value = false;
  await sleep(1000);
  await enemyTurn();

  if (!gameOver.value && !victory.value) {
    isAttacking.value = false;
  }
};

const usePotion = async () => {
  if (!canUsePotion.value || !isPlayerTurn.value || isAttacking.value) return;

  isAttacking.value = true;
  const battleBox = document.querySelector('.battle-box');

  actions.usePotion();
  gameState.player.potions -= 1;

  const healAmount = 30;
  playerCharacter.value.currentHp = Math.min(
    playerCharacter.value.maxHp,
    playerCharacter.value.currentHp + healAmount
  );
  playerCharacter.value.hpPercent = (playerCharacter.value.currentHp / playerCharacter.value.maxHp) * 100;
  showPopup(healAmount, battleBox, 'hp-heal');
  addLogMessage(`<span style="color: #90c090;">🧪 ${playerCharacter.value.name} usa uma poção e recupera ${healAmount} de vida!</span>`);
  playAudio('potion');

  await sleep(1000);
  isPlayerTurn.value = false;
  await sleep(1000);
  await enemyTurn();

  if (!gameOver.value && !victory.value) {
    isAttacking.value = false;
  }
};

const enemyTurn = async () => {
  if (enemy.value.hpPercent <= 0 || playerCharacter.value.hpPercent <= 0) return;

  const battleBox = document.querySelector('.battle-box');

  addLogMessage(`<b>🐉 ${enemy.value.name}</b> prepara um sopro gélido!`);
  await sleep(800);

  const damageTaken = enemy.value.attackPower + Math.floor(Math.random() * 6 + 5);
  playerCharacter.value.currentHp = Math.max(0, playerCharacter.value.currentHp - damageTaken);
  playerCharacter.value.hpPercent = (playerCharacter.value.currentHp / playerCharacter.value.maxHp) * 100;
  gameState.player.health = playerCharacter.value.currentHp;
  showPopup(damageTaken, battleBox, 'player-damage');
  addLogMessage(`<span style="color: #c06060;">💥 ${playerCharacter.value.name} sofre ${damageTaken} de dano!</span>`);
  playAudio('hit');

  await sleep(500);

  if (playerCharacter.value.hpPercent <= 0) {
    gameOver.value = true;
    addLogMessage(`<b>💀 ${playerCharacter.value.name} foi derrotado!</b>`);
    handleDefeat();
    isAttacking.value = false;
    return;
  }
  await sleep(800);

  if (!gameOver.value) {
    isPlayerTurn.value = true;
    addLogMessage('<i>🛡️ Sua vez de lutar!</i>');
  }
  isAttacking.value = false;
};

const handleVictory = () => {
  bossDefeated.value = true;
  actions.completeLevel('montanha_boss');
  gameState.player.gold += rewards.gold;
  rewards.items.forEach(item => {
    actions.addItemToInventory(item.itemId, item.quantity);
  });
  addLogMessage(`<span style="color: #d0a070;">💰 Você recolhe ${rewards.gold} peças de ouro!</span>`);
  addLogMessage(`<span style="color: #d0a070;">🎁 Você encontra ${rewards.items[0].quantity} x Fragmento de Gelo!</span>`);
  gameState.player.health = playerCharacter.value.currentHp;
  inBattle.value = false;
  playAudio('boss_defeat');
  feedbackMessage.value = 'O Dragão de Gelo foi derrotado!';
  showFeedback.value = true;
};

const handleDefeat = () => {
  gameState.player.health = 0;
  inBattle.value = false;
  playAudio('player_defeat');
  feedbackMessage.value = 'Você foi derrotado!';
  showFeedback.value = true;
  setTimeout(() => {
    alert('Game Over!');
    router.push('/');
  }, 2000);
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Existing functions (unchanged)
const confrontBoss = () => {
  inBattle.value = true;
  playAudio('battle_start_dragon_ice');
  feedbackMessage.value = 'O Dragão de Gelo surge da nevasca!';
  showFeedback.value = true;
  addLogMessage(`🌬️ ${playerCharacter.value.name} enfrenta o Dragão de Gelo!`);
};

const collectKey = () => {
  if (bossDefeated.value && !gameState.player.keys.ice) {
    actions.collectKey('ice');
    playAudio('collect_key_ice');
    feedbackMessage.value = 'Você obteve a Chave de Gelo!';
    showFeedback.value = true;
  } else {
    feedbackMessage.value = 'Não há chave aqui ou você já a pegou.';
    showFeedback.value = true;
  }
};

const goToPreviousArea = () => {
  playAudio('ui_back');
  router.push({ name: 'Acampamento' });
};

const goToNextArea = () => {
  playAudio('ui_confirm');
  router.push({ name: 'Caverna' });
};

onMounted(() => {
  actions.setCurrentArea('Montanha Congelada');
  if (!gameState.player.keys) {
    gameState.player.keys = reactive({ ancestral: false, ice: false, fire: false });
  }
});

// Background style
const backgroundStyle = computed(() => {
  return { backgroundColor: '#e0ffff' };
});
</script>

<style scoped>
.montanha-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  color: #191970;
  font-family: 'Press Start 2P', cursive;
}

.game-hud-placeholder {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  font-size: 12px;
  border-bottom: 1px solid #ccc;
  color: #333;
}

.content-area {
  flex-grow: 1;
  padding: 30px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.scenario-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px dashed #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
  z-index: 0;
}

.snow-effect {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 1.5rem;
  color: white;
  opacity: 0.7;
}

.boss-area-placeholder {
  border: 3px solid #4682b4;
  padding: 40px;
  background-color: rgba(176, 224, 230, 0.5);
}

.interactions {
  background-color: rgba(200, 220, 255, 0.7);
  padding: 20px;
  border-radius: 5px;
  text-align: center;
  z-index: 1;
  color: #000080;
}

.battle-box {
  background-color: rgba(0, 0, 0, 0.65);
  padding: 20px;
  border: 2px solid #4682b4;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  text-align: center;
  box-shadow: 0 0 15px #000;
  animation: fadeIn 0.6s ease;
  z-index: 3;
}

.enemy {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.enemy.fainted {
  filter: grayscale(100%) opacity(40%);
}

.enemy.hit {
  animation: flash 0.3s linear;
}

@keyframes flash {
  0% { filter: brightness(2); }
  50% { filter: brightness(0.5); }
  100% { filter: brightness(1); }
}

.actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 20px 0;
  flex-wrap: wrap;
}

.actions-placeholder {
  font-size: 12px;
  color: #4682b4;
  margin: 20px 0;
}

.battle-log {
  max-height: 120px;
  overflow-y: auto;
  margin-top: 10px;
  padding: 10px;
  background: rgba(176, 224, 230, 0.3);
  border-radius: 5px;
}

.battle-log::-webkit-scrollbar {
  width: 8px;
}

.battle-log::-webkit-scrollbar-track {
  background: #b0e0e6;
  border-radius: 5px;
}

.battle-log::-webkit-scrollbar-thumb {
  background: #4682b4;
  border-radius: 5px;
}

.log {
  font-size: 12px;
  margin: 5px 0;
  animation: fadeIn 0.3s ease;
}

.damage-popup {
  position: absolute;
  font-size: 20px;
  font-weight: bold;
  animation: floatUpFade 1s forwards ease-out;
  pointer-events: none;
  transform: translateX(-50%);
  z-index: 10;
  text-shadow: 1px 1px 2px #000;
}

.damage-popup.player-damage {
  color: #c06060;
}

.damage-popup.enemy-damage {
  color: #d0a070;
}

.damage-popup.hp-heal {
  color: #90c090;
}

@keyframes floatUpFade {
  0% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -50px); }
}

.tooltip-text {
  visibility: hidden;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  text-align: center;
  border-radius: 6px;
  padding: 8px 12px;
  position: absolute;
  z-index: 20;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 12px;
  white-space: nowrap;
}

[data-tooltip]:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

.feedback-box {
  background-color: rgba(0, 0, 0, 0.8);
  border: 2px solid #ccc;
  padding: 20px;
  margin-top: 20px;
  width: 80%;
  max-width: 600px;
  border-radius: 5px;
  text-align: center;
  color: white;
  z-index: 2;
}

button {
  margin: 10px;
  padding: 10px 15px;
  font-family: 'Press Start 2P', cursive;
  cursor: pointer;
  background-color: #4682b4;
  color: white;
  border: 1px solid #1e90ff;
  border-radius: 10px;
  transition: transform 0.2s, background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #5f9ea0;
  transform: scale(1.05);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.navigation-placeholder {
  padding: 10px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.7);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>