<template>
  <div class="forest-view">
    <div class="hud">
      <div>❤️ Vida: {{ playerHealth }}/100</div>
      <div>⚔️ Arma: {{ equippedWeapon }}</div>
    </div>

    <div class="battle-box">
      <div class="enemy">
        <h2>👹 {{ enemy.name }}</h2>
        <p>🩸 Vida: {{ enemy.health }}/{{ enemy.maxHealth }}</p>
      </div>

      <div class="actions">
        <button @click="attackEnemy" :disabled="enemy.health <= 0 || playerHealth <= 0">Atacar</button>
        <button @click="usePotion" :disabled="potions <= 0">Usar Poção ({{ potions }})</button>
      </div>

      <p class="log">{{ battleLog }}</p>

      <button v-if="enemy.health <= 0" @click="finishBattle">🏆 Vitória! Continuar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const playerHealth = ref(100)
const potions = ref(parseInt(localStorage.getItem('potions')) || 3)
const equippedWeapon = ref(localStorage.getItem('weapon') || 'Espada de Treinamento')

const enemy = ref({
  name: 'Goblin',
  health: 60,
  maxHealth: 60,
  attack: 12
})

const battleLog = ref('Um goblin selvagem apareceu!')

const attackEnemy = () => {
  const damage = equippedWeapon.value === 'Espada de Treinamento'
    ? Math.floor(Math.random() * 6 + 10)
    : Math.floor(Math.random() * 5 + 5)

  enemy.value.health = Math.max(0, enemy.value.health - damage)
  battleLog.value = `Você causou ${damage} de dano ao ${enemy.value.name}!`

  if (enemy.value.health > 0) {
    setTimeout(enemyAttack, 1000)
  }
}

const enemyAttack = () => {
  const damage = Math.floor(Math.random() * 6 + enemy.value.attack)
  playerHealth.value = Math.max(0, playerHealth.value - damage)
  battleLog.value = `${enemy.value.name} atacou e causou ${damage} de dano!`
}

const usePotion = () => {
  if (potions.value > 0 && playerHealth.value < 100) {
    playerHealth.value = Math.min(100, playerHealth.value + 30)
    potions.value--
    localStorage.setItem('potions', potions.value)
    battleLog.value = 'Você usou uma poção!'
  }
}

const finishBattle = () => {
  localStorage.setItem('progress', 'floresta-concluida')
  router.push('/map')
}
</script>

<style scoped>
.forest-view {
  padding: 30px;
  background: linear-gradient(to bottom, #0a3614, #06240f);
  color: white;
  font-family: 'Press Start 2P', cursive;
  height: 100vh;
}

.hud {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  background-color: rgba(0, 0, 0, 0.4);
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.battle-box {
  background-color: rgba(0, 0, 0, 0.5);
  padding: 20px;
  border: 2px solid #8b5e3c;
  border-radius: 12px;
  max-width: 500px;
  margin: auto;
  text-align: center;
}

.enemy h2 {
  margin-bottom: 5px;
}

.actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 20px 0;
}

button {
  background-color: #8b5e3c;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}

.log {
  font-size: 12px;
  margin-top: 10px;
}
</style>
