<template>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap" rel="stylesheet">

  <div class="hud">
    <div class="panel panel-left">
      <p class="stat vida">❤️ Vida: {{ health }}/100</p>
      <p class="stat energia">⚡ Energia: {{ stamina }}/100</p>
      <p class="resource ouro">🥇 Ouro: {{ gold }}</p>
      <p class="resource potions">🧪 Poções: {{ potions }}</p>
      <p class="loc">📍 {{ area }}</p>
    </div>
    <p class="fps">{{ fps }} FPS</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  health: Number,
  stamina: Number,
  gold: Number,
  potions: Number,
  area: String,
})

const fps = ref(0)
let frameCount = 0
let lastTime = performance.now()

onMounted(() => {
  function updateFPS() {
    const now = performance.now()
    frameCount++
    if (now - lastTime >= 1000) {
      fps.value = frameCount
      frameCount = 0
      lastTime = now
    }
    requestAnimationFrame(updateFPS)
  }
  updateFPS()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');

.hud {
  position: fixed;
  top: 0px;
  left: -10px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 12px 24px;
  font-family: 'Cinzel', serif;
  font-size: 14px;
  z-index: 1000;
  letter-spacing: 0.5px;
  flex-direction: column;
}

.loc {
  position: fixed;
  top: 0px;
  right: 10px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 12px 24px;
  font-family: 'Cinzel', serif;
  font-size: 14px;
  z-index: 1000;
  letter-spacing: 0.5px;
  flex-direction: column;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 300px;
}

.panel-left {
  color: #f0d9a9;
}

.stat,
.resource,
.location {
  margin: 0;
  padding: 6px 10px;
  border-radius: 5px;
  box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.1);
  text-shadow: 1px 1px 1px #000;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

/* Fundo colorido leve para cada item */
.vida {
  background: rgba(255, 0, 0, 1); /* Vermelho claro */
  border-color: rgba(255, 0, 0, 0.3);
}

.energia {
  background: rgba(255, 255, 0, 0.45); /* Amarelo claro */
  border-color: rgba(255, 255, 0, 0.3);
}

.ouro {
  background: rgba(255, 255, 255, 1); /* Branco claro */
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff; /* Ajuste cor do texto para melhor visibilidade */
  text-shadow: 1px 1px 2px #000;
}

.potions {
  background: rgba(0, 255, 0, 0.45); /* Verde claro */
  border-color: rgba(0, 255, 0, 0.3);
}

/* Adiciona espaçamento e estilo aos ícones */
.stat::before,
.resource::before,
.location::before {
  font-size: 1.2em;
  display: inline-block;
}

/* FPS visual melhorado */
.fps {
  position: absolute;
  bottom: 550px;
  left: -1060px;
  transform: translateX(-50%);
  font-size: 20px;
  color: #caffc6;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid #76c976;
  font-family: monospace;
  box-shadow: 0 0 5px #76c976;
  z-index: 5;
}
</style>
