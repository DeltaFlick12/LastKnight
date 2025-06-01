<template>
  <div class="montanha-view" :style="backgroundStyle">
    <div class="game-hud-placeholder">
      <p>❤️ {{ gameState.player.health }}/{{ gameState.player.maxHealth }} | ⚡ {{ Math.round(gameState.player.stamina) }}/{{ gameState.player.maxStamina }} | 🪙 {{ gameState.player.gold }} | 🧪 {{ gameState.player.potions }}</p>
      <p>Área Atual: {{ gameState.currentArea }}</p>
      <p>Chaves: {{ getCollectedKeysStatus() }}</p>
    </div>

    <div class="content-area">
      <!-- Placeholder para o cenário: Montanha gelada, neve caindo -->
      <div class="scenario-placeholder">
        (Placeholder: Cenário da Montanha Congelada)
        <div class="snow-effect">❄️❄️❄️</div>
        <div v-if="!bossDefeated" class="boss-area-placeholder">
          (Placeholder: Covil do Dragão de Gelo)
        </div>
      </div>

      <!-- Interações / Inimigos -->
      <div v-if="!bossDefeated" class="interactions">
        <p>O ar gélido corta seus pulmões. A montanha é traiçoeira.</p>
        <p><strong>Inimigos:</strong> Placeholders para Yetis e Golens de Gelo bloqueiam o caminho.</p>
        <p>No pico, um poder congelante emana...</p>
        <button @click="confrontBoss">Enfrentar o Guardião do Gelo</button>
      </div>
      <div v-else class="interactions">
        <p>O Dragão de Gelo foi derrotado. A nevasca parece diminuir.</p>
        <p v-if="!gameState.player.keys.ice">Uma chave congelada repousa onde o dragão caiu.</p>
        <button v-if="!gameState.player.keys.ice" @click="collectKey">Pegar a Chave de Gelo</button>
      </div>

       <!-- Caixa de Diálogo para feedback -->
      <div v-if="showFeedback" class="dialog-box feedback-box">
        <p>{{ feedbackMessage }}</p>
        <button @click="showFeedback = false">Ok</button>
      </div>

      <!-- Placeholder para Batalha -->
      <div v-if="inBattle" class="battle-placeholder">
        <p><strong>BATALHA!</strong></p>
        <p>Enfrentando: {{ currentEnemy }}</p>
        <button @click="winBattleExample">Vencer Batalha (Exemplo)</button>
        <button @click="loseBattleExample">Perder Batalha (Exemplo)</button>
      </div>

    </div>

    <div class="navigation-placeholder">
       <button @click="goToPreviousArea">Voltar para Acampamento</button>
       <button v-if="bossDefeated" @click="goToNextArea">Seguir para Caverna</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { gameState, actions } from '@/store/gfame.js'; // Ajuste o caminho
import { playAudio } from '@/utils/audioManager.js';

const router = useRouter();

// Estado local
const showFeedback = ref(false);
const feedbackMessage = ref('');
const bossDefeated = ref(gameState.levelsCompleted.includes('montanha_boss'));
const inBattle = ref(false);
const currentEnemy = ref('');

// Função para exibir chaves coletadas
const getCollectedKeysStatus = () => {
  let keys = [];
  if (gameState.player.keys?.ancestral) keys.push('Ancestral');
  if (gameState.player.keys?.ice) keys.push('Gelo');
  if (gameState.player.keys?.fire) keys.push('Fogo');
  return keys.length > 0 ? keys.join(', ') : 'Nenhuma';
};

const confrontBoss = () => {
  currentEnemy.value = 'Dragão de Gelo';
  inBattle.value = true;
  playAudio('battle_start_dragon_ice');
  feedbackMessage.value = 'O Dragão de Gelo surge da nevasca!';
  showFeedback.value = true;
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

// Funções de exemplo para simular batalha
const winBattleExample = () => {
  if (currentEnemy.value === 'Dragão de Gelo') {
    playAudio('boss_defeat');
    bossDefeated.value = true;
    actions.completeLevel('montanha_boss');
    feedbackMessage.value = 'O Dragão de Gelo foi derrotado!';
    showFeedback.value = true;
  }
  inBattle.value = false;
  currentEnemy.value = '';
};

const loseBattleExample = () => {
  playAudio('player_defeat');
  feedbackMessage.value = 'Você foi derrotado!';
  showFeedback.value = true;
  inBattle.value = false;
  currentEnemy.value = '';
  alert('Game Over!');
  router.push('/');
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
  // playAudio('music_mountain_ambient', { loop: true });
  if (!gameState.player.keys) {
    gameState.player.keys = reactive({ ancestral: false, ice: false, fire: false });
  }
});

// Estilo de fundo (placeholder)
const backgroundStyle = computed(() => {
  // TODO: Trocar por imagem de fundo real da montanha
  return { backgroundColor: '#e0ffff' }; // LightCyan (cor de gelo/neve)
});

</script>

<style scoped>
/* Estilos gerais similares aos outros níveis, ajustar cores */
.montanha-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  color: #191970; /* MidnightBlue para fundo claro */
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
  top: 0; left: 0; right: 0; bottom: 0;
  border: 2px dashed #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
  z-index: 0;
}

.snow-effect {
  position: absolute;
  top: 10px; left: 10px;
  font-size: 1.5rem;
  color: white;
  opacity: 0.7;
  /* TODO: Animar a neve caindo */
}

.boss-area-placeholder {
  border: 3px solid #4682b4; /* SteelBlue */
  padding: 40px;
  background-color: rgba(176, 224, 230, 0.5); /* PowderBlue semi-transparente */
}

.interactions {
  background-color: rgba(200, 220, 255, 0.7);
  padding: 20px;
  border-radius: 5px;
  text-align: center;
  z-index: 1;
  color: #000080; /* Navy */
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

.battle-placeholder {
  border: 2px solid red;
  background-color: rgba(100, 0, 0, 0.8);
  padding: 30px;
  margin-top: 20px;
  color: white;
  text-align: center;
  z-index: 3;
}

button {
  margin: 10px;
  padding: 10px 15px;
  font-family: 'Press Start 2P', cursive;
  cursor: pointer;
  background-color: #4682b4; /* SteelBlue */
  color: white;
  border: 1px solid #1e90ff; /* DodgerBlue */
  z-index: 1;
}

button:hover {
  background-color: #5f9ea0; /* CadetBlue */
}

.navigation-placeholder {
  padding: 10px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.7);
}
</style>
