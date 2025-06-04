<template>
  <div class="inventory-modal scroll-unroll">
    <div class="modal-header">
      <h2>INVENTÁRIO</h2>
      <div class="gold">
        <img src="/icons/gold-icon.png" alt="Gold Coin" class="gold-icon" />
        <span>{{ gameState.player.gold }}</span>
      </div>
      <button class="close-btn" @click="$emit('close')">✖</button>
    </div>

    <!-- Filtros -->
    <div class="filter-bar">
      <button
        v-for="cat in categories"
        :key="cat"
        :class="{ 'filter-btn': true, active: activeCategory === cat }"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <div class="inventory-content">
      <!-- Lista de Itens -->
      <div class="item-grid">
        <transition-group name="item-fade" tag="div" class="grid-container">
          <div
            v-for="item in filteredItems"
            :key="item.itemId"
            class="item-card"
            :class="{
              clickable: item.usable || item.equipable,
              equipped: item.equipped,
              'low-quantity': item.quantity === 1 && item.usable,
            }"
            @click="handleClick(item)"
            @mouseenter="hoverItem = item"
            @mouseleave="hoverItem = null"
          >
            <img :src="item.icon" class="item-icon" :alt="item.name" />
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span v-if="item.quantity > 1" class="item-quantity">×{{ item.quantity }}</span>
              <span v-if="item.equipped" class="equipped-tag">Equipado</span>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- Painel de Detalhes -->
      <div class="details-panel" v-if="hoverItem">
        <div class="details-header">
          <img :src="hoverItem.icon" class="item-icon large" :alt="hoverItem.name" />
          <h3>{{ hoverItem.name }}</h3>
        </div>
        <p class="description">{{ hoverItem.description }}</p>
        <p v-if="hoverItem.type" class="detail">Tipo: {{ hoverItem.type }}</p>
        <p v-if="hoverItem.stats?.attack" class="detail">Dano: +{{ hoverItem.stats.attack }}</p>
        <p v-if="hoverItem.stats?.defense" class="detail">Defesa: +{{ hoverItem.stats.defense }}</p>
        <p v-if="hoverItem.equipped" class="equipped-notice">Item atualmente equipado</p>
      </div>

      <!-- Mensagem de Feedback -->
      <p v-if="feedbackMessage" class="feedback-message">{{ feedbackMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { gameState, actions, ITEMS, ITEM_ICONS } from '@/stores/game.js';

const emits = defineEmits(['close']);
const hoverItem = ref(null);
const feedbackMessage = ref('');
const activeCategory = ref('Todos');

const categories = ['Todos', 'Consumíveis', 'Armas', 'Armadura', 'Chave'];

const getItemIcon = (itemId) => {
  return ITEM_ICONS[itemId] || '/assets/icons/unknown-item.png';
};

const allItems = computed(() => {
  return gameState.player.inventory
    .map((invItem) => {
      const itemData = ITEMS[invItem.itemId];
      if (!itemData) {
        console.warn(`Item com ID ${invItem.itemId} não encontrado em ITEMS`);
        return null;
      }
      return {
        itemId: invItem.itemId,
        name: itemData.name,
        icon: getItemIcon(invItem.itemId),
        quantity: invItem.quantity,
        description: itemData.description,
        type: itemData.type === 'Armadura' ? 'Armadura' : itemData.type,
        usable: itemData.type === 'Consumível' || itemData.type === 'Consumível Especial',
        equipable: itemData.slot === 'weapon' || itemData.slot === 'armor',
        equipped: gameState.player.equipment[itemData.slot] === invItem.itemId,
        stats: itemData.stats,
        action: itemData.slot
          ? () => {
              if (gameState.player.equipment[itemData.slot] === invItem.itemId) {
                actions.unequipItem(itemData.slot);
              } else {
                actions.equipItem(invItem.itemId);
              }
            }
          : itemData.type === 'Consumível' || itemData.type === 'Consumível Especial'
          ? () => actions.useItem(invItem.itemId)
          : null,
      };
    })
    .filter((item) => item !== null);
});

const filteredItems = computed(() => {
  if (activeCategory.value === 'Todos') return allItems.value;
  return allItems.value.filter(
    (item) => item.type.toLowerCase() === activeCategory.value.toLowerCase()
  );
});

const handleClick = (item) => {
  feedbackMessage.value = '';
  if (item.usable && item.quantity > 0) {
    const used = item.action?.();
    feedbackMessage.value = used
      ? `Você usou ${item.name}!`
      : `Não foi possível usar ${item.name}.`;
  } else if (item.equipable) {
    const wasEquipped = item.equipped;
    item.action?.();
    feedbackMessage.value = wasEquipped ? `${item.name} desequipado!` : `${item.name} equipado!`;
  } else if (item.usable) {
    feedbackMessage.value = `Você não tem ${item.name}!`;
  } else {
    feedbackMessage.value = `${item.name} não pode ser usado ou equipado.`;
  }

  setTimeout(() => (feedbackMessage.value = ''), 3000);
};
</script>

<style scoped>
/* Animação de abertura (scroll unroll) */
.scroll-unroll {
  animation: unroll 1s ease-out forwards;
}

@keyframes unroll {
  0% {
    transform: translate(-50%, -50%) scaleY(0);
    opacity: 0;
  }
  60% {
    transform: translate(-50%, -50%) scaleY(1.15);
    opacity: 0.9;
  }
  100% {
    transform: translate(-50%, -50%) scaleY(1);
    opacity: 1;
  }
}

/* Modal principal - couro envelhecido com costura */
.inventory-modal {
  position: fixed;
  bottom: -20%;  /* mais próximo do rodapé (mais para baixo) */
  right: 2%;   /* mais próximo da borda direita (mais para direita) */

  transform: translate(0, 0); /* sem deslocamento */
  
  background: linear-gradient(145deg, #4a3118, #3c2611);
  border: 6px solid #5d3a1a;
  border-radius: 18px;
  padding: 0px 0px;
  color: #f1d7b1;
  width: 90%;
  max-width: 820px;
  min-height: 520px;
  box-shadow:
    inset 0 0 15px 3px #7f5b24,
    0 0 25px 3px #4a3118;
  image-rendering: pixelated;
  z-index: 10000;
  /* Costura ao redor */
  box-shadow:
    inset 0 0 15px 3px #7f5b24,
    0 0 25px 3px #4a3118,
    0 0 0 4px #6e4a23 inset,
    0 0 0 7px #593e16 inset;
  position: flex;
}

/* Costura estilo pontos */
.inventory-modal::before {
  content: '';
  position: absolute;
  top: 12px; bottom: 12px; left: 12px; right: 12px;
  border: 2px dashed #a6793b;
  border-radius: 14px;
  pointer-events: none;
  z-index: 1;
}

/* Cabeçalho */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 3px solid #a6793b;
  text-shadow: 2px 2px 3px #2f1e0d;
  position: relative;
  z-index: 2;
}

.modal-header h2 {
  font-size: 28px;
  margin: 0;
  color: #f1d7b1;
  text-shadow:
    1px 1px 0 #4a3118,
    2px 2px 3px #3c2611;
  font-family: 'UnifrakturCook', cursive;
}

.gold {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #f3d88c;
  font-weight: 700;
  text-shadow: 1px 1px 0 #593e16;
}

.gold-icon {
  width: 26px;
  height: 26px;
  image-rendering: pixelated;
  filter: drop-shadow(1px 1px 1px #2c1a06);
}

.close-btn {
  background: #7f5b24;
  border: 2px solid #593e16;
  border-radius: 12px;
  width: 34px;
  height: 34px;
  color: #f1d7b1;
  font-weight: bold;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 1px 1px 2px #3c2611 inset;
  transition: background 0.3s ease, color 0.3s ease;
}

.close-btn:hover {
  background: #a6793b;
  color: #fff3c4;
  border-color: #7f5b24;
}

/* Barra de filtros */
.filter-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 18px;
  background: #5d3a1a;
  color: #f1d7b1;
  border: 2px solid #7f5b24;
  border-radius: 14px;
  font-family: 'Cinzel', serif;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 1px 1px 2px #3c2611 inset;
  user-select: none;
  transition: background 0.25s ease, color 0.25s ease;
}

.filter-btn:hover,
.filter-btn.active {
  background: #a6793b;
  color: #fff3c4;
  border-color: #7f5b24;
}

/* Conteúdo principal do inventário */
.inventory-content {
  display: flex;
  gap: 18px;
  justify-content: space-between;
}

/* Grid de itens */
.item-grid {
  flex: 1 1 60%;
  max-height: 420px;
  overflow-y: auto;
  border: 3px solid #7f5b24;
  border-radius: 14px;
  padding: 10px;
  background: linear-gradient(145deg, #593e16, #4a3118);
  box-shadow: inset 0 0 10px 3px #7f5b24;
}

/* Container para transition-group */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

/* Cartão de item */
.item-card {
  background: #7f5b24;
  border-radius: 12px;
  padding: 8px;
  text-align: center;
  cursor: default;
  color: #f1d7b1;
  font-weight: 600;
  box-shadow:
    inset 0 0 4px #3c2611,
    1px 1px 3px #3c2611;
  user-select: none;
  transition: box-shadow 0.3s ease, background 0.3s ease;
}

.item-card.clickable {
  cursor: pointer;
}

.item-card.clickable:hover {
  background: #a6793b;
  box-shadow:
    0 0 12px 3px #ffdb66,
    inset 0 0 8px #fff5b1;
  color: #fff3c4;
}

.item-card.equipped {
  border: 3px solid #f3d88c;
  box-shadow: 0 0 12px 3px #f3d88c;
}

.item-card.low-quantity {
  border: 2px solid #e85c3f;
  box-shadow: 0 0 8px 2px #e85c3f;
}

.item-icon {
  width: 44px;
  height: 44px;
  image-rendering: pixelated;
  margin-bottom: 6px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
}

.item-quantity {
  font-size: 13px;
  color: #ffda8e;
  font-weight: 700;
}

.equipped-tag {
  font-size: 12px;
  color: #f3d88c;
  font-weight: 700;
  text-shadow: 1px 1px 0 #593e16;
}

/* Painel de detalhes do item */
.details-panel {
  flex: 1 1 35%;
  border: 3px solid #7f5b24;
  border-radius: 14px;
  padding: 18px 24px;
  background: linear-gradient(145deg, #593e16, #4a3118);
  box-shadow: inset 0 0 10px 3px #7f5b24;
  color: #f1d7b1;
  font-family: 'Cinzel', serif;
  user-select: none;
}

.details-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.details-header h3 {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  text-shadow: 1px 1px 2px #2f1e0d;
}

.item-icon.large {
  width: 56px;
  height: 56px;
  image-rendering: pixelated;
}

.description {
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.4;
  color: #e5c98a;
}

.detail {
  font-size: 14px;
  margin-bottom: 6px;
  font-weight: 600;
  color: #f3d88c;
  text-shadow: 1px 1px 0 #593e16;
}

.equipped-notice {
  margin-top: 12px;
  font-weight: 700;
  color: #f3d88c;
  text-shadow: 0 0 5px #ffdb66;
}

/* Mensagem de feedback */
.feedback-message {
  position: absolute;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  background: #a6793b;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 700;
  color: #fff3c4;
  text-shadow: 1px 1px 1px #593e16;
  box-shadow: 0 0 10px 2px #7f5b24;
  user-select: none;
  animation: fadeinout 3s ease forwards;
  pointer-events: none;
  font-family: 'Cinzel', serif;
}

@keyframes fadeinout {
  0%, 100% { opacity: 0; }
  10%, 90% { opacity: 1; }
}

/* Transitions do grupo de itens */
.item-fade-enter-active,
.item-fade-leave-active {
  transition: all 0.3s ease;
}

.item-fade-enter-from,
.item-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
