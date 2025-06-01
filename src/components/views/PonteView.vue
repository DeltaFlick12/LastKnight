<template>
  <div class="ponte-view" :style="backgroundStyle">
    <div class="game-hud-placeholder">
      <p>❤️ {{ gameState.player.health }}/{{ gameState.player.maxHealth }} | ⚡ {{ Math.round(gameState.player.stamina) }}/{{ gameState.player.maxStamina }} | 🪙 {{ gameState.player.gold }} | 🧪 {{ gameState.player.potions }}</p>
      <p>Área Atual: {{ gameState.currentArea }}</p>
    </div>

    <div class="content-area">
      <!-- Placeholder para o cenário: Ponte sobre um abismo ou rio? -->
      <div class="scenario-placeholder">
        (Placeholder: Cenário da Ponte)
        <div class="bridge-visual">--- Ponte ---</div>
      </div>

      <!-- Interação -->
      <div class="interaction-point">
        <p>Uma ponte antiga se estende à sua frente.</p>
        <!-- Adicionar lógica de puzzle, inimigos ou escolha de caminho se necessário -->
        <p>(Placeholder: Interação/Puzzle da Ponte)</p>
        <button @click="crossBridge">Atravessar a Ponte</button>
      </div>

       <!-- Caixa de Diálogo para feedback -->
      <div v-if="showFeedback" class="dialog-box feedback-box">
        <p>{{ feedbackMessage }}</p>
        <button @click="showFeedback = false">Ok</button>
      </div>

    </div>

    <div class="navigation-placeholder">
       <button @click="goToPreviousArea">Voltar</button>
       <button @click="goToNextArea">Seguir Adiante</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { gameState, actions } from '@/store/gfame.js'; // Ajuste o caminho
import { playAudio } from '@/utils/audioManager.js';

const router = useRouter();

// Estado local
const showFeedback = ref(false);
const feedbackMessage = ref('');

const crossBridge = () => {
  // Placeholder: Lógica para atravessar a ponte
  playAudio('footsteps_bridge');
  feedbackMessage.value = 'Você atravessa a ponte com cuidado.';
  showFeedback.value = true;
  // Marcar como completo ou liberar próxima área?
  // actions.completeLevel('ponte');
};

const goToPreviousArea = () => {
  playAudio('ui_back');
  // TODO: Definir a área anterior correta com base no fluxo do jogo
  router.go(-1); // Exemplo: voltar para a página anterior
};

const goToNextArea = () => {
  playAudio('ui_confirm');
  // TODO: Definir a próxima área correta com base no fluxo do jogo
  // Exemplo: router.push({ name: 'AlgumLugar' });
  feedbackMessage.value = 'Destino indefinido.';
  showFeedback.value = true;
};

onMounted(() => {
  actions.setCurrentArea('Ponte Misteriosa');
  // playAudio('music_bridge_ambient', { loop: true });
});

// Estilo de fundo (placeholder)
const backgroundStyle = computed(() => {
  // TODO: Trocar por imagem de fundo real da ponte
  return { backgroundColor: '#a9a9a9' }; // DarkGray (cor de pedra/névoa)
});

</script>

<style scoped>
/* Estilos gerais similares aos outros níveis */
.ponte-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  color: white;
  font-family: 'Press Start 2P', cursive;
}

.game-hud-placeholder {
  background-color: rgba(0, 0, 0, 0.7);
  padding: 10px;
  font-size: 12px;
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

.bridge-visual {
  font-size: 1.5rem;
  color: #ccc;
  text-align: center;
  border-top: 3px solid #888;
  border-bottom: 3px solid #888;
  padding: 10px 0;
}

.interaction-point {
  background-color: rgba(50, 50, 50, 0.7);
  padding: 20px;
  border-radius: 5px;
  text-align: center;
  z-index: 1;
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
  background-color: #696969; /* DimGray */
  color: white;
  border: 1px solid #808080; /* Gray */
  z-index: 1;
}

button:hover {
  background-color: #808080; /* Gray */
}

.navigation-placeholder {
  padding: 10px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
