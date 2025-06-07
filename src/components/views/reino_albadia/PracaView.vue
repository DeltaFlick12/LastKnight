<template>
  <div class="game-view">
    <canvas ref="canvas" class="game-canvas"></canvas>

    <HUD />

    <div v-if="showEnterPrompt" class="enter-prompt">
      Pressione <span class="key">E</span> para entrar em {{ structureName }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import HUD from '@/components/HUD.vue'
import { useGameState } from '@/stores/gameState'

const router = useRouter()
const gameState = useGameState()

const canvas = ref(null)
let ctx = null

const world = { width: 4096, height: 2732 }

const showEnterPrompt = ref(false)
const structureName = ref('')
const obstacles = [
  // Exemplo de obstáculos
  // { x: 480, y: 380, width: 480, height: 180, name: 'Ferreiro', route: '/interior/ferreiro' },
]

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  e: false,
}

// Classe Sprite com múltiplas animações
class Sprite {
  constructor({ position, animations, frameBuffer = 10, scale = 1 }) {
    this.position = position
    this.animations = animations
    this.frameBuffer = frameBuffer
    this.scale = scale
    this.currentAnimation = 'idle'
    this.currentFrame = 0
    this.elapsedFrames = 0
    this.loadedImages = {}

    for (const key in animations) {
      const image = new Image()
      image.src = animations[key].imageSrc
      this.loadedImages[key] = {
        image,
        frameRate: animations[key].frameRate,
      }

      image.onload = () => {
        if (!this.width) {
          this.width = (image.width / animations[key].frameRate) * this.scale
          this.height = image.height * this.scale
        }
      }
    }
  }

  setAnimation(name) {
    if (this.currentAnimation !== name && this.loadedImages[name]) {
      this.currentAnimation = name
      this.currentFrame = 0
      this.elapsedFrames = 0
    }
  }

  draw(ctx, camera) {
    const { image, frameRate } = this.loadedImages[this.currentAnimation]
    if (!image.complete) return

    const cropWidth = image.width / frameRate
    const cropHeight = image.height
    const sx = this.currentFrame * cropWidth
    const sy = 0

    ctx.drawImage(
      image,
      sx, sy, cropWidth, cropHeight,
      this.position.x - camera.x,
      this.position.y - camera.y,
      this.width,
      this.height
    )
  }

  update(ctx, camera) {
    this.draw(ctx, camera)
    this.updateFrames()
  }

  updateFrames() {
    const { frameRate } = this.loadedImages[this.currentAnimation]
    this.elapsedFrames++
    if (this.elapsedFrames % this.frameBuffer === 0) {
      this.currentFrame = (this.currentFrame + 1) % frameRate
    }
  }

  setPosition(x, y) {
    this.position.x = x
    this.position.y = y
  }
}

// Estado do player (posição, direção e movimento)
const player = reactive({
  x: 830,
  y: 1600,
  speed: 4,
  direction: 'down',
  moving: false,
  size: 128,
})

// Inicializa o sprite do player com suas animações
const playerSprite = new Sprite({
  position: { x: player.x, y: player.y },
  frameBuffer: 8,
  scale: 5,
  animations: {
    idle: {
      imageSrc: 'src/assets/sprites/player/idle.png', // Substitua pelo caminho correto
      frameRate: 5,
    },
    walk_down: {
      imageSrc: 'src/assets/sprites/player/walk_down.png',
      frameRate: 5,
    },
    walk_up: {
      imageSrc: 'src/assets/sprites/player/walk_up.png',
      frameRate: 5,
    },
    walk_left: {
      imageSrc: 'src/assets/sprites/player/walk_left.png',
      frameRate: 5,
    },
    walk_right: {
      imageSrc: 'src/assets/sprites/player/walk_right.png',
      frameRate: 5,
    },
  },
})

const background = new Image()
const foreground = new Image()

let allImagesLoaded = false
let imagesLoadedCount = 0
const totalImagesToLoad = 2 + Object.keys(playerSprite.animations).length

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

onMounted(() => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  if (!ctx) {
    console.error('Erro: ctx é null.')
    return
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  // Carrega fundo e camada superior
  loadImage(background, 'public/img/albadia/albadia-bg.png')
  loadImage(foreground, 'public/img/albadia/albadiaDetalhes.png')

  // Carrega todas as animações do player
  for (const key in playerSprite.animations) {
    const { imageSrc } = playerSprite.animations[key]
    const image = playerSprite.loadedImages[key].image
    loadImage(image, imageSrc)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})

function resizeCanvas() {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
}

function onKeyDown(e) {
  if (e.key in keys) keys[e.key] = true
  if (e.key.toLowerCase() === 'e') {
    const current = getPlayerNearbyStructure()
    if (current?.route) router.push(current.route)
  }
}

function onKeyUp(e) {
  if (e.key in keys) keys[e.key] = false
}

function updatePlayer() {
  player.moving = false

  if (keys.ArrowUp) {
    player.y -= player.speed
    player.direction = 'up'
    player.moving = true
  } else if (keys.ArrowDown) {
    player.y += player.speed
    player.direction = 'down'
    player.moving = true
  } else if (keys.ArrowLeft) {
    player.x -= player.speed
    player.direction = 'left'
    player.moving = true
  } else if (keys.ArrowRight) {
    player.x += player.speed
    player.direction = 'right'
    player.moving = true
  }

  // Define a animação conforme o movimento
  const anim = player.moving ? `walk_${player.direction}` : 'idle'
  playerSprite.setAnimation(anim)
  playerSprite.setPosition(player.x - player.size / 2, player.y - player.size / 2)

  // Mantém player dentro do mundo
  player.x = Math.min(Math.max(player.x, 0), world.width)
  player.y = Math.min(Math.max(player.y, 0), world.height)

  // Detecta estruturas próximas para mostrar prompt "Pressione E"
  const nearbyStructure = getPlayerNearbyStructure()
  if (nearbyStructure && nearbyStructure.name) {
    showEnterPrompt.value = true
    structureName.value = nearbyStructure.name
  } else {
    showEnterPrompt.value = false
  }
}

function getPlayerNearbyStructure() {
  for (const obs of obstacles) {
    const distX = Math.abs(player.x - (obs.x + obs.width / 2))
    const distY = Math.abs(player.y - (obs.y + obs.height / 2))

    if (distX < obs.width / 2 + player.size / 2 && distY < obs.height / 2 + player.size / 2) {
      return obs
    }
  }
  return null
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

  if (delta >= 15) {
    updatePlayer()
    draw()
    lastUpdateTime = timestamp
  }

  animationFrameId = requestAnimationFrame(gameLoop)
}

function draw() {
  if (!ctx || !allImagesLoaded) return

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  const cam = {
    x: player.x - canvas.value.width / 2,
    y: player.y - canvas.value.height / 2,
  }
  cam.x = Math.max(0, Math.min(cam.x, world.width - canvas.value.width))
  cam.y = Math.max(0, Math.min(cam.y, world.height - canvas.value.height))

  // Desenha o fundo (background)
  ctx.drawImage(background, -cam.x, -cam.y)

  // Atualiza e desenha o sprite do player
  playerSprite.update(ctx, cam)

  // Desenha a camada superior (foreground)
  ctx.drawImage(foreground, -cam.x, -cam.y)
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
  width: 100vw;
  height: 100vh;
}

.enter-prompt {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 18px;
  font-family: monospace;
  z-index: 10;
}

.key {
  background: #fff;
  color: #000;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}
</style>
