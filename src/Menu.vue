<script setup>

</script>

<template>
  <div class="menu-container">
    <img src="@/assets/Background.png" alt="Background" class="background-image" />
    <img src="@/assets/Menu.png" alt="Menu" class="menu-image" />

    <!-- Botões invisíveis -->
    <div class="btn story" @click="goTo('story')"></div>
    <div class="btn endless" @click="goTo('endless')"></div>
    <div class="btn options" @click="goTo('options')"></div>
  </div>
</template>

<style scoped>
.menu-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* CSS das imagems */
.background-image {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
}

.menu-image {
  position: absolute;
  width: 60%;
  top: 20%;
  left: 20%;
  z-index: -1;
}

/* Estilo dos botões */
.btn {
  position: absolute;
  width: 220px;
  height: 60px;
  cursor: pointer;
}

/* Posições dos botões */
.story {
  top: 40%;
  left: 40%;
}

.endless {
  top: 50%;
  left: 40%;
}

.options {
  top: 60%;
  left: 40%;
}
</style>
