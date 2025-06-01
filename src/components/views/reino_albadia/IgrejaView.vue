<template>
  <div class="igreja-view" :style="backgroundStyle">
    <div class="game-hud-placeholder">
      <p>❤️ {{ gameState.player.health }}/{{ gameState.player.maxHealth }} | ⚡ {{ Math.round(gameState.player.stamina) }}/{{ gameState.player.maxStamina }} | 🪙 {{ gameState.player.gold }} | 🧪 {{ gameState.player.potions }}</p>
      <p>Área Atual: {{ gameState.currentArea }}</p>
      <p v-if="gameState.player.hasRiverBlessing">Bênção do Rio Ativa</p>
    </div>

    <div class="content-area">
      <!-- Placeholder para o cenário: Igreja com bancos, altar -->
      <div class="scenario-placeholder">
        (Placeholder: Cenário da Igreja)
      </div>

      <!-- Placeholder para Padre José -->
      <div class="npc-placeholder padre-jose" @click="interactWithPadre">
        <p>Padre José</p>
      </div>

      <!-- Placeholder para Freira Albedo (andando?) -->
      <div class="npc-placeholder freira-albedo" @click="interactWithFreira">
        <p>Freira Albedo</p>
      </div>

      <!-- Caixa de Diálogo -->
      <div v-if="showDialog" class="dialog-box">
        <p class="speaker-name">{{ currentDialog.speaker }}:</p>
        <p class="dialog-text">{{ currentDialog.text }}</p>
        <button v-if="currentDialog.options" v-for="(option, index) in currentDialog.options" :key="index" @click="handleDialogOption(option.action)">{{ option.text }}</button>
        <button v-else @click="nextDialog">Continuar...</button>
      </div>

    </div>

    <div class="navigation-placeholder">
       <button @click="goToMap">Sair da Igreja</button>
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
const showDialog = ref(false);
const dialogSpeaker = ref(null); // 'padre' ou 'freira'
const dialogStep = ref(0);

// Diálogos
const padreDialogs = reactive([
  { speaker: 'Padre José', text: 'A paz esteja contigo, meu filho. Veio buscar conforto e restauração?' },
  { speaker: 'Padre José', text: 'Posso restaurar suas forças e, se precisar cruzar o Rio das Almas Perdidas, posso conceder-lhe a bênção necessária.', options: [{ text: 'Restaurar Forças', action: 'restore' }, { text: 'Pedir Bênção do Rio', action: 'bless' }, { text: 'Nada, obrigado', action: 'closeDialog' }] },
  { speaker: 'Padre José', text: 'Que a luz guie seus passos.' }, // Saída
  { speaker: 'Padre José', text: 'Suas forças foram restauradas. Siga com cuidado.' }, // Pós-restauração
  { speaker: 'Padre José', text: 'Você já possui a bênção, meu filho. Ela o protegerá nas águas sombrias.' }, // Já tem bênção
  { speaker: 'Padre José', text: 'Receba a Bênção do Rio. Que ela o proteja das correntes espirituais.' }, // Concedendo bênção
]);

const freiraDialogs = reactive([
  { speaker: 'Freira Albedo', text: 'Bem-vindo à casa do Pai. Que encontre paz aqui.' },
  { speaker: 'Freira Albedo', text: 'O Padre José pode ajudá-lo com suas necessidades espirituais e físicas.' },
  { speaker: 'Freira Albedo', text: 'Mantenha a fé, mesmo nos tempos mais sombrios.' },
]);

const currentDialog = computed(() => {
  if (dialogSpeaker.value === 'padre') {
    return padreDialogs[dialogStep.value];
  } else if (dialogSpeaker.value === 'freira') {
    return freiraDialogs[dialogStep.value];
  }
  return null;
});

const interactWithPadre = () => {
  dialogSpeaker.value = 'padre';
  dialogStep.value = 0; // Início do diálogo do padre
  showDialog.value = true;
  playAudio('padre_greeting');
};

const interactWithFreira = () => {
  dialogSpeaker.value = 'freira';
  dialogStep.value = 0; // Início do diálogo da freira
  showDialog.value = true;
  playAudio('freira_greeting');
};

const nextDialog = () => {
  playAudio('dialog_next');
  const dialogs = dialogSpeaker.value === 'padre' ? padreDialogs : freiraDialogs;
  // Se for diálogo simples da freira, apenas avança ou fecha
  if (dialogSpeaker.value === 'freira') {
     if (dialogStep.value < dialogs.length - 1) {
        dialogStep.value++;
     } else {
        showDialog.value = false;
     }
     return;
  }

  // Lógica para o padre (após restauração/bênção)
  if (dialogStep.value === 3 || dialogStep.value === 5) { // Se estava mostrando msg pós-ação
     dialogStep.value = 2; // Volta para diálogo de saída
     showDialog.value = true;
  } else if (dialogStep.value < dialogs.length - 1 && dialogStep.value !== 1) { // Avança se não for opções ou saída
     dialogStep.value++;
  } else {
     showDialog.value = false; // Fecha se for o último diálogo
  }
};

const handleDialogOption = (action) => {
  playAudio('ui_confirm');
  if (action === 'restore') {
    actions.restorePlayer(); // Ação a ser criada no store
    playAudio('heal_sound');
    dialogStep.value = 3; // Mensagem pós-restauração
    showDialog.value = true;
  } else if (action === 'bless') {
    if (gameState.player.hasRiverBlessing) {
      dialogStep.value = 4; // Mensagem 'já possui'
    } else {
      actions.grantRiverBlessing(); // Ação a ser criada no store
      playAudio('blessing_sound');
      dialogStep.value = 5; // Mensagem 'concedendo bênção'
    }
    showDialog.value = true;
  } else if (action === 'closeDialog') {
    dialogStep.value = 2; // Diálogo de saída
    showDialog.value = true;
    // setTimeout(() => { showDialog.value = false; }, 2000);
  }
};

const goToMap = () => {
  playAudio('ui_back');
  router.push({ name: 'Map' });
};

onMounted(() => {
  actions.setCurrentArea('Igreja de Albadia');
  // playAudio('music_church_ambient', { loop: true });
});

// Estilo de fundo (placeholder)
const backgroundStyle = computed(() => {
  // TODO: Trocar por imagem de fundo real da igreja
  return { backgroundColor: '#f5f5dc' }; // Bege claro (cor de pedra/parede clara)
});

</script>

<style scoped>
/* Estilos similares aos outros hubs, ajustar cores */
.igreja-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  color: #404040; /* Texto mais escuro para fundo claro */
  font-family: 'Press Start 2P', cursive;
}

.game-hud-placeholder {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  font-size: 12px;
  border-bottom: 1px solid #ccc;
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

.npc-placeholder {
  border: 2px solid #b8860b; /* DarkGoldenrod */
  background-color: rgba(255, 250, 240, 0.9); /* FloralWhite semi-transparente */
  padding: 15px;
  text-align: center;
  cursor: pointer;
  z-index: 1;
  min-width: 130px;
  margin: 10px;
}

.npc-placeholder p:first-child {
  font-weight: bold;
}

.dialog-box {
  background-color: rgba(50, 50, 50, 0.9);
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
  color: #ffd700; /* Gold */
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
  background-color: #b8860b; /* DarkGoldenrod */
  color: white;
  border: 1px solid #8b4513; /* SaddleBrown */
  z-index: 1;
}

button:hover {
  background-color: #daa520; /* Goldenrod */
}

.navigation-placeholder {
  padding: 10px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.7);
}
</style>
