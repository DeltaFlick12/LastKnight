<template>
  <div class="rio-view" :style="backgroundStyle">
    <div class="game-hud-placeholder">
      <p>❤️ {{ gameState.player.health }}/{{ gameState.player.maxHealth }} | ⚡ {{ Math.round(gameState.player.stamina) }}/{{ gameState.player.maxStamina }} | 🪙 {{ gameState.player.gold }} | 🧪 {{ gameState.player.potions }}</p>
      <p>Área Atual: {{ gameState.currentArea }}</p>
      <p v-if="gameState.player.hasRiverBlessing">Bênção do Rio Ativa</p>
    </div>

    <div class="content-area">
      <!-- Placeholder para o cenário: Rio largo e sombrio -->
      <div class="scenario-placeholder">
        (Placeholder: Cenário do Rio das Almas Perdidas)
        <div class="river-visual">~~~~~~ Rio ~~~~~~</div>
      </div>

      <!-- Interação -->
      <div class="interaction-point">
        <p>Você chega à margem do Rio das Almas Perdidas. As águas escuras parecem puxar sua energia vital.</p>
        <button @click="attemptCrossRiver">Tentar Atravessar</button>
      </div>

       <!-- Caixa de Diálogo para feedback -->
      <div v-if="showFeedback" class="dialog-box feedback-box">
        <p>{{ feedbackMessage }}</p>
        <button @click="showFeedback = false">Ok</button>
      </div>

    </div>

    <div class="navigation-placeholder">
       <button @click="goToPreviousArea">Voltar para Floresta</button>
       <!-- Botão para próxima área aparece após atravessar -->
       <button v-if="crossedRiver" @click="goToNextArea">Seguir para Ruínas</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { gameState, actions } from '@/stores/gfame.js'; // Ajuste o caminho
import { playAudio } from '@/utils/audioManager.js';

const router = useRouter();

// Estado local
const showFeedback = ref(false);
const feedbackMessage = ref('');
const crossedRiver = ref(false); // Indica se o jogador já atravessou

const attemptCrossRiver = () => {
  if (crossedRiver.value) {
    feedbackMessage.value = 'Você já atravessou o rio.';
    showFeedback.value = true;
    return;
  }

  if (gameState.player.hasRiverBlessing) {
    playAudio('river_cross_blessed');
    feedbackMessage.value = 'Com a bênção da Igreja, você atravessa as águas sombrias sem dificuldades.';
    crossedRiver.value = true;
    actions.completeLevel('rio'); // Marcar nível como completo
  } else {
    playAudio('river_cross_unblessed');
    const damageTaken = 25; // Exemplo de dano por tentar cruzar sem bênção
    actions.takeDamage(damageTaken);
    feedbackMessage.value = `As águas amaldiçoadas drenam sua força vital! Você perde ${damageTaken} HP e é forçado a recuar.`;
    if (gameState.player.health <= 0) {
      // Lógica de Game Over
      playAudio('player_defeat');
      alert('Game Over! As águas o consumiram.');
      router.push('/'); // Volta ao menu
      return;
    }
  }
  showFeedback.value = true;
};

const goToPreviousArea = () => {
  playAudio('ui_back');
  // TODO: Navegar de volta para a FlorestaView ou Mapa
  router.push({ name: 'Floresta' }); // Assumindo que 'Floresta' é a rota
};

const goToNextArea = () => {
  playAudio('ui_confirm');
  // Navegar para a próxima área após o rio (Ruínas, conforme enredo)
  router.push({ name: 'Ruinas' }); // Assumindo que 'Ruinas' é a rota
};

onMounted(() => {
  actions.setCurrentArea('Rio das Almas Perdidas');
  // playAudio('music_river_ambient', { loop: true });
  // Verificar se o jogador já completou este nível para definir crossedRiver
  if (gameState.levelsCompleted.includes('rio')) {
      crossedRiver.value = true;
  }
});

// Estilo de fundo (placeholder)
const backgroundStyle = computed(() => {
  // TODO: Trocar por imagem de fundo real do rio
  return { backgroundColor: '#2e4a62' }; // Azul acinzentado escuro
});

</script>

<style scoped>
/* Estilos gerais similares aos outros níveis */
.rio-view {
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

.river-visual {
  font-size: 2rem;
  color: #5a7a9a;
  text-align: center;
}

.interaction-point {
  background-color: rgba(0, 0, 0, 0.6);
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
  background-color: #4682b4; /* SteelBlue */
  color: white;
  border: 1px solid #5a7a9a;
  z-index: 1;
}

button:hover {
  background-color: #6495ed; /* CornflowerBlue */
}

.navigation-placeholder {
  padding: 10px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
