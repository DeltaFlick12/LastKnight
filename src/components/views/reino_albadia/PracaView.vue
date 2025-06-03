<template>
  <div class="game-view">
    <canvas ref="canvas" class="game-canvas"></canvas>

    <HUD/>

    <!-- Prompt de entrada -->
    <div v-if="showEnterPrompt" class="enter-prompt">
      Pressione <span class="key">E</span> para entrar em {{ structureName }}
    </div>

    <!-- Botão do Mapa -->
    <button class="map-button" @click="handleMapClick">
      <img src="/icons/map-icon.png" alt="Mapa" class="button-icon" />
    </button>

    <!-- Botão da Mochila -->
    <button class="bag-button" @click="toggleBag">
      <img src="/icons/bag-icon.png" alt="Mochila" class="button-icon" />
    </button>

    <!-- Mochila -->
    <Inventory 
      v-if="bagOpen"
      :potions="potions"
      :equipped-weapon="equippedWeapon"
      @use-potion="usePotion"
      @equip-weapon="equipWeapon"
      @close="toggleBag"
    />

    <!-- Mostrador de Ouro -->
    <div class="gold-display">
      <img src="/icons/gold-icon.png" alt="Ouro" class="gold-icon" />
      <span>{{ gold }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Inventory from '@/components/Inventory.vue'
import HUD from '@/components/HUD.vue'

const router = useRouter()

// Estados principais
const health = ref(100)
const stamina = ref(100)
const gold = ref(150)
const potions = ref(3)
const currentArea = ref('Reino de Albadia')
const showEnterPrompt = ref(false)
const structureName = ref('')

const bagOpen = ref(false)
const toggleBag = () => (bagOpen.value = !bagOpen.value)

const equippedWeapon = ref('Espada de Treinamento')
const equipWeapon = (name) => (equippedWeapon.value = name)

const usePotion = () => {
  if (potions.value > 0) {
    health.value = Math.min(100, health.value + 30)
    potions.value--
  }
}

const handleMapClick = () => {
  const tutorialDone = localStorage.getItem('tutorialCompleted')
  if (!tutorialDone) {
    localStorage.setItem('tutorialCompleted', 'true')
    router.push('/tutorial')
  } else {
    router.push('/map')
  }
}

// Canvas + mapa
const canvas = ref(null)
let ctx
const player = {
  x: 830 + 128 / 2, // centro do player
  y: 1600 + 128 / 2,
  size: 128,
  speed: 6,
  direction: 'idle'
}
const keys = { w: false, a: false, s: false, d: false }
const world = { width: 3000, height: 2000 }
const background = new Image()
const foreground = new Image()

const playerSprites = {
  idle: new Image(),
  walk_down: new Image(),
  walk_up: new Image(),
  walk_left: new Image(),
  walk_right: new Image()
}
let allImagesLoaded = false
let imagesLoadedCount = 0
const totalImagesToLoad = 2 + Object.keys(playerSprites).length

function imageLoadedCallback() {
  imagesLoadedCount++
  if (imagesLoadedCount >= totalImagesToLoad) {
    allImagesLoaded = true
    gameLoop()
  }
}

function loadImage(img, src) {
  img.onload = imageLoadedCallback
  img.onerror = () => console.error(`Erro ao carregar imagem: ${src}`)
  img.src = src
}

const obstacles = [
  { x: 480, y: 380, width: 480, height: 180, name: 'Ferreiro', route: '/interior/ferreiro' },
  { x: 1310, y: 820, width: 350, height: 150, name: 'Loja de Poções', route: '/interior/bruxa' },
  { x: 2080, y: 590, width: 330, height: 140, name: 'Igreja', route: '/interior/igreja' },
  { x: 1165, y: 1300, width: 290, height: 20, name: 'Fonte' },
  { x: 1155, y: 1320, width: 315, height: 25 },
  { x: 1145, y: 1345, width: 335, height: 120 },
  { x: 1165, y: 1465, width: 290, height: 20 },
  { x: 400, y: 1545, width: 310, height: 20 },
  { x: 380, y: 1545, width: 20, height: 320 },
  { x: 400, y: 1810, width: 310, height: 55 },
]

const minimapCanvas = ref(null)
let minimapCtx = null
const minimapScale = 0.15 // escala do minimapa (15% do mundo)
const minimapPlayerSize = 6 // tamanho do ponto do jogador no minimapa

onMounted(() => {
  if (!canvas.value) {
    console.error("Elemento Canvas não encontrado!")
    return
  }
  ctx = canvas.value.getContext('2d')
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  loadImage(background, '/public/img/albadia/albadia-bg.png')
  loadImage(foreground, '/public/img/albadia/albadiaDetalhes.png')

  loadImage(playerSprites.idle, '/img/sprites/player/player_idle.png')
  loadImage(playerSprites.walk_down, '/img/sprites/player/player_walk_down.png')
  loadImage(playerSprites.walk_up, '/img/sprites/player/player_walk_up.png')
  loadImage(playerSprites.walk_left, '/img/sprites/player/player_walk_left.png')
  loadImage(playerSprites.walk_right, '/img/sprites/player/player_walk_right.png')

  nextTick(() => {
    if (minimapCanvas.value) {
      minimapCtx = minimapCanvas.value.getContext('2d')
      resizeMinimap()
      window.addEventListener('resize', resizeMinimap)
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('resize', resizeMinimap)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})

function resizeCanvas() {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
}

function resizeMinimap() {
  if (!minimapCanvas.value) return
  minimapCanvas.value.width = world.width * minimapScale
  minimapCanvas.value.height = world.height * minimapScale
}

function onKeyDown(e) {
  const k = e.key.toLowerCase()
  if (keys.hasOwnProperty(k)) keys[k] = true

  if (k === 'e') {
    const current = getPlayerNearbyStructure()
    if (current?.route) router.push(current.route)
  }
}

function onKeyUp(e) {
  const k = e.key.toLowerCase()
  if (keys.hasOwnProperty(k)) keys[k] = false
}

let animationFrameId = null

function gameLoop() {
  if (!allImagesLoaded) {
    animationFrameId = requestAnimationFrame(gameLoop)
    return
  }
  update()
  draw()
  drawMinimap()
  animationFrameId = requestAnimationFrame(gameLoop)
}

function update() {
  const { w, a, s, d } = keys
  let moved = false
  let dx = 0
  let dy = 0

  if (w) {
    dy -= player.speed
    player.direction = 'walk_up'
    moved = true
  }
  if (s) {
    dy += player.speed
    player.direction = 'walk_down'
    moved = true
  }
  if (a) {
    dx -= player.speed
    player.direction = 'walk_left'
    moved = true
  }
  if (d) {
    dx += player.speed
    player.direction = 'walk_right'
    moved = true
  }

  if (moved) {
    move(dx, dy)
  } else {
    player.direction = 'idle'
  }

  const nearStructure = getPlayerNearbyStructure()
  showEnterPrompt.value = !!nearStructure?.route
  structureName.value = nearStructure?.name || ''
}

function move(dx, dy) {
  // Tentativa de mover no eixo X
  let nextX = player.x + dx
  let playerBoxX = {
    x: nextX - player.size / 2,
    y: player.y - player.size / 2,
    width: player.size,
    height: player.size
  }
  let collidedX = obstacles.some(block => (
    playerBoxX.x < block.x + block.width &&
    playerBoxX.x + playerBoxX.width > block.x &&
    playerBoxX.y < block.y + block.height &&
    playerBoxX.y + playerBoxX.height > block.y
  ))

  if (!collidedX) {
    player.x = Math.max(player.size / 2, Math.min(world.width - player.size / 2, nextX))
  }

  // Tentativa de mover no eixo Y
  let nextY = player.y + dy
  let playerBoxY = {
    x: player.x - player.size / 2,
    y: nextY - player.size / 2,
    width: player.size,
    height: player.size
  }
  let collidedY = obstacles.some(block => (
    playerBoxY.x < block.x + block.width &&
    playerBoxY.x + playerBoxY.width > block.x &&
    playerBoxY.y < block.y + block.height &&
    playerBoxY.y + playerBoxY.height > block.y
  ))

  if (!collidedY) {
    player.y = Math.max(player.size / 2, Math.min(world.height - player.size / 2, nextY))
  }

  // Atualiza área atual (se está em algum obstáculo com nome)
  const collidedBlock = obstacles.find(block => (
    player.x - player.size/2 < block.x + block.width &&
    player.x + player.size/2 > block.x &&
    player.y - player.size/2 < block.y + block.height &&
    player.y + player.size/2 > block.y
  ))
  currentArea.value = collidedBlock?.name || 'Reino de Albadia'
}

function getPlayerNearbyStructure() {
  return obstacles.find((b) => {
    if (!b.route) return false
    const buffer = 20
    const playerHitbox = {
      x: player.x - player.size / 2,
      y: player.y - player.size / 2,
      width: player.size,
      height: player.size
    }
    const structureHitbox = {
      x: b.x - buffer,
      y: b.y - buffer,
      width: b.width + 2 * buffer,
      height: b.height + 2 * buffer
    }

    return (
      playerHitbox.x < structureHitbox.x + structureHitbox.width &&
      playerHitbox.x + playerHitbox.width > structureHitbox.x &&
      playerHitbox.y < structureHitbox.y + structureHitbox.height &&
      playerHitbox.y + playerHitbox.height > structureHitbox.y
    )
  })
}

function getCamera() {
  if (!canvas.value) return { x: 0, y: 0 }
  const cw = canvas.value.width
  const ch = canvas.value.height
  return {
    x: Math.max(0, Math.min(player.x - cw / 2, world.width - cw)),
    y: Math.max(0, Math.min(player.y - ch / 2, world.height - ch))
  }
}

function draw() {
  if (!ctx || !canvas.value || !allImagesLoaded) return

  const cam = getCamera()
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  if (background.complete) {
    ctx.drawImage(background, cam.x, cam.y, canvas.value.width, canvas.value.height, 0, 0, canvas.value.width, canvas.value.height)
  }

  let currentSprite = playerSprites[player.direction] || playerSprites.idle

  if (currentSprite && currentSprite.complete) {
    // sombra do personagem
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
    ctx.shadowBlur = 15
    ctx.shadowOffsetX = 5
    ctx.shadowOffsetY = 10

    ctx.drawImage(
      currentSprite,
      player.x - cam.x - player.size / 2,
      player.y - cam.y - player.size / 2,
      player.size,
      player.size
    )

    // resetar sombra para não afetar outros desenhos
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

  } else if (playerSprites.idle && playerSprites.idle.complete) {
    ctx.drawImage(
      playerSprites.idle,
      player.x - cam.x - player.size / 2,
      player.y - cam.y - player.size / 2,
      player.size,
      player.size
    )
  } else {
    ctx.fillStyle = 'magenta'
    ctx.fillRect(player.x - cam.x, player.y - cam.y, player.size, player.size)
  }

  if (foreground.complete) {
    ctx.drawImage(foreground, cam.x, cam.y, canvas.value.width, canvas.value.height, 0, 0, canvas.value.width, canvas.value.height)
  }
}

function drawMinimap() {
  if (!minimapCtx || !background.complete) return

  minimapCtx.clearRect(0, 0, minimapCanvas.value.width, minimapCanvas.value.height)
  minimapCtx.drawImage(
    background,
    0, 0, world.width, world.height,
    0, 0, minimapCanvas.value.width, minimapCanvas.value.height
  )

  minimapCtx.fillStyle = 'red'
  minimapCtx.beginPath()
  minimapCtx.arc(
    player.x * minimapScale,
    player.y * minimapScale,
    minimapPlayerSize,
    0,
    Math.PI * 2
  )
  minimapCtx.fill()
}
</script>


<style scoped>
.game-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.game-canvas {
  display: block; 
  background-color: #333; 
}

.enter-prompt {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background-color: rgba(0,0,0,0.75);
  border-radius: 10px;
  color: #eee;
  font-weight: bold;
  font-family: 'Arial', sans-serif;
  z-index: 50;
}

.key {
  background-color: #444;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.map-button, .bag-button {
  position: absolute;
  right: 20px;
  cursor: pointer;
  z-index: 60;
  display: flex;
  align-items: center;
  background: transparent; /* Sem fundo */
  border: none;
  padding: 0;
  width: 60px;  /* aumentei de 40px para 60px */
  height: 60px; /* aumentei de 40px para 60px */
  transition: filter 0.2s ease-in-out;
}

.map-button {
  top: 20px;
  right: 2%;
  padding: 2px;
}

.bag-button {
  top: 90px;
  right: 2%;
}

.map-button:hover, .bag-button:hover {
  filter: brightness(1.2); /* Efeito visual ao passar o mouse */
}

.button-icon {
  width: 82px;
  height: 82px;
  margin-top: 800%;
  filter: drop-shadow(1px 1px 1px #000);
}

.gold-display {
  position: absolute;
  bottom: 20px;
  right: 20px;
  /* removido background para ficar flutuando */
  background: none;
  box-shadow: none;
  color: gold;
  font-weight: bold;
  font-size: 1.8em;
  padding: 0; /* remove padding para parecer flutuante */
  border-radius: 0;
  display: flex;
  align-items: center;
  user-select: none;
  z-index: 100;
  text-shadow: 1px 1px 4px #000; /* sombra mais forte para destacar */
}

.gold-icon {
  width: 60px;
  height: 60px;
  margin-right: 10px;
  filter: drop-shadow(1px 1px 2px #000);
}
</style>
