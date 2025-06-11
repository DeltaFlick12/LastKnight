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
      <!-- NPC Padre -->
      <div
        class="npc padre"
        :style="{
          transform: `translate(${padrePosition.x}px, ${padrePosition.y}px)`,
          backgroundImage: `url(${padreSprite})`
        }"
      ></div>

      <!-- Personagem do jogador -->
      <div
        class="character"
        :style="{
          transform: `translate(${characterPosition.x}px, ${characterPosition.y}px)`,
          backgroundImage: `url(${currentSprite})`,
          backgroundSize: 'cover',
          width: '80px',
          height: '80px'
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

    <!-- Caixa de diálogo do diálogo inicial -->
    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button @click="nextDialog" :disabled="typing">Continuar</button>
    </div>

    <!-- Caixa de diálogo para sair da igreja -->
    <div v-if="showExitDialog && !showDialog" class="dialog-box">
      <p>{{ exitDialogText }}</p>
    </div>

    <!-- NEW: Caixa de diálogo para a mensagem de bênção -->
    <div v-if="showBlessingPrompt && !showDialog && !showBlessingMenu" class="dialog-box">
      <p>Para receber a bênção do padre aperte "E"</p>
    </div>

    <!-- Menu de bênçãos aparece quando perto do padre -->
    <div v-if="showBlessingMenu" class="blessing-menu dialog-box">
      <h3>Bênçãos Disponíveis</h3>
      <p>Ouro: {{ gold }}</p>
      <ul>
        <li v-for="(blessing, index) in blessingsAvailable" :key="index">
          <button
            @click="buyBlessing(blessing)"
            :disabled="gold < blessing.cost || blessings.includes(blessing.name)"
          >
            {{ blessing.name }} - Custa {{ blessing.cost }} ouro
          </button>
          <span v-if="blessings.includes(blessing.name)"> (Comprado) </span>
        </li>
      </ul>
      <button @click="closeBlessingMenu">Fechar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import bgImage from '@/assets/interior/igreja-bg.png'
import padreSprite from '@/assets/Padre.png'

// Sprites
const sprites = {
  idle: '/img/sprites/player/player_idle.png',
  walk_up: '/img/sprites/player/player_walk_up.png',
  walk_down: '/img/sprites/player/player_walk_down.png',
  walk_left: '/img/sprites/player/player_walk_left.png',
  walk_right: '/img/sprites/player/player_walk_right.png'
}

// Estado do personagem
const currentSprite = ref(sprites.idle)
const characterPosition = ref({ x: 0, y: 0 })
const zoomLevel = ref(0.95)
const moving = ref({ up: false, down: false, left: false, right: false })
const lastDirection = ref('up')

// Estado do padre
const padrePosition = ref({ x: 400, y: 120 })

// Estado do jogador (ouro e bênçãos)
const gold = ref(100)
const blessings = ref([])

// Definição das bênçãos disponíveis
const blessingsAvailable = [
  { name: 'Bênção da Força', cost: 30 },
  { name: 'Bênção da Proteção', cost: 50 },
  { name: 'Bênção da Velocidade', cost: 40 }
]

// Controla a exibição do menu de bênçãos e da mensagem
const showBlessingMenu = ref(false)
const showBlessingPrompt = ref(false) // NEW: Estado para a mensagem de bênção

// Diálogo inicial
const showDialog = ref(true)
const dialogIndex = ref(0)
const dialogLines = [
  'Filho, bem-vindo à casa sagrada de Albadia.',
  'Aqui oferecemos bênçãos para proteger-te nas tuas batalhas.',
  'Cada bênção carrega consigo um poder divino e um preço justo.',
  'Escolha com fé...'
]
const displayedText = ref('')
const typing = ref(false)
const canMove = ref(false)

// Caixa diálogo para saída da igreja
const showExitDialog = ref(false)
const exitDialogText = "Pressione 'E' para Sair da Igreja"

// Tamanho do fundo
const bgWidth = 1200
const bgHeight = 1024
let animationFrameId = null

// Áreas de colisão
const collisionAreas = [
  { x: 0, y: 200, width: 1024, height: 50 },
  { x: 0, y: 950, width: 1024, height: 50 },
  { x: 1020, y: 200, width: 50, height: 1000 },
  { x: 820, y: 700, width: 130, height: 100 },
  { x: 430, y: 890, width: 170, height: 50 }
]

// Áreas interativas para "entrar" em lugares (área verde)
const interactionAreas = [
  { x: 430, y: 850, width: 170, height: 80, action: () => (window.location.href = '/level/albadia') }
]

// Verificação de colisão
const isColliding = (nextX, nextY) => {
  const charBox = { x: nextX, y: nextY, width: 80, height: 80 }
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
  const charBox = { x: characterPosition.value.x, y: characterPosition.value.y, width: 80, height: 80 }
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
  const charBox = { x: characterPosition.value.x, y: characterPosition.value.y, width: 80, height: 80 }
  const padreBox = { x: padrePosition.value.x, y: padrePosition.value.y, width: 120, height: 120 }
  return (
    charBox.x < padreBox.x + padreBox.width + 30 &&
    charBox.x + charBox.width > padreBox.x - 30 &&
    charBox.y < padreBox.y + padreBox.height + 30 &&
    charBox.y + charBox.height > padreBox.y - 30
  )
}

// Digitação do texto do diálogo inicial
const typeLine = () => {
  typing.value = true
  displayedText.value = ''
  const line = dialogLines[dialogIndex.value]
  let index = 0
  const interval = setInterval(() => {
    if (index < line.length) {
      displayedText.value += line[index++]
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
    canMove.value = true
  }
}

const getMovementBounds = () => {
  const screen = document.querySelector('.igreja-screen')
  const rect = screen.getBoundingClientRect()
  const bgRenderedWidth = bgWidth * zoomLevel.value
  const bgRenderedHeight = bgHeight * zoomLevel.value

  return {
    minX: 0,
    maxX: bgRenderedWidth - 80,
    minY: 0,
    maxY: bgRenderedHeight - 80
  }
}

// Atualização do movimento
const updateMovement = () => {
  if (!canMove.value) {
    animationFrameId = requestAnimationFrame(updateMovement)
    return
  }

  const step = 3
  let moved = false
  const bounds = getMovementBounds()

  if (moving.value.up) {
    const nextY = characterPosition.value.y - step
    if (nextY >= bounds.minY && !isColliding(characterPosition.value.x, nextY)) {
      characterPosition.value.y = nextY
      lastDirection.value = 'up'
      moved = true
    }
  }
  if (moving.value.down) {
    const nextY = characterPosition.value.y + step
    if (nextY <= bounds.maxY && !isColliding(characterPosition.value.x, nextY)) {
      characterPosition.value.y = nextY
      lastDirection.value = 'down'
      moved = true
    }
  }
  if (moving.value.left) {
    const nextX = characterPosition.value.x - step
    if (nextX >= bounds.minX && !isColliding(nextX, characterPosition.value.y)) {
      characterPosition.value.x = nextX
      lastDirection.value = 'left'
      moved = true
    }
  }
  if (moving.value.right) {
    const nextX = characterPosition.value.x + step
    if (nextX <= bounds.maxX && !isColliding(nextX, characterPosition.value.y)) {
      characterPosition.value.x = nextX
      lastDirection.value = 'right'
      moved = true
    }
  }

  currentSprite.value = moved ? sprites[`walk_${lastDirection.value}`] : sprites.idle

  // Verifica se personagem está dentro da área verde
  const insideArea = isInInteractionArea()
  showExitDialog.value = !!insideArea

  // NEW: Atualiza a visibilidade da mensagem de bênção
  showBlessingPrompt.value = isNearPadre() && !showBlessingMenu.value

  animationFrameId = requestAnimationFrame(updateMovement)
}

// Controles do teclado
const startMoving = (event) => {
  const key = event.key.toLowerCase()

  if (showBlessingMenu.value) {
    if (key === 'escape') closeBlessingMenu()
    return
  }

  if (!canMove.value) return

  if (key === 'e') {
    const area = isInInteractionArea()
    if (area) {
      area.action()
    } else if (isNearPadre()) {
      showBlessingMenu.value = true
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

// Comprar bênçãos
const buyBlessing = (blessing) => {
  if (gold.value >= blessing.cost && !blessings.value.includes(blessing.name)) {
    gold.value -= blessing.cost
    blessings.value.push(blessing.name)
    alert(`Você comprou a ${blessing.name}!`)
  }
}

// Fechar menu e liberar movimento
const closeBlessingMenu = () => {
  showBlessingMenu.value = false
  canMove.value = !showDialog.value
}

onMounted(() => {
  typeLine()
  const screen = document.querySelector('.igreja-screen')
  screen.focus()
  screen.addEventListener('click', () => screen.focus())

  const bounds = getMovementBounds()
  characterPosition.value.x = (bounds.minX + bounds.maxX) / 2
  characterPosition.value.y = (bounds.minY + bounds.maxY) / 2

  animationFrameId = requestAnimationFrame(updateMovement)
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
  transition: transform 0.05s linear;
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

.dialog-box {
  position: fixed;
  background-color: rgba(40, 25, 15, 0.9);
  padding: 25px 35px;
  border: 4px solid;
  border-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAALElEQVQoU2NkIAIwEqGGAa5IU1OTEZkPM+jfv3+MyHxkNlZFMINwKcJpEgDlTRcFFzrw5QAAAABJRU5ErkJggg==') 3 repeat;
  border-radius: 8px;
  text-align: center;
  width: 90vw;
  max-width: 750px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  color: #f0e0c0;
  font-size: 15px;
  line-height: 1.7;
  bottom: 5vh;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  font-family: 'Press Start 2P', cursive;
  transition: background-color 0.2s ease;
  user-select: none;
}

.dialog-box:hover {
  background-color: rgba(50, 35, 20, 0.95);
}

.blessing-menu {
  position: fixed;
  top: 15vh;
  left: 1%;
  transform: translateX(0);
  width: 90vw;
  max-width: 700px;
  max-height: 420px;
  overflow-y: auto;
  background-color: rgba(40, 25, 15, 0.9);
  padding: 20px 30px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  color: #f0e0c0;
  font-size: 15px;
  line-height: 1.6;
  font-family: 'Press Start 2P', cursive;
  border: 2px solid #6c552a;
  text-align: center;
  user-select: none;
  transition: box-shadow 0.3s ease;
  z-index: 20;
}

.blessing-menu:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.8);
}

.blessing-menu h3 {
  margin-bottom: 18px;
  font-size: 1.4rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 2px dashed #d7b85b;
  padding-bottom: 8px;
  color: #ffe8b2;
}

.blessing-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.blessing-menu li {
  margin-bottom: 15px;
  border-bottom: 1px dotted #c2a65c;
  padding-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #f0e0c0;
  text-shadow: 1px 1px 0 #000;
}

.blessing-menu button {
  cursor: pointer;
  background-color: #e0a867;
  color: #5c2c1d;
  border: 4px solid #5c2c1d;
  padding: 10px 20px;
  border-radius: 6px;
  font-family: 'Press Start 2P', cursive;
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  box-shadow: inset -6px -6px #d17844, inset 6px 6px #ffcb8e;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s;
  text-shadow: 1px 1px 0 #fff3cd;
}

.blessing-menu button:hover:not(:disabled) {
  background-color: #f4b76a;
  color: #3e1e14;
  box-shadow: inset -6px -6px #c96a32, inset 6px 6px #ffd9a1;
  transform: scale(1.05);
}

.blessing-menu button:disabled {
  opacity: 0.6;
  cursor: default;
  background-color: #4a3d19;
  border-color: #3a2e11;
  color: #a09362;
  box-shadow: none;
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

/* Manter invisível mas mantendo estrutura para debug */
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