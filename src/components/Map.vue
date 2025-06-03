<template>
  <div class="map-screen" role="region" aria-label="Mapa Interativo de Albadia">
    <img src="@/assets/Mapa.png" class="map-image" alt="Mapa de Albadia" @load="onImageLoad" />

    <!-- Áreas clicáveis do mapa -->
    <div
      v-for="(area, index) in areas"
      :key="index"
      class="map-area"
      :style="{ top: area.top, left: area.left, width: area.width, height: area.height }"
      :class="{ unlocked: area.unlocked, locked: !area.unlocked, 'newly-unlocked': area.newlyUnlocked }"
      @click="goToArea(area)"
      role="button"
      :aria-label="area.unlocked ? `Ir para ${area.name}` : `${area.name} (bloqueado)`"
      :tabindex="area.unlocked ? 0 : -1"
      @keydown.enter="goToArea(area)"
      @mouseover="showTooltip(area)"
      @mouseout="hideTooltip"
    >
      <!-- Removido o <span class="area-label">{{ area.name }}</span> -->
      <span v-if="area.unlocked && area.showTooltip" class="tooltip">
        {{ area.description }}
      </span>
    </div>

    <button class="back-btn" @click="goBack" aria-label="Voltar para a história" tabindex="0">
      Voltar
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Definição das áreas com coordenadas ajustadas para a nova imagem
const areas = ref([
  {
    name: 'Reino Albadia',
    top: '65%', // Ajustado para alinhar com a posição na imagem
    left: '14%',
    width: '25%',
    height: '30%',
    route: '/level/albadia',
    unlocked: true,
    description: 'A cidade central de Albadia.',
    newlyUnlocked: false,
    showTooltip: false,
  },
  {
    name: 'Floresta',
    top: '15%',
    left: '10%',
    width: '35%',
    height: '30%',
    route: '/level/floresta',
    unlocked: true,
    description: 'Uma floresta misteriosa.',
    newlyUnlocked: false,
    showTooltip: false,
  },
  {
    name: 'Rio',
    top: '60%',
    left: '39%',
    width: '15%',
    height: '15%',
    route: '/level/rio',
    unlocked: true,
    description: 'Um rio cristalino.',
    newlyUnlocked: false,
    showTooltip: false,
  },
  {
    name: 'Ruínas',
    top: '65%',
    left: '51%',
    width: '20%',
    height: '30%',
    route: '/level/ruinas',
    unlocked: true,
    description: 'Restos de uma civilização antiga.',
    newlyUnlocked: false,
    showTooltip: false,
  },
  {
    name: 'Caverna',
    top: '52%',
    left: '66%',
    width: '25%',
    height: '30%',
    route: '/level/caverna',
    unlocked: true,
    description: 'Uma caverna sombria.',
    newlyUnlocked: false,
    showTooltip: false,
  },
  {
    name: 'Montanha Glacial',
    top: '25%',
    left: '46%',
    width: '23%',
    height: '30%',
    route: '/level/montanha',
    unlocked: true,
    description: 'Picos gelados e perigosos.',
    newlyUnlocked: false,
    showTooltip: false,
  },
  {
    name: 'Castelo de Magnus',
    top: '10%',
    left: '57%',
    width: '35%',
    height: '30%',
    route: '/level/castelo',
    unlocked: true,
    description: 'Um castelo imponente.',
    newlyUnlocked: false,
    showTooltip: false,
  },
]);

// Atualiza as áreas desbloqueadas com base no progresso
const updateUnlockedAreas = () => {
  const progress = localStorage.getItem('progress');
  const previousProgress = localStorage.getItem('previousProgress') || '';

  areas.value.forEach((area) => {
    area.newlyUnlocked = false; // Reseta o estado de novo desbloqueio
  });

  if (progress === 'floresta-concluida' && previousProgress !== progress) {
    areas.value.find((a) => a.name === 'Rio').unlocked = true;
    areas.value.find((a) => a.name === 'Rio').newlyUnlocked = true;
  }
  if (progress === 'rio-concluido' && previousProgress !== progress) {
    areas.value.find((a) => a.name === 'Rio').unlocked = true;
    areas.value.find((a) => a.name === 'Ruínas').unlocked = true;
    areas.value.find((a) => a.name === 'Ruínas').newlyUnlocked = true;
  }
  if (progress === 'ruinas-concluidas' && previousProgress !== progress) {
    areas.value.find((a) => a.name === 'Rio').unlocked = true;
    areas.value.find((a) => a.name === 'Ruínas').unlocked = true;
    areas.value.find((a) => a.name === 'Caverna').unlocked = true;
    areas.value.find((a) => a.name === 'Montanha Glacial').unlocked = true;
    areas.value.find((a) => a.name === 'Castelo de Magnus').unlocked = true;
    areas.value.find((a) => a.name === 'Caverna').newlyUnlocked = true;
  }

  localStorage.setItem('previousProgress', progress);
};

// Navega para a área selecionada
const goToArea = (area) => {
  if (!area.unlocked) {
    alert('Área bloqueada! Complete a anterior.');
    return;
  }
  if (confirm(`Deseja viajar para ${area.name}?`)) {
    router.push(area.route);
  }
};

// Volta para a história
const goBack = () => {
  router.push('/level/albadia');
};

// Animação ao carregar a imagem
const onImageLoad = () => {
  const mapImage = document.querySelector('.map-image');
  mapImage.classList.add('loaded');
};

// Gerencia tooltips
const showTooltip = (area) => {
  if (area.unlocked) {
    area.showTooltip = true;
  }
};

const hideTooltip = () => {
  areas.value.forEach((area) => (area.showTooltip = false));
};

// Inicializa ao montar o componente
onMounted(() => {
  updateUnlockedAreas();
});

// Observa mudanças no localStorage para atualizar dinamicamente
watch(
  () => localStorage.getItem('progress'),
  () => {
    updateUnlockedAreas();
  }
);
</script>

<style scoped>
.map-screen {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1a1a1a;
}

.map-image {
  width: 90%;
  height: 1000%;
  object-fit: contain;
  filter: brightness(0.9);
  border: 3px solid #4a4a4a;
  border-radius: 10px;
  transition: transform 0.5s ease;
}

.map-image.loaded {
  transform: scale(1.02);
}

.map-area {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  pointer-events: none;
}

.map-area.unlocked {
  cursor: pointer;
  pointer-events: auto;
}

.map-area.unlocked:hover .area-label {
  background-color: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.map-area.locked {
  filter: brightness(0.4);
  cursor: not-allowed;
}

.map-area.newly-unlocked .area-label {
  animation: pulse 1.5s infinite;
}

.area-label {
  position: relative;
  padding: 5px 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: 2px solid #ffd700;
  border-radius: 5px;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
  pointer-events: auto;
  text-shadow: 1px 1px 2px black;
  display: none;
}

.tooltip {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
}

.back-btn {
  position: absolute;
  bottom: 20px;
  left: 20px;
  padding: 12px 24px;
  background-color: #8b5e3c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background-color: #a67c52;
  transform: scale(1.05);
}

.back-btn:focus {
  outline: 2px solid #ffd700;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 215, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .map-image {
    width: 100%;
    height: 100%;
  }

  .area-label {
    font-size: 12px;
    padding: 4px 8px;
  }

  .tooltip {
    font-size: 10px;
    top: -30px;
  }

  .back-btn {
    padding: 10px 20px;
    font-size: 14px;
    font-family: 'MedievalSharp';
  }
}
</style>