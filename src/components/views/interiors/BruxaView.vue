<template>
  <div class="bruxa-screen" :style="{ backgroundImage: `url(${bgImage})` }">
    <!-- Partículas mágicas no fundo -->
    <div class="particle-overlay"></div>

    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button class="btn-continuar" @click="nextDialog" :disabled="typing">Continuar</button>
    </div>

    <transition name="fade-zoom">
      <div v-if="showShop" class="shop-box pergaminho">
        <p class="shop-title">Bem-vindo à loja de Margaret!</p>
        <div class="shop-item" v-for="item in weapons" :key="item.name">
          <strong>{{ item.name }} - {{ item.price }} ouro</strong>
          <p>{{ item.description }}</p>
          <button class="btn-comprar" @click="buyWeapon(item)">Comprar</button>
        </div>
        <p v-if="message" class="message">{{ message }}</p>
        <button class="btn-sair" @click="router.push('/level/albadia')">Sair</button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import bgImage from '@/assets/interior/bruxa-bg.png'
import { useAudio } from '@/composables/audio'

const router = useRouter()
const { playAudio } = useAudio()

const showDialog = ref(true)
const dialogIndex = ref(0)
const dialogLines = [
  'Olá jovem rapaz, sou Margaret, a bruxa do reino!',
  'Minhas poções são as melhores de toda Albadia, pode ter certeza.',
  'Porém, escolha com cuidado... nunca se sabe o que uma bruxa pode fazer.',
  'Brincadeirinha... ou não.'
]
const displayedText = ref('')
const typing = ref(false)
const showShop = ref(false)
const message = ref('')

const gold = ref(150)
const ownedWeapons = ref([])

const weapons = [
  { name: 'Poção de Cura', price: 80, description: 'Cura 10 de vida.' },
  { name: 'Poção Azul Misteriosa', price: 120, description: 'É azul. Talvez mágica.' },
  { name: 'Poção da Morte', price: 999, description: 'Essa poção... te mata. Evite.' }
]

const typeLine = () => {
  typing.value = true
  displayedText.value = ''
  const line = dialogLines[dialogIndex.value]
  let index = 0
  const interval = setInterval(() => {
    if (index < line.length) {
      displayedText.value += line[index]
      index++
    } else {
      clearInterval(interval)
      typing.value = false
    }
  }, 40)
}

const nextDialog = () => {
  if (typing.value) return
  if (dialogIndex.value < dialogLines.length - 1) {
    dialogIndex.value++
    typeLine()
  } else {
    localStorage.setItem('visitedMargaret', 'true')
    showDialog.value = false
    showShop.value = true
    playAudio('sfx_shop_open')
  }
}

const buyWeapon = (item) => {
  if (ownedWeapons.value.includes(item.name)) {
    message.value = 'Você já comprou esta poção.'
    return
  }
  if (gold.value >= item.price) {
    gold.value -= item.price
    ownedWeapons.value.push(item.name)
    message.value = `Você comprou ${item.name}!`
  } else {
    message.value = 'Você não tem ouro suficiente.'
  }
  setTimeout(() => (message.value = ''), 3000)
}

onMounted(() => {
  const visited = localStorage.getItem('visitedMargaret')
  if (visited) {
    displayedText.value = 'Bem-vindo de volta à loja de Margaret!'
    showDialog.value = true
    setTimeout(() => {
      showDialog.value = false
      showShop.value = true
    }, 2500)
  } else {
    typeLine()
  }
})
</script>

<style scoped>
.bruxa-screen {
  background-size: cover;
  background-position: center;
  height: 100vh;
  width: 100vw;
  color: white;
  font-family: 'Press Start 2P', cursive;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 40px;
  position: relative;
  overflow: hidden;
}

.particle-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  animation: magicParticles 10s linear infinite;
  z-index: 0;
}

@keyframes magicParticles {
  from { background-position: 0 0; }
  to { background-position: 100px 100px; }
}

.dialog-box {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  width: 700px;
  padding: 25px 30px;
  text-align: center;
  border-radius: 8px;
  box-shadow: 0 0 15px black;
  z-index: 2;
}

.shop-box {
  position: absolute;
  right: 5%;
  bottom: 160px;
  max-width: 90vw;
  width: 360px;
  background: rgba(255, 245, 220, 0.95);
  color: #2c1b10;
  padding: 25px;
  border-radius: 8px;
  text-align: left;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  z-index: 2;
  overflow-y: auto;
  max-height: 80vh;
}


.fade-zoom-enter-active {
  animation: fadeZoomIn 0.6s ease-out forwards;
}
.fade-zoom-leave-active {
  animation: fadeZoomOut 0.3s ease-in forwards;
}

@keyframes fadeZoomIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeZoomOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.8);
  }
}

.shop-title {
  font-size: 14px;
  color: #4b2e19;
  margin-bottom: 20px;
}

.shop-item {
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #4b2e19;
}

button {
  font-family: 'Press Start 2P', cursive;
  font-size: 12px;
  cursor: pointer;
}

.btn-continuar,
.btn-comprar,
.btn-sair {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #e0a867;
  color: #3e1e14;
  border: 2px solid #5c2c1d;
  border-radius: 4px;
  box-shadow: inset -3px -3px #c96a32, inset 3px 3px #ffd9a1;
}

.btn-continuar:hover,
.btn-comprar:hover,
.btn-sair:hover {
  background-color: #f4b76a;
}

.message {
  color: #5c2c1d;
  margin-top: 10px;
  font-weight: bold;
}
</style>