<template>
  <div :class="['cave-view', { shake: isShaking }]" :style="showCutscene ? cutsceneBackgroundStyle : backgroundStyle">
    <!-- Cutscene -->
    <div v-if="showCutscene" class="cutscene-container" tabindex="0">
      <div class="cutscene-content">
        <div v-for="(line, index) in cutsceneLines" :key="index" class="cutscene-box" :class="{ visible: index < currentCutsceneLine }">
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

    <!-- HUD -->
    <div v-if="!showCutscene" class="hud">
      <div>❤️ Vida: {{ playerHealth }}/100</div>
      <div>⚡ Energia: {{ playerStamina }}/100</div>
      <div>⚔️ Arma: {{ equippedWeapon }}</div>
    </div>

    <!-- Content Area -->
    <div class="content-area">
      <!-- Interactions -->
      <div v-if="!bossDefeated && !inBattle && !showCutscene" class="interactions">
        <button @click="confrontBoss">Enfrentar o Dragão de Fogo</button>
        <button @click="fleeArea">Fugir</button>
      </div>
      <div v-if="!inBattle && bossDefeated && !showCutscene" class="interactions">
        <p>O Dragão de Fogo foi derrotado.</p>
        <p v-if="!hasFireKey">Uma Chave Incandescente brilha entre as cinzas.</p>
        <button v-if="!hasFireKey" @click="collectKey">Pegar Chave Incandescente</button>
      </div>

      <!-- Battle System -->
      <div v-if="inBattle && !showCutscene" class="battle-box">
        <div :class="['enemy', { hit: enemyHit }]">
          <h2>🔥 {{ enemy.name }}</h2>
          <p>🩸 Vida: {{ enemy.health }}/{{ enemy.maxHealth }}</p>
        </div>

        <div class="actions">
          <button @click="attackEnemy" :disabled="enemy.health <= 0 || playerHealth <= 0 || playerStamina < 10">Atacar</button>
          <button @click="usePotion" :disabled="potions <= 0 || playerHealth >= 100 || playerStamina < 5">Usar Poção ({{ potions }})</button>
          <button @click="dodge" :disabled="enemy.health <= 0 || playerHealth <= 0 || playerStamina < 10 || isDodging">Esquivar-se</button>
        </div>

        <p class="log animated-text">{{ battleLog }}</p>

        <button v-if="enemy.health <= 0" @click="finishBattle">🏆 Vitória! Continuar</button>
      </div>
    </div>

    <!-- Feedback Box -->
    <div v-if="showFeedback && !showCutscene" class="feedback-box">
      <p>{{ feedbackMessage }}</p>
      <button @click="showFeedback = false">Ok</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import caveImage1 from '@/assets/backviews/caverna-entrada.png'; // Primeira imagem (caverna externa)
import caveImage2 from '@/assets/backviews/caverna-confronto.png'; // Segunda imagem (caverna interna com dragão)
import caveBattleImage from '@/assets/backviews/caverna-cenario.png'; // Terceira imagem (arena de batalha)

const router = useRouter();

// Cutscene State
const showCutscene = ref(true);
const currentCutsceneLine = ref(0);
const cutsceneLines = [
  'A escuridão úmida da caverna engole seus passos, o ar pesado cheira a enxofre.',
  'Gotas d’água ecoam pelas paredes rochosas, misturadas ao brilho de um rio de lava.',
  'O calor aumenta, e o som de rochas estalando quebra o silêncio opressivo.',
  'A caverna se abre em uma câmara vasta, iluminada por reflexos avermelhados.',
  'No centro, sobre uma ilha de pedra, o Dragão de Fogo observa com olhos flamejantes.',
  'Um rugido ensurdecedor ecoa, e chamas iluminam a caverna. A batalha começa!',
];
const displayedLines = ref([]);
const isFading = ref(false);
const cutsceneBackgroundImage = ref(caveImage1); // Inicia com a primeira imagem

// Background Styles
const backgroundStyle = computed(() => ({
   backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${cutsceneBackgroundImage.value})`,
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
const playerHealth = ref(100);
const playerStamina = ref(parseInt(localStorage.getItem('stamina')) || 100);
const potions = ref(parseInt(localStorage.getItem('potions')) || 3);
const equippedWeapon = ref(localStorage.getItem('weapon') || 'Espada de Treinamento');
const hasFireKey = ref(localStorage.getItem('fireKey') === 'true');
const bossDefeated = ref(localStorage.getItem('progress') === 'caverna-concluida');
const inBattle = ref(false);
const showFeedback = ref(false);
const feedbackMessage = ref('');
const isDodging = ref(false);

const enemy = ref({
  name: 'Dragão de Fogo',
  health: 150,
  maxHealth: 150,
  attack: 20,
  lavaAttack: 30,
});

const battleLog = ref('Um Dragão de Fogo irrompeu das chamas!');
const isShaking = ref(false);
const enemyHit = ref(false);

// Utility Functions
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const playSound = (path) => {
  const sfx = new Audio(path);
  sfx.volume = 0.5;
  sfx.play();
};

// Cutscene Logic
const playCutscene = async () => {
  playSound('/sfx/cave_ambient.wav');
  displayedLines.value = new Array(cutsceneLines.length).fill('');
  for (let i = 0; i < cutsceneLines.length; i++) {
    currentCutsceneLine.value = i + 1;
    const text = cutsceneLines[i];

    // Troca de imagem no momento certo (ex: na linha 4 ou 5)
    if (i === 4) {
      cutsceneBackgroundImage.value = caveImage2; // muda para imagem da caverna interna
    }

    for (let j = 0; j <= text.length; j++) {
      displayedLines.value[i] = text.slice(0, j);
      displayedLines.value = [...displayedLines.value];
      if (j > 0) playSound('/sfx/typewriter_click.wav');
      await sleep(50);
    }

    if (i === 4) {
      playSound('/sfx/dragon_roar.wav');
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
  playSound('/sfx/ui_confirm.wav');
  isFading.value = true;
  await sleep(500);
  isFading.value = false;
  cutsceneBackgroundImage.value = caveImage2; // Muda para a segunda imagem
  showCutscene.value = false;
};

// Game Functions
const confrontBoss = () => {
 inBattle.value = true;
  cutsceneBackgroundImage.value = caveBattleImage; // Muda a imagem ao iniciar a batalha
  playSound('/sfx/battle_start_dragon.wav');
  feedbackMessage.value = 'O Dragão de Fogo desperta!';
  showFeedback.value = true;
  battleLog.value = 'O Dragão de Fogo ruge, lançando chamas!';
};

const attackEnemy = async () => {
  if (enemy.value.health <= 0 || playerHealth.value <= 0 || playerStamina.value < 10) {
    if (playerStamina.value < 10) {
      battleLog.value = '⚡ Energia insuficiente!';
      showFeedback.value = true;
      feedbackMessage.value = 'Você não tem energia suficiente!';
    }
    return;
  }

  playerStamina.value = Math.max(0, playerStamina.value - 10);
  localStorage.setItem('stamina', playerStamina.value);
  battleLog.value = '⚡ -10 energia';

  const baseDamage = equippedWeapon.value === 'Espada de Treinamento'
    ? Math.floor(Math.random() * 6 + 10)
    : Math.floor(Math.random() * 8 + 12);

  let damage = baseDamage;
  const isCritical = Math.random() < 0.2;
  if (isCritical) {
    damage *= 2;
    battleLog.value = `💥 Acerto crítico! Você causou ${damage} de dano ao ${enemy.value.name}!`;
  } else {
    battleLog.value = `Você causou ${damage} de dano ao ${enemy.value.name}!`;
  }

  enemy.value.health = Math.max(0, enemy.value.health - damage);
  enemyHit.value = true;
  playSound('/sfx/attack.wav');

  setTimeout(() => {
    enemyHit.value = false;
    if (enemy.value.health > 0) {
      enemyAttack();
    }
  }, 300);
};

const dodge = async () => {
  if (enemy.value.health <= 0 || playerHealth.value <= 0 || playerStamina.value < 10 || isDodging.value) {
    if (playerStamina.value < 10) {
      battleLog.value = '⚡ Energia insuficiente!';
      showFeedback.value = true;
      feedbackMessage.value = 'Você não tem energia suficiente!';
    }
    return;
  }

  playerStamina.value = Math.max(0, playerStamina.value - 10);
  localStorage.setItem('stamina', playerStamina.value);
  isDodging.value = true;
  battleLog.value = '🏃 Você se prepara para esquivar!';
  await sleep(300);
  enemyAttack();
};

const enemyAttack = () => {
  const isLavaAttack = Math.random() < 0.3;
  let damage;

  if (isLavaAttack) {
    damage = Math.floor(Math.random() * 6 + enemy.value.lavaAttack);
    battleLog.value = `🔥 ${enemy.value.name} lança uma Explosão de Lava!`;
  } else {
    damage = Math.floor(Math.random() * 6 + enemy.value.attack);
    battleLog.value = `${enemy.value.name} atacou com chamas!`;
  }

  if (isDodging.value && Math.random() < 0.5) {
    battleLog.value += ' 🏃 Você esquivou do ataque!';
    isDodging.value = false;
    playSound('/sfx/hit.wav');
    return;
  }

  playerHealth.value = Math.max(0, playerHealth.value - damage);
  battleLog.value += ` Causou ${damage} de dano!`;
  isShaking.value = true;
  playSound('/sfx/hit.wav');
  setTimeout(() => {
    isShaking.value = false;
    isDodging.value = false;
  }, 400);

  if (playerHealth.value <= 0) {
    playSound('/sfx/player_defeat.wav');
    feedbackMessage.value = 'Você foi derrotado pelas chamas!';
    showFeedback.value = true;
    setTimeout(() => router.push('/'), 2000);
  }
};

const usePotion = () => {
  if (potions.value > 0 && playerHealth.value < 100 && playerStamina.value >= 5) {
    playerStamina.value = Math.max(0, playerStamina.value - 5);
    localStorage.setItem('stamina', playerStamina.value);
    playerHealth.value = Math.min(100, playerHealth.value + 30);
    potions.value--;
    localStorage.setItem('potions', potions.value);
    battleLog.value = '🧪 Você usou uma poção! +30 vida';
    playSound('/sfx/potion.wav');
  } else if (playerStamina.value < 5) {
    battleLog.value = '⚡ Energia insuficiente!';
    showFeedback.value = true;
    feedbackMessage.value = 'Você não tem energia suficiente!';
  }
};

const collectKey = () => {
  if (bossDefeated.value && !hasFireKey.value) {
    hasFireKey.value = true;
    localStorage.setItem('fireKey', 'true');
    playSound('/sfx/collect_key.wav');
    feedbackMessage.value = 'Chave Incandescente obtida!';
    showFeedback.value = true;
  } else {
    feedbackMessage.value = 'Nenhuma chave disponível.';
    showFeedback.value = true;
  }
};

const fleeArea = () => {
  playSound('/sfx/ui_back.wav');
  router.push('/map');
};

const finishBattle = () => {
  playSound('/sfx/victory.wav');
  localStorage.setItem('progress', 'caverna-concluida');
  bossDefeated.value = true;
  inBattle.value = false;
  feedbackMessage.value = 'Dragão de Fogo derrotado!';
  showFeedback.value = true;
};

// Lifecycle Hooks
onMounted(() => {
  showCutscene.value = true;
  playCutscene();
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

.bg-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  object-fit: cover;
  z-index: -1;
  filter: brightness(0.85);
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

.content-area {
  flex-grow: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.interactions, .feedback-box {
  background-color: rgba(40, 20, 10, 0.85);
  padding: 20px;
  border: 2px solid #b64e1a;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
  color: #f0d0a0;
  font-family: 'MedievalSharp', cursive;
}

.interactions {
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
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
  0% { filter: brightness(2); }
  50% { filter: brightness(0.5); }
  100% { filter: brightness(1); }
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