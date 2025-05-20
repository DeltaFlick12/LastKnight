<template>
  <div class="class-select">
    <div class="left-panel">
      <h1>Escolha sua Classe</h1>
      <input
        v-model="playerName"
        placeholder="Digite seu nome"
        class="name-input"
      />
      <div class="classes">
        <div
          v-for="c in classes"
          :key="c.name"
          :class="['card', selectedClass?.name === c.name ? 'selected' : '']"
          @click="selectClass(c)"
        >
          <img :src="c.icon" :alt="`Ícone de ${c.name}`" />
          <h2>{{ c.name }}</h2>
          <p>{{ c.desc }}</p>
        </div>
      </div>
    </div>

    <div class="right-panel" v-if="selectedClass">
      <h2>{{ selectedClass.name }}</h2>

      <div class="radar-chart">
        <canvas ref="radarCanvas"></canvas>
      </div>

      <div class="info">
        <p><strong>Dificuldade:</strong> {{ selectedClass.difficulty }}</p>
        <p><strong>Traits:</strong> {{ selectedClass.traits }}</p>
        <p><strong>Arma:</strong> {{ selectedClass.weapon }}</p>
      </div>

      <button
        :disabled="!playerName || !selectedClass"
        @click="confirmSelection"
      >
        Selecionar
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Chart from 'chart.js/auto'

const router = useRouter()
const playerName = ref('')
const selectedClass = ref(null)
const radarCanvas = ref(null)
let radarChart = null

const classes = ref([
  {
    name: 'Guerreiro',
    desc: 'Equilibrado e fácil de jogar.',
    icon: '/icons/guerreiro.png',
    difficulty: '★★☆☆☆',
    traits: 'Equilíbrio • Iniciação',
    weapon: 'Espada e Escudo',
    stats: { Ataque: 60, Defesa: 80, Magia: 30, Mobilidade: 50, Suporte: 40, Controle: 60 },
  },
  {
    name: 'Arqueiro',
    desc: 'Rápido e preciso à distância.',
    icon: '/icons/arqueiro.png',
    difficulty: '★★★☆☆',
    traits: 'Velocidade • Crítico',
    weapon: 'Arco Longo',
    stats: { Ataque: 75, Defesa: 40, Magia: 20, Mobilidade: 80, Suporte: 20, Controle: 60 },
  },
  {
    name: 'Mago',
    desc: 'Ataques mágicos poderosos em área.',
    icon: '/icons/mago.png',
    difficulty: '★★★★☆',
    traits: 'Explosão • Alcance',
    weapon: 'Cajado Arcano',
    stats: { Ataque: 90, Defesa: 30, Magia: 95, Mobilidade: 30, Suporte: 50, Controle: 80 },
  },
  {
    name: 'Shielder',
    desc: 'Tanque com muita defesa.',
    icon: '/icons/shielder.png',
    difficulty: '★★☆☆☆',
    traits: 'Resistência • Defesa',
    weapon: 'Grande Escudo',
    stats: { Ataque: 30, Defesa: 95, Magia: 10, Mobilidade: 30, Suporte: 70, Controle: 60 },
  },
])

const drawRadar = () => {
  const stats = selectedClass.value.stats
  const labels = Object.keys(stats)
  const data = Object.values(stats)

  if (radarChart) radarChart.destroy()

  radarChart = new Chart(radarCanvas.value, {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          label: 'Atributos',
          data,
          fill: true,
          backgroundColor: 'rgba(255, 215, 0, 0.3)',
          borderColor: '#FFD700',
          pointBackgroundColor: '#FFD700',
        },
      ],
    },
    options: {
      scales: {
        r: {
          angleLines: { display: false },
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: { display: false },
          grid: { color: '#444' },
          pointLabels: { color: '#fff' },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  })
}

const selectClass = (c) => {
  selectedClass.value = c
}

const confirmSelection = () => {
  localStorage.setItem('playerClass', selectedClass.value.name)
  localStorage.setItem('playerName', playerName.value)
  router.push('/tutorial')
}

watch(selectedClass, () => {
  if (selectedClass.value) drawRadar()
})

onMounted(() => {
  if (selectedClass.value) drawRadar()
})
</script>

<style scoped>
.class-select {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px;
  gap: 60px;
  background: linear-gradient(180deg, #0c0c0c 0%, #1c1c1c 100%);
  color: #fff;
  min-height: 100vh;
  font-family: 'Cinzel', serif;
}

.left-panel {
  flex: 1;
  max-width: 500px;
  text-align: center;
}

.name-input {
  width: 100%;
  padding: 10px 20px;
  margin: 20px 0;
  border: 2px solid #FFD700;
  background: transparent;
  color: white;
  font-size: 16px;
  border-radius: 8px;
}

.classes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}

.card {
  background: #1f1f1f;
  border: 2px solid #8b5e3c;
  border-radius: 12px;
  padding: 15px;
  width: 180px;
  transition: 0.3s;
  cursor: pointer;
  box-shadow: 0 0 5px transparent;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 10px #ffd70060;
}
.card.selected {
  border-color: #FFD700;
  box-shadow: 0 0 15px #ffd700a0;
}
.card img {
  width: 100%;
  height: 100px;
  object-fit: contain;
}
.card h2 {
  margin-top: 10px;
  color: #FFD700;
}
.card p {
  font-size: 14px;
  color: #ccc;
}

.right-panel {
  background: #141414;
  border: 2px solid #FFD700;
  border-radius: 15px;
  padding: 30px;
  width: 350px;
  box-shadow: 0 0 20px #ffd70020;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.radar-chart {
  width: 100%;
  height: 250px;
}
.radar-chart canvas {
  width: 100% !important;
  height: 100% !important;
}

.info p {
  margin: 4px 0;
  font-size: 15px;
}
button {
  background: #FFD700;
  color: #000;
  border: none;
  padding: 12px;
  font-weight: bold;
  font-size: 16px;
  border-radius: 8px;
  transition: background 0.2s;
  cursor: pointer;
}
button:hover {
  background: #e0b800;
}
button:disabled {
  background: #555;
  cursor: not-allowed;
}
</style>
