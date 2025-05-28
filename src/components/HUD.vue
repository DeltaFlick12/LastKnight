<template>
  <div class="hud">
    <div class="hud-box left">
      <div class="hud-label">Status</div>
      <p>❤️ Vida: <span>{{ health }}/100</span></p>
      <p>⚡ Stamina: <span>{{ stamina }}/100</span></p>
    </div>

    <div class="hud-box center">
      <div class="hud-label">Recursos</div>
      <p>🪙 Ouro: <span>{{ gold }}</span></p>
      <p>🧪 Poções: <span>{{ potions }}</span></p>
    </div>

    <div class="hud-box right">
      <div class="hud-label">Local</div>
      <p>📍 <span>{{ area }}</span></p>
    </div>
<<<<<<< Updated upstream
=======

    <p class="fps">{{ fps }} FPS</p>
>>>>>>> Stashed changes
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
  width: 100%;
  padding: 10px 30px;
  display: flex;
  justify-content: space-between;
<<<<<<< Updated upstream
  align-items: flex-start;
  padding: 12px 30px;
  background: rgba(34, 17, 5, 0.85);
  font-family: 'Press Start 2P', cursive;
  font-size: 14px;
  border-bottom: 4px solid #5c2c1d;
  box-shadow: 0 4px 12px rgba(0,0,0,0.7);
  z-index: 100;
=======
  z-index: 1000;
  font-family: 'Press Start 2P', cursive;
  image-rendering: pixelated;
>>>>>>> Stashed changes
}

.hud-box {
  background: url('/img/ui/pergaminho.png') repeat;
  border: 3px solid #af8a58;
  padding: 14px 20px;
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0,0,0,0.6);
  min-width: 180px;
  color: #f8e3b7;
  text-shadow: 1px 1px 1px #000;
}

.hud-box.left {
  border-left: 6px solid #b53a3a;
}

.hud-box.center {
  text-align: center;
  border-left: 6px solid #d4a127;
}

.hud-box.right {
  text-align: right;
  border-left: 6px solid #3e9356;
}

.hud-label {
  font-size: 13px;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: #ffe9b5;
  border-bottom: 1px solid #e0c48f;
  padding-bottom: 4px;
}

.hud p {
  margin: 4px 0;
  font-size: 12px;
}

.hud p span {
  font-weight: bold;
  color: #fffbe0;
}
<<<<<<< Updated upstream
</style>
=======

.fps {
  position: absolute;
  bottom: 12px;
  left: 12px;
  font-size: 12px;
  color: #b6ffba;
  background: rgba(0, 0, 0, 0.4);
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #76c976;
  z-index: 1001;
}
</style>
>>>>>>> Stashed changes
