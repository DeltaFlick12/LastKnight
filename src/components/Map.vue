<template>
  <div class="map-screen">
    <img src="@/assets/Mapa_rpg_2.jpg" class="map-image" alt="Mapa de Albadia" />

    <!-- Pontos de texto clicáveis -->
    <div
      v-for="(loc, index) in locations"
      :key="index"
      class="map-point"
      :style="{ top: loc.top, left: loc.left }"
      :class="{ unlocked: loc.unlocked }"
      @click="goToLocation(loc)"
    >
      {{ loc.name }}
    </div>

    <button class="back-btn" @click="goBack">Voltar</button>
  </div>
</template>

<<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const locations = ref([
  { name: 'Albadia', top: '10%', left: '15%', route: '/level/albadia', unlocked: true },
  { name: 'Floresta', top: '30%', left: '35%', route: '/level/floresta', unlocked: true },
  { name: 'Caverna', top: '80%', left: '44%', route: '/level/caverna', unlocked: false },
  { name: 'Rio', top: '52%', left: '32%', route: '/level/rio', unlocked: false },
  { name: 'Ruínas', top: '75%', left: '60%', route: '/level/ruinas', unlocked: false },
  { name: 'Castelo', top: '75%', left: '82%', route: '/level/castelo', unlocked: false },
])

const updateUnlockedLocations = () => {
  const progress = localStorage.getItem('progress')

  // Floresta já começa desbloqueada
  if (progress === 'floresta-concluida') {
    locations.value[1].unlocked = true // Rio
  }
  if (progress === 'rio-concluido') {
    locations.value[1].unlocked = true // Rio
    locations.value[2].unlocked = true // Ruínas
  }
  if (progress === 'ruinas-concluidas') {
    locations.value[1].unlocked = true
    locations.value[2].unlocked = true
    locations.value[3].unlocked = true // Castelo
  }
}

const goToLocation = (loc) => {
  if (loc.unlocked) {
    router.push(loc.route)
  } else {
    alert('Área bloqueada! Termine a anterior.')
  }
}

const goBack = () => {
  router.push('/story')
}

onMounted(() => {
  updateUnlockedLocations()
})
</script>


<style scoped>
.map-screen {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Press Start 2P', cursive;
}

.map-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.9);
}

.map-point {
  position: absolute;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.6);
  padding: 5px 10px;
  border: 2px solid red;
  border-radius: 8px;
  color: white;
  font-size: 12px;
  pointer-events: none;
  opacity: 0.5;
  transition: 0.3s ease;
}

.map-point.unlocked {
  border-color: gold;
  opacity: 1;
  cursor: pointer;
  pointer-events: auto;
}

.map-point.unlocked:hover {
  background-color: rgba(0, 0, 0, 0.8);
  transform: translate(-50%, -50%) scale(1.1);
}

.back-btn {
  position: absolute;
  bottom: 20px;
  left: 20px;
  padding: 10px 20px;
  background-color: #8b5e3c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>
