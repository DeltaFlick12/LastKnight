<template>
  <div class="game-view">
    <canvas ref="canvas" class="game-canvas"></canvas>

    <HUD />

    <div v-if="showEnterPrompt" class="enter-prompt">
      Pressione <span class="key">E</span> para entrar em {{ structureName }}
    </div>

    <button class="map-button" @click="handleMapClick">
      <img src="/icons/map-icon.png" alt="Mapa" class="button-icon" />
    </button>

    <button class="bag-button" @click="toggleBag">
      <img src="/icons/bag-icon.png" alt="Mochila" class="button-icon" />
    </button>

    <Inventory 
      v-if="bagOpen"
      :potions="potions"
      :equipped-weapon="equippedWeapon"
      @use-potion="usePotion"
      @equip-weapon="equipWeapon"
      @close="toggleBag"
    />

    <div class="gold-display">
      <img src="/icons/gold-icon.png" alt="Ouro" class="gold-icon" />
      <span>{{ gold }}</span>
    </div>

    <div class="stamina-bar">
<span>Stamina: {{ staminaRounded }}</span>
<progress max="100" :value="staminaRounded"></progress>
    </div>
  </div>
</template>

<script setup>
import { useGameState } from '@/stores/gameState'  // ajuste o caminho conforme o seu projeto
import { ref, onMounted, onUnmounted } from 'vue'
import Inventory from '@/components/Inventory.vue'
import HUD from '@/components/HUD.vue'
import { computed } from 'vue'


const gameState = useGameState()

const maxStamina = gameState.player.maxStamina
const staminaRecoveryRate = 10 // por segundo
const staminaConsumptionRate = 25 // por segundo

const staminaRounded = computed(() => {
  return Math.floor(gameState.player.stamina)
})


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
    gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 30)
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
  x: 830 + 128 / 2,
  y: 1600 + 128 / 2,
  size: 128,
  speed: 6,
  runSpeed: 12,
  direction: 'idle'
}
const keys = { w: false, a: false, s: false, d: false, shift: false }
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
    requestAnimationFrame(gameLoop)
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

onMounted(() => {
  if (!canvas.value) return
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
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('resize', resizeCanvas)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})

function resizeCanvas() {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
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
let lastUpdateTime = 0

function gameLoop(timestamp) {
  if (!allImagesLoaded) {
    animationFrameId = requestAnimationFrame(gameLoop)
    return
  }

  if (!lastUpdateTime) lastUpdateTime = timestamp

  const delta = timestamp - lastUpdateTime

  if (delta >= 15) { // 15 ms para ~30 FPS
    update(delta / 1000) // delta em segundos
    lastUpdateTime = timestamp
  }

  draw()
  animationFrameId = requestAnimationFrame(gameLoop)
}

function update(deltaSeconds) {
  const { w, a, s, d, shift } = keys
  let moved = false
  let dx = 0
  let dy = 0

  if (w) { dy -= 1; moved = true }
  if (s) { dy += 1; moved = true }
  if (a) { dx -= 1; moved = true }
  if (d) { dx += 1; moved = true }

  if (dx !== 0 && dy !== 0) {
    const invSqrt2 = 1 / Math.sqrt(2)
    dx *= invSqrt2
    dy *= invSqrt2
  }

  if (moved) {
    let speed = player.speed

    if (shift && gameState.player.stamina > 0) {
      speed = player.runSpeed

      // Gasta stamina proporcional ao tempo
      gameState.player.stamina -= staminaConsumptionRate * deltaSeconds
      if (gameState.player.stamina < 0) gameState.player.stamina = 0
    } else {
      // Recupera stamina se não estiver correndo
      gameState.player.stamina += staminaRecoveryRate * deltaSeconds
      if (gameState.player.stamina > maxStamina) gameState.player.stamina = maxStamina
    }

    if (dy < 0) player.direction = 'walk_up'
    else if (dy > 0) player.direction = 'walk_down'
    else if (dx < 0) player.direction = 'walk_left'
    else if (dx > 0) player.direction = 'walk_right'

    move(dx * speed, dy * speed)
  } else {
    player.direction = 'idle'
    // Recupera stamina quando parado
    gameState.player.stamina += staminaRecoveryRate * deltaSeconds
    if (gameState.player.stamina > maxStamina) gameState.player.stamina = maxStamina
  }

  const nearStructure = getPlayerNearbyStructure()
  showEnterPrompt.value = !!nearStructure?.route
  structureName.value = nearStructure?.name || ''
}

function move(dx, dy) {
  // colisão eixo X
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

  // colisão eixo Y
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

  const collidedBlock = obstacles.find(block => (
    player.x - player.size / 2 < block.x + block.width &&
    player.x + player.size / 2 > block.x &&
    player.y - player.size / 2 < block.y + block.height &&
    player.y + player.size / 2 > block.y
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

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }
}
</script>
