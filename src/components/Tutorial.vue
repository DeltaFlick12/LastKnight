```vue
<template>
  <div class="medieval-battle-container">
    <!-- Bartolomeu's Dialog -->
    <img src="@/assets/bartolomeu.png" alt="Bartolomeu" class="bartolomeu-image" v-if="showDialog" />
    <div v-if="showDialog" class="skip-button menu-button" @click="skipTutorial">Pular Tutorial</div>
    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button @click="nextDialog" class="menu-button"
        style="height: 50px; display: inline-flex; justify-content: center; align-items: center;">
        Continuar
      </button>
    </div>

    <!-- Battle Arena -->
    <div class="battle-arena" :style="battleArenaStyle">
      <!-- Status Superior -->
      <div class="game-status-top" v-if="combatStarted">
        <div v-if="!gameOver && !victory">{{ battleStatus }}</div>
        <div v-if="victory" class="victory-message">✨ Triunfo! O Dummy de Treino jaz derrotado! ✨</div>
        <div v-if="gameOver" class="game-over-message">💀 Tragédia! A escuridão te consumiu... 💀</div>
      </div>

      <!-- Player Character -->
      <div class="character-info player-info" v-if="combatStarted">
        <span class="character-name">{{ playerCharacter.name }} (Guerreiro)</span>
        <div class="resource-bar-container">
          <div class="hp-bar-label">Vida:</div>
          <div class="hp-bar">
            <div class="hp" :style="{ width: playerCharacter.hpPercent + '%' }"></div>
          </div>
          <span class="resource-value">{{ playerCharacter.currentHp }}/{{ playerCharacter.maxHp }}</span>
        </div>
      </div>
      <div v-if="combatStarted" class="unit player-character" verbs="none"
        :class="{ 'is-attacking': playerAttacking, 'is-damaged': damagedPlayer }"
        :style="{
          top: playerCharacter.top + 'px',
          left: playerCharacter.left + 'px',
          backgroundImage: `url(${playerSprite})`,
          backgroundPosition: `-${animations[currentAnimation].frames[currentFrame] * frameWidth}px -${animations[currentAnimation].row * frameHeight}px`,
          width: frameWidth + 'px',
          height: frameHeight + 'px'
        }">
      </div>

      <!-- Enemy (Dummy de Treino) -->
      <div v-if="combatStarted && enemies[0].hpPercent > 0">
        <div class="character-info enemy-info"
          :style="{ top: (enemies[0].top - 90) + 'px', left: `calc(80vw - 120px)` }">
          <span class="character-name">{{ enemies[0].name }}</span>
          <div class="resource-bar-container">
            <div class="hp-bar-label">Vida:</div>
            <div class="hp-bar enemy-hp-bar">
              <div class="hp enemy-hp" :style="{ width: enemies[0].hpPercent + '%' }"></div>
            </div>
            <span class="resource-value">{{ enemies[0].currentHp }}/{{ enemies[0].maxHp }}</span>
          </div>
        </div>
        <div class="unit enemy-character" verbs="none"
          :class="{ 'is-attacking': enemyAttacking === 0, 'is-damaged': damagedEnemy === 0 }"
          :style="{ top: enemies[0].top + 'px', left: enemies[0].left + 'px' }">
          <!-- <img src="@/assets/sprites/enemies/dummy.png" alt="Enemy" class="character-sprite" /> -->
        </div>
      </div>
      <div v-if="combatStarted && enemies[0].hpPercent <= 0" class="unit enemy-character fainted" verbs="none"
        :style="{ top: initialEnemyPositions[0].top + 'px', left: initialEnemyPositions[0].left + 'px' }">
        <!-- <img src="@/assets/sprites/enemies/dummy.png" alt="Enemy" class="character-sprite" /> -->
      </div>

      <!-- Damage Popup -->
      <div v-if="damagePopup.active" class="damage-popup" :class="damagePopup.type"
        :style="{ top: damagePopup.top + 'px', left: damagePopup.left + 'px' }">
        {{ damagePopup.prefix }}{{ damagePopup.value }}
      </div>

      <!-- Attack Effect -->
      <div v-if="attackEffect.active" class="attack-effect" :style="attackEffect.style">
        <img :src="attackEffect.sprite" alt="Attack Effect" class="effect-sprite" />
      </div>
    </div>

    <!-- Battle Log and Controls -->
    <div v-if="combatStarted" class="battle-log-container">
      <div class="battle-log">
        <p v-for="(message, index) in battleLog" :key="index" v-html="message"></p>
      </div>
      <div class="actions" v-if="isPlayerTurn && !isAttacking && !gameOver && !victory">
        <button class="action-btn attack-btn" @click="attackEnemy">
          Atacar
        </button>
        <button class="action-btn potion-btn" @click="usePotion" :disabled="!canUsePotion">
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { playAudio } from '@/utils/audioManager.js';

// Sprite sheet for player
import playerSprite from '/img/sprites/player/player_sprite.png';

// Audio files
import attackEffectSpritePlayer from '@/assets/sprites/ataque-efeito.png';
import attackEffectSpriteDummy from '@/assets/sprites/ataque-dragao.png';
import playerAttackSound from '/sounds/hit_sound.mp3';
import dummyAttackSound from '/sounds/hit_dummy.mp3';
const clickSound = new Audio('/public/sounds/click.wav');
const dialogSounds = [
  new Audio('public/sounds/bartolomeu/b1.mp3'),
  new Audio('public/sounds/bartolomeu/b2.mp3'),
  new Audio('public/sounds/bartolomeu/b3.mp3'),
  new Audio('public/sounds/bartolomeu/b4.mp3'),
  new Audio('public/sounds/bartolomeu/b5.mp3'),
  new Audio('public/sounds/bartolomeu/b6.mp3'),
];
const tutorialBgMusic = new Audio('@/assets/sounds/tutorial-bg.mp3');
const battleBgMusic = new Audio('@/assets/sounds/battle-bg.mp3');
const potionSound = new Audio('@/assets/sounds/potion-sound.mp3');

const isMuted = ref(localStorage.getItem('isMuted') === 'true');
[clickSound, ...dialogSounds, tutorialBgMusic, battleBgMusic, potionSound].forEach(audio => {
  audio.volume = isMuted.value ? 0 : 1;
});

const playClick = () => {
  if (!isMuted.value && clickSound) {
    clickSound.currentTime = 0;
    clickSound.play();
  }
};

const router = useRouter();

// Animation Variables
const currentFrame = ref(0);
const frameTimer = ref(0);
const frameWidth = 96;
const frameHeight = 96;
const animations = {
  idle: { row: 2, frames: [0, 1, 2, 3, 4, 5, 6, 7], frameInterval: 150 },
  attack_right: { row: 14, frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11], frameInterval: 100 }
};
const currentAnimation = computed(() => playerAttacking.value ? 'attack_right' : 'idle');
let animationFrameId = null;

// Dialog
const showDialog = ref(true);
const dialogIndex = ref(0);
const dialogLines = [
  'Olá, jovem guerreiro! Eu sou Bartolomeu, o dummy falante!',
  'Neste tutorial, vou te ensinar a lutar contra inimigos!',
  'Use o botão "Atacar" para golpear o Dummy de Treino.',
  'Se sua vida estiver baixa, use uma poção com o botão "Usar Poção".',
  'Cuidado! O dummy pode revidar quando for a vez dele.',
  'Vamos começar! Clique em "Continuar" e prepare-se para a batalha!'
];
const displayedText = ref('');
const typing = ref(false);
const typingInterval = ref(null);

const typeLine = async () => {
  if (typing.value) {
    clearInterval(typingInterval.value);
    if (dialogSounds[dialogIndex.value] && !isMuted.value) {
      dialogSounds[dialogIndex.value].pause();
      dialogSounds[dialogIndex.value].currentTime = 0;
    }
    displayedText.value = dialogLines[dialogIndex.value];
    typing.value = false;
    return;
  }

  typing.value = true;
  displayedText.value = '';
  const line = dialogLines[dialogIndex.value];
  let index = 0;

  if (dialogSounds[dialogIndex.value] && !isMuted.value) {
    try {
      dialogSounds[dialogIndex.value].pause();
      dialogSounds[dialogIndex.value].currentTime = 0;
      await dialogSounds[dialogIndex.value].play();
    } catch { }
  }

  typingInterval.value = setInterval(() => {
    if (index < line.length) {
      displayedText.value += line[index++];
    } else {
      clearInterval(typingInterval.value);
      if (dialogSounds[dialogIndex.value] && !isMuted.value) {
        dialogSounds[dialogIndex.value].pause();
      }
      typing.value = false;
    }
  }, 40);
};

const nextDialog = () => {
  playClick();
  if (typing.value) {
    typeLine();
    return;
  }
  if (dialogIndex.value < dialogLines.length - 1) {
    dialogIndex.value++;
    typeLine();
  } else {
    showDialog.value = false;
    combatStarted.value = true;
    addLogMessage('🌲 A batalha contra o Dummy de Treino começa!');
    if (tutorialBgMusic && !isMuted.value) {
      tutorialBgMusic.pause();
      battleBgMusic.currentTime = 0;
      battleBgMusic.loop = true;
      battleBgMusic.play();
    }
    frameTimer.value = performance.now();
    animationFrameId = requestAnimationFrame(updateAnimation);
  }
};

const skipTutorial = () => {
  playClick();
  clearInterval(typingInterval.value);
  if (dialogSounds[dialogIndex.value] && !isMuted.value) {
    dialogSounds[dialogIndex.value].pause();
  }
  if (tutorialBgMusic && !isMuted.value) {
    tutorialBgMusic.pause();
  }
  router.push('/map');
};

// Battle Logic
const combatStarted = ref(false);
const playerCharacter = ref({
  name: 'Herói',
  className: 'Guerreiro',
  hpPercent: 100,
  currentHp: 100,
  maxHp: 100,
  top: 300,
  left: 50,
  attackPower: 15,
  stamina: 50,
  maxStamina: 50,
});

const enemies = ref([
  {
    name: 'Dummy de Treino',
    hpPercent: 100,
    currentHp: 30,
    maxHp: 30,
    top: 200,
    left: 1100,
    attackPower: 8,
  },
]);

const initialEnemyPositions = [{ top: 200, left: 1100 }];
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
  sprite: null,
});
const potionCount = ref(3);
const canUsePotion = computed(() =>
  potionCount.value > 0 && playerCharacter.value.currentHp < playerCharacter.value.maxHp
);
const activeEnemies = computed(() => enemies.value.filter(enemy => enemy.hpPercent > 0));

// Add stamina management
const recoverStamina = (amount) => {
  playerCharacter.value.stamina = Math.min(
    playerCharacter.value.maxStamina,
    playerCharacter.value.stamina + amount
  );
};

const useStamina = (amount) => {
  playerCharacter.value.stamina = Math.max(0, playerCharacter.value.stamina - amount);
};

// Animation Loop
const updateAnimation = (now) => {
  if (!combatStarted.value) return;
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

// Background management
const tutorialBackgroundImage = ref('@/assets/tutorial-background.png');
const backgroundImage = ref('@/assets/tutorial-fight.png');
const completedBackgroundImage = ref('@/assets/tutorial-completed.png');
const battleArenaStyle = computed(() => ({
  backgroundImage: `url(${victory.value ? completedBackgroundImage.value : combatStarted.value ? backgroundImage.value : tutorialBackgroundImage.value})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}));

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
  let prefix = type === 'hp-heal' ? '+' : '-';

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
  }, 800);
};

const showAttackEffect = async (attackerElement, targetElement, isPlayer = true) => {
  const startRect = attackerElement.getBoundingClientRect();
  const endRect = targetElement.getBoundingClientRect();
  const containerRect = document.querySelector('.battle-arena').getBoundingClientRect();
  const spriteToUse = isPlayer ? attackEffectSpritePlayer : attackEffectSpriteDummy;

  attackEffect.value.active = true;
  attackEffect.value.style = {
    top: `${startRect.top - containerRect.top + startRect.height / 2}px`,
    left: `${startRect.left - containerRect.left + startRect.width / 2}px`,
    opacity: 1,
  };
  attackEffect.value.sprite = spriteToUse;

  await sleep(50);

  attackEffect.value.style = {
    top: `${endRect.top - containerRect.top + endRect.height / 2}px`,
    left: `${endRect.left - containerRect.left + endRect.width / 2}px`,
    opacity: 0,
    transition: 'top 0.3s ease-out, left 0.3s ease-out, opacity 0.3s ease-out',
  };

  await sleep(300);
  attackEffect.value.active = false;
  attackEffect.value.style = {};
  attackEffect.value.sprite = null;
};

const attackEnemy = async () => {
  if (activeEnemies.value.length === 0 || !isPlayerTurn.value || isAttacking.value) return;

  playClick();
  isAttacking.value = true;
  playerAttacking.value = true;
  currentFrame.value = 0;
  frameTimer.value = performance.now();

  // Regenerate stamina
  recoverStamina(5);
  addLogMessage(`<span style="color: #33cc33;">⚡ +5 energia restaurada!</span>`);

  // Check stamina
  if (playerCharacter.value.stamina < 10) {
    addLogMessage(`<span style="color: #ff6666;">⚡ Energia insuficiente para atacar!</span>`);
    playerAttacking.value = false;
    isAttacking.value = false;
    isPlayerTurn.value = false;
    await enemyTurn();
    if (!gameOver.value && !victory.value) {
      isPlayerTurn.value = true;
      battleStatus.value = 'Desfira teu golpe, valente!';
    }
    return;
  }

  useStamina(10);
  addLogMessage(`<span style="color: #33cc33;">⚡ -10 energia</span>`);

  const enemyIndex = 0;
  const enemy = enemies.value[enemyIndex];
  const playerElement = document.querySelector('.player-character');
  const enemyElement = document.querySelector('.enemy-character');

  playAudio(playerAttackSound, { volume: 0.5 });
  battleStatus.value = `${playerCharacter.value.name} ergue sua arma...`;
  addLogMessage(`<b>⚔️ ${playerCharacter.value.name}</b> golpeia ${enemy.name}!`);

  const originalLeft = playerCharacter.value.left;
  playerCharacter.value.left += 40;
  await sleep(200);
  await showAttackEffect(playerElement, enemyElement, true);
  playerCharacter.value.left = originalLeft;

  damagedEnemy.value = enemyIndex;
  const damageDealt = playerCharacter.value.attackPower + Math.floor(Math.random() * 5 - 2);
  enemy.currentHp = Math.max(0, enemy.currentHp - damageDealt);
  enemy.hpPercent = (enemy.currentHp / enemy.maxHp) * 100;
  showPopup(damageDealt, enemyElement, 'enemy-damage');
  addLogMessage(`<span style="color: #d0a070;">💥 ${enemy.name} sofre ${damageDealt} de dano!</span>`);

  await sleep(500);
  damagedEnemy.value = null;

  if (enemy.hpPercent <= 0) {
    addLogMessage(`<span style="color: #a09080;">☠️ ${enemy.name} tomba sem vida!</span>`);
    victory.value = true;
    battleStatus.value = 'Triunfo!';
    addLogMessage('<b>🏆 A batalha foi vencida!</b>');
    setTimeout(() => router.push('/map'), 3000);
    isAttacking.value = false;
    return;
  }

  isPlayerTurn.value = false;
  await enemyTurn();
  if (!gameOver.value && !victory.value) {
    isPlayerTurn.value = true;
    battleStatus.value = 'Desfira teu golpe, valente!';
  }
  isAttacking.value = false;
};

const usePotion = async () => {
  if (!canUsePotion.value || !isPlayerTurn.value || isAttacking.value) return;

  playClick();
  isAttacking.value = true;

  // Regenerate stamina
  recoverStamina(5);
  addLogMessage(`<span style="color: #33cc33;">⚡ +5 energia restaurada!</span>`);

  // Check stamina
  if (playerCharacter.value.stamina < 5) {
    addLogMessage(`<span style="color: #ff6666;">⚡ Energia insuficiente para usar poção!</span>`);
    isAttacking.value = false;
    isPlayerTurn.value = false;
    await enemyTurn();
    if (!gameOver.value && !victory.value) {
      isPlayerTurn.value = true;
      battleStatus.value = 'Desfira teu golpe, valente!';
    }
    return;
  }

  useStamina(5);
  addLogMessage(`<span style="color: #33cc33;">⚡ -5 energia</span>`);

  const playerElement = document.querySelector('.player-character');

  if (!isMuted.value && potionSound) {
    potionSound.currentTime = 0;
    potionSound.play();
  }

  potionCount.value--;
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
  battleStatus.value = `${enemies.value[0].name} avança contra ti!`;
  await sleep(1000);
  await enemyTurn();
  isAttacking.value = false;
};

const enemyTurn = async () => {
  const playerElement = document.querySelector('.player-character');
  const enemy = enemies.value[0];

  if (enemy.hpPercent <= 0 || playerCharacter.value.hpPercent <= 0) return;

  enemyAttacking.value = 0;
  const enemyElement = document.querySelector('.enemy-character');

  battleStatus.value = `${enemy.name} avança contra ti!`;
  addLogMessage(`<b>⚔️ ${enemy.name}</b> contra-ataca!`);
  playAudio(dummyAttackSound, { volume: 0.5 });
  await sleep(800);

  const originalLeft = enemy.left;
  enemy.left -= 40;
  await sleep(200);
  await showAttackEffect(enemyElement, playerElement, false);
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
    setTimeout(() => router.push('/gameover'), 3000);
    isAttacking.value = false;
    return;
  }

  isPlayerTurn.value = true;
  battleStatus.value = `Desfira teu golpe, valente!`;
  addLogMessage('<i>🛡️ O destino te chama à luta!</i>');
  isAttacking.value = false;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

onMounted(() => {
  typeLine();
  if (tutorialBgMusic && !isMuted.value) {
    tutorialBgMusic.loop = true;
    tutorialBgMusic.play();
  }
});

onUnmounted(() => {
  clearInterval(typingInterval.value);
  [tutorialBgMusic, battleBgMusic, ...dialogSounds].forEach(audio => audio?.pause());
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=UnifrakturMaguntia&display=swap');

.medieval-battle-container {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: url('@/assets/tutorial-background.png') no-repeat center center fixed;
  background-size: cover;
  box-sizing: border-box;
  color: #d0b090d0;
  font-family: 'MedievalSharp', cursive;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.bartolomeu-image {
  position: absolute;
  width: 800px;
  z-index: 30;
}

.skip-button {
  position: fixed;
  top: 20px;
  z-index: 35;
}

.menu-button {
  background-color: #e0a867;
  color: #5c4033;
  border: 4px solid #5c4033;
  padding: 10px 40px;
  width: 200px;
  height: 30px;
  font-size: 20px;
  text-align: center;
  cursor: pointer;
  position: relative;
  image-rendering: pixelated;
  box-shadow: inset -6px -6px #d17844, inset 6px 6px #ffcb8c;
  font-weight: bold;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s;
}

.menu-button:hover:not(:disabled) {
  background-color: #f4b76a;
  color: #3e1e14;
  box-shadow: inset -6px -6px #c96a32, inset 6px 6px #ffd9a1;
}

.menu-button:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: inset -3px -3px #d17844, inset 3px 3px #ffcb8c;
}

.menu-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #a08050;
  box-shadow: inset -3px -3px #8b5a3a, inset 3px 3px #b09070;
}

.dialog-box {
  position: absolute;
  bottom: 25vh;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(40, 25, 15, 0.85);
  padding: 20px;
  border: none;
  border-radius: 8px;
  max-width: 500px;
  text-align: center;
  z-index: 30;
  color: #d0b090;
  font-size: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.dialog-box p {
  margin: 0 0 20px 0;
}

.battle-arena {
  position: relative;
  width: 100%;
  height: 80vh;
  border-bottom: 4px solid #5c4033;
  background-size: cover;
  background-position: center;
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
  width: 96px;
  height: 96px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: top 0.4s ease, left 0.4s ease;
  user-select: none;
  filter: drop-shadow(5px 5px 5px rgba(0, 0, 0, 0.7));
}

.player-character {
  z-index: 10;
  transform: scale(5);
  transform-origin: center center;
  image-rendering: pixelated;
  margin-top: 7%;
}

.player-character.is-attacking {
  animation: attackShake 0.4s ease-in-out;
}

.player-character.is-damaged {
  animation: damageBrighten 1s linear forwards;
}

@keyframes attackShake {
  0%, 100% { transform: scale(5) translateX(0); }
  25% { transform: scale(5) translateX(-5px); }
  75% { transform: scale(5) translateX(5px); }
}

@keyframes damageBrighten {
  0% { filter: brightness(1); }
  30% { filter: brightness(1.2); }
  50% { filter: brightness(1.5); }
  90% { filter: brightness(1.2); }
  100% { filter: brightness(1); }
}

.enemy-character {
  z-index: 9;
}

.enemy-character.fainted {
  filter: grayscale(100%) opacity(40%);
  transition: filter 0.5s ease;
}

.character-sprite {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
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
  text-align: center;
  margin-top: 10%;
}

.player-info {
  bottom: 40px;
  left: 40px;
}

.enemy-info {
  text-align: center;
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

.damage-popup.player-damage { color: #c06060; }
.damage-popup.enemy-damage { color: #d0a070; }
.damage-popup.hp-heal { color: #90c090; }

@keyframes floatUpFade {
  0% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -50px); }
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