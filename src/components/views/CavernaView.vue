<template>
  <transition name="fade">
    <div :class="['cave-view', { shake: isShaking }]">
      <img src="@/assets/backviews/caverna.jpg" alt="Fundo da Caverna" class="bg-image" />

      <div class="hud">
        <div>❤️ Vida: {{ playerHealth }}/100</div>
        <div>⚔️ Arma: {{ equippedWeapon }}</div>
      </div>

      <div class="battle-box">
        <div :class="['enemy', { hit: enemyHit }]">
          <h2>🔥 {{ enemy.name }}</h2>
          <p>🩸 Vida: {{ enemy.health }}/{{ enemy.maxHealth }}</p>
        </div>

        <div class="actions">
          <button @click="attackEnemy" :disabled="enemy.health <= 0 || playerHealth <= 0">Atacar</button>
          <button @click="usePotion" :disabled="potions <= 0">Usar Poção ({{ potions }})</button>
        </div>

        <p class="log animated-text">{{ battleLog }}</p>

        <button v-if="enemy.health <= 0" @click="finishBattle">🏆 Vitória! Continuar</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const playerHealth = ref(100)
const potions = ref(parseInt(localStorage.getItem('potions')) || 3)
const equippedWeapon = ref(localStorage.getItem('weapon') || 'Espada de Treinamento')

const enemy = ref({
  name: 'Demônio da Lava',
  health: 100,
  maxHealth: 100,
  attack: 18
})

const battleLog = ref('Um demônio irrompeu das chamas!')
const isShaking = ref(false)
const enemyHit = ref(false)

const playSound = (path) => {
  const sfx = new Audio(path)
  sfx.volume = 0.5
  sfx.play()
}

const attackEnemy = () => {
  const damage = equippedWeapon.value === 'Espada de Treinamento'
    ? Math.floor(Math.random() * 6 + 10)
    : Math.floor(Math.random() * 5 + 5)

  enemy.value.health = Math.max(0, enemy.value.health - damage)
  battleLog.value = `Você causou ${damage} de dano ao ${enemy.value.name}!`

  enemyHit.value = true
  playSound('/sfx/attack.wav')

  setTimeout(() => {
    enemyHit.value = false
    if (enemy.value.health > 0) {
      enemyAttack()
    }
  }, 300)
}

const enemyAttack = () => {
  const damage = Math.floor(Math.random() * 6 + enemy.value.attack)
  playerHealth.value = Math.max(0, playerHealth.value - damage)
  battleLog.value = `${enemy.value.name} atacou e causou ${damage} de dano!`

  isShaking.value = true
  setTimeout(() => (isShaking.value = false), 400)
  playSound('/sfx/hit.wav')
}

const usePotion = () => {
  if (potions.value > 0 && playerHealth.value < 100) {
    playerHealth.value = Math.min(100, playerHealth.value + 30)
    potions.value--
    localStorage.setItem('potions', potions.value)
    battleLog.value = 'Você usou uma poção!'
    playSound('/sfx/potion.wav')
  }
}

const finishBattle = () => {
  playSound('/sfx/victory.wav')
  localStorage.setItem('progress', 'caverna-concluida')
  setTimeout(() => router.push('/map'), 1000)
}
</script>

<style scoped>
html, body {
  overflow: hidden;
  height: 100%;
  margin: 0;
}

.cave-view {
  position: relative;
  height: 100vh;
  width: 100vw;
  color: white;
  font-family: 'Press Start 2P', cursive;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 30px;
  overflow: hidden;
  animation: fadeInSmooth 0.6s ease-out;
}

.bg-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  filter: brightness(0.85);
}

.hud {
  background-color: rgba(0, 0, 0, 0.6);
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
  box-shadow: 0 0 10px #000;
}

.battle-box {
  background-color: rgba(0, 0, 0, 0.65);
  padding: 20px;
  border: 2px solid #b64e1a;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 0 15px #000;
  animation: fadeIn 0.6s ease;
}

.enemy.hit {
  animation: flash 0.3s linear;
}

@keyframes flash {
  0% { filter: brightness(2) }
  50% { filter: brightness(0.5) }
  100% { filter: brightness(1) }
}

.shake {
  animation: shake 0.3s;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-3px); }
  100% { transform: translateX(0); }
}

.actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 20px 0;
  flex-wrap: wrap;
}

button {
  background-color: #b64e1a;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

button:hover {
  background-color: #c85d27;
  transform: scale(1.05);
}

.log {
  font-size: 12px;
  margin-top: 10px;
  min-height: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInSmooth {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
