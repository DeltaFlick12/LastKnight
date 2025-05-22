<template>
  <div class="hud">
    <div class="panel panel-left">
      <p class="stat">❤️ Vida: {{ health }}/100</p>
      <p class="stat">⚡ Stamina: {{ stamina }}/100</p>
    </div>
    <div class="panel panel-center">
      <p class="resource">🪙 Ouro: {{ gold }}</p>
      <p class="resource">🧪 Poções: {{ potions }}</p>
    </div>
    <div class="panel panel-right">
      <p class="location">📍 {{ area }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  health: Number,
  stamina: Number,
  gold: Number,
  potions: Number,
  area: String,
})
</script>

<style scoped>
.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 30px;
  background: rgba(34, 17, 5, 0.85);
  font-family: 'Press Start 2P', cursive;
  font-size: 14px;
  border-bottom: 4px solid #5c2c1d;
  box-shadow: 0 4px 12px rgba(0,0,0,0.7);
  z-index: 100;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.panel-left {
  color: #fbeec1;
}

.panel-center {
  text-align: center;
  color: #ffd700;
}

.panel-right {
  text-align: right;
  color: #d7b29d;
}

.stat,
.resource,
.location {
  margin: 0;
  text-shadow: 1px 1px 2px #000;
}
</style>