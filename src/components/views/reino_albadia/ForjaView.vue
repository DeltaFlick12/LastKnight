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

// Flag para controlar se o jogador já viu o diálogo inicial
const bjornFirstTime = ref(true);

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
  if (!shopOpen.value) {
    if (bjornFirstTime.value) {
      // Primeira vez: mostra diálogo inicial (0) e depois opções (1)
      dialogStep.value = 0;
      showDialog.value = true;
      bjornFirstTime.value = false;
      playAudio('bjorn_greeting');
    } else {
      // Já viu diálogo: abre loja direto
      openShop();
    }
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
  router.push({ name: 'Map' }); // Assumindo que 'Map' é a rota da vila/mapa
};

onMounted(() => {
  actions.setCurrentArea('Forja do Bjorn');
  // Tocar música ambiente da forja?
  // playAudio('music_forge_ambient', { loop: true });
});

// Estilo de fundo (placeholder)
const backgroundStyle = computed(() => {
  return { backgroundColor: '#6b4f3a' }; // Tom de madeira/pedra escura
});
</script>

<style scoped>
/* seus estilos permanecem iguais */
</style>
