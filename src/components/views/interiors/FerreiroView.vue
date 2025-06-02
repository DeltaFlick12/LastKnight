<template>
  <div
    class="ferreiro-screen"
    :style="{ backgroundImage: `url(${bgImage})` }"
  >
    <img
      :src="bjornImage"
      alt="Bjorn o Ferreiro"
      class="bjorn-image"
      :class="{ breathing: !typing }"
    />

    <transition name="fade">
      <div v-if="showDialog" class="dialog-box" key="dialog">
        <p>{{ displayedText }}</p>
        <button @click="nextDialog" :disabled="typing">Continuar</button>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showShop" class="shop-box" key="shop">
        <p>Escolha sua arma:</p>
        <div class="shop-item" v-for="item in weapons" :key="item.itemId">
          <img :src="item.icon" :alt="item.name" class="weapon-icon" />
          <strong>{{ item.name }} - {{ item.price }} ouro</strong>
          <p>{{ item.description }}</p>
          <button @click="buyWeapon(item)">Comprar</button>
        </div>
        <div class="backpack">
          <h3>Sua Mochila</h3>
          <p v-if="gameState.player.inventory.length === 0">Sua mochila está vazia.</p>
          <div
            v-else
            class="backpack-item"
            v-for="invItem in gameState.player.inventory"
            :key="invItem.itemId"
          >
            <strong>{{ ITEMS[invItem.itemId].name }}</strong> -
            {{ ITEMS[invItem.itemId].description }}
          </div>
        </div>
        <p v-if="message" class="message">{{ message }}</p>
        <button class="exit" @click="exitShop">Sair</button>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showFarewell" class="dialog-box farewell" key="farewell">
        <p>Volte sempre, guerreiro! Que suas batalhas sejam gloriosas!</p>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameState, actions, ITEMS } from '@/stores/game.js'
import bgImage from '@/assets/interior/ferreiro-bg.gif'
import bjornParado from '/public/img/sprites/bjorn/bjorn.png'
import bjornFalando from '/public/img/sprites/bjorn/bjorn-falando.gif'

const router = useRouter()

const showDialog = ref(true)
const dialogIndex = ref(0)

const firstVisitLines = [
  'Ah, um novo guerreiro! Eu sou Bjorn, o ferreiro mais rúbido do reino!',
  'Minhas armas são forjadas com fogo de dragão e suor de titãs.',
  'Escolha com sabedoria, jovem... uma boa arma faz toda a diferença.',
  'Vamos aos negócios!'
]

const repeatVisitLines = [
  'Bem vindo de volta à minha forja, guerreiro! Espero que esteja pronto para reforjar seu arsenal.',
]

const dialogLines = ref([])

const displayedText = ref('')
const typing = ref(false)
const showShop = ref(false)
const message = ref('')
const showFarewell = ref(false)

const bjornImage = ref(bjornParado)

const weapons = [
  {
    itemId: 'sword_iron',
    name: ITEMS.sword_iron.name,
    price: ITEMS.sword_iron.price,
    description: ITEMS.sword_iron.description,
    stats: ITEMS.sword_iron.stats,
    icon: '/img/weapons/sword_iron.png',
  },
  {
    itemId: 'axe_iron',
    name: ITEMS.axe_iron.name,
    price: 120,
    description: ITEMS.axe_iron.description,
    stats: ITEMS.axe_iron.stats,
    icon: '/img/weapons/axe_iron.png',
  },
  {
    itemId: 'sword_mythril',
    name: 'Lança Rúnica',
    price: 200,
    description: 'Aumenta o dano em +20. Forjada com magia anã.',
    stats: { attack: 20 },
    icon: '/img/weapons/sword_mythril.png',
  }
]

const typeLine = async () => {
  typing.value = true
  bjornImage.value = bjornFalando
  displayedText.value = ''
  const line = dialogLines.value[dialogIndex.value]
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
  if (dialogIndex.value < dialogLines.value.length - 1) {
    dialogIndex.value++
    typeLine()
  } else {
    showDialog.value = false
    showShop.value = true
    localStorage.setItem('visitedBlacksmith', 'true')
  }
}

const buyWeapon = (item) => {
  const existingItem = gameState.player.inventory.find(
    (invItem) => invItem.itemId === item.itemId
  )
  if (existingItem) {
    message.value = `Você já possui ${item.name}.`
    return
  }

  if (gameState.player.gold >= item.price) {
    gameState.player.gold -= item.price
    actions.addItemToInventory(item.itemId, 1)
    message.value = `Você comprou ${item.name}! Foi adicionado à sua mochila.`
  } else {
    message.value = 'Você não tem ouro suficiente.'
  }

  setTimeout(() => (message.value = ''), 3000)
}

const exitShop = () => {
  // Faz fade out da loja
  showShop.value = false

  // Mostra mensagem de despedida
  showFarewell.value = true

  // Depois de 3 segundos, redireciona
  setTimeout(() => {
    router.push('/level/albadia')
  }, 3000)
}

onMounted(() => {
  const visited = localStorage.getItem('visitedBlacksmith')

  if (visited) {
    dialogLines.value = repeatVisitLines
    dialogIndex.value = 0
    typeLine()
  } else {
    dialogLines.value = firstVisitLines
    dialogIndex.value = 0
    typeLine()
  }
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
  0%,
  100% {
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

.backpack {
  margin-top: 20px;
  border-top: 1px solid #d69c2f;
  padding-top: 10px;
}

.backpack-item {
  margin: 10px 0;
  text-align: left;
}

.message {
  margin-top: 10px;
  color: #ffd700;
}

.weapon-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 5px;
}

.exit {
  margin-top: 20px;
  background: #5c2c1d;
  color: white;
}

/* Transitions fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.farewell {
  position: fixed;
  bottom: 0.5vh;
  left: 60%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.9);
  padding: 2rem;
  border: 2px solid #d69c2f;
  border-radius: 10px;
  width: 80vw;
  max-width: 600px;
  text-align: center;
  font-weight: bold;
  font-size: 18px;
  color: #ffffff;
  z-index: 10;
}
</style>
