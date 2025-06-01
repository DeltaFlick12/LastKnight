<template>
  <div class="bruxa-screen" :style="{ backgroundImage: `url(${bgImage})` }">
    <!-- <img src="@/assets/bjorn.png" alt="Bjorn o Ferreiro" class="bjorn-image" /> -->

    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button @click="nextDialog" :disabled="typing">Continuar</button>
    </div>

    <div v-if="showShop" class="shop-box">
      <p>Escolha sua poção:</p>
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
import bgImage from '@/assets/interior/bruxa-bg.png'
// import bjornVoice from '@/assets/bjorn-voz.mp3'

const router = useRouter()

const showDialog = ref(true)
const dialogIndex = ref(0)
const dialogLines = [
  'Ola jovem rapaz, sou margaret a bruxa do reino!',
  'Minhas poções são as melhores de toda albadia pode ter certeza.',
  'Porem escolha com cuidado, nunca se sabe oque uma bruxa pode fazer.',
  'Brincadeirinhaa, ou não.'
]
const displayedText = ref('')
const typing = ref(false)
const showShop = ref(false)
const message = ref('')

const gold = ref(150)
const ownedWeapons = ref([])

const weapons = [
  {
    name: 'Poção de Cura',
    price: 80,
    description: 'Cura 10 de vida.'
  },
  {
    name: 'Poção Azul misteriosa',
    price: 120,
    description: 'É azul.'
  },
  {
    name: 'Poção da morte',
    price: 999,
    description: 'Essa poção te mata.'
  }
]

// const audio = new Audio(bjornVoice)

const typeLine = async () => {
  typing.value = true
  displayedText.value = ''
  const line = dialogLines[dialogIndex.value]
  let index = 0

  try {
    audio.pause()
    audio.currentTime = 0
    await audio.play()
  } catch (e) {
    console.warn('Erro ao tocar voz da margaret:', e)
  }

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
    showDialog.value = false
    showShop.value = true
  }
}

const buyWeapon = (item) => {
  if (ownedWeapons.value.includes(item.name)) {
    message.value = 'Você esta no limite de poções.'
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
.bruxa-screen {
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
  background-color: rgba(0, 0, 0, 0.85);
  padding: 20px;
  border: 2px solid #d69c2f;
  border-radius: 10px;
  text-align: center;
  max-width: 600px;
  z-index: 1;
  margin-top: 630px;
}

.margaret-image {
  width: 250px;
  margin-bottom: -20px;
  z-index: 0;
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
