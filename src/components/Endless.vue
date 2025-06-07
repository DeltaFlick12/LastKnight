<template>
  <div class="medieval-battle-container">
    <div class="battle-arena">
      <!-- Status Superior -->
      <div class="game-status-top">
        <div v-if="!gameOver && !victory">{{ battleStatus }}</div>
        <div v-if="victory" class="victory-message">✨ Triunfo! Os inimigos jazem derrotados! ✨</div>
        <div v-if="gameOver" class="game-over-message">💀 Tragédia! A escuridão te consumiu... 💀</div>
      </div>

      <!-- Personagem do Jogador -->
      <div class="character-info player-info">
        <span class="character-name">{{ playerCharacter.name }} ({{ playerCharacter.className }})</span>
        <div class="resource-bar-container">
          <div class="hp-bar-label">Vida:</div>
          <div class="hp-bar">
            <div class="hp" :style="{ width: playerCharacter.hpPercent + '%' }"></div>
          </div>
          <span class="resource-value">{{ playerCharacter.currentHp }}/{{ playerCharacter.maxHp }}</span>
        </div>
      </div>
      <div
        class="unit player-character"
        :class="{ 'is-attacking': playerAttacking, 'is-damaged': damagedPlayer }"
        :style="{ top: playerCharacter.top + 'px', left: playerCharacter.left + 'px' }"
      >
        <img :src="playerSprite" alt="Player" class="character-sprite" />
      </div>

      <!-- Inimigos -->
      <div v-for="(enemy, index) in enemies" :key="'enemy-' + index">
        <div v-if="enemy.hpPercent > 0">
          <div
            class="character-info enemy-info"
            :style="{ top: (initialEnemyPositions[index].top - 90) + 'px', left: `calc(80vw - ${120 + index * 50}px)` }"
          >
            <span class="character-name">{{ enemy.name }}</span>
            <div class="resource-bar-container">
              <div class="hp-bar-label">Vida:</div>
              <div class="hp-bar enemy-hp-bar">
                <div class="hp enemy-hp" :style="{ width: enemy.hpPercent + '%' }"></div>
              </div>
              <span class="resource-value">{{ enemy.currentHp }}/{{ enemy.maxHp }}</span>
            </div>
          </div>
          <div
            class="unit enemy-character"
            :class="{ 'is-attacking': enemyAttacking === index, 'is-damaged': damagedEnemy === index }"
            :style="{ top: enemy.top + 'px', left: `calc(80vw - ${index * 50}px)` }"
          >
            <img :src="enemy.sprite" alt="Enemy" class="character-sprite" />
          </div>
        </div>
        <div
          v-else
          class="unit enemy-character fainted"
          :style="{ top: initialEnemyPositions[index].top + 'px', left: initialEnemyPositions[index].left + 'px' }"
        >
          <img :src="enemy.sprite" alt="Enemy" class="character-sprite" />
        </div>
      </div>

      <!-- Popup de Dano -->
      <div
        v-if="damagePopup.active"
        class="damage-popup"
        :class="damagePopup.type"
        :style="{ top: damagePopup.top + 'px', left: damagePopup.left + 'px' }"
      >
        {{ damagePopup.prefix }}{{ damagePopup.value }}
      </div>

      <!-- Efeito de Ataque -->
      <div v-if="attackEffect.active" class="attack-effect" :style="attackEffect.style">
        <img :src="attackEffectSprite" alt="Attack Effect" class="effect-sprite" />
      </div>
    </div>

    <!-- Caixa de Diálogo/Log -->
    <div class="battle-log-container">
      <div class="battle-log">
        <p v-for="(message, index) in battleLog" :key="index" v-html="message"></p>
      </div>
      <div class="actions" v-if="isPlayerTurn && !isAttacking && !gameOver && !victory">
        <button
          class="action-btn attack-btn"
          @click="attackEnemy"
          :disabled="activeEnemies.length === 0"
        >
          Atacar
        </button>
        <button
          class="action-btn potion-btn"
          @click="usePotion"
          :disabled="!canUsePotion"
          v-tooltip="'Cura 30 de Vida'"
        >
          Usar Poção ({{ potionCount }})
        </button>
      </div>
      <div class="actions-placeholder" v-else>
        Os ventos sussurram... Aguarde sua vez...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { gameState, actions, ITEMS } from '@/stores/game.js';


// Sprites
// import playerSprite from '@/assets/sprites/player-warrior.png';
// import enemySprite from '@/assets/sprites/wolf-enemy.png';
// import attackEffectSprite from '@/assets/effects/slash-effect.png';

// Diretiva de Tooltip
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

// Props
const frameSize = 32; // Cada quadro do rato é 32x32

const props = defineProps({
  enemiesConfig: {
    type: Array,
    default: () => [
      {
        name: 'Rato Cinzento',
        hpPercent: 100,
        currentHp: 40,
        maxHp: 40,
        top: 200,
        left: 1100,
        attackPower: 8,
        currentAnimation: 'idle',
        currentFrame: 0,
        frameTick: 0,
        frameDelay: 8,
        sprite: new URL('@/assets/sprites/rat/rat-idle.png', import.meta.url).href,
        animations: {
          idle: {
            src: new URL('@/assets/sprites/rat/rat-idle.png', import.meta.url).href,
            frames: 5,
          },
          run: {
            src: new URL('@/assets/sprites/rat/rat-run.png', import.meta.url).href,
            frames: 5,
          },
          attack1: {
            src: new URL('@/assets/sprites/rat/rat-attack.png', import.meta.url).href,
            frames: 9,
          },
          hurt: {
            src: new URL('@/assets/sprites/rat/rat-hurt.png', import.meta.url).href,
            frames: 1,
          },
          death: {
            src: new URL('@/assets/sprites/rat/rat-death.png', import.meta.url).href,
            frames: 9,
          },
        }
      },
      {
        name: 'Rato Negro',
        hpPercent: 100,
        currentHp: 50,
        maxHp: 50,
        top: 400,
        left: 1100,
        attackPower: 10,
        currentAnimation: 'idle',
        currentFrame: 0,
        frameTick: 0,
        frameDelay: 8,
        sprite: new URL('@/assets/sprites/rat/rat-idle.png', import.meta.url).href,
        animations: {
          idle: {
            src: new URL('@/assets/sprites/rat/rat-idle.png', import.meta.url).href,
            frames: 5,
          },
          run: {
            src: new URL('@/assets/sprites/rat/rat-run.png', import.meta.url).href,
            frames: 5,
          },
          attack1: {
            src: new URL('@/assets/sprites/rat/rat-attack.png', import.meta.url).href,
            frames: 9,
          },
          hurt: {
            src: new URL('@/assets/sprites/rat/rat-hurt.png', import.meta.url).href,
            frames: 1,
          },
          death: {
            src: new URL('@/assets/sprites/rat/rat-death.png', import.meta.url).href,
            frames: 9,
          },
        }
      },
    ]
  },
  rewards: {
    type: Object,
    default: () => ({
      gold: 50,
      items: [{ itemId: 'wolf_pelt', quantity: 2 }],
    }),
  },
  onVictory: {
    type: Function,
    default: null,
  },
  onDefeat: {
    type: Function,
    default: null,
  },
});


const router = useRouter();

const playerCharacter = ref({
  name: gameState.player.name || 'Herói',
  className: gameState.player.className || 'Guerreiro',
  hpPercent: 100,
  currentHp: gameState.player.hp || 100,
  maxHp: gameState.player.maxHp || 100,
  top: 300,
  left: 50,
  attackPower: 15,
});

const initialEnemyPositions = props.enemiesConfig.map(enemy => ({ top: enemy.top, left: enemy.left }));
const enemies = ref(
  props.enemiesConfig.map(enemy => ({
    ...enemy,
    hpPercent: (enemy.currentHp / enemy.maxHp) * 100,
  }))
);

const damagedEnemy = ref(null);
const damagedPlayer = ref(false);
const playerAttacking = ref(false);
const enemyAttacking = ref(null);
const isPlayerTurn = ref(true);
const isAttacking = ref(false);
const battleLog = ref(['A batalha se inicia nas sombras da penumbra!']);
const battleStatus = ref('Desfira teu golpe, valente! Ou busca uma poção nas tuas vestes...');
const gameOver = ref(false);
const victory = ref(false);
const damagePopup = ref({
  active: false,
  value: 0,
  top: 0,
  left: 0,
  type: 'enemy-damage',
  prefix: '-',
});
const attackEffect = ref({
  active: false,
  style: {},
});

const potionCount = computed(() => {
  const potionItem = gameState.player.inventory.find(item => item.itemId === 'potion');
  return potionItem ? potionItem.quantity : 0;
});

const canUsePotion = computed(() => potionCount.value > 0 && playerCharacter.value.currentHp < playerCharacter.value.maxHp);

const activeEnemies = computed(() => enemies.value.filter(enemy => enemy.hpPercent > 0));

const addLogMessage = (message) => {
  battleLog.value.push(message);
  if (battleLog.value.length > 8) {
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
  const containerRect = document.querySelector('.battle-arena').getBoundingClientRect();
  let prefix = '-';
  if (type === 'hp-heal') prefix = '+';

  damagePopup.value = {
    active: true,
    value,
    top: rect.top - containerRect.top + rect.height / 2 - 20,
    left: rect.left - containerRect.left + rect.width / 2,
    type,
    prefix,
  };
  setTimeout(() => {
    damagePopup.value.active = false;
  }, 1000);
};

const showAttackEffect = async (attackerElement, targetElement) => {
  const startRect = attackerElement.getBoundingClientRect();
  const endRect = targetElement.getBoundingClientRect();
  const containerRect = document.querySelector('.battle-arena').getBoundingClientRect();

  attackEffect.value.style = {
    top: `${startRect.top - containerRect.top + startRect.height / 2}px`,
    left: `${startRect.left - containerRect.left + startRect.width / 2}px`,
    opacity: 1,
  };
  attackEffect.value.active = true;

  await sleep(50);

  attackEffect.value.style = {
    top: `${endRect.top - containerRect.top + endRect.height / 2}px`,
    left: `${endRect.left - containerRect.left + endRect.width / 2}px`,
    opacity: 0,
    transition: 'top 0.3s ease-out, left 0.3s ease-out, opacity 0.3s ease-out',
  };

  await sleep(300);
  attackEffect.value.active = false;
};

const attackEnemy = async () => {
  if (activeEnemies.value.length === 0 || !isPlayerTurn.value || isAttacking.value) return;

  isAttacking.value = true;
  playerAttacking.value = true;

  const enemyIndex = enemies.value.findIndex(enemy => enemy.hpPercent > 0);
  const enemy = enemies.value[enemyIndex];
  const playerElement = document.querySelector('.player-character');
  const enemyElement = document.querySelectorAll('.enemy-character')[enemyIndex];

  battleStatus.value = `${playerCharacter.value.name} ergue sua arma...`;
  addLogMessage(`<b>⚔️ ${playerCharacter.value.name}</b> golpeia ${enemy.name}!`);

  const originalLeft = playerCharacter.value.left;
  playerCharacter.value.left += 40;
  await sleep(200);
  await showAttackEffect(playerElement, enemyElement);
  playerCharacter.value.left = originalLeft;

  damagedEnemy.value = enemyIndex;
  const damageDealt = playerCharacter.value.attackPower + Math.floor(Math.random() * 5 - 2);
  enemy.currentHp = Math.max(0, enemy.currentHp - damageDealt);
  enemy.hpPercent = (enemy.currentHp / enemy.maxHp) * 100;
  showPopup(damageDealt, enemyElement, 'enemy-damage');
  addLogMessage(`<span style="color: #d0a070;">💥 ${enemy.name} sofre ${damageDealt} de dano!</span>`);

  await sleep(500);
  damagedEnemy.value = null;
  playerAttacking.value = false;

  if (enemy.hpPercent <= 0) {
    addLogMessage(`<span style="color: #a09080;">☠️ ${enemy.name} tomba sem vida!</span>`);
    if (checkWinCondition()) {
      victory.value = true;
      battleStatus.value = 'Triunfo!';
      addLogMessage('<b>🏆 A batalha foi vencida!</b>');
      handleVictory();
      isAttacking.value = false;
      return;
    }
  }

  isPlayerTurn.value = false;
  battleStatus.value = 'As feras avançam!';
  await sleep(1000);
  await enemyTurn();

  if (!gameOver.value && !victory.value) {
    isAttacking.value = false;
  }
};

const usePotion = async () => {
  if (!canUsePotion.value || !isPlayerTurn.value || isAttacking.value) return;

  isAttacking.value = true;
  const playerElement = document.querySelector('.player-character');

  actions.removeItemFromInventory('potion', 1);

  const healAmount = 30;
  playerCharacter.value.currentHp = Math.min(
    playerCharacter.value.maxHp,
    playerCharacter.value.currentHp + healAmount
  );
  playerCharacter.value.hpPercent = (playerCharacter.value.currentHp / playerCharacter.value.maxHp) * 100;
  showPopup(healAmount, playerElement, 'hp-heal');
  addLogMessage(`<span style="color: #90c090;">🧪 ${playerCharacter.value.name} bebe uma poção e recupera ${healAmount} de vida!</span>`);

  await sleep(1000);

  isPlayerTurn.value = false;
  battleStatus.value = 'As feras avançam!';
  await sleep(1000);
  await enemyTurn();

  if (!gameOver.value && !victory.value) {
    isAttacking.value = false;
  }
};

const enemyTurn = async () => {
  const playerElement = document.querySelector('.player-character');

  for (let i = 0; i < enemies.value.length; i++) {
    const enemy = enemies.value[i];
    if (enemy.hpPercent <= 0 || playerCharacter.value.hpPercent <= 0) continue;

    enemyAttacking.value = i;
    const enemyElement = document.querySelectorAll('.enemy-character')[i];

    battleStatus.value = `${enemy.name} avança contra ti!`;
    await sleep(800);

    const originalLeft = enemy.left;
    enemy.left -= 40;
    await sleep(200);
    await showAttackEffect(enemyElement, playerElement);
    enemy.left = originalLeft;

    damagedPlayer.value = true;
    const damageTaken = enemy.attackPower + Math.floor(Math.random() * 5 - 2);
    playerCharacter.value.currentHp = Math.max(0, playerCharacter.value.currentHp - damageTaken);
    playerCharacter.value.hpPercent = (playerCharacter.value.currentHp / playerCharacter.value.maxHp) * 100;
    showPopup(damageTaken, playerElement, 'player-damage');
    addLogMessage(`<span style="color: #c06060;">💥 ${playerCharacter.value.name} sofre ${damageTaken} de dano!</span>`);

    await sleep(500);
    damagedPlayer.value = false;
    enemyAttacking.value = null;

    if (playerCharacter.value.hpPercent <= 0) {
      gameOver.value = true;
      battleStatus.value = 'Tragédia!';
      addLogMessage(`<b>💀 ${playerCharacter.value.name} sucumbiu às feras!</b>`);
      handleDefeat();
      isAttacking.value = false;
      return;
    }
    await sleep(800);
  }

  if (!gameOver.value) {
    isPlayerTurn.value = true;
    battleStatus.value = `Desfira teu golpe, valente! Ou busca uma poção nas tuas vestes...`;
    addLogMessage('<i>🛡️ O destino te chama à luta!</i>');
  }
  isAttacking.value = false;
};

const checkWinCondition = () => {
  return enemies.value.every(enemy => enemy.hpPercent <= 0);
};

const handleVictory = () => {
  gameState.player.gold += props.rewards.gold;
  props.rewards.items.forEach(item => {
    actions.addItemToInventory(item.itemId, item.quantity);
  });
  addLogMessage(`<span style="color: #d0a070;">💰 ${playerCharacter.value.name} recolhe ${props.rewards.gold} peças de ouro!</span>`);
  props.rewards.items.forEach(item => {
    addLogMessage(`<span style="color: #d0a070;">🎁 ${playerCharacter.value.name} encontra ${item.quantity} x ${ITEMS[item.itemId].name}!</span>`);
  });

  gameState.player.hp = playerCharacter.value.currentHp;

  if (props.onVictory) {
    props.onVictory();
  } else {
    setTimeout(() => router.push('/level/albadia'), 3000);
  }
};

const handleDefeat = () => {
  gameState.player.hp = 0;

  if (props.onDefeat) {
    props.onDefeat();
  } else {
    setTimeout(() => router.push('/gameover'), 3000);
  }
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

onMounted(() => {
  addLogMessage(`🌲 ${playerCharacter.value.name} avista feras na penumbra!`);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=UnifrakturMaguntia&display=swap');

.medieval-battle-container {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(rgba(20, 10, 5, 0.9), rgba(20, 10, 5, 0.9)), #1c120a;
  box-sizing: border-box;
  color: #d0b090;
  font-family: 'MedievalSharp', cursive;
  margin: 0;
  padding: 0;
}

.battle-arena {
  position: relative;
  width: 100%;
  height: 80vh;
  border-bottom: 4px solid #5c4033;
  background: rgba(20, 10, 5, 0.95);
  overflow: hidden;
}

.game-status-top {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  font-weight: bold;
  color: #d0b090;
  background: rgba(40, 25, 15, 0.9);
  padding: 15px 40px;
  border-radius: 5px;
  z-index: 20;
  text-align: center;
  min-width: 600px;
  border: 3px solid #8b6a47;
  text-shadow: 2px 2px 3px rgba(0, 0, 0, 0.8);
  font-family: 'UnifrakturMaguntia', cursive;
}

.victory-message {
  color: #b09050;
  font-size: 20px;
  animation: pulseGlow 1.5s infinite;
}

.game-over-message {
  color: #a04040;
  font-size: 20px;
  animation: pulseGlow 1.5s infinite;
}

@keyframes pulseGlow {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
  100% { filter: brightness(1); }
}

.unit {
  position: absolute;
  width: 120px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: top 0.4s ease, left 0.4s ease, transform 0.2s ease;
  user-select: none;
  filter: drop-shadow(5px 5px 5px rgba(0, 0, 0, 0.7));
}

.character-sprite {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.player-character {
  z-index: 10;
}

.enemy-character {
  z-index: 9;
}

.enemy-character.fainted {
  filter: grayscale(100%) opacity(40%);
  transition: filter 0.5s ease;
}

.character-info {
  position: absolute;
  background: rgba(40, 25, 15, 0.9);
  border: 3px solid #8b6a47;
  border-radius: 8px;
  padding: 12px 25px;
  z-index: 15;
  color: #d0b090;
  font-size: 14px;
  min-width: 280px;
  box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.5);
}

.player-info {
  bottom: 40px;
  left: 40px;
}

.enemy-info {
  text-align: right;
}

.character-name {
  font-weight: bold;
  display: block;
  margin-bottom: 10px;
  font-size: 16px;
  color: #e0c0a0;
  text-shadow: 1px 1px 2px #000;
}

.resource-bar-container {
  display: flex;
  align-items: center;
  height: 22px;
  margin-bottom: 4px;
}

.hp-bar-label {
  font-size: 14px;
  font-weight: bold;
  margin-right: 10px;
  width: 45px;
  color: #d0b090;
}

.hp-bar {
  flex-grow: 1;
  height: 18px;
  border: 2px solid #5c4033;
  border-radius: 5px;
  overflow: hidden;
  background: #3c2a1d;
}

.hp {
  height: 100%;
  background: linear-gradient(to right, #804040, #a06060);
  transition: width 0.5s ease-out;
  border-radius: 3px;
}

.resource-value {
  font-size: 14px;
  margin-left: 12px;
  font-weight: bold;
  min-width: 70px;
  text-align: right;
  color: #d0b090;
}

.battle-log-container {
  width: 100%;
  height: 20vh;
  background: rgba(40, 25, 15, 0.95);
  border-top: 4px solid #5c4033;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
  box-shadow: 0 -10px 20px rgba(0, 0, 0, 0.8);
}

.battle-log {
  width: 50%;
  height: 100%;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.8;
  padding: 10px 20px;
  border: 2px solid #8b6a47;
  border-radius: 5px;
  color: #c0a080;
  font-family: 'MedievalSharp', cursive;
}

.battle-log p {
  margin: 0 0 12px 0;
}

.battle-log::-webkit-scrollbar {
  width: 12px;
}

.battle-log::-webkit-scrollbar-track {
  background: #3c2a1d;
  border-radius: 5px;
}

.battle-log::-webkit-scrollbar-thumb {
  background: #8b6a47;
  border-radius: 5px;
}

.battle-log::-webkit-scrollbar-thumb:hover {
  background: #a0805a;
}

.actions {
  width: 40%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  padding: 10px;
}

.actions-placeholder {
  width: 40%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #a09070;
  font-size: 16px;
  font-family: 'MedievalSharp', cursive;
  font-style: italic;
}

.action-btn {
  margin: 15px;
  padding: 15px 40px;
  font-size: 16px;
  cursor: pointer;
  border: 3px solid #5c4033;
  border-radius: 8px;
  font-weight: bold;
  color: #d0b090;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  transition: all 0.15s;
  background-color: #704d3a;
  box-shadow: 3px 3px 0px #4c3326;
  font-family: 'UnifrakturMaguntia', cursive;
}

.attack-btn {
  background-color: #704d3a;
}

.potion-btn {
  background-color: #5a704d;
}

.action-btn:hover:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px #4c3326;
  filter: brightness(1.2);
}

.action-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: 1px 1px 0px #4c3326;
  background-color: #504030;
}

.tooltip-text {
  visibility: hidden;
  width: max-content;
  background-color: rgba(40, 25, 15, 0.95);
  color: #d0b090;
  text-align: center;
  border-radius: 6px;
  padding: 8px 12px;
  position: absolute;
  z-index: 30;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 12px;
  white-space: nowrap;
  border: 2px solid #8b6a47;
  font-family: 'MedievalSharp', cursive;
}

[data-tooltip]:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

.unit.is-attacking {
  animation: attackShake 0.4s ease-in-out;
}

.unit.is-damaged {
  animation: damageFlash 0.3s linear 2;
}

@keyframes attackShake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes damageFlash {
  0%, 100% {
    filter: brightness(1) drop-shadow(5px 5px 5px rgba(0, 0, 0, 0.7));
  }
  50% {
    filter: brightness(1.5) saturate(1.2) drop-shadow(5px 5px 5px rgba(100, 0, 0, 0.7));
  }
}

.damage-popup {
  position: absolute;
  font-size: 24px;
  font-weight: bold;
  user-select: none;
  animation: floatUpFade 1s forwards ease-out;
  pointer-events: none;
  transform: translateX(-50%);
  z-index: 25;
  text-shadow: 2px 2px 4px black;
  font-family: 'UnifrakturMaguntia', cursive;
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
  0% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50px);
  }
}

.attack-effect {
  position: absolute;
  z-index: 20;
  pointer-events: none;
}

.effect-sprite {
  width: 60px;
  height: 60px;
  object-fit: contain;
  image-rendering: pixelated;
}
</style>