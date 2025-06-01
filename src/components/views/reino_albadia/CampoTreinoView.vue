<template>
  <div class="campo-treino-view" :style="backgroundStyle">
    <div class="game-hud-placeholder">
      <p>❤️ {{ gameState.player.health }}/{{ gameState.player.maxHealth }} | ⚡ {{ Math.round(gameState.player.stamina) }}/{{ gameState.player.maxStamina }} | 🪙 {{ gameState.player.gold }} | 🧪 {{ gameState.player.potions }}</p>
      <p>Área Atual: {{ gameState.currentArea }}</p>
    </div>

    <div class="content-area">
      <!-- Placeholder para o cenário: Chão de terra, muralha, alvos -->
      <div class="scenario-placeholder">
        (Placeholder: Cenário do Campo de Treino)
      </div>

      <!-- Placeholder para Bartolomeu (Dummy) -->
      <div class="npc-placeholder bartolomeu" @click="interactWithBartolomeu">
        <p>Bartolomeu (Dummy)</p>
        <p v-if="bartolomeuHitCount > 0">Ai! ({{ bartolomeuHitCount }})</p>
      </div>

      <!-- Caixa de Diálogo -->
      <div v-if="showDialog" class="dialog-box">
        <p class="speaker-name">{{ currentDialog.speaker }}:</p>
        <p class="dialog-text">{{ currentDialog.text }}</p>
        <button @click="nextDialog">Continuar...</button>
      </div>

      <!-- Botão de Ataque (apenas para o tutorial) -->
       <button v-if="tutorialStep >= 2 && tutorialStep < 5" @click="attackBartolomeu">Atacar Bartolomeu</button>

    </div>

    <div class="navigation-placeholder">
       <button v-if="tutorialComplete" @click="goToClassSelect">Ir para Seleção de Classe</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { gameState, actions } from '@/store/gfame.js'; // Ajuste o caminho
import { playAudio } from '@/utils/audioManager.js';

const router = useRouter();

// Estado local do tutorial
const tutorialStep = ref(0);
const showDialog = ref(false);
const tutorialComplete = ref(false);
const bartolomeuHitCount = ref(0);

// Diálogos do Tutorial com Bartolomeu
const tutorialDialogs = reactive([
  { speaker: 'Bartolomeu', text: 'Ei! Novato! Acordou finalmente? Depois daquele ataque... pensei que você não voltaria!' },
  { speaker: 'Bartolomeu', text: 'Sou Bartolomeu, seu parceiro de treino! Ou saco de pancadas, como preferir. Hehe.' },
  { speaker: 'Bartolomeu', text: 'Vamos ao básico! Veja sua vida (❤️) e stamina (⚡) ali em cima. Stamina é usada para atacar e esquivar. Ela regenera sozinha, mas cuidado para não zerar!' },
  { speaker: 'Bartolomeu', text: 'Você também tem poções (🧪) para curar a vida. Use com sabedoria! E ouro (🪙) para comprar coisas.' },
  { speaker: 'Bartolomeu', text: 'Tente me acertar! Só pra sentir o gostinho. Mas não pega leve, tá? Quer dizer... pega leve sim! Ai!' }, // Passo 4
  { speaker: 'Bartolomeu', text: 'Isso! Viu como sua stamina desceu? Agora espere um pouco para ela recuperar.' },
  { speaker: 'Bartolomeu', text: 'Você pode me bater para ganhar umas moedinhas. É meu trabalho! Mas não me machuca de verdade, por favor!' },
  { speaker: 'Bartolomeu', text: 'Ótimo! Agora que você sabe o básico, está na hora de escolher seu caminho. Vou te levar até a Escola de Classes!' },
]);

const currentDialog = computed(() => tutorialDialogs[tutorialStep.value]);

const startTutorial = () => {
  tutorialStep.value = 0;
  showDialog.value = true;
  playAudio('bartolomeu_greeting'); // Som de Bartolomeu falando
};

const nextDialog = () => {
  playAudio('dialog_next');
  if (tutorialStep.value < tutorialDialogs.length - 1) {
    tutorialStep.value++;
    if (tutorialStep.value === 4) {
      // Momento de pedir para atacar
      showDialog.value = false; // Esconde diálogo para liberar botão de ataque
    }
     if (tutorialStep.value === 5 && !showDialog.value) {
      // Reaparece diálogo após o ataque
      showDialog.value = true;
    }
     if (tutorialStep.value === 7) {
       // Fim do tutorial
       showDialog.value = true; // Garante que o último diálogo apareça
    }

  } else {
    // Fim dos diálogos
    showDialog.value = false;
    tutorialComplete.value = true;
    playAudio('tutorial_complete');
    actions.completeLevel('tutorial'); // Marcar tutorial como completo no estado global
  }
};

const interactWithBartolomeu = () => {
  if (!showDialog.value && !tutorialComplete.value && tutorialStep.value < 4) {
    // Inicia o tutorial se ainda não começou e não está na hora de atacar
    startTutorial();
  } else if (tutorialStep.value >= 4 && tutorialStep.value < 7) {
     // Se clicar nele durante a fase de ataque/pós-ataque
     attackBartolomeu();
  }
};

const attackBartolomeu = () => {
  if (gameState.player.stamina >= 10) { // Custo de stamina para atacar
    actions.useStamina(10);
    playAudio('dummy_hit');
    bartolomeuHitCount.value++;
    actions.addGold(1); // Ganha 1 ouro por hit
    if (tutorialStep.value === 4) {
      // Avança o tutorial após o primeiro ataque solicitado
      nextDialog(); // Vai para o diálogo pós-ataque (índice 5)
    }
  } else {
    playAudio('action_fail'); // Som de falha (sem stamina)
    // Poderia mostrar uma mensagem "Sem Stamina!"
  }
};

const goToClassSelect = () => {
  playAudio('ui_confirm');
  router.push({ name: 'ClassSelect' });
};

onMounted(() => {
  actions.setCurrentArea('Campo de Treino');
  // Não iniciar diálogo automaticamente, esperar interação
  // startTutorial();
});

// Estilo de fundo (placeholder)
const backgroundStyle = computed(() => {
  // TODO: Trocar por imagem de fundo real do campo de treino
  return { backgroundColor: '#d2b48c' }; // Cor de areia
});

</script>

<style scoped>
.campo-treino-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  color: #333; /* Texto escuro para fundo claro */
  font-family: 'Press Start 2P', cursive;
  background-size: cover;
  background-position: center;
}

.game-hud-placeholder {
  background-color: rgba(255, 255, 255, 0.7);
  padding: 10px;
  font-size: 12px;
  border-bottom: 1px solid #aaa;
}

.content-area {
  flex-grow: 1;
  padding: 30px;
  position: relative; /* Para posicionar NPCs */
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

.npc-placeholder {
  border: 2px solid #8b4513; /* Marrom */
  background-color: rgba(255, 228, 196, 0.8); /* Bisque semi-transparente */
  padding: 20px;
  text-align: center;
  cursor: pointer;
  z-index: 1;
  min-width: 150px;
}

.npc-placeholder.bartolomeu p:first-child {
  font-weight: bold;
}

.dialog-box {
  background-color: rgba(0, 0, 0, 0.8);
  border: 2px solid #ccc;
  padding: 20px;
  margin-top: 20px;
  width: 80%;
  max-width: 600px;
  border-radius: 5px;
  text-align: left;
  color: white;
  z-index: 2;
}

.speaker-name {
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 5px;
}

.dialog-text {
  font-size: 1rem;
  line-height: 1.5;
}

button {
  margin: 10px;
  padding: 10px 15px;
  font-family: 'Press Start 2P', cursive;
  cursor: pointer;
  background-color: #8b4513; /* Marrom */
  color: white;
  border: 1px solid #5a2d0c;
  z-index: 1;
}

button:hover {
  background-color: #a0522d; /* Sienna */
}

.navigation-placeholder {
  padding: 10px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.5);
}
</style>
