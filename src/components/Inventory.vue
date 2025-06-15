```vue
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

    <div class="inventory-content">
      <div class="item-grid">
        <transition-group name="item-fade" tag="div" class="grid-container">
          <div
            v-for="item in allItems"
            :key="item.itemId"
            class="item-card"
            :class="{
              clickable: item.usable || item.equipable,
              equipped: item.equipped,
              'low-quantity': item.quantity === 1 && item.usable,
            }"
            @click="handleClick(item)"
          >
            <div class="item-header">
              <img :src="item.icon" :style="{ width: '64px', height: '64px', imageRendering: 'pixelated' }" :alt="item.name" />
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span v-if="item.quantity > 1" class="item-quantity">×{{ item.quantity }}</span>
                <span v-if="item.equipped" class="equipped-tag">Equipado</span>
              </div>
            </div>
            <div class="item-details">
              <p class="description">{{ item.description }}</p>
              <p v-if="item.type" class="detail">Tipo: {{ item.type }}</p>
              <p v-if="item.stats?.attack" class="detail">Dano: +{{ item.stats.attack }}</p>
              <p v-if="item.stats?.defense" class="detail">Defesa: +{{ item.stats.defense }}</p>
              <p v-if="item.stats?.speed" class="detail">Velocidade: {{ item.stats.speed > 0 ? '+' : '' }}{{ item.stats.speed }}</p>
              <p v-if="item.equipped" class="equipped-notice">Item atualmente equipado</p>
            </div>
          </div>
        </transition-group>
      </div>
      <p v-if="feedbackMessage" class="feedback-message">{{ feedbackMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useGameState, ITEMS } from '@/stores/gameState.js';

const emits = defineEmits(['update:show']);
const gameState = useGameState();

const feedbackMessage = ref('');
const isClosing = ref(false);

const inventoryModal = ref(null);
const header = ref(null);

const getItemIcon = (itemId) => ITEMS[itemId]?.icon || '/assets/icons/unknown-item.png';

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
              gameState.unequipItem(slot);
            } else {
              gameState.equipItem(invItem.itemId);
            }
          }
        : itemData.type.startsWith('Consumível')
        ? () => gameState.useItem(invItem.itemId)
        : null,
    };
  }).filter(Boolean);
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

.inventory-modal {
  position: fixed;
  z-index: 10000;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 600px;
  background: #533200;
  border: 2px solid #00000044;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  color: white;
}

.inventory-modal::-webkit-scrollbar {
  width: 8px;
}

.inventory-modal::-webkit-scrollbar-track {
  background: #4a3118;
  border-radius: 4px;
}

.inventory-modal::-webkit-scrollbar-thumb {
  background: #a6793b;
  border-radius: 4px;
}

.inventory-modal::-webkit-scrollbar-thumb:hover {
  background: #f3d88c;
}

.inventory-modal::before {
  content: '';
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 12px;
  right: 12px;
  border: 2px dashed #a6793b;
  border-radius: 14px;
  pointer-events: none;
  z-index: 1;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 12px;
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
  transition: background-color 0.3s ease, color 0.3s ease;
}

.close-btn:hover {
  background: #a6793b;
  color: #fff3c4;
  border-color: #7f5b24;
}

.inventory-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin-top: 8px;
  width: 100%;
  box-sizing: border-box;
}

.inventory-content::-webkit-scrollbar {
  width: 8px;
}

.inventory-content::-webkit-scrollbar-track {
  background: #4a3118;
  border-radius: 4px;
}

.inventory-content::-webkit-scrollbar-thumb {
  background: #a6793b;
  border-radius: 4px;
}

.inventory-content::-webkit-scrollbar-thumb:hover {
  background: #f3d88c;
}

.item-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px;
  background: none;
  border: none;
  max-width: 100%;
}

.item-card {
  width: 100%;
  max-width: calc(100% - 12px); /* Account for padding and border */
  padding: 6px;
  border: 2px solid #a6793b;
  border-radius: 8px;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  cursor: default;
  transition: transform 0.15s ease, border-color 0.2s;
  box-shadow: inset 0 0 4px #3c2611;
  box-sizing: border-box;
}

.item-card:hover {
  border-color: #f3d88c;
  transform: scale(1.02);
}

.item-card.clickable {
  cursor: pointer;
  border-color: #777;
}

.item-card.equipped {
  border-color: gold;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
  width: 100%;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: calc(100% - 76px); /* Account for icon (64px) + gap (12px) */
}

.item-name {
  font-size: 16px;
  color: #f1d7b1;
  font-weight: 600;
  text-shadow: 1px 1px 0 #593e16;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.item-quantity {
  font-size: 14px;
  color: #ffda8e;
  font-weight: 700;
}

.equipped-tag {
  font-size: 12px;
  color: #f3d88c;
  font-weight: 700;
  text-shadow: 1px 1px 0 #593e16;
}

.item-details {
  padding: 3px;
  background: linear-gradient(145deg, #593e16, #4a3118);
  border-radius: 6px;
  width: 100%;
  max-width: 100%;
  max-height: 120px;
  overflow-y: auto;
  box-shadow: inset 0 0 6px #7f5b24;
  box-sizing: border-box;
}

.item-details::-webkit-scrollbar {
  width: 6px;
}

.item-details::-webkit-scrollbar-track {
  background: #4a3118;
  border-radius: 3px;
}

.item-details::-webkit-scrollbar-thumb {
  background: #a6793b;
  border-radius: 3px;
}

.item-details::-webkit-scrollbar-thumb:hover {
  background: #f3d88c;
}

.description {
  margin-bottom: 6px;
  font-size: 14px;
  line-height: 1.4;
  color: #e5c98a;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.detail {
  font-size: 14px;
  margin-bottom: 4px;
  font-weight: 600;
  color: #f3d88c;
  text-shadow: 1px 1px 0 #593e16;
}

.equipped-notice {
  margin-top: 6px;
  font-weight: 700;
  color: #f3d88c;
  text-shadow: 0 0 5px #ffdb66;
}

.feedback-message {
  position: sticky;
  bottom: 10px;
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
  z-index: 2;
  max-width: 90%;
  text-align: center;
  box-sizing: border-box;
}

@keyframes fadeinout {
  0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
  10% { opacity: 1; transform: translateX(-50%) translateY(0); }
  90% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
}

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
```