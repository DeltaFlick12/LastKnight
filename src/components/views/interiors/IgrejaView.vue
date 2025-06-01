<template>
  <div
    class="igreja-screen"
    @keydown="startMoving"
    @keyup="stopMoving"
    tabindex="0"
  >
    <!-- Botão de sair -->
    <button class="menu menu-button" @click="sairDaCena">Sair</button>

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
    </div>

    <!-- Caixa de diálogo -->
    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button @click="nextDialog" :disabled="typing">Continuar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import bgImage from '@/assets/interior/igreja-bg.png'
import padreSprite from '@/assets/Padre.png'  // Importação correta da imagem do padre

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

// Diálogo
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
  { x: 430, y: 890, width: 170, height: 50 },
]

// Verificação de colisão
const isColliding = (nextX, nextY) => {
  const charBox = {
    x: nextX,
    y: nextY,
    width: 80,
    height: 80
  }

  return collisionAreas.some(area =>
    charBox.x < area.x + area.width &&
    charBox.x + charBox.width > area.x &&
    charBox.y < area.y + area.height &&
    charBox.y + charBox.height > area.y
  )
}

// Digitação do texto do diálogo
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

// Limites de movimento
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

// Atualização do movimento com verificação de colisão
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

  currentSprite.value = moved
    ? sprites[`walk_${lastDirection.value}`]
    : sprites.walk_up

  animationFrameId = requestAnimationFrame(updateMovement)
}

// Controles do teclado
const startMoving = (event) => {
  if (!canMove.value) return
  switch (event.key.toLowerCase()) {
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

// Função do botão de sair
const sairDaCena = () => {
  window.location.href = '/level/albadia' // redireciona para a tela inicial
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
.igreja-screen {
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
  outline: none;
  font-family: 'Press Start 2P', cursive;
  color: white;
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
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.85);
  padding: 20px;
  border: 2px solid #ffffff;
  border-radius: 10px;
  text-align: center;
  max-width: 600px;
  z-index: 10;
}

.collision-box {
  position: absolute;
  background-color: rgba(255, 0, 0, 0.0); 
  z-index: 1;
}

/* BOTÕES */
.menu {
  display: grid;
  gap: 20px;
  justify-content: center;
  margin-top: 850px;
}

.menu-button {
  background-color: #e0a867;
  color: #5c2c1d;
  border: 4px solid #5c2c1d;
  padding:5px 40px ;
  margin-left: 100px;
  width: 200px;
  height: 50px;
  font-size: 30px;
  text-align: center;
  cursor: pointer;
  position: relative;
  image-rendering: pixelated;
  box-shadow: inset -6px -6px #d17844, inset 6px 6px #ffcb8e;
  font-weight: bold;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s;
}

.menu-button:hover {
  background-color: #f4b76a;
  color: #3e1e14;
  box-shadow: inset -6px -6px #c96a32, inset 6px 6px #ffd9a1;
}

.menu-button:active {
  transform: translateY(2px);
  box-shadow: inset -3px -3px #d17844, inset 3px 3px #ffcb8e;
}
</style>
