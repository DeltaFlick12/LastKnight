<template>
  <div
    class="castelo-screen"
    @keydown="startMoving"
    @keyup="stopMoving"
    tabindex="0"
  >
    <!-- Background Layer -->
    <div
      class="zoom-layer background"
      :style="{
        backgroundImage: `url(${bgImage})`,
        backgroundPosition: `${-cameraOffset.x}px ${-cameraOffset.y}px`,
        backgroundSize: 'cover'
      }"
    >
      <!-- Áreas de interação -->
      <div
        v-for="(area, i) in interactionAreas"
        :key="'interact-' + i"
        class="interaction-box"
        :style="{
          left: `${area.x - cameraOffset.x}px`,
          top: `${area.y - cameraOffset.y}px`,
          width: `${area.width}px`,
          height: `${area.height}px`
        }"
      />

      <!-- Áreas de colisão -->
      <div
        v-for="(area, i) in collisionAreas"
        :key="'collision-' + i"
        class="collision-box"
        :style="{
          left: `${area.x - cameraOffset.x}px`,
          top: `${area.y - cameraOffset.y}px`,
          width: `${area.width}px`,
          height: `${area.height}px`
        }"
      />

      <!-- Boss (Magnus) -->
      <div
        v-if="enemy.state !== 'defeated'"
        class="enemy"
        :class="{ 'damaged': isBossDamaged }"
        :style="{
          left: `${enemy.position.x - cameraOffset.x}px`,
          top: `${enemy.position.y - cameraOffset.y}px`,
          backgroundImage: `url(${bossSpriteSheet})`,
          backgroundPosition: `-${
            bossAnimations[bossCurrentAnimation].frames[bossCurrentFrame] * bossFrameWidth
          }px -${
            bossAnimations[bossCurrentAnimation].row * bossFrameHeight
          }px`,
          width: bossFrameWidth + 'px',
          height: bossFrameHeight + 'px'
        }"
      >
        <!-- Boss Hitbox -->
        <div class="boss-hitbox"></div>
        <!-- Boss HUD -->
        <div class="enemy-hud">
          <div class="enemy-name">{{ gameState.boss.name }}</div>
          <div class="health-bar">
            <div
              class="health-fill"
              :style="{ width: `${bossHealthPercent}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Projectiles -->
      <div
        v-for="(projectile, i) in projectiles"
        :key="'projectile-' + i"
        class="projectile"
        :style="{
          left: `${projectile.x - cameraOffset.x}px`,
          top: `${projectile.y - cameraOffset.y}px`
        }"
      ></div>

      <!-- Player Hitbox -->
      <div
        class="player-hitbox"
        :style="{
          left: `${characterPosition.x + 12 - cameraOffset.x}px`,
          top: `${characterPosition.y + 48 - cameraOffset.y}px`,
          width: '32px',
          height: '64px'
        }"
      ></div>
    </div>

    <!-- Character Layer -->
    <div
      class="character"
      :class="{ 'invulnerable': isInvulnerable }"
      :style="{
        backgroundImage: `url(${spriteSheet})`,
        backgroundPosition: `-${
          animations[currentAnimation].frames[currentFrame] * frameWidth
        }px -${animations[currentAnimation].row * frameHeight}px`,
        width: frameWidth + 'px',
        height: frameHeight + 'px'
      }"
    />

    <!-- Foreground Layer -->
    <div
      class="zoom-layer foreground"
      :style="{
        backgroundImage: `url(${fgImage})`,
        backgroundPosition: `${-cameraOffset.x}px ${-cameraOffset.y}px`,
        backgroundSize: 'cover'
      }"
    />

    <!-- HUD Component -->
    <HUD />

    <!-- Dialog -->
    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button @click="nextDialog" :disabled="typing">Continuar</button>
    </div>

    <!-- Game Over Dialog -->
    <div v-if="showGameOver" class="dialog-box">
      <p v-if="gameState.player.lives > 0">
        Você foi derrotado! Vidas restantes: {{ gameState.player.lives }}
      </p>
      <p v-else>Game Over: Você foi derrotado!</p>
      <button @click="restartGame">Tentar Novamente</button>
    </div>

    <!-- Victory Dialog -->
    <div v-if="showVictory" class="dialog-box">
      <p>Parabéns! Você derrotou Magnus!</p>
      <button @click="returnToAlbadia">Retornar a Albadia</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameState } from '@/stores/gameState'
import HUD from '@/components/HUD.vue'
import bgImage from '@/assets/interior/bossroom.png'
import fgImage from '@/assets/interior/bossroom_detalhes.png'

const gameState = useGameState()

// Player Animation Variables
const currentFrame = ref(0)
const frameTimer = ref(0)
const staminaTimer = ref(0)
const frameWidth = 96
const frameHeight = 96

// Boss Animation Variables
const bossCurrentFrame = ref(0)
const bossFrameTimer = ref(0)
const bossFrameWidth = 96
const bossFrameHeight = 96
const bossLastDirection = ref('down')
const isBossAttacking = ref(false)

// Spritesheets
const spriteSheet = new URL(
  '/img/sprites/player/player_sprite.png',
  import.meta.url
).href
const bossSpriteSheet = new URL(
  '/img/sprites/boss/magnus_sprite.png',
  import.meta.url
).href

// Player Position and State
const characterPosition = ref({ x: 750, y: 700 })
const moving = ref({ up: false, down: false, left: false, right: false })
const isSprinting = ref(false)
const lastDirection = ref('down')
const isAttacking = ref(false)
const canMove = ref(false)
const isInvulnerable = ref(false)
const isBossDamaged = ref(false)
const isBossRecovering = ref(false)
const bossRecoveryStartTime = ref(0)
const bossRecoveryDuration = 5000 // 5 seconds
const invulnerabilityDuration = 1000
let invulnerabilityTimer = null
const showGameOver = ref(false)
const showVictory = ref(false)
const bagOpen = ref(false)

const toggleBag = () => {
  bagOpen.value = !bagOpen.value
  gameState.toggleBag()
}

// Computed Properties
const bossHealthPercent = computed(() =>
  Math.max(0, (gameState.boss.health / gameState.boss.maxHealth) * 100)
)
const bossStaminaPercent = computed(() =>
  Math.max(0, (gameState.boss.stamina / gameState.boss.maxStamina) * 100)
)

// Player Animations
const animations = {
  idle: { row: 3, frames: [7, 1, 2, 3, 4, 5], frameInterval: 150 },
  walk_down: {
    row: 6,
    frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    frameInterval: 70
  },
  walk_up: { row: 4, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 },
  walk_left: {
    row: 20.1,
    frames: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    frameInterval: 70
  },
  walk_right: {
    row: 5,
    frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    frameInterval: 70
  },
  attack_up: {
    row: 13,
    frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11],
    frameInterval: 100
  },
  attack_down: {
    row: 15,
    frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11],
    frameInterval: 100
  },
  attack_left: {
    row: 12,
    frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11],
    frameInterval: 110
  },
  attack_right: {
    row: 14,
    frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11],
    frameInterval: 100
  }
}

// Boss Animations
const bossAnimations = {
  idle: { row: 3, frames: [7, 1, 2, 3, 4, 5], frameInterval: 150 },
  walk_down: {
    row: 6,
    frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    frameInterval: 70
  },
  walk_up: {
    row: 4,
    frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    frameInterval: 70
  },
  walk_left: {
    row: 20.1,
    frames: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    frameInterval: 70
  },
  walk_right: {
    row: 5,
    frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    frameInterval: 70
  },
  attack_melee: {
    row: 14,
    frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11],
    frameInterval: 100
  },
  attack_projectile: {
    row: 13,
    frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11],
    frameInterval: 100
  },
  defeated: {
    row: 3,
    frames: [0, 1, 2, 3],
    frameInterval: 200
  }
}

// Player Current Animation
const currentAnimation = computed(() => {
  if (isAttacking.value) {
    return {
      up: 'attack_up',
      down: 'attack_down',
      left: 'attack_left',
      right: 'attack_right'
    }[lastDirection.value]
  }
  if (moving.value.up) return 'walk_up'
  if (moving.value.down) return 'walk_down'
  if (moving.value.left) return 'walk_left'
  if (moving.value.right) return 'walk_right'
  return 'idle'
})

// Boss Current Animation
const bossCurrentAnimation = computed(() => {
  if (enemy.value.state === 'defeated') return 'defeated'
  if (isBossAttacking.value) return 'attack_melee'
  if (enemy.value.state === 'active') {
    return {
      up: 'walk_up',
      down: 'walk_down',
      left: 'walk_left',
      right: 'walk_right'
    }[bossLastDirection.value]
  }
  return 'idle'
})

// Dialog Variables
const showDialog = ref(true)
const dialogIndex = ref(0)
const typing = ref(false)
const displayedText = ref('')

const dialogLines = [
  'Então você finalmente chegou ao coração do castelo...',
  'Há séculos espero por alguém que ouse me desafiar.',
  'Sou Magnus, o guardião final de Albadia!',
  'Prepare-se... este será o seu último julgamento!'
]

let typeInterval = null
const typeLine = () => {
  typing.value = true
  displayedText.value = ''
  const line = dialogLines[dialogIndex.value]
  let index = 0
  typeInterval = setInterval(() => {
    if (index < line.length) {
      displayedText.value += line[index++]
    } else {
      clearInterval(typeInterval)
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

const skipDialog = () => {
  clearInterval(typeInterval)
  typing.value = false
  showDialog.value = false
  canMove.value = true
}

// Interaction and Collision Areas
const interactionAreas = [
  {
    x: 730,
    y: 1150,
    width: 170,
    height: 80,
    action: () => {
      window.location.href = '/level/albadia'
    }
  }
]

const collisionAreas = [
  { x: 0, y: 0, width: 1, height: 1266 },
  { x: 0, y: 1080, width: 2048, height: 1 },
  { x: 1920, y: 0, width: 1, height: 1266 },
  { x: 0, y: 200, width: 2048, height: 1 },
  { x: 650, y: 390, width: 300, height: 100 }
]

const screenSize = { width: window.innerWidth, height: window.innerHeight }

const cameraOffset = computed(() => ({
  x: characterPosition.value.x - screenSize.width / 2 + frameWidth / 2 + 70,
  y: characterPosition.value.y - screenSize.height / 2 + frameHeight / 2 + 120
}))

const isInInteractionArea = () => {
  const charBox = { ...characterPosition.value, width: 32, height: 64 }
  return interactionAreas.find(area =>
    charBox.x < area.x + area.width &&
    charBox.x + charBox.width > area.x &&
    charBox.y < area.y + area.height &&
    charBox.y + charBox.height > area.y
  )
}

const checkStaticCollision = (nextX, nextY) => {
  const hitbox = {
    x: nextX + 12,
    y: nextY + 48,
    width: 32,
    height: 64
  }
  return collisionAreas.some(area =>
    hitbox.x < area.x + area.width &&
    hitbox.x + hitbox.width > area.x &&
    hitbox.y < area.y + area.height &&
    hitbox.y + hitbox.height > area.y
  )
}

const checkEntityCollision = (entity1, entity2) => {
  if (enemy.value.state === 'defeated') return false
  const hitbox1 = {
    x: entity1.x + 12,
    y: entity1.y + 48,
    width: 32,
    height: 64
  }
  const hitbox2 = {
    x: entity2.x,
    y: entity2.y,
    width: bossFrameWidth,
    height: bossFrameHeight
  }
  const dx = (hitbox1.x + hitbox1.width / 2) - (hitbox2.x + hitbox2.width / 2)
  const dy = (hitbox1.y + hitbox1.height / 2) - (hitbox2.y + hitbox2.height / 2)
  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance > 200) return false
  const collides =
    hitbox1.x < hitbox2.x + hitbox2.width &&
    hitbox1.x + hitbox1.width > hitbox2.x &&
    hitbox1.y < hitbox2.y + hitbox2.height &&
    hitbox1.y + hitbox1.height > hitbox2.y
  if (collides) {
    console.log(
      `Collision detected: Player at (${hitbox1.x}, ${hitbox1.y}), Boss at (${hitbox2.x}, ${hitbox2.y})`
    )
  }
  return collides
}

const resolveCollision = (playerPos, bossPos) => {
  const playerHitbox = {
    x: playerPos.x + 12,
    y: playerPos.y + 48,
    width: 32,
    height: 64
  }
  const bossHitbox = {
    x: bossPos.x,
    y: bossPos.y,
    width: bossFrameWidth,
    height: bossFrameHeight
  }
  if (
    playerHitbox.x < bossHitbox.x + bossHitbox.width &&
    playerHitbox.x + playerHitbox.width > bossHitbox.x &&
    playerHitbox.y < bossHitbox.y + bossHitbox.height &&
    playerHitbox.y + playerHitbox.height > bossHitbox.y
  ) {
    const overlapX = Math.min(
      playerHitbox.x + playerHitbox.width - bossHitbox.x,
      bossHitbox.x + bossHitbox.width - playerHitbox.x
    )
    const overlapY = Math.min(
      playerHitbox.y + playerHitbox.height - bossHitbox.y,
      bossHitbox.y + bossHitbox.height - playerHitbox.y
    )
    let adjustX = 0
    let adjustY = 0
    if (overlapX < overlapY) {
      if (playerHitbox.x + playerHitbox.width / 2 < bossHitbox.x + bossHitbox.width / 2) {
        adjustX = -(overlapX + 1)
      } else {
        adjustX = overlapX + 1
      }
    } else {
      if (playerHitbox.y + playerHitbox.height / 2 < bossHitbox.y + bossHitbox.height / 2) {
        adjustY = -(overlapY + 1)
      } else {
        adjustY = overlapY + 1
      }
    }
    console.log(`Collision resolved: adjustX=${adjustX}, adjustY=${adjustY}`)
    return { adjustX, adjustY }
  }
  return { adjustX: 0, adjustY: 0 }
}

const checkEnemyCollision = (nextX, nextY) => {
  const hitbox = {
    x: nextX,
    y: nextY,
    width: bossFrameWidth,
    height: bossFrameHeight
  }
  return collisionAreas.some(area =>
    hitbox.x < area.x + area.width &&
    hitbox.x + hitbox.width > area.x &&
    hitbox.y < area.y + area.height &&
    hitbox.y + hitbox.height > area.y
  )
}

const checkAttackHit = () => {
  const playerAttackBox = {
    x:
      characterPosition.value.x +
      (lastDirection.value === 'left'
        ? -50
        : lastDirection.value === 'right'
        ? 50
        : 0),
    y:
      characterPosition.value.y +
      (lastDirection.value === 'up'
        ? -50
        : lastDirection.value === 'down'
        ? 50
        : 0),
    width: 100,
    height: 100
  }
  const enemyHitbox = {
    x: enemy.value.position.x,
    y: enemy.value.position.y,
    width: bossFrameWidth,
    height: bossFrameHeight
  }
  const hit =
    playerAttackBox.x < enemyHitbox.x + enemyHitbox.width &&
    playerAttackBox.x + playerAttackBox.width > enemyHitbox.x &&
    playerAttackBox.y < enemyHitbox.y + enemyHitbox.height &&
    playerAttackBox.y + playerAttackBox.height > enemyHitbox.y
  if (!hit) {
    console.log('Player attack missed Magnus!')
  }
  return hit
}

const enemy = ref({
  position: { x: 1200, y: 300 },
  state: 'idle',
  timer: 0,
  lastShot: 0,
  lastMeleeAttack: 0,
  detectionRadius: 700,
  randomMoveTimer: 0,
  randomDirection: { x: 0, y: 0 }
})

const projectiles = ref([])

const performMeleeAttack = (now) => {
  if (
    gameState.boss.stamina >= 10 &&
    !isInvulnerable.value &&
    !showGameOver.value &&
    !isBossRecovering.value &&
    checkEntityCollision(characterPosition.value, enemy.value.position)
  ) {
    console.log(
      `Magnus melee attack! Player health before: ${gameState.player.health}`
    )
    isBossAttacking.value = true
    bossCurrentFrame.value = 0
    gameState.drainBossStamina(10)
    gameState.takeDamage(10)
    isInvulnerable.value = true
    clearTimeout(invulnerabilityTimer)
    invulnerabilityTimer = setTimeout(() => {
      isInvulnerable.value = false
      console.log('Invulnerability ended')
    }, invulnerabilityDuration)
    console.log(`Player health after: ${gameState.player.health}`)
    if (gameState.player.health <= 0) {
      showGameOver.value = true
      canMove.value = false
      cancelAnimationFrame(animationFrameId)
      console.log('Player defeated!')
    }
    enemy.value.lastMeleeAttack = now
    setTimeout(() => {
      isBossAttacking.value = false
    }, bossAnimations.attack_melee.frames.length * bossAnimations.attack_melee.frameInterval)
    if (gameState.boss.stamina <= 0) {
      isBossRecovering.value = true
      bossRecoveryStartTime.value = now
      console.log('Magnus out of stamina, entering recovery mode')
    }
  }
}

const updateEnemy = (now) => {
  // Se o diálogo está ativo, manter o boss em estado idle e não executar ações
  if (showDialog.value) {
    enemy.value.state = 'idle'
    console.log('Boss attacks disabled during dialog')
    return
  }

  if (enemy.value.state === 'defeated') return

  console.log(
    `Boss stats: health=${gameState.boss.health}, stamina=${gameState.boss.stamina}, phase=${gameState.boss.phase}, vulnerable=${gameState.boss.isVulnerable}, recovering=${isBossRecovering.value}`
  )

  // Verificar se o boss está em recuperação
  if (isBossRecovering.value) {
    if (now - bossRecoveryStartTime.value >= bossRecoveryDuration) {
      gameState.boss.stamina = gameState.boss.maxStamina
      isBossRecovering.value = false
      enemy.value.state = 'idle'
      enemy.value.timer = now
      enemy.value.lastShot = now
      enemy.value.lastMeleeAttack = now
      enemy.value.randomMoveTimer = now
      console.log('Magnus recovery complete, stamina restored, resuming actions')
    }
    return
  }

  // Verificar se o boss está sem stamina
  if (gameState.boss.stamina <= 0) {
    isBossRecovering.value = true
    bossRecoveryStartTime.value = now
    console.log('Magnus out of stamina, entering recovery mode')
    return
  }

  const dx = characterPosition.value.x - enemy.value.position.x
  const dy = characterPosition.value.y - enemy.value.position.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const enemySpeed = 2 + gameState.boss.phase * 0.5

  let nextEnemyPos = { ...enemy.value.position }
  let isColliding = checkEntityCollision(characterPosition.value, enemy.value.position)

  // Atualizar direção do boss
  if (Math.abs(dx) > Math.abs(dy)) {
    bossLastDirection.value = dx > 0 ? 'right' : 'left'
  } else {
    bossLastDirection.value = dy > 0 ? 'down' : 'up'
  }

  if (distance <= enemy.value.detectionRadius) {
    if (enemy.value.state === 'idle') {
      enemy.value.state = 'active'
      enemy.value.timer = now
      console.log('Magnus state changed to active')
    }

    if (enemy.value.state === 'active' && !isColliding && !isBossAttacking.value) {
      const magnitude = distance > 0 ? distance : 1
      const moveX = (dx / magnitude) * enemySpeed
      const moveY = (dy / magnitude) * enemySpeed
      nextEnemyPos.x += moveX
      if (!checkEnemyCollision(nextEnemyPos.x, enemy.value.position.y)) {
        enemy.value.position.x = nextEnemyPos.x
      }
      nextEnemyPos.y += moveY
      if (!checkEnemyCollision(enemy.value.position.x, nextEnemyPos.y)) {
        enemy.value.position.y = nextEnemyPos.y
      }
    }
  } else {
    if (now - enemy.value.randomMoveTimer >= 2000) {
      enemy.value.randomDirection = {
        x: Math.floor(Math.random() * 3) - 1,
        y: Math.floor(Math.random() * 3) - 1
      }
      enemy.value.randomMoveTimer = now
      // Atualizar direção para movimento aleatório
      if (Math.abs(enemy.value.randomDirection.x) > Math.abs(enemy.value.randomDirection.y)) {
        bossLastDirection.value = enemy.value.randomDirection.x > 0 ? 'right' : 'left'
      } else if (enemy.value.randomDirection.y !== 0) {
        bossLastDirection.value = enemy.value.randomDirection.y > 0 ? 'down' : 'up'
      }
    }
    nextEnemyPos.x += enemy.value.randomDirection.x * enemySpeed
    if (!checkEnemyCollision(nextEnemyPos.x, enemy.value.position.y)) {
      enemy.value.position.x = nextEnemyPos.x
    }
    nextEnemyPos.y += enemy.value.randomDirection.y * enemySpeed
    if (!checkEnemyCollision(enemy.value.position.x, nextEnemyPos.y)) {
      enemy.value.position.y = nextEnemyPos.y
    }
  }

  if (enemy.value.state === 'active') {
    if (now - enemy.value.lastMeleeAttack >= 1000) {
      performMeleeAttack(now)
    }
    if (now - enemy.value.timer < 30000 && gameState.boss.stamina >= 5) {
      if (now - enemy.value.lastShot >= 500) {
        gameState.drainBossStamina(5)
        const angle = Math.atan2(dy, dx)
        const speed = 10 + gameState.boss.phase * 2
        const newProjectile = {
          x: enemy.value.position.x,
          y: enemy.value.position.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed
        }
        projectiles.value.push(newProjectile)
        console.log(
          `Projectile created at position: ${newProjectile.x}, ${newProjectile.y}, velocity: ${newProjectile.vx}, ${newProjectile.vy}`
        )
        isBossAttacking.value = true
        bossCurrentFrame.value = 0
        setTimeout(() => {
          isBossAttacking.value = false
        }, bossAnimations.attack_projectile.frames.length * bossAnimations.attack_projectile.frameInterval)
        enemy.value.lastShot = now
        if (gameState.boss.stamina <= 0) {
          isBossRecovering.value = true
          bossRecoveryStartTime.value = now
          console.log('Magnus out of stamina, entering recovery mode')
        }
      }
    } else if (now - enemy.value.timer < 45000) {
      enemy.value.state = 'idle'
      console.log('Magnus state changed to idle')
    } else {
      enemy.value.timer = now
      enemy.value.state = 'active'
      console.log('Magnus state changed to active')
    }
  }

  // Atualizar quadro de animação do boss
  const bossAnim = bossAnimations[bossCurrentAnimation.value]
  if (now - bossFrameTimer.value > bossAnim.frameInterval) {
    bossFrameTimer.value = now
    bossCurrentFrame.value++
    if (bossCurrentFrame.value >= bossAnim.frames.length) {
      bossCurrentFrame.value = 0
      if (isBossAttacking.value && enemy.value.state !== 'defeated') {
        isBossAttacking.value = false
      }
    }
  }

  // Verificar se o boss foi derrotado
  if (gameState.boss.health <= 0 && enemy.value.state !== 'defeated') {
    enemy.value.state = 'defeated'
    gameState.defeatMagnus()
    showVictory.value = true
    canMove.value = false
    console.log('Magnus defeated!')
  }
}

const updateProjectiles = () => {
  projectiles.value = projectiles.value.filter(projectile => {
    projectile.x += projectile.vx
    projectile.y += projectile.vy

    const hitbox = { x: projectile.x, y: projectile.y, width: 20, height: 20 }
    const collides = collisionAreas.some(area =>
      hitbox.x < area.x + area.width &&
      hitbox.x + hitbox.width > area.x &&
      hitbox.y < area.y + area.height &&
      hitbox.y + hitbox.height > area.y
    )

    const playerHitbox = {
      x: characterPosition.value.x + 12,
      y: characterPosition.value.y + 48,
      width: 32,
      height: 64
    }
    const hitsPlayer =
      hitbox.x < playerHitbox.x + playerHitbox.width &&
      hitbox.x + hitbox.width > playerHitbox.x &&
      hitbox.y < playerHitbox.y + playerHitbox.height &&
      hitbox.y + hitbox.height > playerHitbox.y

    if (hitsPlayer && !isInvulnerable.value && !showGameOver.value) {
      console.log(
        `Player hit by projectile! Health before: ${gameState.player.health}`
      )
      gameState.takeDamage(15)
      isInvulnerable.value = true
      clearTimeout(invulnerabilityTimer)
      invulnerabilityTimer = setTimeout(() => {
        isInvulnerable.value = false
        console.log('Invulnerability ended')
      }, invulnerabilityDuration)
      console.log(`Player health after: ${gameState.player.health}`)
      if (gameState.player.health <= 0) {
        showGameOver.value = true
        canMove.value = false
        cancelAnimationFrame(animationFrameId)
        console.log('Player defeated!')
      }
      return false
    }

    return (
      !collides &&
      projectile.x > 0 &&
      projectile.x < 2048 &&
      projectile.y > 0 &&
      projectile.y < 1366
    )
  })
}

let animationFrameId = null

const updateMovement = () => {
  const normalStep = 3
  const sprintStep = 5
  const now = performance.now()
  let nextPos = { ...characterPosition.value }

  if (canMove.value && !isAttacking.value) {
    let dx = 0
    let dy = 0
    let moved = false
    const step = isSprinting.value ? sprintStep : normalStep
    const staminaCost = isSprinting.value ? 2 : 1

    if (moving.value.up && gameState.player.stamina >= staminaCost) {
      dy -= step
      lastDirection.value = 'up'
      moved = true
    }
    if (moving.value.down && gameState.player.stamina >= staminaCost) {
      dy += step
      lastDirection.value = 'down'
      moved = true
    }
    if (moving.value.left && gameState.player.stamina >= staminaCost) {
      dx -= step
      lastDirection.value = 'left'
      moved = true
    }
    if (moving.value.right && gameState.player.stamina >= staminaCost) {
      dx += step
      lastDirection.value = 'right'
      moved = true
    }

    if (moved) {
      const magnitude = Math.sqrt(dx * dx + dy * dy)
      if (magnitude > 0) {
        dx = (dx / magnitude) * step
        dy = (dy / magnitude) * step
      }
      nextPos.x += dx
      nextPos.y += dy
      if (!checkStaticCollision(nextPos.x, nextPos.y)) {
        if (!checkEntityCollision(nextPos, enemy.value.position)) {
          characterPosition.value.x = nextPos.x
          characterPosition.value.y = nextPos.y
        } else {
          const { adjustX, adjustY } = resolveCollision(
            nextPos,
            enemy.value.position
          )
          characterPosition.value.x = nextPos.x + adjustX
          characterPosition.value.y = nextPos.y + adjustY
          if (adjustX < 0) moving.value.right = false
          if (adjustX > 0) moving.value.left = false
          if (adjustY < 0) moving.value.down = false
          if (adjustY > 0) moving.value.up = false
        }
      }
      gameState.useStamina(staminaCost)
    }
  }

  if (
    now - staminaTimer.value >= 600 &&
    gameState.player.stamina < gameState.player.maxStamina
  ) {
    gameState.recoverStamina(10)
  }

  // Atualizar quadro de animação do jogador
  const anim = animations[currentAnimation.value]
  if (now - frameTimer.value > anim.frameInterval) {
    frameTimer.value = now
    currentFrame.value++
    if (currentFrame.value >= anim.frames.length) {
      currentFrame.value = 0
      if (isAttacking.value) {
        isAttacking.value = false
        if (checkAttackHit() && enemy.value.state !== 'defeated') {
          let attackResult = { success: false, damage: 0 }
          try {
            attackResult = gameState.playerAttackAction() || {
              success: true,
              damage: 10
            }
          } catch (e) {
            console.warn(
              'playerAttackAction failed, using fallback damage:',
              e.message
            )
            attackResult = { success: true, damage: 10 }
          }
          if (attackResult.success) {
            const bossDefense = 5
            const finalDamage = Math.max(1, attackResult.damage - bossDefense)
            console.log(
              `Player attack hit Magnus! Weapon: ${
                gameState.player.equipment.weapon || 'none'
              }, Base damage: ${attackResult.damage}, Final damage: ${finalDamage}, Boss health before: ${
                gameState.boss.health
              }`
            )
            gameState.damageBoss(finalDamage)
            gameState.saveState()
            isBossDamaged.value = true
            setTimeout(() => {
              isBossDamaged.value = false
            }, 200)
            console.log(
              `Boss health after: ${gameState.boss.health}, Health bar: ${bossHealthPercent.value}%`
            )
          } else {
            console.log('Attack failed:', attackResult.message)
          }
        }
      }
    }
  }

  updateEnemy(now)
  updateProjectiles()

  animationFrameId = requestAnimationFrame(updateMovement)
}

const startMoving = (event) => {
  if (!canMove.value || showGameOver.value || showVictory.value) return
  const key = event.key.toLowerCase()

  if (key === 'e') {
    const area = isInInteractionArea()
    if (area) area.action()
  } else if (key === ' ') {
    if (gameState.player.stamina >= 10) {
      gameState.useStamina(10)
      console.log(
        `Player attacked, stamina reduced to ${gameState.player.stamina}`
      )
      isAttacking.value = true
      currentFrame.value = 0
    } else {
      console.log('Not enough stamina to attack!')
    }
  } else if (key === 'b') {
    toggleBag()
  } else if (key === 'shift') {
    isSprinting.value = true
  } else {
    if (key === 'w') moving.value.up = true
    if (key === 's') moving.value.down = true
    if (key === 'a') moving.value.left = true
    if (key === 'd') moving.value.right = true
  }
}

const stopMoving = (event) => {
  const key = event.key.toLowerCase()
  if (key === 'w') moving.value.up = false
  if (key === 's') moving.value.down = false
  if (key === 'a') moving.value.left = false
  if (key === 'd') moving.value.right = false
  if (key === 'shift') isSprinting.value = false
}

const restartGame = () => {
  if (gameState.player.lives > 0) {
    gameState.restorePlayer()
  } else {
    gameState.resetGame()
  }
  showGameOver.value = false
  showVictory.value = false
  characterPosition.value = { x: 850, y: 1100 }
  canMove.value = true
  projectiles.value = []
  enemy.value = {
    position: { x: 1200, y: 300 },
    state: 'idle',
    timer: performance.now(),
    lastShot: performance.now(),
    lastMeleeAttack: performance.now(),
    detectionRadius: 700,
    randomMoveTimer: performance.now(),
    randomDirection: { x: 0, y: 0 }
  }
  gameState.boss.health = gameState.boss.maxHealth
  gameState.boss.stamina = gameState.boss.maxStamina
  gameState.boss.phase = 1
  gameState.boss.isVulnerable = false
  isBossRecovering.value = false
  bossRecoveryStartTime.value = performance.now()
  gameState.saveState()
  frameTimer.value = performance.now()
  bossFrameTimer.value = performance.now()
  staminaTimer.value = performance.now()
  bossCurrentFrame.value = 0
  isAttacking.value = false
  bossLastDirection.value = 'down'
  animationFrameId = requestAnimationFrame(updateMovement)
}

const returnToAlbadia = () => {
  window.location.href = '/level/albadia'
}

onMounted(() => {
  const screen = document.querySelector('.castelo-screen')
  screen.focus()
  screen.addEventListener('click', () => screen.focus())

  if (checkEntityCollision(characterPosition.value, enemy.value.position)) {
    console.warn('Initial overlap detected! Repositioning player.')
    characterPosition.value.x = 850
    characterPosition.value.y = 1100
  }

  gameState.recalculateStats()
  console.log('Initial boss stats:', gameState.boss)
  console.log('Boss HUD rendered with name:', gameState.boss.name)
  console.log('Boss hitbox rendered at position:', enemy.value.position)
  console.log('Player hitbox rendered at position:', {
    x: characterPosition.value.x + 12,
    y: characterPosition.value.y + 48
  })
  frameTimer.value = performance.now()
  bossFrameTimer.value = performance.now()
  staminaTimer.value = performance.now()
  enemy.value.timer = performance.now()
  enemy.value.lastShot = performance.now()
  enemy.value.lastMeleeAttack = performance.now()
  enemy.value.randomMoveTimer = performance.now()
  bossRecoveryStartTime.value = performance.now()
  animationFrameId = requestAnimationFrame(updateMovement)
  typeLine()
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  clearInterval(typeInterval)
  clearTimeout(invulnerabilityTimer)
})
</script>

<style scoped>
.castelo-screen {
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
  outline: none;
  font-family: 'Press Start 2P', cursive;
  color: white;
}

.zoom-layer.background,
.zoom-layer.foreground {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-repeat: no-repeat;
  background-size: cover;
  filter: brightness(1.5);
}

.zoom-layer.foreground {
  pointer-events: none;
  z-index: 6;
}

.character {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  scale: 3;
  z-index: 3;
  filter: brightness(0.7);
}

.character.invulnerable {
  animation: blink 0.2s infinite;
}

@keyframes blink {
  50% {
    opacity: 0.5;
  }
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

.interaction-box {
  position: absolute;
  z-index: 1;
}

.collision-box {
  position: absolute;
  z-index: 2;
}

.enemy {
  position: absolute;
  z-index: 4;
  scale: 3.5;
  filter: brightness(0.4);
}

.enemy.damaged {
  animation: damageFlash 0.2s;
}

@keyframes damageFlash {
  0%, 100% { filter: brightness(0.6); }
  50% { filter: brightness(1) sepia(1) hue-rotate(-50deg); }
}

.boss-hitbox {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
}

.player-hitbox {
  position: absolute;
  width: 32px;
  height: 64px;
  z-index: 3;
}

.enemy-hud {
  position: absolute;
  top: -40px;
  left: 20%;
  transform: translateX(-50%);
  width: 120px;
  background-color: rgba(0, 0, 0, 0.85);
  padding: 8px;
  border: 2px solid #ffffff;
  border-radius: 8px;
  text-align: center;
  z-index: 200;
  scale: 0.5;
}

.enemy-name {
  font-family: 'Press Start 2P', cursive;
  font-size: 10px;
  color: #ffffff;
  margin-bottom: 6px;
  text-shadow: 1px 1px 0 #000;
  z-index: 200;
}

.health-bar {
  width: 100%;
  height: 12px;
  background-color: #333;
  border: 2px solid #ffffff;
  border-radius: 6px;
  margin-bottom: 6px;
}

.health-fill {
  height: 100%;
  background-color: #ff0000;
  border-radius: 4px;
  transition: width 0.2s ease;
}

.projectile {
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: rgba(255, 0, 0, 0.8);
  border: 2px solid rgba(255, 255, 0, 0.5);
  border-radius: 50%;
  z-index: 4;
}
</style>