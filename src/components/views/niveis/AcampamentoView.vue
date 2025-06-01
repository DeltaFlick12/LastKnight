<template>
  <div class="acampamento-view" :style="backgroundStyle">
    <div class="game-hud-placeholder">
      <p>❤️ {{ gameState.player.health }}/{{ gameState.player.maxHealth }} | ⚡ {{ Math.round(gameState.player.stamina) }}/{{ gameState.player.maxStamina }} | 🪙 {{ gameState.player.gold }} | 🧪 {{ gameState.player.potions }}</p>
      <p>Área Atual: {{ gameState.currentArea }}</p>
    </div>

    <div class="content-area">
      <!-- Placeholder para o cenário: Acampamento com fogueiras, tendas -->
      <div class="scenario-placeholder">
        (Placeholder: Cenário do Acampamento dos Ladrões)
        <div v-if="!clearedCamp" class="enemy-area-placeholder">
          (Placeholder: Ladrões patrulhando)
        </div>
        <div class="final-tent-placeholder" :class="{ accessible: clearedCamp }">
          (Placeholder: Tenda Principal)
          <div v-if="clearedCamp && !luccaRescued" class="npc-placeholder lucca" @click="interactWithLucca">
            <p>Lucca (Prisioneira)</p>
          </div>
        </div>
      </div>

      <!-- Interações / Inimigos -->
      <div v-if="!clearedCamp" class="interactions">
        <p>Você se infiltra no acampamento dos ladrões. Eles parecem bem armados.</p>
        <p><strong>Inimigos:</strong> Placeholders para Ladrões (Adaga, Arco, Magos).</p>
        <button @click="startCampCombat">Lutar contra os Ladrões</button>
      </div>
      <div v-else class="interactions">
        <p>O acampamento está silencioso. Os ladrões foram derrotados.</p>
        <p v-if="!luccaRescued">Você ouve um choro vindo da tenda principal.</p>
        <button v-if="!luccaRescued" @click="enterTent">Entrar na Tenda</button>
      </div>

       <!-- Caixa de Diálogo para feedback ou Lucca -->
      <div v-if="showDialog" class="dialog-box">
         <p v-if="currentDialog.speaker" class="speaker-name">{{ currentDialog.speaker }}:</p>
         <p class="dialog-text">{{ currentDialog.text }}</p>
         <button @click="nextDialog">Continuar...</button>
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
       <button @click="goToPreviousArea">Voltar para Ruínas</button>
       <button v-if="clearedCamp" @click="goToNextArea">Seguir para Montanha</button> <!-- Ou bifurcação? -->
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
const dialogStep = ref(0);
const clearedCamp = ref(gameState.levelsCompleted.includes('acampamento')); // Verifica se o acampamento já foi limpo
const luccaRescued = ref(gameState.quests?.luccaRescued || false); // Verifica se Lucca já foi resgatada
const inBattle = ref(false);
const currentEnemy = ref('');

// Diálogos com Lucca
const luccaDialogs = reactive([
  { speaker: 'Lucca', text: 'Oh! Você... você me salvou daqueles monstros! Obrigada!' },
  { speaker: 'Lucca', text: 'Eles me sequestraram da minha vila... achei que nunca mais veria minha casa.' },
  { speaker: 'Lucca', text: 'Não tenho muito, mas pegue isso como agradecimento.' }, // Entrega ouro
  { speaker: 'Lucca', text: 'Vou tentar voltar para casa agora. Tenha cuidado em sua jornada!' },
]);

const currentDialog = computed(() => luccaDialogs[dialogStep.value]);

const startCampCombat = () => {
  // TODO: Iniciar combate contra múltiplos ladrões
  currentEnemy.value = 'Grupo de Ladrões';
  inBattle.value = true;
  playAudio('battle_start_thieves');
};

const enterTent = () => {
  if (clearedCamp.value && !luccaRescued.value) {
    // Permite interação com Lucca
    playAudio('enter_tent');
    // A interação em si é feita clicando no placeholder dela
  } else if (luccaRescued.value) {
     showDialog.value = true;
     dialogStep.value = -1; // Indicador para mensagem genérica
     currentDialog.value = { speaker: null, text: 'A tenda está vazia.' };
  }
};

const interactWithLucca = () => {
  if (clearedCamp.value && !luccaRescued.value) {
    dialogStep.value = 0;
    showDialog.value = true;
    playAudio('lucca_greeting');
  }
};

const nextDialog = () => {
  playAudio('dialog_next');
  if (dialogStep.value === 2) { // Momento de dar a recompensa
    const reward = 100; // Exemplo de recompensa em ouro
    actions.addGold(reward);
    playAudio('collect_gold');
    alert(`Placeholder: Lucca te deu ${reward} de ouro!`);
  }

  if (dialogStep.value < luccaDialogs.length - 1) {
    dialogStep.value++;
  } else {
    // Fim do diálogo e resgate
    showDialog.value = false;
    luccaRescued.value = true;
    actions.completeQuest('luccaRescued'); // Ação a ser criada no store
    actions.completeLevel('acampamento'); // Marcar nível como completo
  }
};

// Funções de exemplo para simular batalha
const winBattleExample = () => {
  if (currentEnemy.value === 'Grupo de Ladrões') {
    playAudio('battle_win');
    clearedCamp.value = true;
    // Não marcar nível como completo ainda, só após resgatar Lucca
  }
  inBattle.value = false;
  currentEnemy.value = '';
};

const loseBattleExample = () => {
  playAudio('player_defeat');
  inBattle.value = false;
  currentEnemy.value = '';
  alert('Game Over!');
  router.push('/');
};

const goToPreviousArea = () => {
  playAudio('ui_back');
  router.push({ name: 'Ruinas' });
};

const goToNextArea = () => {
  playAudio('ui_confirm');
  // Conforme enredo: Montanha é o próximo
  router.push({ name: 'Montanha' });
};

onMounted(() => {
  actions.setCurrentArea('Acampamento dos Ladrões');
  // playAudio('music_camp_ambient', { loop: true });
  // Inicializar estado das quests se não existir
  if (!gameState.quests) {
    gameState.quests = reactive({ luccaRescued: false });
  }
});

// Estilo de fundo (placeholder)
const backgroundStyle = computed(() => {
  // TODO: Trocar por imagem de fundo real do acampamento
  return { backgroundColor: '#deb887' }; // BurlyWood (cor de terra/madeira)
});

</script>

<style scoped>
/* Estilos gerais similares aos outros níveis */
.acampamento-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  color: #4a4a4a;
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

.enemy-area-placeholder, .final-tent-placeholder {
  border: 1px solid #999;
  padding: 20px;
  margin: 10px;
  background-color: rgba(200, 150, 150, 0.5);
}

.final-tent-placeholder {
   background-color: rgba(150, 150, 200, 0.5);
   position: relative; /* Para conter o NPC */
   min-height: 100px;
}

.final-tent-placeholder.accessible {
   border-style: solid;
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
}

.interactions {
  background-color: rgba(50, 50, 50, 0.7);
  padding: 20px;
  border-radius: 5px;
  text-align: center;
  z-index: 1;
  color: white;
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
  color: #add8e6; /* LightBlue */
  margin-bottom: 5px;
}

.dialog-text {
  font-size: 1rem;
  line-height: 1.5;
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
  background-color: #8b4513; /* SaddleBrown */
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
  background-color: rgba(255, 255, 255, 0.7);
}
</style>
