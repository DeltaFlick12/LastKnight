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
  import { ref, onMounted, onUnmounted, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useGameState } from '@/stores/gameState'
  import HUD from '@/components/HUD.vue'

  const router = useRouter()
  const gameState = useGameState()

  const maxStamina = gameState.player.maxStamina
  const staminaRecoveryRate = 10
  const staminaConsumptionRate = 25
  const staminaRounded = computed(() => Math.floor(gameState.player.stamina))

  const potions = ref(3)
  const currentArea = ref('Reino de Albadia')
  const showEnterPrompt = ref(false)
  const structureName = ref('')
  const bagOpen = ref(false)
  const toggleBag = () => (bagOpen.value = !bagOpen.value)
  const equippedWeapon = ref('Espada de Treinamento')
  const equipWeapon = (name) => (equippedWeapon.value = name)

  const obstacles = [
    { x: 910, y: 790, width: 580, height: 270, name: 'Ferreiro', route: '/interior/ferreiro' },
    { x: 2645, y: 990, width: 390, height: 250, name: 'Loja de Poções', route: '/interior/bruxa' },
    { x: 1720, y: 660, width: 660, height: 240, name: 'Igreja', route: '/interior/igreja' },
    { x: 1800, y: 1350, width: 500, height: 280 },
    { x: 980, y: 1900, width: 495, height: 300 },
    { x: 2550, y: 1950, width: 550, height: 250 }
  ]

  const lightSources = [
    { x: 2560, y: 1085, radius: 200, intensity: 0.2, color: 'rgba(0, 255, 0, 0.4)' },
    { x: 3090, y: 1200, radius: 200, intensity: 0.1, color: 'rgba(0, 255, 0, 0.4)' },
    { x: 1190, y: 990, radius: 700, intensity: 1.8, color: 'rgba(255, 100, 0, 0.6)' },
    { x: 2433, y: 2000, radius: 850, intensity: 0, color: 'rgba(255, 255, 255, 0.3)' }
  ]

  function drawLights(ctx, cam) {
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
    for (const light of lightSources) {
      const screenX = light.x - cam.x
      const screenY = light.y - cam.y
      const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, light.radius)
      gradient.addColorStop(0, light.color)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(screenX, screenY, light.radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    ctx.globalCompositeOperation = 'source-over'
  }

  const usePotion = () => {
    if (potions.value > 0) {
      gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 30)
      potions.value--
    }
  }

  const canvas = ref(null)
  let ctx
  const player = {
    x: 2050,
    y: 2000,
    size: 300,
    speed: 6,
    runSpeed: 9,
    direction: 'idle'
  }
  const keys = { w: false, a: false, s: false, d: false, shift: false }
  const world = { width: 4096, height: 2732 }

  const backgrounds = [new Image(), new Image(), new Image(), new Image()]
  backgrounds[0].src = '/img/albadia/albadia-bg-manha.png'
  backgrounds[1].src = '/img/albadia/albadia-bg.png'
  backgrounds[2].src = '/img/albadia/albadia-bg-tarde.png'
  backgrounds[3].src = '/img/albadia/albadia-bg-noite.png'
  for (const bg of backgrounds) {
    bg.onload = imageLoadedCallback
    bg.onerror = () => console.error('Erro ao carregar uma imagem de background')
  }

  const foregrounds = [new Image(), new Image(), new Image(), new Image()]
foregrounds[0].src = '/img/albadia/albadiaDetalhes-manha.png'
foregrounds[1].src = '/img/albadia/albadiaDetalhes.png'
foregrounds[2].src = '/img/albadia/albadiaDetalhes-tarde.png'
foregrounds[3].src = '/img/albadia/albadiaDetalhes-noite.png'
for (const fg of foregrounds) {
  fg.onload = imageLoadedCallback
  fg.onerror = () => console.error('Erro ao carregar uma imagem de foreground')
}


  const foreground = new Image()
  const playerSpriteSheet = new Image()
  const frameWidth = 96
  const frameHeight = 96

  const animations = {
    idle: { row: 3, frames: [7, 1, 2, 3, 4, 5], frameInterval: 150 },
    walk_down: { row: 6, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 },
    walk_up: { row: 4, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 },
    walk_left: { row: 20.1, frames: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0], frameInterval: 70 },
    walk_right: { row: 5, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 }
  }

  let currentFrameIndex = 0
  let frameTimer = 0
  let allImagesLoaded = false
  let imagesLoadedCount = 0
const totalImagesToLoad = 6 + 4 // 6 originais + 4 foregrounds  
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

  let backgroundIndex = parseInt(localStorage.getItem('albadia_last_bg') || '0')
  backgroundIndex = (backgroundIndex + 1) % backgrounds.length
  localStorage.setItem('albadia_last_bg', backgroundIndex.toString())
  let nextBackgroundIndex = (backgroundIndex + 1) % backgrounds.length
  let transitionAlpha = 0
  const transitionDuration = 1000
  let transitionStartTime = 0

  function startBackgroundTransition() {
    backgroundIndex = nextBackgroundIndex
    nextBackgroundIndex = (backgroundIndex + 1) % backgrounds.length
    transitionAlpha = 0
    transitionStartTime = performance.now()
    localStorage.setItem('albadia_last_bg', backgroundIndex.toString())
  }

  let lastBgSwitchTime = 0
  onMounted(() => {
    if (!canvas.value) return
    ctx = canvas.value.getContext('2d')
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    loadImage(foreground, '/img/albadia/albadiaDetalhes.png')
    loadImage(playerSpriteSheet, '/img/sprites/player/player_sprite.png')
    lastBgSwitchTime = performance.now()
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
    if (delta >= 15) {
      update(delta / 1000, timestamp)
      lastUpdateTime = timestamp
    }
    draw()
    animationFrameId = requestAnimationFrame(gameLoop)
  }

  function update(deltaSeconds, timestamp) {
    const { w, a, s, d, shift } = keys
    let moved = false
    let dx = 0, dy = 0
    if (w) { dy -= 1; moved = true }
    if (s) { dy += 1; moved = true }
    if (a) { dx -= 1; moved = true }
    if (d) { dx += 1; moved = true }
    if (dx !== 0 && dy !== 0) {
      const invSqrt2 = 1 / Math.sqrt(2)
      dx *= invSqrt2
      dy *= invSqrt2
    }
    const flickerSpeed = 5
    const flickerAmount = 0.2
    const baseIntensity = 1.8
    const baseRadius = 500
    const flicker = Math.sin(timestamp / 1000 * flickerSpeed)
    lightSources[2].intensity = baseIntensity + flicker * flickerAmount
    lightSources[2].radius = baseRadius + flicker * (flickerAmount * 200)
    if (lightSources[2].intensity < 0) lightSources[2].intensity = 0

    if (moved) {
      let speed = player.speed
      if (shift && gameState.player.stamina > 0) {
        gameState.player.stamina -= staminaConsumptionRate * deltaSeconds
        if (gameState.player.stamina <= 0) {
          gameState.player.stamina = 0
        } else {
          speed = player.runSpeed
        }
      } else {
        gameState.player.stamina += staminaRecoveryRate * deltaSeconds
        if (gameState.player.stamina > maxStamina) gameState.player.stamina = maxStamina
      }
      if (dy < 0) player.direction = 'walk_up'
      else if (dy > 0) player.direction = 'walk_down'
      else if (dx < 0) player.direction = 'walk_left'
      else if (dx > 0) player.direction = 'walk_right'
      let newX = player.x + dx * speed
      let newY = player.y + dy * speed
      for (const obs of obstacles) {
        if (rectCircleColliding(newX, newY, player.size / 4, player.size / 4, obs.x, obs.y, obs.width, obs.height)) {
          newX = player.x
          newY = player.y
          break
        }
      }
      player.x = Math.min(Math.max(newX, 0), world.width)
      player.y = Math.min(Math.max(newY, 0), world.height)
    } else {
      player.direction = 'idle'
      gameState.player.stamina += staminaRecoveryRate * deltaSeconds
      if (gameState.player.stamina > maxStamina) gameState.player.stamina = maxStamina
    }
    const nearbyStructure = getPlayerNearbyStructure()
    showEnterPrompt.value = !!nearbyStructure?.name
    structureName.value = nearbyStructure?.name || ''
    updateAnimation(deltaSeconds)
    if (timestamp - lastBgSwitchTime > 10000 && transitionAlpha === 0) {
      startBackgroundTransition()
      lastBgSwitchTime = timestamp
    }
    if (transitionAlpha < 1) {
      const elapsed = timestamp - transitionStartTime
      transitionAlpha = Math.min(elapsed / transitionDuration, 1)
    }
  }

  function getPlayerNearbyStructure() {
    for (const obs of obstacles) {
      const distX = Math.abs(player.x - (obs.x + obs.width / 4))
      const distY = Math.abs(player.y - (obs.y + obs.height / 4))
      if (distX < obs.width / 4 + player.size / 4 && distY < obs.height / 4 + player.size / 2) {
        return obs
      }
    }
    return null
  }

  function rectCircleColliding(cx, cy, cwidth, cheight, rx, ry, rw, rh) {
    return !(
      cx + cwidth < rx ||
      cx > rx + rw ||
      cy + cheight < ry ||
      cy > ry + rh
    )
  }


  function draw() {
    if (!ctx || !allImagesLoaded) return

    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

    const cam = {
      x: player.x - canvas.value.width / 2,
      y: player.y - canvas.value.height / 2
    }
    cam.x = Math.max(0, Math.min(cam.x, world.width - canvas.value.width))
    cam.y = Math.max(0, Math.min(cam.y, world.height - canvas.value.height))

    ctx.globalAlpha = 1 - transitionAlpha
    ctx.drawImage(backgrounds[backgroundIndex], -cam.x, -cam.y, world.width, world.height)

    if (transitionAlpha > 0) {
      ctx.globalAlpha = transitionAlpha
      ctx.drawImage(backgrounds[nextBackgroundIndex], -cam.x, -cam.y, world.width, world.height)
    }

    ctx.globalAlpha = 1

    const anim = animations[player.direction] || animations.idle
    const frame = anim.frames[currentFrameIndex]
    const sx = frame * frameWidth
    const sy = anim.row * frameHeight
    

    ctx.save()
    switch (backgroundIndex) {
      case 0: ctx.filter = 'brightness(1)'; break
      case 1: ctx.filter = 'brightness(0.7)'; break
      case 2: ctx.filter = 'brightness(0.4)'; break
      case 3: ctx.filter = 'brightness(0.8)'; break
      default: ctx.filter = 'none'
    }
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 10

    ctx.drawImage(
      playerSpriteSheet,
      sx, sy, frameWidth, frameHeight,
      player.x - cam.x - player.size / 2,
      player.y - cam.y - player.size / 2,
      player.size,
      player.size
    )
    ctx.restore()

    // Foreground correspondente ao background atual
ctx.globalAlpha = 1 - transitionAlpha
ctx.drawImage(foregrounds[backgroundIndex], -cam.x, -cam.y, world.width, world.height)

// Foreground da próxima transição (se houver)
if (transitionAlpha > 0) {
  ctx.globalAlpha = transitionAlpha
  ctx.drawImage(foregrounds[nextBackgroundIndex], -cam.x, -cam.y, world.width, world.height)
}
    drawLights(ctx, cam)
ctx.globalAlpha = 1
  }

  function updateAnimation(deltaSeconds) {
    const anim = animations[player.direction] || animations.idle
    const interval = anim.frameInterval || 70
    frameTimer += deltaSeconds * 1000
    if (frameTimer > interval) {
      frameTimer = 0
      currentFrameIndex++
      if (currentFrameIndex >= anim.frames.length) currentFrameIndex = 0
    }
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
    background: #000;
    width: 100vw;
    height: 100vh;
  }

  .enter-prompt {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(10, 10, 10, 0.7);
    padding: 8px 14px;
    border-radius: 6px;
    color: white;
    font-weight: 600;
    font-size: 18px;
    user-select: none;
    pointer-events: none;
  }

  .enter-prompt .key {
    font-weight: 700;
    font-size: 22px;
    color: #aaffaa;
    padding: 0 6px;
    border: 2px solid #aaffaa;
    border-radius: 4px;
  }
  </style>