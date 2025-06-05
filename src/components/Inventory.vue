<template>
  <div
    ref="inventoryModal"
    :class="[
      'inventory-modal scroll-unroll',
      isClosing ? 'fade-out-scale' : 'fade-in-scale'
    ]"
  >
<div ref="header" class="modal-header">
  <div class="gold">
    <img src="/icons/gold-icon.png" alt="Gold Coin" class="gold-icon" />
    <span>{{ gameState.player.gold }}</span>
  </div>
  <h2>INVENTÁRIO</h2>
  <button class="close-btn" @click="handleClose">✖</button>
</div>

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
              <span v-if="item.equipped" class="equipped-tag"></span>
            </div>
          </div>
        </transition-group>
      </div>

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

      <p v-if="feedbackMessage" class="feedback-message">{{ feedbackMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { gameState, actions, ITEMS, ITEM_ICONS } from '@/stores/game.js';

const emits = defineEmits(['update:show']);

const hoverItem = ref(null);
const feedbackMessage = ref('');
const activeCategory = ref('Todos');
const isClosing = ref(false);

const categories = ['Todos', 'Consumíveis', 'Armas', 'Armadura', 'Chave'];

const inventoryModal = ref(null);
const header = ref(null);

const getItemIcon = (itemId) => ITEM_ICONS[itemId] || '/assets/icons/unknown-item.png';

const allItems = computed(() => {
  return gameState.player.inventory.map((invItem) => {
    const itemData = ITEMS[invItem.itemId];
    if (!itemData) return null;

    const slot = itemData.slot;

    return {
      itemId: invItem.itemId,
      name: itemData.name,
      icon: getItemIcon(invItem.itemId),
      quantity: invItem.quantity,
      description: itemData.description,
      type: itemData.type === 'Armadura' ? 'Armadura' : itemData.type,
      usable: ['Consumível', 'Consumível Especial'].includes(itemData.type),
      equipable: slot === 'weapon' || slot === 'armor',
      equipped: gameState.player.equipment[slot] === invItem.itemId,
      stats: itemData.stats,
      action: slot
        ? () => {
            if (gameState.player.equipment[slot] === invItem.itemId) {
              actions.unequipItem(slot);
            } else {
              actions.equipItem(invItem.itemId);
            }
          }
        : itemData.type.startsWith('Consumível')
        ? () => actions.useItem(invItem.itemId)
        : null,
    };
  }).filter(Boolean);
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
    item.action?.();
    feedbackMessage.value = `Você usou ${item.name}!`;
  } else if (item.equipable) {
    const wasEquipped = item.equipped;
    item.action?.();
    feedbackMessage.value = wasEquipped ? `${item.name} desequipado!` : `${item.name} equipado!`;
  } else {
    feedbackMessage.value = `${item.name} não pode ser usado ou equipado.`;
  }

  setTimeout(() => (feedbackMessage.value = ''), 3000);
};

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

const handleMouseDown = (e) => {
  isDragging = true;
  const modal = inventoryModal.value;
  const rect = modal.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  modal.style.position = 'fixed';
  modal.style.left = `${rect.left}px`;
  modal.style.top = `${rect.top}px`;
  modal.style.transform = 'none';
  modal.style.margin = '0';
  modal.classList.add('dragging');
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  e.preventDefault();
};

const handleMouseMove = (e) => {
  if (!isDragging) return;
  const modal = inventoryModal.value;
  modal.style.left = `${e.clientX - offsetX}px`;
  modal.style.top = `${e.clientY - offsetY}px`;
};

const handleMouseUp = () => {
  if (!isDragging) return;
  isDragging = false;
  const modal = inventoryModal.value;
  modal.classList.remove('dragging');
  localStorage.setItem('inventoryModalPos', JSON.stringify({
    left: modal.style.left,
    top: modal.style.top,
  }));
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
};

const handleClose = () => {
  if (isClosing.value) return;
  isClosing.value = true;
  setTimeout(() => emits('update:show', false), 300);
};

onMounted(() => {
  if (header.value) {
    header.value.addEventListener('mousedown', handleMouseDown);
  }
  const savedPos = localStorage.getItem('inventoryModalPos');
  const modal = inventoryModal.value;
  if (savedPos && modal) {
    const pos = JSON.parse(savedPos);
    modal.style.position = 'fixed';
    modal.style.left = pos.left;
    modal.style.top = pos.top;
    modal.style.transform = 'none';
    modal.style.margin = '0';
  }
});

onBeforeUnmount(() => {
  if (header.value) {
    header.value.removeEventListener('mousedown', handleMouseDown);
  }
});
</script>

<style scoped>
.fade-in-scale {
  animation: fadeInScale 0.3s ease forwards;
  opacity: 0;
  transform: scale(0.9);
}

.fade-out-scale {
  animation: fadeOutScale 0.3s ease forwards;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}
/* Animação de abertura (scroll unroll) */
/* Modal principal - couro envelhecido com costura */
.inventory-modal {
  position: fixed;
  z-index: 10000;
  left: 50%; /* Corrigido de 30% para 50% */
  top: 50%;  /* Centralização vertical */
  transform: translate(-50%, -50%);
  width: 800px;
  height: 500px;
  background: #533200;
  border: 2px solid #00000044;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  color: white;
}

/* Removido: estilo condicional que sobrescrevia a centralização */
.inventory-modal:not([style*="left"]) {
  transform: translate(-50%, -50%);
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

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: 20px;
  border-bottom: 3px solid #a6793b;
  z-index: 2;
  cursor: grab;
}

.modal-header h2 {
  font-size: 28px;
  color: #f1d7b1;
  margin: 0;
  text-shadow:
    1px 1px 0 #4a3118,
    2px 2px 3px #3c2611;
  flex-grow: 1;
  text-align: center;
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
  width: 24px;
  height: 24px;
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
  padding: 10px 28px;
  background: #5d3a1a;
  color: #f1d7b1;
  border: 2px solid #7f5b24;
  font-weight: 600;
  margin-left: 3%;
  cursor: pointer;
  box-shadow: 1px 1px 2px #3c2611 inset;
  user-select: none;
  transition: background 0.25s ease, color 0.25s ease;
}

.filter-btn:hover,
.filter-btn.active {
  background: #f3d88c;
  color: #4a3118;
  border-color: #a6793b;
  font-weight: bold;
  box-shadow: 0 0 6px #f3d88c;
}

/* Conteúdo principal do inventário */
.inventory-content {
  display: flex;
  gap: 18px;
  justify-content: space-between;
}

/* Grid de itens */
.item-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: none; /* Remova qualquer fundo ou borda geral */
  border: none;     /* Remova borda geral */
}

.item-card {
  width: 100px;
  height: 100px;
  border: 2px solid #a6793b; /* cor mais visível e temática */
  border-radius: 8px;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: default;
  transition: transform 0.15s ease, border-color 0.2s;
  box-shadow: inset 0 0 4px #3c2611; /* opcional: reforça a moldura */
} 

.item-card:hover {
  border-color: #aaa;
  transform: scale(1.05);
}

.item-card.clickable {
  cursor: pointer;
  border-color: #777;
}

.item-card.equipped {
  border-color: gold;
}

.item-icon {
  width: 64px;
  height: 64px;
}

.item-info {
  text-align: center;
  font-size: 10px;
  color: #eee;
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
  0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
  10% { opacity: 1; transform: translateX(-50%) translateY(0); }
  90% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
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
.inventory-modal.dragging {
  cursor: grabbing !important;
  user-select: none;
}
</style>
