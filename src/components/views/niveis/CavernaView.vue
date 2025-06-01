<template>
  <div class="caverna-view" :style="backgroundStyle">
    <div class="game-hud-placeholder">
      <p>❤️ {{ gameState.player.health }}/{{ gameState.player.maxHealth }} | ⚡ {{ Math.round(gameState.player.stamina) }}/{{ gameState.player.maxStamina }} | 🪙 {{ gameState.player.gold }} | 🧪 {{ gameState.player.potions }}</p>
      <p>Área Atual: {{ gameState.currentArea }}</p>
      <p>Chaves: {{ getCollectedKeysStatus() }}</p>
    </div>

    <div class="content-area">
      <!-- Placeholder para o cenário: Caverna com rio de lava -->
      <div class="scenario-placeholder">
        (Placeholder: Cenário da Caverna Ígnea)
        <div class="lava-river-effect">~~ Rio de Lava ~~</div>
        <div v-if="!bossDefeated" class="boss-area-placeholder">
          (Placeholder: Covil do Dragão de Fogo)
        </div>
      </div>

      <!-- Interações / Inimigos -->
      <div v-if="!bossDefeated" class="interactions">
        <p>O calor sufocante da caverna dificulta a respiração. O chão treme ocasionalmente.</p>
        <p><strong>Inimigos:</strong> Placeholders para Morcegos e Homens Lagarto espreitam nas sombras quentes.</p>
        <p>Nas profundezas, um poder incandescente reside...</p>
        <button @click="confrontBoss">Enfrentar o Guardião do Fogo</button>
      </div>
      <div v-else class="interactions">
        <p>O Dragão de Fogo foi derrotado. O calor intenso diminuiu um pouco.</p>
        <p v-if="!gameState.player.keys.fire">Uma chave em brasa repousa onde o dragão caiu.</p>
        <button v-if="!gameState.player.keys.fire" @click="collectKey">Pegar a Chave de Fogo</button>
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
       <button @click="goToPreviousArea">Voltar para Montanha</button>
       <!-- Após pegar as 3 chaves, o próximo destino é o Castelo -->
       <button v-if="bossDefeated" @click="goToNextArea">Seguir para Castelo</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { gameState, actions } from '@/stores/gfame.js'; // Ajuste o caminho
import { playAudio } from '@/utils/audioManager.js';

const router = useRouter();

// Estado local
const showFeedback = ref(false);
const feedbackMessage = ref('');
const bossDefeated = ref(gameState.levelsCompleted.includes('caverna_boss'));
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
  currentEnemy.value = 'Dragão de Fogo';
  inBattle.value = true;
  playAudio('battle_start_dragon_fire');
  feedbackMessage.value = 'O Dragão de Fogo emerge das chamas!';
  showFeedback.value = true;
};

const collectKey = () => {
  if (bossDefeated.value && !gameState.player.keys.fire) {
    actions.collectKey('fire');
    playAudio('collect_key_fire');
    feedbackMessage.value = 'Você obteve a Chave de Fogo!';
    showFeedback.value = true;
  } else {
     feedbackMessage.value = 'Não há chave aqui ou você já a pegou.';
     showFeedback.value = true;
  }
};

// Funções de exemplo para simular batalha
const winBattleExample = () => {
  if (currentEnemy.value === 'Dragão de Fogo') {
    playAudio('boss_defeat');
    bossDefeated.value = true;
    actions.completeLevel('caverna_boss');
    feedbackMessage.value = 'O Dragão de Fogo foi derrotado!';
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
  router.push({ name: 'Montanha' });
};

const goToNextArea = () => {
  playAudio('ui_confirm');
  // Após a última chave, vai para o Castelo
  router.push({ name: 'Castelo' });
};

onMounted(() => {
  actions.setCurrentArea('Caverna Ígnea');
  // playAudio('music_cave_ambient', { loop: true });
  if (!gameState.player.keys) {
    gameState.player.keys = reactive({ ancestral: false, ice: false, fire: false });
  }
});

// Estilo de fundo (placeholder)
const backgroundStyle = computed(() => {
  // TODO: Trocar por imagem de fundo real da caverna
  return { backgroundColor: '#8b0000' }; // DarkRed (cor de lava/rocha escura)
});

</script>

<style scoped>
/* Estilos gerais similares aos outros níveis, ajustar cores */
.caverna-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  color: #ffcc66; /* Cor clara/amarelada para fundo escuro */
  font-family: 'Press Start 2P', cursive;
}

.game-hud-placeholder {
  background-color: rgba(0, 0, 0, 0.7);
  padding: 10px;
  font-size: 12px;
  color: white;
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
  border: 2px dashed #ff4500; /* OrangeRed */
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
  z-index: 0;
}

.lava-river-effect {
  position: absolute;
  bottom: 10px;
  left: 0; right: 0;
  text-align: center;
  font-size: 1.5rem;
  color: #ff4500; /* OrangeRed */
  font-weight: bold;
  /* TODO: Animar a lava */
}

.boss-area-placeholder {
  border: 3px solid #dc143c; /* Crimson */
  padding: 40px;
  background-color: rgba(139, 0, 0, 0.5); /* DarkRed semi-transparente */
}

.interactions {
  background-color: rgba(50, 10, 10, 0.7);
  padding: 20px;
  border-radius: 5px;
  text-align: center;
  z-index: 1;
  color: #ffebcd; /* BlanchedAlmond */
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
  background-color: #b22222; /* Firebrick */
  color: white;
  border: 1px solid #dc143c; /* Crimson */
  z-index: 1;
}

button:hover {
  background-color: #cd5c5c; /* IndianRed */
}

.navigation-placeholder {
  padding: 10px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
