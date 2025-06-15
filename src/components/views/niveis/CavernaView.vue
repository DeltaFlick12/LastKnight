<template>
  <transition name="fade">
    <div :class="['cave-view', { shake: isShaking }]">
      <img src="@/assets/backviews/caverna.jpg" alt="Fundo da Caverna" class="bg-image" />

      <div class="hud">
        <div>❤️ Vida: {{ playerHealth }}/100</div>
        <div>⚔️ Arma: {{ equippedWeapon }}</div>
      </div>

      <div class="battle-box">
        <div :class="['enemy', { hit: enemyHit }]">
          <h2>🔥 {{ enemy.name }}</h2>
          <p>🩸 Vida: {{ enemy.health }}/{{ enemy.maxHealth }}</p>
        </div>

        <div class="actions">
          <button @click="attackEnemy" :disabled="enemy.health <= 0 || playerHealth <= 0">Atacar</button>
          <button @click="usePotion" :disabled="potions <= 0">Usar Poção ({{ potions }})</button>
        </div>

        <p class="log animated-text">{{ battleLog }}</p>

        <button v-if="enemy.health <= 0" @click="finishBattle">🏆 Vitória! Continuar</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameState } from '@/stores/gameState.js';
import { playAudio } from '@/utils/audioManager.js';

// Importações de assets com fallback
let caveImage1, caveImage2, caveBattleImage, dragonFireSprite, playerSprite, attackEffectSprite;
try {
  caveImage1 = (await import('@/assets/backviews/caverna-entrada.png')).default;
  caveImage2 = (await import('@/assets/backviews/caverna-confronto.png')).default;
  caveBattleImage = (await import('@/assets/backviews/caverna-cenario.png')).default;
  // dragonFireSprite = (await import('@/assets/sprites/dragon-fire-sprite.png')).default;
  // playerSprite = (await import('@/assets/sprites/player-sprite.png')).default;
  // attackEffectSprite = (await import('@/assets/sprites/attack-effect.png')).default;
} catch (e) {
  console.error('Erro ao carregar assets:', e);
}

// Inicialização do store
const gameStore = useGameState();
const gameState = gameStore.$state;
const actions = gameStore;
const router = useRouter();

// Log para depuração
console.log('gameStore:', gameState);

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
const typewriterSpans = ref([]);

// Game State
const showFeedback = ref(false);
const feedbackMessage = ref('');
const bossDefeated = ref(false);
const inBattle = ref(false);
const currentEnemyIndex = ref(0);

// Background Styles
const backgroundStyle = computed(() => {
  let backgroundImage = caveImage2;
  if (inBattle.value) {
    backgroundImage = caveBattleImage;
  }
  return {
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: isFading.value ? 0 : 1,
    transition: 'opacity 0.5s ease',
    backgroundColor: backgroundImage ? 'transparent' : '#000', // Fallback
  };
});

const cutsceneBackgroundStyle = computed(() => ({
  backgroundImage: cutsceneBackgroundImage.value
    ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${cutsceneBackgroundImage.value})`
    : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: isFading.value ? 0 : 1,
  transition: 'opacity 0.5s ease',
  backgroundColor: cutsceneBackgroundImage.value ? 'transparent' : '#000', // Fallback
}));

// HUD
const maxBarSegments = 10;
const filledHealthSegments = computed(() =>
  Math.round(((gameState.player?.health || 100) / (gameState.player?.maxHealth || 100)) * maxBarSegments)
);
const filledStaminaSegments = computed(() =>
  Math.round(((gameState.player?.stamina || 100) / (gameState.player?.maxStamina || 100)) * maxBarSegments)
);

// Player Character
const playerCharacter = reactive({
  name: gameState.player?.name || 'Herói',
  classe: gameState.player?.classe || 'Guerreiro',
  hpPercent: ((gameState.player?.health || 100) / (gameState.player?.maxHealth || 100)) * 100,
  currentHp: gameState.player?.health || 100,
  maxHp: gameState.player?.maxHealth || 100,
  currentStamina: gameState.player?.stamina || 100,
  maxStamina: gameState.player?.maxStamina || 100,
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
  'Dragão de Fogo': dragonFireSprite || null,
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
const potionCount = computed(() => gameStore.getItemQuantity('potion_health') || 0);
const canUsePotion = computed(() => potionCount.value > 0 && playerCharacter.currentHp < playerCharacter.maxHp);
const activeEnemies = computed(() => enemies.filter(enemy => enemy.hpPercent > 0 && enemies.indexOf(enemy) === currentEnemyIndex.value));
const enemyInfoStyle = index => ({
  top: `${initialEnemyPositions[index]?.top - 90 || 0}px`,
  left: `calc(80vw - ${120 + (index || 0) * 50}px)`,
});
const enemyStyle = (index, enemy) => ({
  top: `${enemy.hpPercent > 0 ? enemy.top : (initialEnemyPositions[index]?.top || 0)}px`,
  left: `${enemy.hpPercent > 0 ? `calc(80vw - ${(index || 0) * 50}px)` : (initialEnemyPositions[index]?.left || 0)}px`,
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
  if (!targetElement) return;
  const rect = targetElement.getBoundingClientRect();
  const containerRect = document.querySelector('.battle-arena')?.getBoundingClientRect() || { top: 0, left: 0 };
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
  if (!attackerElement || !targetElement) return;
  const startRect = attackerElement.getBoundingClientRect();
  const endRect = targetElement.getBoundingClientRect();
  const containerRect = document.querySelector('.battle-arena')?.getBoundingClientRect() || { top: 0, left: 0 };
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

// Cutscene Logic
const playCutscene = async () => {
  try {
    playAudio('cave_ambient', { loop: true });
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
  } catch (e) {
    console.error('Erro na cutscene:', e);
    endCutscene(); // Finaliza a cutscene em caso de erro
  }
};

const endCutscene = async () => {
  try {
    playAudio('ui_confirm');
    playAudio('cave_ambient', { stop: true });
    isFading.value = true;
    await sleep(500);
    isFading.value = false;
    cutsceneBackgroundImage.value = caveImage2;
    showCutscene.value = false;
    gameState.player.hasViewedCavernaCutscene = true;
  } catch (e) {
    console.error('Erro ao finalizar cutscene:', e);
    showCutscene.value = false;
  }
};

// Game Functions
const confrontBoss = () => {
  inBattle.value = true;
  currentEnemyIndex.value = 0;
  playAudio('battle_start_dragon_fire');
  feedbackMessage.value = 'O Dragão de Fogo desperta!';
  showFeedback.value = true;
  addLogMessage('🔥 O Dragão de Fogo ruge, lançando chamas!');
  battleLog.value = [`${playerCharacter.name} enfrenta o Dragão de Fogo!`];
  battleStatus.value = 'Desfira seu golpe!';
  enemies[0].hpPercent = 100;
  enemies[0].currentHp = enemies[0].maxHp;
  gameOver.value = false;
  victory.value = false;
  isPlayerTurn.value = true;
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
  const enemy = enemies[currentEnemyIndex.value];
  const playerElement = document.querySelector('.player-character');
  const enemyElement = document.querySelector('.enemy-character');
  if (!playerElement || !enemyElement) {
    console.warn('Elementos de batalha não encontrados');
    isAttacking.value = false;
    return;
  }
  battleStatus.value = `${playerCharacter.name} ataca!`;
  addLogMessage(`⚔️ ${playerCharacter.name} golpeia!`);
  playAudio('attack');
  const originalLeft = playerCharacter.left;
  playerCharacter.left += 40;
  await sleep(200);
  await showAttackEffect(playerElement, enemyElement);
  playerCharacter.left = originalLeft;
  damagedEnemy.value = currentEnemyIndex.value;
  const baseDamage = playerCharacter.attackPower + Math.floor(Math.random() * 6 + 10);
  const isCritical = Math.random() < 0.2;
  let damage = baseDamage;
  if (isCritical) {
    damage *= 2;
    addLogMessage(`💥 <strong>Acerto crítico!</strong> ${playerCharacter.name} causou ${damage} de dano!`);
  } else {
    addLogMessage(`⚔️ ${playerCharacter.name} causou ${damage} de dano ao Dragão de Fogo!`);
  }
  enemy.currentHp = Math.max(0, enemy.currentHp - damage);
  enemy.hpPercent = (enemy.currentHp / enemy.maxHp) * 100;
  showPopup(damage, enemyElement, 'enemy-damage');
  await sleep(500);
  damagedEnemy.value = null;
  playerAttacking.value = false;
  if (enemy.hpPercent <= 0) {
    addLogMessage(`<span style="color: #a09080;">☠️ Dragão de Fogo caiu!</span>`);
    victory.value = true;
    battleStatus.value = 'Triunfo!';
    await finishBattle();
    isAttacking.value = false;
    return;
  }
  isPlayerTurn.value = false;
  battleStatus.value = `Dragão de Fogo prepara um ataque!`;
  await sleep(1000);
  await enemyAttack();
  if (!gameOver.value && !victory.value) {
    isPlayerTurn.value = true;
    battleStatus.value = 'Desfira seu golpe!';
  }
  isAttacking.value = false;
};

const enemyAttack = async () => {
  if (victory.value || gameOver.value) return;
  const enemy = enemies[currentEnemyIndex.value];
  const playerElement = document.querySelector('.player-character');
  const enemyElement = document.querySelector('.enemy-character');
  if (!playerElement || !enemyElement) {
    console.warn('Elementos de batalha não encontrados');
    return;
  }
  enemyAttacking.value = currentEnemyIndex.value;
  const isLavaAttack = Math.random() < 0.3;
  let damage;
  if (isLavaAttack) {
    damage = Math.floor(Math.random() * 10 + 30);
    addLogMessage(`🔥 <strong>Explosão de Lava!</strong> O Dragão causou ${damage} de dano!`);
    playAudio('dragon_lava_attack');
  } else {
    damage = Math.floor(Math.random() * 6 + enemy.attackPower);
    addLogMessage(`🔥 O Dragão de Fogo atacou! Causou ${damage} de dano!`);
    playAudio('hit');
  }
  await showAttackEffect(enemyElement, playerElement);
  playerCharacter.currentHp = Math.max(0, playerCharacter.currentHp - damage);
  playerCharacter.hpPercent = (playerCharacter.currentHp / playerCharacter.maxHp) * 100;
  gameState.player.health = playerCharacter.currentHp;
  damagedPlayer.value = true;
  showPopup(damage, playerElement, 'player-damage');
  await sleep(500);
  damagedPlayer.value = false;
  enemyAttacking.value = null;
  if (playerCharacter.hpPercent <= 0) {
    gameOver.value = true;
    addLogMessage(`💀 <strong>Derrota!</strong> ${playerCharacter.name} foi consumido pelas chamas!`);
    await handleDefeat();
  } else {
    isPlayerTurn.value = true;
    battleStatus.value = 'Desfira seu golpe!';
  }
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
  if (!playerElement) {
    console.warn('Elemento do jogador não encontrado');
    isAttacking.value = false;
    return;
  }
  actions.removeItemFromInventory('potion_health', 1);
  const healAmount = 30;
  playerCharacter.currentHp = Math.min(playerCharacter.maxHp, playerCharacter.currentHp + healAmount);
  playerCharacter.hpPercent = (playerCharacter.currentHp / playerCharacter.maxHp) * 100;
  gameState.player.health = playerCharacter.currentHp;
  showPopup(healAmount, playerElement, 'hp-heal');
  addLogMessage(`🧪 ${playerCharacter.name} usou uma poção! Recuperou ${healAmount} de vida!`);
  playAudio('potion');
  await sleep(1000);
  isPlayerTurn.value = false;
  battleStatus.value = `Dragão de Fogo prepara um ataque!`;
  await sleep(1000);
  await enemyAttack();
  if (!gameOver.value && !victory.value) {
    isPlayerTurn.value = true;
    battleStatus.value = 'Desfira seu golpe!';
  }
  isAttacking.value = false;
};

const collectKey = () => {
  if (bossDefeated.value && !gameState.player.keys?.fire) {
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
  playAudio('ui_back');
  router.push({ name: 'Acampamento' });
};

const finishBattle = async () => {
  playAudio('victory');
  actions.completeLevel('caverna_boss');
  gameState.player.gold += 100;
  actions.addItemToInventory('fire_shard', 1);
  addLogMessage(`<span style="color: #d0a070;">💰 +100 ouro!</span>`);
  addLogMessage(`<span style="color: #d0a070;">🎁 Fragmento de Fogo!</span>`);
  bossDefeated.value = true;
  inBattle.value = false;
  feedbackMessage.value = 'Dragão de Fogo derrotado!';
  showFeedback.value = true;
};

const handleDefeat = async () => {
  gameState.player.health = 0;
  inBattle.value = false;
  playAudio('player_defeat');
  feedbackMessage.value = 'Você foi derrotado!';
  showFeedback.value = true;
  await sleep(2000);
  router.push({ name: 'Home' });
};

// Watchers
watch(
  () => [gameState.player?.health, gameState.player?.stamina],
  ([newHealth, newStamina]) => {
    playerCharacter.currentHp = newHealth || 100;
    playerCharacter.hpPercent = ((newHealth || 100) / playerCharacter.maxHp) * 100;
    playerCharacter.currentStamina = newStamina || 100;
  }
);

// Lifecycle Hooks
onMounted(() => {
  console.log('CavernaView mounted');
  actions.setCurrentArea('Caverna de Fogo');
  if (!gameState.player.hasViewedCavernaCutscene) {
    gameState.player.hasViewedCavernaCutscene = false;
  }
  playerCharacter.currentHp = gameState.player?.health || 100;
  playerCharacter.maxHp = gameState.player?.maxHealth || 100;
  playerCharacter.currentStamina = gameState.player?.stamina || 100;
  playerCharacter.maxStamina = gameState.player?.maxStamina || 100;
  bossDefeated.value = gameState.levelsCompleted?.includes('caverna_boss') || false;
  if (!bossDefeated.value && !gameState.player.hasViewedCavernaCutscene) {
    showCutscene.value = true;
    playCutscene();
  } else {
    showCutscene.value = false;
  }
});
</script>

<style scoped>
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
  font-family: 'Press Start 2P', cursive;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 30px;
  overflow: hidden;
  animation: fadeInSmooth 0.6s ease-out;
}

.bg-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  filter: brightness(0.85);
}

.hud {
  background-color: rgba(0, 0, 0, 0.6);
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
  box-shadow: 0 0 10px #000;
}

.battle-box {
  background-color: rgba(0, 0, 0, 0.65);
  padding: 20px;
  border: 2px solid #b64e1a;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 0 15px #000;
  animation: fadeIn 0.6s ease;
}

.enemy.hit {
  animation: flash 0.3s linear;
}

@keyframes flash {
  0% { filter: brightness(2) }
  50% { filter: brightness(0.5) }
  100% { filter: brightness(1) }
}

.shake {
  animation: shake 0.3s;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-3px); }
  100% { transform: translateX(0); }
}

.actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 20px 0;
  flex-wrap: wrap;
}

button {
  background-color: #b64e1a;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

button:hover {
  background-color: #c85d27;
  transform: scale(1.05);
}

.log {
  font-size: 12px;
  margin-top: 10px;
  min-height: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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
