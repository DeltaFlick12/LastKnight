<template>
  <div
    class="igreja-screen"
    @keydown="startMoving"
    @keyup="stopMoving"
    tabindex="0"
  >
    <!-- Camada com imagem e zoom centralizado -->
    <div
      class="zoom-layer"
      :style="{
        backgroundImage: `url(${bgImage})`,
        transform: `translate(-50%, -50%) scale(${zoomLevel})`
      }"
    >
      <!-- Canvas para o personagem -->
      <canvas
        ref="characterCanvas"
        class="character"
        :style="{
          transform: `translate(${characterPosition.x}px, ${characterPosition.y}px)`,
          width: `${player.size}px`,
          height: `${player.size}px`
        }"
      ></canvas>

      <!-- NPC Padre -->
      <div
        class="npc padre"
        :style="{
          transform: `translate(${padrePosition.x}px, ${padrePosition.y}px)`,
          backgroundImage: `url(${padreSprite})`
        }"
      ></div>

      <!-- Visualização das colisões -->
      <div
        v-for="(area, i) in collisionAreas"
        :key="i"
        class="collision-box"
        :style="{
          transform: `translate(${area.x}px, ${area.y}px)`,
          width: `${area.width}px`,
          height: `${area.height}px`
        }"
      />

      <!-- Visualização das áreas interativas -->
      <div
        v-for="(area, i) in interactionAreas"
        :key="'interact-' + i"
        class="interaction-box"
        :style="{
          transform: `translate(${area.x}px, ${area.y}px)`,
          width: `${area.width}px`,
          height: `${area.height}px`
        }"
      />
    </div>

    <!-- Caixa de diálogo inicial -->
    <transition name="fade">
      <div v-if="showDialog" class="dialog-box dialog-style centered-dialog" key="dialog">
        <p>{{ displayedText }}</p>
        <button @click="nextDialog" :disabled="typing" class="dialog-button">Continuar</button>
      </div>
    </transition>

    <!-- Caixa de diálogo para sair da igreja -->
    <transition name="fade">
      <div v-if="showExitDialog && !showDialog" class="dialog-box dialog-style centered-dialog">
        <p>{{ exitDialogText }}</p>
      </div>
    </transition>

    <!-- Caixa de diálogo para interação com o padre -->
    <transition name="fade">
      <div v-if="showBlessingPrompt && !showDialog && !showShop" class="dialog-box dialog-style centered-dialog">
        <p>Para receber bênçãos do padre, aperte "E"</p>
      </div>
    </transition>

    <!-- Menu de compras -->
    <transition name="shop-fade">
      <div v-if="showShop" class="shop-box dialog-style" key="shop">
        <button class="dialog-button exit-button" @click="closeShop">Sair</button>
        <h3 class="shop-name">SANTUÁRIO DE ALBADIA</h3>
        <h4 class="shop-title">Escolha sua bênção:</h4>
        <div class="gold-display">
          <img :src="goldIcon" alt="Gold Icon" class="gold-icon" />
          : {{ gameState.player.gold }}
        </div>
        <div class="shop-content">
          <div class="shop-items-container">
            <div v-if="blessings.length === 0" class="shop-item no-items">
              Não há bênçãos disponíveis no momento.
            </div>
            <div
              v-for="item in blessings"
              :key="item.itemId"
              class="shop-item"
              @mouseover="hoverItemDescription(item)"
              @mouseleave="hideHoverDialog"
            >
              <div>
                <strong>{{ item.name }}</strong>
                <span>
                  <img :src="goldIcon" alt="Gold Icon" class="gold-icon small" />
                  Custo: {{ item.price }} Ouro
                </span>
              </div>
              <p>{{ item.description }}</p>
              <button @click="buyBlessing(item)" class="dialog-button buy-button">Comprar</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Diálogo da loja -->
    <transition name="fade">
      <div v-if="showShopDialog" class="dialog-box dialog-style shop-dialog" key="shopDialog">
        <p>{{ displayedText }}</p>
      </div>
    </transition>

    <!-- Diálogo de mensagem -->
    <transition name="fade">
      <div v-if="showMessageDialog" class="dialog-box dialog-style message-dialog" key="messageDialog">
        <p>{{ displayedText }}</p>
      </div>
    </transition>

    <!-- Diálogo de hover -->
    <transition name="fade">
      <div v-if="showHoverDialog" class="dialog-box dialog-style hover-dialog" key="hoverDialog">
        <p>{{ displayedText }}</p>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameState, ITEMS } from '@/stores/gamestate.js'
import bgImage from '@/assets/interior/igreja-bg.png'
import padreSprite from '@/assets/Padre.png'

// Configurações do jogador e sprite sheet
const playerSpriteSheet = new Image()
playerSpriteSheet.src = '/img/sprites/player/player_sprite.png'

const player = {
  size: 250,
  speed: 3
}

const frameWidth = 96
const frameHeight = 96
const animations = {
  idle: { row: 3, frames: [7, 1, 2, 3, 4, 5], frameInterval: 150 },
  walk_down: { row: 6, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 },
  walk_up: { row: 4, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 },
  walk_left: { row: 20.1, frames: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0], frameInterval: 70 },
  walk_right: { row: 5, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 }
}

const currentFrameIndex = ref(0)
const frameTimer = ref(0)
const playerDirection = ref('idle')

// Estado do personagem
const characterPosition = ref({ x: 0, y: 0 })
const zoomLevel = ref(0.95)
const moving = ref({ up: false, down: false, left: false, right: false })
const lastDirection = ref('up')

// Estado do padre
const padrePosition = ref({ x: 400, y: 120 })

// Estado do jogo
const gameState = useGameState()
const router = useRouter()

// Diálogos e loja
const showDialog = ref(true)
const showShop = ref(false)
const showShopDialog = ref(false)
const showMessageDialog = ref(false)
const showHoverDialog = ref(false)
const showBlessingPrompt = ref(false)
const showExitDialog = ref(false)
const dialogIndex = ref(0)
const displayedText = ref('')
const typing = ref(false)
const canMove = ref(false)
const exitDialogText = "Pressione 'E' para Sair da Igreja"
const hoverItemDescriptionText = ref('')
const message = ref('')
let typingInterval = null
let currentHoverItem = null

const dialogLines = ref([
  'Filho, bem-vindo à casa sagrada de Albadia.',
  'Aqui oferecemos bênçãos para proteger-te nas tuas batalhas.',
  'Cada bênção carrega consigo um poder divino e um preço justo.',
  'Escolha com fé...'
])

const shopDialogLines = ['Escolha uma bênção para sua jornada, filho!']

// Itens disponíveis (bênçãos)
const blessings = computed(() => {
  const blessingList = [
    {
      itemId: 'blessing_strength',
      name: 'Bênção da Força',
      price: 30,
      description: 'Aumenta sua força em combate.',
      icon: ITEMS['blessing_strength']?.icon || '/icons/blessing-strength.png',
      type: 'Bênção'
    },
    {
      itemId: 'blessing_protection',
      name: 'Bênção da Proteção',
      price: 50,
      description: 'Reduz o dano recebido.',
      icon: ITEMS['blessing_protection']?.icon || '/icons/blessing-protection.png',
      type: 'Bênção'
    },
    {
      itemId: 'blessing_speed',
      name: 'Bênção da Velocidade',
      price: 40,
      description: 'Aumenta sua velocidade de movimento.',
      icon: ITEMS['blessing_speed']?.icon || '/icons/blessing-speed.png',
      type: 'Bênção'
    }
  ]
  console.log('Bênçãos geradas:', blessingList) // Depuração
  return blessingList.filter(item => ITEMS[item.itemId] || true)
})

const goldIcon = computed(() => ITEMS.gold?.icon || '/icons/gold-icon.png')
const backpackIcon = computed(() => ITEMS.backpack?.icon || '/icons/bag-icon.png')

// Efeitos sonoros
const sounds = {
  dialogClick: new Audio('/sounds/click.wav'),
  coinClank: new Audio('/sounds/coin_clank.mp3'),
  typing: new Audio('/sounds/typing.mp3')
}
sounds.dialogClick.volume = 0.5
sounds.coinClank.volume = 0.5
sounds.typing.volume = 0.5

const playSound = (audio) => {
  if (!audio) return
  audio.currentTime = 0
  audio.play().catch(() => {})
}

// Configurações do canvas
const characterCanvas = ref(null)
let ctx = null

// Tamanho do fundo
const bgWidth = 1200
const bgHeight = 1024
let animationFrameId = null
let lastUpdateTime = 0

// Áreas de colisão
const collisionAreas = [
  { x: 0, y: 200, width: 1024, height: 50 },
  { x: 0, y: 950, width: 1024, height: 50 },
  { x: 1020, y: 200, width: 50, height: 1000 },
  { x: 820, y: 700, width: 130, height: 100 },
  { x: 430, y: 890, width: 170, height: 50 }
]

// Áreas interativas
const interactionAreas = [
  { x: 430, y: 850, width: 170, height: 80, action: () => router.push('/level/albadia') }
]

// Verificação de colisão
const isColliding = (nextX, nextY) => {
  const charBox = { x: nextX, y: nextY, width: player.size, height: player.size }
  return collisionAreas.some(
    area =>
      charBox.x < area.x + area.width &&
      charBox.x + charBox.width > area.x &&
      charBox.y < area.y + area.height &&
      charBox.y + charBox.height > area.y
  )
}

// Verifica se personagem está numa área interativa
const isInInteractionArea = () => {
  const charBox = { x: characterPosition.value.x, y: characterPosition.value.y, width: player.size, height: player.size }
  return interactionAreas.find(
    area =>
      charBox.x < area.x + area.width &&
      charBox.x + charBox.width > area.x &&
      charBox.y < area.y + area.height &&
      charBox.y + charBox.height > area.y
  )
}

// Verifica se personagem está perto do padre
const isNearPadre = () => {
  const charBox = { x: characterPosition.value.x, y: characterPosition.value.y, width: player.size, height: player.size }
  const padreBox = { x: padrePosition.value.x, y: padrePosition.value.y, width: 120, height: 120 }
  return (
    charBox.x < padreBox.x + padreBox.width + 30 &&
    charBox.x + charBox.width > padreBox.x - 30 &&
    charBox.y < padreBox.y + padreBox.height + 30 &&
    charBox.y + charBox.height > padreBox.y - 30
  )
}

// Digitação do texto
const typeLine = (text) => {
  return new Promise((resolve) => {
    if (typingInterval) clearInterval(typingInterval)
    displayedText.value = ''
    typing.value = true

    const line = text || dialogLines.value[dialogIndex.value] || hoverItemDescriptionText.value || shopDialogLines[0] || message.value
    let index = 0

    typingInterval = setInterval(() => {
      if (index < line.length) {
        displayedText.value += line[index++]
        if (index % 3 === 0) playSound(sounds.typing)
      } else {
        clearInterval(typingInterval)
        typingInterval = null
        typing.value = false
        resolve()
      }
    }, 40)
  })
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const resetState = () => {
  showDialog.value = true
  dialogIndex.value = 0
  showHoverDialog.value = false
  showShopDialog.value = false
  showMessageDialog.value = false
  showShop.value = false
  displayedText.value = ''
  typing.value = false
  hoverItemDescriptionText.value = ''
  message.value = ''
  if (typingInterval) {
    clearInterval(typingInterval)
    typingInterval = null
  }
  currentHoverItem = null
}

const nextDialog = async () => {
  if (typing.value) return
  playSound(sounds.dialogClick)
  if (dialogIndex.value < dialogLines.value.length - 1) {
    dialogIndex.value++
    await typeLine(dialogLines.value[dialogIndex.value])
  } else {
    showDialog.value = false
    canMove.value = true
  }
}

const hideHoverDialog = () => {
  showHoverDialog.value = false
  currentHoverItem = null
  if (typingInterval) {
    clearInterval(typingInterval)
    typingInterval = null
    typing.value = false
  }
}

const hideAllDialogs = () => {
  showHoverDialog.value = false
  showShopDialog.value = false
  showMessageDialog.value = false
  currentHoverItem = null
  if (typingInterval) {
    clearInterval(typingInterval)
    typingInterval = null
    typing.value = false
  }
}

const hoverItemDescription = async (item) => {
  if (!showShop.value) return
  if (currentHoverItem === item.itemId) return
  hideAllDialogs()
  currentHoverItem = item.itemId
  hoverItemDescriptionText.value = item.description
  showHoverDialog.value = true
  await typeLine(item.description)
}

const buyBlessing = async (item) => {
  hideAllDialogs()
  const existingItem = gameState.player.inventory.find((invItem) => invItem.itemId === item.itemId)
  if (existingItem) {
    message.value = `Você já possui ${item.name}.`
  } else if (gameState.player.gold >= item.price) {
    gameState.removeGold(item.price)
    gameState.addItemToInventory(item.itemId, 1)
    message.value = `Você comprou ${item.name}! Foi adicionado à sua mochila.`
    playSound(sounds.coinClank)
  } else {
    message.value = 'Você não tem ouro suficiente.'
  }
  showMessageDialog.value = true
  await typeLine(message.value)
  await delay(2000)
  hideAllDialogs()
  if (showShop.value) {
    showShopDialog.value = true
    await typeLine(shopDialogLines[0])
  }
}

const closeShop = () => {
  hideAllDialogs()
  showShop.value = false
  canMove.value = !showDialog.value
}

const getMovementBounds = () => {
  const bgRenderedWidth = bgWidth * zoomLevel.value
  const bgRenderedHeight = bgHeight * zoomLevel.value
  return {
    minX: 0,
    maxX: bgRenderedWidth - player.size,
    minY: 0,
    maxY: bgRenderedHeight - player.size
  }
}

const updateAnimation = (deltaSeconds) => {
  const anim = animations[playerDirection.value] || animations.idle
  const interval = anim.frameInterval || 70
  frameTimer.value += deltaSeconds * 1000
  if (frameTimer.value > interval) {
    frameTimer.value = 0
    currentFrameIndex.value++
    if (currentFrameIndex.value >= anim.frames.length) currentFrameIndex.value = 0
  }
}

const drawCharacter = () => {
  if (!ctx || !playerSpriteSheet.complete) return
  ctx.clearRect(0, 0, characterCanvas.value.width, characterCanvas.value.height)
  const anim = animations[playerDirection.value] || animations.idle
  const frame = anim.frames[currentFrameIndex.value]
  const sx = frame * frameWidth
  const sy = anim.row * frameHeight
  ctx.drawImage(
    playerSpriteSheet,
    sx, sy, frameWidth, frameHeight,
    0, 0, player.size, player.size
  )
}

const updateMovement = (timestamp) => {
  if (!canMove.value) {
    drawCharacter()
    animationFrameId = requestAnimationFrame(updateMovement)
    return
  }

  if (!lastUpdateTime) lastUpdateTime = timestamp
  const deltaSeconds = (timestamp - lastUpdateTime) / 1000
  lastUpdateTime = timestamp

  let moved = false
  const bounds = getMovementBounds()

  if (moving.value.up) {
    const nextY = characterPosition.value.y - player.speed
    if (nextY >= bounds.minY && !isColliding(characterPosition.value.x, nextY)) {
      characterPosition.value.y = nextY
      playerDirection.value = 'walk_up'
      lastDirection.value = 'up'
      moved = true
    }
  }
  if (moving.value.down) {
    const nextY = characterPosition.value.y + player.speed
    if (nextY <= bounds.maxY && !isColliding(characterPosition.value.x, nextY)) {
      characterPosition.value.y = nextY
      playerDirection.value = 'walk_down'
      lastDirection.value = 'down'
      moved = true
    }
  }
  if (moving.value.left) {
    const nextX = characterPosition.value.x - player.speed
    if (nextX >= bounds.minX && !isColliding(nextX, characterPosition.value.y)) {
      characterPosition.value.x = nextX
      playerDirection.value = 'walk_left'
      lastDirection.value = 'left'
      moved = true
    }
  }
  if (moving.value.right) {
    const nextX = characterPosition.value.x + player.speed
    if (nextX <= bounds.maxX && !isColliding(nextX, characterPosition.value.y)) {
      characterPosition.value.x = nextX
      playerDirection.value = 'walk_right'
      lastDirection.value = 'right'
      moved = true
    }
  }

  if (!moved) {
    playerDirection.value = 'idle'
  }

  updateAnimation(deltaSeconds)
  drawCharacter()

  const insideArea = isInInteractionArea()
  showExitDialog.value = !!insideArea

  showBlessingPrompt.value = isNearPadre() && !showShop.value

  animationFrameId = requestAnimationFrame(updateMovement)
}

const startMoving = (event) => {
  const key = event.key.toLowerCase()

  if (showShop.value) {
    if (key === 'escape') closeShop()
    return
  }

  if (!canMove.value) return

  if (key === 'e') {
    const area = isInInteractionArea()
    if (area) {
      area.action()
    } else if (isNearPadre()) {
      showShop.value = true
      canMove.value = false
    }
    return
  }

  switch (key) {
    case 'w': moving.value.up = true; break
    case 's': moving.value.down = true; break
    case 'a': moving.value.left = true; break
    case 'd': moving.value.right = true; break
  }
}

const stopMoving = (event) => {
  if (!canMove.value) return
  switch (event.key.toLowerCase()) {
    case 'w': moving.value.up = false; break
    case 's': moving.value.down = false; break
    case 'a': moving.value.left = false; break
    case 'd': moving.value.right = false; break
  }
}

onMounted(() => {
  console.log('ITEMS no onMounted:', ITEMS) // Depuração
  resetState()
  typeLine()
  const screen = document.querySelector('.igreja-screen')
  screen.focus()
  screen.addEventListener('click', () => screen.focus())

  const bounds = getMovementBounds()
  characterPosition.value.x = (bounds.minX + bounds.maxX) / 2
  characterPosition.value.y = (bounds.minY + bounds.maxY) / 2

  if (characterCanvas.value) {
    ctx = characterCanvas.value.getContext('2d')
    characterCanvas.value.width = player.size
    characterCanvas.value.height = player.size
  }

  playerSpriteSheet.onload = () => {
    animationFrameId = requestAnimationFrame(updateMovement)
  }
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (typingInterval) {
    clearInterval(typingInterval)
    typingInterval = null
  }
})

watch(() => showShop, (newVal) => {
  if (newVal) {
    hideAllDialogs()
    showShopDialog.value = true
    typeLine(shopDialogLines[0])
  }
})
</script>

<style scoped>
.fade-in {
  animation: fadeIn 1.5s ease-in;
}

@keyframes fadeIn {
  0% { opacity: 0; transform: scale(1); }
  100% { opacity: 1; transform: scale(1); }
}

.igreja-screen {
  position: relative;
  height: 100vh;
  width: 100vw;
  color: #f0e0c0;
  font-family: 'Press Start 2P', cursive;
  overflow: hidden;
}

.zoom-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1024px;
  height: 1024px;
  background-repeat: no-repeat;
  background-position: center;
  transform-origin: center center;
  z-index: 0;
}

.character {
  position: absolute;
  z-index: 3;
}

.npc.padre {
  position: absolute;
  width: 120px;
  height: 120px;
  background-size: contain;
  background-repeat: no-repeat;
  z-index: 2;
}

.dialog-style {
  position: fixed;
  background-color: rgba(40, 25, 15, 0.9);
  padding: 25px 35px;
  border: 4px solid #6c552a;
  border-radius: 8px;
  text-align: center;
  width: 90vw;
  max-width: 750px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  color: #f0e0c0;
  font-size: 15px;
  line-height: 1.7;
  font-family: 'Press Start 2P', cursive;
}

.centered-dialog {
  bottom: 5vh;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.shop-dialog {
  top: 15vh;
  left: 1%;
  transform: translateX(0);
  z-index: 5;
}

.hover-dialog {
  top: 15vh;
  left: 1%;
  transform: translateX(0);
  z-index: 15;
}

.message-dialog {
  top: 15vh;
  left: 1%;
  transform: translateX(0);
  z-index: 15;
}

.shop-box {
  top: 10vh;
  bottom: 5vh;
  left: 65%;
  transform: translateX(-35%);
  z-index: 2;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-style p {
  margin: 0 0 20px 0;
}

.dialog-button {
  display: block;
  margin-left: auto;
  margin-right: 0;
  margin-top: 10px;
  padding: 10px 20px;
  background-color: #e0a867;
  color: #5c2c1d;
  border: 4px solid #5c2c1d;
  border-radius: 6px;
  font-family: 'Press Start 2P', cursive;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s;
  box-shadow: inset -6px -6px #d17844, inset 6px 6px #ffcb8e;
  text-transform: uppercase;
}

.dialog-button:hover:not(:disabled) {
  background-color: #f4b76a;
  color: #3e1e14;
  box-shadow: inset -6px -6px #c96a32, inset 6px 6px #ffd9a1;
}

.dialog-button:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: inset -3px -3px #d17844, inset 3px 3px #ffcb8e;
}

.dialog-button:disabled {
  opacity: 0.6;
  cursor: default;
}

.shop-name {
  text-align: center;
  color: #ffe8b2;
  font-size: 18px;
  margin-bottom: 5px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
}

.shop-title {
  text-align: center;
  color: #ffe8b2;
  margin-top: 0;
  margin-bottom: 10px;
  animation: pulseGlow 3s ease-in-out infinite;
}

@keyframes pulseGlow {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.gold-display {
  text-align: right;
  font-size: 13px;
  margin-bottom: 20px;
  color: #f0b860;
  text-shadow: 1px 1px 0 #000;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.gold-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  image-rendering: pixelated;
}

.gold-icon.small {
  width: 16px;
  height: 16px;
  margin-right: 4px;
}

.shop-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
}

.shop-items-container {
  flex: 1;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.shop-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto;
  gap: 5px 15px;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #6c552a;
  background-color: rgba(40, 25, 15, 0.9);
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.shop-item:hover {
  background-color: rgba(50, 35, 20, 0.95);
}

.shop-item.no-items {
  text-align: center;
  color: #a09362;
  font-style: italic;
}

.shop-item img.blessing-icon {
  grid-row: 1 / 3;
  width: 50px;
  height: 50px;
  object-fit: contain;
  image-rendering: pixelated;
}

.shop-item div {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shop-item div strong {
  font-size: 1.1em;
  color: #f0e0c0;
  text-shadow: 1px 1px 0 #000;
}

.shop-item div span {
  font-size: 0.9em;
  color: #f0b860;
  text-shadow: 1px 1px 0 #000;
  display: flex;
  align-items: center;
}

.shop-item p {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  font-size: 0.9em;
  color: #c0b090;
  margin: 0;
}

.shop-item button.buy-button {
  grid-column: 3 / 4;
  grid-row: 1 / 3;
  margin: 0;
  align-self: center;
}

.exit-button {
  position: absolute;
  top: 15px;
  right: 15px;
  margin: 0;
  background-color: #5c2c1d;
  color: #f0e0c0;
  border-color: #3e1e14;
}

.exit-button:hover:not(:disabled) {
  background-color: #704030;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.shop-fade-enter-active, .shop-fade-leave-active {
  transition: opacity 1s ease, transform 1s ease;
}

.shop-fade-enter-from, .shop-fade-leave-to {
  opacity: 0;
  transform: translateX(50px);
}

.collision-box {
  position: absolute;
  background-color: rgba(255, 0, 0, 0);
  z-index: 1;
}

.interaction-box {
  position: absolute;
  background-color: rgba(0, 255, 0, 0);
  z-index: 1;
}
</style>