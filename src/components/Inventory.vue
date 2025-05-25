<template>
  <div class="bag-modal">
    <h2>🎒 Mochila</h2>

    <!-- Filtros -->
    <div class="filters">
      <button 
        v-for="cat in categories" 
        :key="cat" 
        :class="{ active: activeCategory === cat }"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <div class="bag-body">
      <!-- Lista de Itens -->
      <transition-group name="fade" tag="div" class="item-list">
        <div
          v-for="item in filteredItems"
          :key="item.name"
          class="item"
          :class="{ clickable: item.usable || item.equipable, equipped: item.equipped }"
          @click="handleClick(item)"
          @mouseenter="hoverItem = item"
          @mouseleave="hoverItem = null"
        >
          <span class="icon">{{ item.icon }}</span>
          <div class="info">
            <strong>{{ item.name }} <span v-if="item.amount > 1">×{{ item.amount }}</span></strong>
            <p v-if="item.equipped" class="equipped-label">(Equipado)</p>
          </div>
        </div>
      </transition-group>

      <!-- Painel lateral -->
      <div class="item-details" v-if="hoverItem">
        <div class="details-header">
          <span class="icon-large">{{ hoverItem.icon }}</span>
          <h4>{{ hoverItem.name }}</h4>
        </div>
        <p>{{ hoverItem.description }}</p>
        <p v-if="hoverItem.equipped" class="equipped-label">Arma equipada!</p>
        <p v-if="hoverItem.type" class="type-label">Tipo: {{ hoverItem.type }}</p>
      </div>
    </div>

    <p v-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>
    <button @click="$emit('close')">Fechar</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  potions: Number,
  equippedWeapon: String
})
const emits = defineEmits(['use-potion', 'equip-weapon', 'close'])

const hoverItem = ref(null)
const feedbackMessage = ref('')
const activeCategory = ref('Todos')

// Categorias
const categories = ['Todos', 'Consumíveis', 'Armas', 'Chave']

const allItems = computed(() => [
  {
    name: 'Poção',
    icon: '🧪',
    amount: props.potions,
    description: 'Recupera 30 de vida. Clique para usar.',
    type: 'Consumíveis',
    usable: true,
    action: () => emits('use-potion')
  },
  {
    name: 'Espada de Treinamento',
    icon: '⚔️',
    amount: 1,
    description: 'Arma básica. +5 de dano ao atacar.',
    type: 'Armas',
    equipable: true,
    equipped: props.equippedWeapon === 'Espada de Treinamento',
    action: () => emits('equip-weapon', 'Espada de Treinamento')
  },
  {
    name: 'Chave da Floresta',
    icon: '🔑',
    amount: 1,
    description: 'Desbloqueia a entrada da floresta amaldiçoada.',
    type: 'Chave',
    usable: false
  }
])

const filteredItems = computed(() => {
  if (activeCategory.value === 'Todos') return allItems.value
  return allItems.value.filter(item => item.type === activeCategory.value)
})

const handleClick = (item) => {
  if (item.usable && item.amount > 0) {
    item.action?.()
    feedbackMessage.value = `Você usou ${item.name}!`
  } else if (item.equipable) {
    item.action?.()
    feedbackMessage.value = `${item.name} equipada!`
  } else if (item.usable) {
    feedbackMessage.value = `Você não tem ${item.name}!`
  }

  setTimeout(() => (feedbackMessage.value = ''), 2000)
}
</script>

<style scoped>
.bag-modal {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #1e1e1e;
  border: 2px solid #8b5e3c;
  border-radius: 12px;
  padding: 20px 30px;
  color: white;
  z-index: 9999;
  min-width: 700px;
  max-width: 800px;
  font-family: 'Press Start 2P', cursive;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.filters button {
  background-color: #2c2c2c;
  color: white;
  padding: 6px 12px;
  border: 1px solid #555;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.filters button.active {
  background-color: #8b5e3c;
  border-color: gold;
}

.bag-body {
  display: flex;
  gap: 20px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 50%;
}

.item {
  display: flex;
  gap: 12px;
  background-color: #2c2c2c;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 10px;
  transition: all 0.3s ease;
}

.item.clickable:hover {
  background-color: #3d2d1c;
  cursor: pointer;
}

.item.equipped {
  border-color: gold;
  background-color: #443315;
}

.icon {
  font-size: 28px;
}

.info {
  flex: 1;
}

.info strong {
  font-size: 13px;
  display: block;
  margin-bottom: 5px;
}

.equipped-label {
  font-size: 11px;
  color: #ffd700;
}

.item-details {
  width: 50%;
  background-color: #2c2c2c;
  border: 1px solid #8b5e3c;
  border-radius: 8px;
  padding: 15px;
  font-size: 12px;
}

.details-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.icon-large {
  font-size: 32px;
}

.type-label {
  font-size: 11px;
  color: #aaa;
  margin-top: 5px;
}

.feedback {
  margin-top: 12px;
  color: #ffd700;
  font-size: 12px;
  text-align: center;
}

button {
  margin-top: 20px;
  padding: 8px 16px;
  font-size: 12px;
  background-color: #8b5e3c;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

/* Transições animadas */
.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
