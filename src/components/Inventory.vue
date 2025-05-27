<template>
  <div class="bag-container slide-down">
    <div class="bag-box">
      <h2 class="bag-title">MOCHILA</h2>
      <div class="filters">
        <div
          v-for="cat in categories"
          :key="cat"
          class="filter-button"
          :class="{ active: activeCategory === cat }"
          @click="setCategory(cat)"
        >
          {{ cat }}
        </div>
      </div>

      <div class="bag-body">
        <div class="item-list">
          <transition-group name="fade" tag="div">
            <div
              v-for="item in filteredItems"
              :key="item.name"
              class="item"
              :class="{
                clickable: item.usable || item.equipable,
                equipped: item.equipped,
                flash: item.flash
              }"
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
        </div>

        <div class="item-details" v-if="hoverItem">
          <div class="details-header">
            <span class="icon-large">{{ hoverItem.icon }}</span>
            <h4>{{ hoverItem.name }}</h4>
          </div>
          <p>{{ hoverItem.description }}</p>
          <p v-if="hoverItem.equipped" class="equipped-label">Arma equipada!</p>
          <p v-if="hoverItem.type" class="type-label">Tipo: {{ hoverItem.type }}</p>
          <div v-if="hoverItem.usable && hoverItem.amount > 0" class="action-button" @click="handleClick(hoverItem)">Usar</div>
          <div v-if="hoverItem.equipable && !hoverItem.equipped" class="action-button" @click="handleClick(hoverItem)">Equipar</div>
        </div>
      </div>

      <p v-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>
      <div class="menu-button close-button" @click="closeBag">FECHAR</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  potions: Number,
  equippedWeapon: String,
})
const emits = defineEmits(['use-potion', 'equip-weapon', 'close'])

const hoverItem = ref(null)
const feedbackMessage = ref('')
const activeCategory = ref('Todos')
const categories = ['Todos', 'Consumíveis', 'Armas', 'Chave']

let clickSound
onMounted(() => {
  clickSound = new Audio('/audio/click.ogg')
  clickSound.volume = 0.4
})

const allItems = computed(() => [
  {
    name: 'Poção de Vida',
    icon: '🧪',
    amount: props.potions,
    description: 'Restaura 30 de vida ao ser usada. Forjada por alquimistas do reino.',
    type: 'Consumíveis',
    usable: true,
    action: () => {
      emits('use-potion')
      feedbackMessage.value = 'Você usou Poção de Vida!'
    },
  },
  {
    name: 'Espada de Treinamento',
    icon: '⚔️',
    amount: 1,
    description: 'Uma lâmina simples, mas confiável. Aumenta o dano em +5.',
    type: 'Armas',
    equipable: true,
    equipped: props.equippedWeapon === 'Espada de Treinamento',
    action: () => {
      emits('equip-weapon', 'Espada de Treinamento')
      feedbackMessage.value = 'Espada de Treinamento equipada!'
    },
  },
  {
    name: 'Chave da Floresta',
    icon: '🔑',
    amount: 1,
    description: 'Uma chave mística que abre o caminho para a Floresta Amaldiçoada.',
    type: 'Chave',
    usable: false,
  },
])

const filteredItems = computed(() => {
  if (activeCategory.value === 'Todos') return allItems.value
  return allItems.value.filter(item => item.type === activeCategory.value)
})

const setCategory = (cat) => {
  playClick()
  activeCategory.value = cat
}

const handleClick = (item) => {
  playClick()
  if (item.usable && item.amount > 0) {
    item.action?.()
  } else if (item.equipable) {
    item.action?.()
  } else if (item.usable) {
    feedbackMessage.value = `Você não tem ${item.name}!`
  }
  setTimeout(() => (feedbackMessage.value = ''), 2000)
}

const closeBag = () => {
  playClick()
  emits('close')
}

const playClick = () => {
  if (clickSound) clickSound.play()
}
</script>

<style scoped>
/* Animação de descida */
.slide-down {
  animation: slideDown 1s ease-out;
}
@keyframes slideDown {
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Container principal */
.bag-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
}

/* Caixa da mochila */
.bag-box {
  background: #e0a867;
  border: 6px solid #5c2c1d;
  border-radius: 10px;
  padding: 20px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: inset -6px -6px #d17844, inset 6px 6px #ffcb8e;
  image-rendering: pixelated;
}

/* Título */
.bag-title {
  font-size: 40px;
  color: #5c2c1d;
  text-align: center;
  margin-bottom: 20px;
  text-shadow: 2px 2px #d17844;
}

/* Filtros */
.filters {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.filter-button {
  background-color: #e0a867;
  color: #5c2c1d;
  border: 4px solid #5c2c1d;
  padding: 8px 20px;
  font-size: 18px;
  text-align: center;
  cursor: pointer;
  box-shadow: inset -4px -4px #d17844, inset 4px 4px #ffcb8e;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s;
}

.filter-button:hover {
  background-color: #f4b76a;
  color: #3e1e14;
  box-shadow: inset -4px -4px #c96a32, inset 4px 4px #ffd9a1;
}

.filter-button.active {
  background-color: #ffcb8e;
  box-shadow: inset -4px -4px #c96a32, inset 4px 4px #ffffff;
}

.filter-button:active {
  transform: translateY(2px);
  box-shadow: inset -2px -2px #d17844, inset 2px 2px #ffcb8e;
}

/* Corpo da mochila */
.bag-body {
  display: flex;
  gap: 20px;
  flex: 1;
  overflow: hidden;
  padding: 10px;
  height: 100%;
  position: relative;
}

/* Lista de itens */
.item-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 50%;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}

.item {
  display: flex;
  gap: 12px;
  background: #d17844;
  border: 3px solid #5c2c1d;
  border-radius: 8px;
  padding: 10px;
  transition: all 0.2s ease;
}

.item.clickable:hover {
  background: #f4b76a;
  cursor: pointer;
  transform: scale(1.02);
}

.item.equipped {
  border-color: #ffcb8e;
  background: #c96a32;
}

.icon {
  font-size: 28px;
}

.info {
  flex: 1;
}

.info strong {
  font-size: 16px;
  color: #5c2c1d;
}

.equipped-label {
  font-size: 14px;
  color: #ffcb8e;
}

/* Detalhes do item - agora fixos e bonitos */
.item-details {
  position: sticky;
  top: 10px;
  align-self: flex-start;
  width: 50%;
  background: linear-gradient(135deg, #d17844, #e0a867);
  border: 3px solid #5c2c1d;
  border-radius: 12px;
  padding: 18px;
  font-size: 14px;
  color: #5c2c1d;
  height: fit-content;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  animation: floatUp 0.3s ease;
}

@keyframes floatUp {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Botões de ação */
.action-button {
  background-color: #e0a867;
  color: #5c2c1d;
  border: 4px solid #5c2c1d;
  padding: 8px 20px;
  font-size: 16px;
  text-align: center;
  cursor: pointer;
  margin-top: 10px;
  box-shadow: inset -4px -4px #d17844, inset 4px 4px #ffcb8e;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s;
}

.action-button:hover {
  background-color: #f4b76a;
  color: #3e1e14;
  box-shadow: inset -4px -4px #c96a32, inset 4px 4px #ffd9a1;
}

.action-button:active {
  transform: translateY(2px);
  box-shadow: inset -2px -2px #d17844, inset 2px 2px #ffcb8e;
}

/* Feedback */
.feedback {
  margin-top: 15px;
  color: #ffcb8e;
  font-size: 16px;
  text-align: center;
}

/* Botão de fechar */
.close-button {
  background-color: #e0a867;
  color: #5c2c1d;
  border: 4px solid #5c2c1d;
  padding: 10px 40px;
  width: 200px;
  height: 30px;
  font-size: 30px;
  text-align: center;
  cursor: pointer;
  margin: 20px auto 0;
  box-shadow: inset -6px -6px #d17844, inset 6px 6px #ffcb8e;
  font-weight: bold;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s;
}

.close-button:hover {
  background-color: #f4b76a;
  color: #3e1e14;
  box-shadow: inset -6px -6px #c96a32, inset 6px 6px #ffd9a1;
}

.close-button:active {
  transform: translateY(2px);
  box-shadow: inset -3px -3px #d17844, inset 3px 3px #ffcb8e;
}

/* Barra de rolagem */
.bag-body::-webkit-scrollbar {
  width: 10px;
}
.bag-body::-webkit-scrollbar-track {
  background: #d17844;
}
.bag-body::-webkit-scrollbar-thumb {
  background: #5c2c1d;
  border-radius: 5px;
}

/* Transições */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
