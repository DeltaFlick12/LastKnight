<template>
  <div class="ruinas-view" :style="backgroundStyle">
    <div class="game-hud-placeholder">
      <p>❤️ {{ gameState.player.health }}/{{ gameState.player.maxHealth }} | ⚡ {{ Math.round(gameState.player.stamina) }}/{{ gameState.player.maxStamina }} | 🪙 {{ gameState.player.gold }} | 🧪 {{ gameState.player.potions }}</p>
      <p>Área Atual: {{ gameState.currentArea }}</p>
      <p>Chaves: {{ getCollectedKeysStatus() }}</p>
    </div>

    <div class="content-area">
      <!-- Placeholder para o cenário: Ruínas antigas e poeirentas -->
      <div class="scenario-placeholder">
        (Placeholder: Cenário das Ruínas Ancestrais)
        <div v-if="!bossDefeated" class="boss-area-placeholder">
          (Placeholder: Área do Dragão Ancestral)
        </div>
      </div>

      <!-- Interações / Inimigos -->
      <div v-if="!bossDefeated" class="interactions">
        <p>As ruínas ecoam com sons antigos e perturbadores.</p>
        <p><strong>Inimigos:</strong> Placeholders para Traças, Esqueletos e Zumbis perambulam pelas sombras.</p>
        <p>No coração das ruínas, uma presença poderosa aguarda...</p>
        <button @click="confrontBoss">Enfrentar o Guardião das Ruínas</button>
      </div>
      <div v-else class="interactions">
        <p>O Dragão Ancestral foi derrotado. As ruínas estão silenciosas, exceto pelo vento.</p>
        <p v-if="!gameState.player.keys.ancestral">Uma chave antiga repousa onde o dragão caiu.</p>
        <button v-if="!gameState.player.keys.ancestral" @click="collectKey">Pegar a Chave Ancestral</button>
      </div>

       <!-- Caixa de Diálogo para feedback -->
      <div v-if="showFeedback" class="dialog-box feedback-box">
        <p>{{ feedbackMessage }}</p>
        <button @click="showFeedback = false">Ok</button>
      </div>

      <!-- Placeholder para Batalha (poderia ser um componente separado ou integrado) -->
      <div v-if="inBattle" class="battle-placeholder">
        <p><strong>BATALHA!</strong></p>
        <p>Enfrentando: {{ currentEnemy }}</p>
        <button @click="winBattleExample">Vencer Batalha (Exemplo)</button>
        <button @click="loseBattleExample">Perder Batalha (Exemplo)</button>
      </div>

    </div>

    <div class="navigation-placeholder">
       <button @click="goToPreviousArea">Voltar para Rio</button>
       <button v-if="bossDefeated" @click="goToNextArea">Seguir para Acampamento</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { gameState, actions } from '@/stores/game.js'; // Ajuste o caminho
import { playAudio } from '@/utils/audioManager.js';

const router = useRouter();

// Estado local
const showFeedback = ref(false);
const feedbackMessage = ref('');
const bossDefeated = ref(gameState.levelsCompleted.includes('ruinas_boss')); // Verifica se o boss já foi derrotado
const inBattle = ref(false);
const currentEnemy = ref('');

// Função para exibir chaves coletadas (precisa ajustar gameState)
const getCollectedKeysStatus = () => {
  let keys = [];
  if (gameState.player.keys?.ancestral) keys.push('Ancestral');
  if (gameState.player.keys?.ice) keys.push('Gelo');
  if (gameState.player.keys?.fire) keys.push('Fogo');
  return keys.length > 0 ? keys.join(', ') : 'Nenhuma';
};

const confrontBoss = () => {
  // TODO: Iniciar a batalha real contra o Dragão Ancestral
  // Poderia navegar para uma rota de batalha ou ativar um componente
  currentEnemy.value = 'Dragão Ancestral';
  inBattle.value = true;
  playAudio('battle_start_dragon_ancestral');
  feedbackMessage.value = 'O Dragão Ancestral desperta!';
  showFeedback.value = true;
};

const collectKey = () => {
  if (bossDefeated.value && !gameState.player.keys.ancestral) {
    actions.collectKey('ancestral'); // Ação a ser criada no store
    playAudio('collect_key_ancient');
    feedbackMessage.value = 'Você obteve a Chave Ancestral!';
    showFeedback.value = true;
    // Atualizar visualmente que a chave foi pega
  } else {
     feedbackMessage.value = 'Não há chave aqui ou você já a pegou.';
     showFeedback.value = true;
  }
};

// Funções de exemplo para simular batalha
const winBattleExample = () => {
  if (currentEnemy.value === 'Dragão Ancestral') {
    playAudio('boss_defeat');
    bossDefeated.value = true;
    actions.completeLevel('ruinas_boss'); // Marcar derrota do boss
    feedbackMessage.value = 'O Dragão Ancestral foi derrotado!';
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
  // Lógica de Game Over
  alert('Game Over!');
  router.push('/');
};

const goToPreviousArea = () => {
  playAudio('ui_back');
  router.push({ name: 'Rio' }); // Assumindo rota 'Rio'
};

const goToNextArea = () => {
  playAudio('ui_confirm');
  router.push({ name: 'Acampamento' }); // Assumindo rota 'Acampamento'
};

onMounted(() => {
  actions.setCurrentArea('Ruínas Ancestrais');
  // playAudio('music_ruins_ambient', { loop: true });
  // Inicializar estado das chaves se não existir
  if (!gameState.player.keys) {
    gameState.player.keys = reactive({ ancestral: false, ice: false, fire: false });
  }
});

// Estilo de fundo (placeholder)
const backgroundStyle = computed(() => {
  // TODO: Trocar por imagem de fundo real das ruínas
  return { backgroundColor: '#8f8f7a' }; // Tom de pedra antiga/musgo
});

</script>

<style scoped>
/* Estilos gerais similares aos outros níveis */
.ruinas-view {
  position: relative;
  width: 100%;
  height: 100vh;
  background-size: cover;
  background-position: center;
  background-image: url('@/assets/backviews/ruina.jpg'); 
  overflow: hidden;
  /* Filtro intensificado para clima sombrio */
  filter: brightness(0.6) contrast(1.05) saturate(0.6) grayscale(0.1);
}
/* .ruinas-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  color: #e0e0d0; /* Cor clara para fundo escuro */
  /* font-family: 'Press Start 2P', cursive;
} */

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
  border: 2px dashed #777;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
  z-index: 0;
}

.boss-area-placeholder {
  border: 3px solid darkred;
  padding: 40px;
  background-color: rgba(50, 20, 20, 0.5);
}

.interactions {
  background-color: rgba(30, 30, 30, 0.7);
  padding: 20px;
  border-radius: 5px;
  text-align: center;
  z-index: 1;
  color: white;
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
  background-color: #708090; /* SlateGray */
  color: white;
  border: 1px solid #5a6874;
  z-index: 1;
}

button:hover {
  background-color: #778899; /* LightSlateGray */
}

.navigation-placeholder {
  padding: 10px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
