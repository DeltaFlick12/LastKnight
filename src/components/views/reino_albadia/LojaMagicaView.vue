<template>
  <div class="loja-magica-view" :style="backgroundStyle">
    <div class="game-hud-placeholder">
      <p>❤️ {{ gameState.player.health }}/{{ gameState.player.maxHealth }} | ⚡ {{ Math.round(gameState.player.stamina) }}/{{ gameState.player.maxStamina }} | 🪙 {{ gameState.player.gold }} | 🧪 {{ gameState.player.potions }}</p>
      <p>Área Atual: {{ gameState.currentArea }}</p>
    </div>

    <div class="content-area">
      <!-- Placeholder para o cenário: Balcão, caldeirão, estante de poções -->
      <div class="scenario-placeholder">
        (Placeholder: Cenário da Loja Mágica)
      </div>

      <!-- Placeholder para Margaret (Bruxa) -->
      <div class="npc-placeholder margaret" @click="interactWithMargaret">
        <p>Margaret (Bruxa)</p>
      </div>

      <!-- Interface da Loja (quando ativa) -->
      <div v-if="shopOpen" class="shop-interface">
        <h3>Poções e Encantos</h3>
        <ul>
          <li v-for="item in itemsForSale" :key="item.id">
            <span>{{ item.name }} - {{ item.price }} 🪙</span>
            <button @click="buyItem(item)" :disabled="gameState.player.gold < item.price">Comprar</button>
            <p class="item-description">{{ item.description }}</p>
          </li>
        </ul>
        <button @click="closeShop">Sair da Loja</button>
      </div>

      <!-- Caixa de Diálogo -->
      <div v-if="showDialog && !shopOpen" class="dialog-box">
        <p class="speaker-name">{{ currentDialog.speaker }}:</p>
        <p class="dialog-text">{{ currentDialog.text }}</p>
        <button v-if="currentDialog.options" v-for="(option, index) in currentDialog.options" :key="index" @click="handleDialogOption(option.action)">{{ option.text }}</button>
        <button v-else @click="nextDialog">Continuar...</button>
      </div>

    </div>

    <div class="navigation-placeholder">
       <button @click="goToMap">Voltar ao Mapa/Vila</button>
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
const shopOpen = ref(false);

// Diálogos com Margaret
const margaretDialogs = reactive([
  { speaker: 'Margaret', text: 'Ora, ora... um novo rosto buscando auxílio arcano? Ou apenas curioso com minhas borbulhas?' },
  { speaker: 'Margaret', text: 'Tenho tônicos para curar, elixires para fortalecer e... outras coisas, se tiver coragem. O que deseja?', options: [{ text: 'Ver Poções', action: 'openShop' }, { text: 'Nada por agora', action: 'closeDialog' }] },
  { speaker: 'Margaret', text: 'Que seus caminhos sejam... interessantes. Hehehe.' }, // Diálogo de saída
]);

// Itens da Loja (Placeholder)
const itemsForSale = reactive([
  { id: 'potion_health_small', name: 'Poção de Cura Pequena', type: 'Consumível', price: 15, description: 'Restaura uma pequena quantidade de vida.', effect: { heal: 30 } },
  { id: 'potion_stamina_small', name: 'Poção de Vigor Pequena', type: 'Consumível', price: 20, description: 'Restaura uma pequena quantidade de stamina.', effect: { stamina: 50 } },
  { id: 'potion_forbidden', name: 'Poção Proibida', type: 'Consumível Especial', price: 500, description: 'Um líquido instável que pulsa com poder... Dizem que pode trocar vida por vida. (Uso único)', // requiresQuest: true // TODO: Implementar lógica de quest se necessário }, // Adicionar lógica de quest se necessário
  // Adicionar mais poções (maiores, buffs, etc.)
]);

const currentDialog = computed(() => margaretDialogs[dialogStep.value]);

const interactWithMargaret = () => {
  if (!shopOpen) {
    dialogStep.value = 0; // Reinicia o diálogo
    showDialog.value = true;
    playAudio('margaret_greeting');
  }
};

const nextDialog = () => {
  playAudio('dialog_next');
  if (dialogStep.value < margaretDialogs.length - 2) {
    dialogStep.value++;
  } else {
    closeDialog();
  }
};

const handleDialogOption = (action) => {
  playAudio('ui_confirm');
  if (action === 'openShop') {
    openShop();
  } else if (action === 'closeDialog') {
    closeDialog();
  }
};

const openShop = () => {
  showDialog.value = false;
  shopOpen.value = true;
  playAudio('shop_open_magic');
};

const closeShop = () => {
  shopOpen.value = false;
  dialogStep.value = margaretDialogs.length - 1;
  showDialog.value = true;
  playAudio('shop_close');
};

const closeDialog = () => {
   dialogStep.value = margaretDialogs.length - 1;
   showDialog.value = true;
};

const buyItem = (item) => {
  if (gameState.player.gold >= item.price) {
    actions.addGold(-item.price);
    if (item.id === 'potion_health_small') {
      actions.collectPotion(); // Assume que esta ação adiciona a poção padrão
    } else if (item.id === 'potion_forbidden') {
      actions.collectForbiddenPotion();
      // TODO: Remover poção proibida da loja após compra?
    } else {
      // TODO: Adicionar outros tipos de itens ao inventário
    }
    alert(`Placeholder: Comprou ${item.name}!`);
    playAudio('shop_buy_potion');
  } else {
    playAudio('action_fail');
    alert('Placeholder: Ouro insuficiente!');
  }
};

const goToMap = () => {
  playAudio('ui_back');
  router.push({ name: 'Map' });
};

onMounted(() => {
  actions.setCurrentArea('Loja Mágica da Margaret');
  // playAudio('music_magic_shop_ambient', { loop: true });
});

// Estilo de fundo (placeholder)
const backgroundStyle = computed(() => {
  // TODO: Trocar por imagem de fundo real da loja mágica
  return { backgroundColor: '#4a2a4a' }; // Tom roxo/escuro
});

</script>

<style scoped>
/* Estilos similares a ForjaView, ajustar cores e elementos */
.loja-magica-view {
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

.npc-placeholder {
  border: 2px solid #8a2be2; /* BlueViolet */
  background-color: rgba(75, 0, 130, 0.8); /* Indigo semi-transparente */
  padding: 20px;
  text-align: center;
  cursor: pointer;
  z-index: 1;
  min-width: 150px;
  color: #e6e6fa; /* Lavender */
}

.npc-placeholder.margaret p:first-child {
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
  color: #da70d6; /* Orchid */
  margin-bottom: 5px;
}

.dialog-text {
  font-size: 1rem;
  line-height: 1.5;
}

.shop-interface {
  background-color: rgba(30, 10, 40, 0.9);
  border: 2px solid #9370db; /* MediumPurple */
  padding: 20px;
  margin-top: 20px;
  width: 90%;
  max-width: 700px;
  border-radius: 5px;
  color: white;
  z-index: 2;
}

.shop-interface h3 {
  text-align: center;
  margin-bottom: 15px;
  color: #da70d6; /* Orchid */
}

.shop-interface ul {
  list-style: none;
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
}

.shop-interface li {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #555;
}

.shop-interface li span {
  font-weight: bold;
}

.shop-interface button {
   margin-left: 10px;
}

.item-description {
  font-size: 0.9rem;
  color: #bbb;
  margin-top: 5px;
}

button {
  margin: 10px;
  padding: 10px 15px;
  font-family: 'Press Start 2P', cursive;
  cursor: pointer;
  background-color: #483d8b; /* DarkSlateBlue */
  color: white;
  border: 1px solid #9370db; /* MediumPurple */
  z-index: 1;
}

button:hover {
  background-color: #6a5acd; /* SlateBlue */
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.navigation-placeholder {
  padding: 10px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
