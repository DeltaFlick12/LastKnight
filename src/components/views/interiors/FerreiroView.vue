<template>
  <div class="ferreiro-screen" :style="{ backgroundImage: `url(${bgImage})` }">
    <img :src="bjornImage" alt="Bjorn o Ferreiro" class="bjorn-image" :class="{ breathing: !typing }" />

    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button @click="nextDialog" :disabled="typing">Continuar</button>
    </div>

    <div v-if="showShop" class="shop-box">
      <p>Escolha sua arma:</p>
      <div class="shop-item" v-for="item in weapons" :key="item.name">
        <strong>{{ item.name }} - {{ item.price }} ouro</strong>
        <p>{{ item.description }}</p>
        <button @click="buyWeapon(item)">Comprar</button>
      </div>
      <p v-if="message" class="message">{{ message }}</p>
      <button class="exit" @click="router.push('/level/albadia')">Sair</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import bgImage from '@/assets/interior/ferreiro-bg.gif'
import bjornParado from '/public/img/sprites/bjorn/bjorn.png'
import bjornFalando from '/public/img/sprites/bjorn/bjorn-falando.gif'

const router = useRouter()

const showDialog = ref(true)
const dialogIndex = ref(0)
const dialogLines = [
  'Ah, um novo guerreiro! Eu sou Bjorn, o ferreiro mais rúbido do reino!',
  'Minhas armas são forjadas com fogo de dragão e suor de titãs.',
  'Escolha com sabedoria, jovem... uma boa arma faz toda a diferença.',
  'Vamos aos negócios!'
]
const displayedText = ref('')
const typing = ref(false)
const showShop = ref(false)
const message = ref('')

const gold = ref(150)
const ownedWeapons = ref([])

const bjornImage = ref(bjornParado)

const weapons = [
  {
    name: 'Espada Longa',
    price: 80,
    description: 'Aumenta o dano em +10. Forjada com o aço da Guarda Real.'
  },
  {
    name: 'Machado de Guerra',
    price: 120,
    description: 'Aumenta o dano em +15. Pesado e brutal como Bjorn.'
  },
  {
    name: 'Lança Rúnica',
    price: 200,
    description: 'Aumenta o dano em +20. Forjada com magia anã.'
  }
]

const typeLine = async () => {
  typing.value = true
  bjornImage.value = bjornFalando
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
      bjornImage.value = bjornParado
    }
  }, 40)
}

const nextDialog = () => {
  if (typing.value) return
  if (dialogIndex.value < dialogLines.length - 1) {
    dialogIndex.value++
    typeLine()
  } else {
    showDialog.value = false
    showShop.value = true
  }
}

const buyWeapon = (item) => {
  if (ownedWeapons.value.includes(item.name)) {
    message.value = 'Você já possui essa arma.'
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
  typeLine()
})
</script>


<style scoped>
.ferreiro-screen {
  background-size: cover;
  background-position: center;
  height: 100vh;
  width: 100vw;
  color: white;
  font-family: 'Press Start 2P', cursive;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.dialog-box,
.shop-box {
  position: fixed;
  bottom: 0.5vh;
  left: 60%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.85);
  padding: 2rem;
  border: 2px solid #d69c2f;
  border-radius: 10px;
  text-align: center;
  width: 80vw;
  max-width: 600px;
  z-index: 1;
}

.bjorn-image {
  position: fixed;
  bottom: -20vh;
  left: -3vw;
  width: 40vw;
  max-width: 850px;
  z-index: 0;
  transition: transform 0.3s ease-in-out;
}

.breathing {
  animation: breathe 5s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.008);
  }
}

button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #d69c2f;
  color: black;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.shop-item {
  margin: 15px 0;
}

.message {
  margin-top: 10px;
  color: #ffd700;
}

.exit {
  margin-top: 20px;
  background: #5c2c1d;
  color: white;
}
</style>
