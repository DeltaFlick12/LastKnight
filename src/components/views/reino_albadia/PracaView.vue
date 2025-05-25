<template>
  <div class="praca-view" :style="backgroundStyle">
    <div class="game-hud-placeholder">
      <p>❤️ {{ gameState.player.health }}/{{ gameState.player.maxHealth }} | ⚡ {{ Math.round(gameState.player.stamina) }}/{{ gameState.player.maxStamina }} | 🪙 {{ gameState.player.gold }} | 🧪 {{ gameState.player.potions }}</p>
      <p>Área Atual: {{ gameState.currentArea }}</p>
    </div>

    <div class="content-area">
      <!-- Placeholder para o cenário: Fonte central, árvores, bancos, parquinho -->
      <div class="scenario-placeholder">
        (Placeholder: Cenário da Praça de Albadia)
        <div class="scenario-element fountain">Fonte</div>
        <div class="scenario-element tree">Árvore</div>
        <div class="scenario-element bench">Banco</div>
      </div>

      <!-- Placeholders para NPCs -->
      <div class="npc-placeholder nathan" @click="interactWithNPC(\'Nathan\')">
        <p>Nathan</p>
      </div>
      <div class="npc-placeholder andre" @click="interactWithNPC(\'Andre\')">
        <p>André</p>
      </div>
      <div class="npc-placeholder lucas" @click="interactWithNPC(\'Lucas\')">
        <p>Lucas</p>
      </div>
      <div class="npc-placeholder maria" @click="interactWithNPC(\'Maria\')">
        <p>Maria</p>
      </div>

      <!-- Caixa de Diálogo -->
      <div v-if="showDialog" class="dialog-box">
        <p class="speaker-name">{{ currentDialog.speaker }}:</p>
        <p class="dialog-text">{{ currentDialog.text }}</p>
        <button @click="nextDialog">Continuar...</button>
      </div>

    </div>

    <div class="navigation-placeholder">
       <button @click="goToMap">Sair da Praça</button>
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
const currentSpeaker = ref(null);
const dialogStep = ref(0);

// Diálogos dos NPCs (Placeholders - expandir com lore)
const npcDialogs = {
  Nathan: [
    { speaker: 'Nathan', text: 'Ah, o cavaleiro! Ouvi falar do ataque... terrível, terrível.' },
    { speaker: 'Nathan', text: 'Dizem que Magnus se refugiou em seu antigo castelo, além das terras selvagens.' },
  ],
  Andre: [
    { speaker: 'André', text: 'Cuidado ao sair do reino. As florestas estão infestadas de criaturas ultimamente.' },
    { speaker: 'André', text: 'Se for para o leste, fique atento aos ladrões no acampamento abandonado.' },
  ],
  Lucas: [
    { speaker: 'Lucas', text: 'Meu avô contava histórias sobre dragões que guardavam chaves antigas... nas montanhas, cavernas e ruínas.' },
    { speaker: 'Lucas', text: 'Bobagem, claro... mas quem sabe?' },
  ],
  Maria: [
    { speaker: 'Maria', text: 'A Princesa Julie... tão gentil. Espero que esteja segura.' },
    { speaker: 'Maria', text: 'O Padre José e a Freira Albedo na igreja podem oferecer ajuda e conforto.' },
  ],
};

const currentDialog = computed(() => {
  if (currentSpeaker.value && npcDialogs[currentSpeaker.value]) {
    return npcDialogs[currentSpeaker.value][dialogStep.value];
  }
  return null;
});

const interactWithNPC = (npcName) => {
  if (npcDialogs[npcName]) {
    currentSpeaker.value = npcName;
    dialogStep.value = 0;
    showDialog.value = true;
    playAudio(`npc_${npcName.toLowerCase()}_greeting`); // Ex: npc_nathan_greeting
  } else {
    console.warn(`Diálogos para ${npcName} não encontrados.`);
  }
};

const nextDialog = () => {
  playAudio('dialog_next');
  const dialogs = npcDialogs[currentSpeaker.value];
  if (dialogStep.value < dialogs.length - 1) {
    dialogStep.value++;
  } else {
    showDialog.value = false;
    currentSpeaker.value = null;
  }
};

const goToMap = () => {
  playAudio('ui_back');
  router.push({ name: 'Map' });
};

onMounted(() => {
  actions.setCurrentArea('Praça de Albadia');
  // playAudio('music_town_square_ambient', { loop: true });
});

// Estilo de fundo (placeholder)
const backgroundStyle = computed(() => {
  // TODO: Trocar por imagem de fundo real da praça
  return { backgroundColor: '#add8e6' }; // Azul claro (céu aberto)
});

</script>

<style scoped>
/* Estilos similares aos outros hubs, ajustar cores e elementos */
.praca-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  color: #333;
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
  /* Usar flex ou grid para posicionar NPCs e elementos */
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
  /* Posicionar elementos internos */
  padding: 50px;
}

.scenario-element {
  border: 1px solid #999;
  padding: 10px;
  margin: 10px;
  background-color: rgba(200, 200, 200, 0.5);
}

.npc-placeholder {
  border: 1px solid #888;
  background-color: rgba(220, 220, 220, 0.8);
  padding: 10px;
  text-align: center;
  cursor: pointer;
  z-index: 1;
  min-width: 100px;
  margin: 15px;
  position: absolute; /* Posicionar NPCs na praça */
}

/* Posicionamento exemplo dos NPCs */
.npc-placeholder.nathan { top: 20%; left: 20%; }
.npc-placeholder.andre { top: 70%; left: 30%; }
.npc-placeholder.lucas { top: 30%; right: 25%; }
.npc-placeholder.maria { top: 60%; right: 15%; }

.npc-placeholder p:first-child {
  font-weight: bold;
  font-size: 0.9rem;
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
  position: relative; /* Para ficar sobre os NPCs */
}

.speaker-name {
  font-weight: bold;
  color: #90ee90; /* LightGreen */
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
  background-color: #5f9ea0; /* CadetBlue */
  color: white;
  border: 1px solid #4682b4; /* SteelBlue */
  z-index: 1;
}

button:hover {
  background-color: #6495ed; /* CornflowerBlue */
}

.navigation-placeholder {
  padding: 10px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.7);
}
</style>
