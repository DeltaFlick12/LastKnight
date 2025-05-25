<template>
  <div class="forja-view" :style="backgroundStyle">
    <div class="game-hud-placeholder">
      <p>❤️ {{ gameState.player.health }}/{{ gameState.player.maxHealth }} | ⚡ {{ Math.round(gameState.player.stamina) }}/{{ gameState.player.maxStamina }} | 🪙 {{ gameState.player.gold }} | 🧪 {{ gameState.player.potions }}</p>
      <p>Área Atual: {{ gameState.currentArea }}</p>
    </div>

    <div class="content-area">
      <!-- Placeholder para o cenário: Balcão, bigorna, forja, espadas penduradas -->
      <div class="scenario-placeholder">
        (Placeholder: Cenário da Forja)
      </div>

      <!-- Placeholder para Bjorn (Ferreiro) -->
      <div class="npc-placeholder bjorn" @click="interactWithBjorn">
        <p>Bjorn (Ferreiro)</p>
      </div>

      <!-- Interface da Loja (quando ativa) -->
      <div v-if="shopOpen" class="shop-interface">
        <h3>Itens à Venda</h3>
        <ul>
          <li v-for="item in itemsForSale" :key="item.id">
            <span>{{ item.name }} ({{ item.type }}) - {{ item.price }} 🪙</span>
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

// Diálogos com Bjorn
const bjornDialogs = reactive([
  { speaker: 'Bjorn', text: 'Bem-vindo à minha forja, cavaleiro! O aço chama por você?' },
  { speaker: 'Bjorn', text: 'Aqui forjamos as melhores lâminas e armaduras de Albadia. O que procura hoje?', options: [{ text: 'Ver Mercadorias', action: 'openShop' }, { text: 'Apenas olhando', action: 'closeDialog' }] },
  { speaker: 'Bjorn', text: 'Volte sempre que precisar de aço de verdade!' }, // Diálogo de saída
]);

// Itens da Loja (Placeholder - idealmente viria de um arquivo de dados)
const itemsForSale = reactive([
  { id: 'sword_iron', name: 'Espada de Ferro', type: 'Arma', price: 50, description: 'Uma espada básica, mas confiável.', stats: { damage: 15 } },
  { id: 'armor_leather', name: 'Armadura de Couro', type: 'Armadura', price: 75, description: 'Oferece proteção modesta.', stats: { defense: 5 } },
  { id: 'shield_wood', name: 'Escudo de Madeira', type: 'Escudo', price: 40, description: 'Um escudo simples para defesa.', stats: { block: 10 } },
  // Adicionar mais itens
]);

const currentDialog = computed(() => bjornDialogs[dialogStep.value]);

const interactWithBjorn = () => {
  if (!shopOpen) {
    dialogStep.value = 0; // Reinicia o diálogo
    showDialog.value = true;
    playAudio('bjorn_greeting');
  }
};

const nextDialog = () => {
  playAudio('dialog_next');
  if (dialogStep.value < bjornDialogs.length - 2) { // Avança até antes das opções/saída
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
  playAudio('shop_open');
};

const closeShop = () => {
  shopOpen.value = false;
  dialogStep.value = bjornDialogs.length - 1; // Vai para o diálogo de saída
  showDialog.value = true;
  playAudio('shop_close');
};

const closeDialog = () => {
   dialogStep.value = bjornDialogs.length - 1; // Vai para o diálogo de saída
   showDialog.value = true;
   // Poderia ter um timer para esconder o diálogo de saída automaticamente
   // setTimeout(() => { showDialog.value = false; }, 3000);
};

const buyItem = (item) => {
  if (gameState.player.gold >= item.price) {
    actions.addGold(-item.price);
    // TODO: Adicionar item ao inventário do jogador (precisa implementar sistema de inventário)
    alert(`Placeholder: Comprou ${item.name}!`);
    playAudio('shop_buy_item');
    // Opcional: Remover item da lista ou diminuir estoque
  } else {
    playAudio('action_fail');
    alert('Placeholder: Ouro insuficiente!');
  }
};

const goToMap = () => {
  playAudio('ui_back');
  // TODO: Navegar de volta para a visão geral da vila ou mapa
  router.push({ name: 'Map' }); // Assumindo que 'Map' é a rota da vila/mapa
};

onMounted(() => {
  actions.setCurrentArea('Forja do Bjorn');
  // Tocar música ambiente da forja?
  // playAudio('music_forge_ambient', { loop: true });
});

// Estilo de fundo (placeholder)
const backgroundStyle = computed(() => {
  // TODO: Trocar por imagem de fundo real da forja
  return { backgroundColor: '#6b4f3a' }; // Tom de madeira/pedra escura
});

</script>

<style scoped>
/* Estilos similares ao CampoTreinoView, ajustar cores e elementos */
.forja-view {
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
  border: 2px solid #aaa; /* Cinza metálico */
  background-color: rgba(100, 100, 100, 0.8);
  padding: 20px;
  text-align: center;
  cursor: pointer;
  z-index: 1;
  min-width: 150px;
}

.npc-placeholder.bjorn p:first-child {
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

.shop-interface {
  background-color: rgba(20, 20, 30, 0.9);
  border: 2px solid #ccc;
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
  color: #ffd700;
}

.shop-interface ul {
  list-style: none;
  padding: 0;
  max-height: 300px; /* Para permitir rolagem se muitos itens */
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
  background-color: #5c5c5c;
  color: white;
  border: 1px solid #ccc;
  z-index: 1;
}

button:hover {
  background-color: #777;
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
