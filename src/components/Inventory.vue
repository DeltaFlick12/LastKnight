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
        type: itemData.type === 'Armadura' ? 'Armadura' : itemData.type, // Standardize type
        usable: itemData.type === 'Consumível' || itemData.type === 'Consumível Especial',
        equipable: itemData.slot === 'weapon' || itemData.slot === 'armor',
        equipped: gameState.player.equipment[itemData.slot] === invItem.itemId,
        stats: itemData.stats,
        action: itemData.slot
          ? () => {
              if (gameState.player.equipment[itemData.slot] === invItem.itemId) {
                actions.unequipItem(itemData.slot); // Unequip if already equipped
              } else {
                actions.equipItem(invItem.itemId); // Equip if not equipped
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
  // Normalize comparison by converting to lowercase
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

/* Modal principal */
.inventory-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: url('/textures/parchment.jpg') repeat;
  background-size: cover;
  border: 4px solid #5c2c1d;
  border-radius: 8px;
  padding: 24px;
  color: #5c2c1d;
  width: 90%;
  max-width: 800px;
  min-height: 500px;
  box-shadow: inset -6px -6px #d17844, inset 6px 6px #ffcb8e, 0 0 20px rgba(0, 0, 0, 0.5),
    0 0 10px #b8860b;
  font-family: 'Press Start 2P', 'Arial', sans-serif;
  image-rendering: pixelated;
  z-index: 10000;
}

/* Cabeçalho */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  border-bottom: 2px solid #5c2c1d;
  padding-bottom: 10px;
}

.modal-header h2 {
  font-size: 24px;
  margin: 0;
  color: #5c2c1d;
  text-shadow: 2px 2px 0 #d17844;
}

.gold {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #b8860b;
  font-weight: bold;
}

.gold-icon {
  width: 20px;
  height: 20px;
  image-rendering: pixelated;
}

.close-btn {
  background: #e0a867;
  border: 3px solid #5c2c1d;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: #5c2c1d;
  font-size: 16px;
  cursor: pointer;
  box-shadow: inset -4px -4px #d17844, inset 4px 4px #ffcb8e;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s;
}

.close-btn:hover {
  background: #f4b76a;
  box-shadow: inset -4px -4px #c96a32, inset 4px 4px #ffd9a1;
}

.close-btn:active {
  transform: translateY(2px);
  box-shadow: inset -2px -2px #d17844, inset 2px 2px #ffcb8e;
}

/* Barra de filtros */
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.filter-btn {
  background: #e0a867;
  border: 3px solid #5c2c1d;
  padding: 8px 16px;
  color: #5c2c1d;
  cursor: pointer;
  font-size: 12px;
  box-shadow: inset -4px -4px #d17844, inset 4px 4px #ffcb8e;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s;
  image-rendering: pixelated;
}

.filter-btn:hover {
  background: #f4b76a;
  box-shadow: inset -4px -4px #c96a32, inset 4px 4px #ffd9a1;
}

.filter-btn:active {
  transform: translateY(2px);
  box-shadow: inset -2px -2px #d17844, inset 2px 2px #ffcb8e;
}

.filter-btn.active {
  background: #f4b76a;
  border-color: #b8860b;
  color: #3e1e14;
}

/* Conteúdo principal */
.inventory-content {
  position: relative;
  display: flex;
  gap: 24px;
  min-height: 350px;
}

/* Grid de itens */
.item-grid {
  flex: 1;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.item-card {
  background: #e0a867;
  border: 2px solid #5c2c1d;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: inset -4px -4px #d17844, inset 4px 4px #ffcb8e;
  image-rendering: pixelated;
  transition: transform 0.1s ease, box-shadow 0.2s ease;
}

.item-card.clickable:hover {
  background: #f4b76a;
  transform: translateY(-2px);
  box-shadow: inset -4px -4px #c96a32, inset 4px 4px #ffd9a1, 0 0 8px #b8860b;
  cursor: pointer;
}

.item-card.equipped {
  border-color: #b8860b;
  background: #d4a45e;
}

.item-card.low-quantity {
  border-color: #8b2c2c;
}

.item-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 8px;
  object-fit: contain;
  image-rendering: pixelated;
}

.item-icon.large {
  width: 48px;
  height: 48px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-size: 12px;
  font-weight: bold;
  color: #5c2c1d;
  text-shadow: 1px 1px 0 #d17844;
}

.item-quantity {
  font-size: 10px;
  color: #3e1e14;
  text-shadow: 1px 1px 0 #d17844;
}

.equipped-tag {
  font-size: 10px;
  color: #b8860b;
  background: rgba(0, 0, 0, 0.4);
  padding: 2px 6px;
  border-radius: 4px;
  text-shadow: 1px 1px 0 #000;
}

/* Painel de detalhes */
.details-panel {
  width: 40%;
  background: #e0a867;
  border: 2px solid #5c2c1d;
  border-radius: 4px;
  padding: 16px;
  color: #5c2c1d;
  box-shadow: inset -4px -4px #d17844, inset 4px 4px #ffcb8e;
}

.details-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.details-header h3 {
  font-size: 16px;
  margin: 0;
  color: #5c2c1d;
  font-weight: bold;
  text-shadow: 1px 1px 0 #d17844;
}

.description {
  font-size: 12px;
  margin-bottom: 8px;
  text-shadow: 1px 1px 0 #d17844;
}

.detail {
  font-size: 11px;
  color: #3e1e14;
  margin: 4px 0;
  text-shadow: 1px 1px 0 #d17844;
}

.equipped-notice {
  font-size: 11px;
  color: #b8860b;
  font-style: italic;
  text-shadow: 1px 1px 0 #d17844;
}

/* Mensagem de feedback */
.feedback-message {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #b8860b;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 4px;
  text-shadow: 1px 1px 0 #000;
  animation: fade-in-out 3s ease forwards;
}

@keyframes fade-in-out {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  10% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  90% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
}

/* Animação de fade para itens */
.item-fade-enter-active,
.item-fade-leave-active {
  transition: all 0.3s ease;
}
.item-fade-enter-from,
.item-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>