<script setup>

</script>

<template>
  <div class="menu-container">
    <img src="@/assets/Background.png" alt="Background" class="background-image" />
    <img src="@/assets/Menu.png" alt="Menu" class="menu-image" />
    <img src="@/assets/rio.gif" alt="Rio" class="background-image" />

    <!-- Botões invisíveis -->
    <div class="btn story" @click="goTo('story')"></div>
    <div class="btn endless" @click="goTo('endless')"></div>
    <div class="btn options" @click="goTo('options')"></div>
  </div>
</template>

<style scoped>
.menu-container {
  position: cover;
  width: 100%;
  height: 100%;
  overflow-y: hidden;
  overflow-x: hidden;
}

/* CSS das imagems */
.background-image {
  position:fixed;
  width: 100%;
  height: 100%;
  object-fit:cover;
  z-index: -2;
  filter: blur(2px);
  overflow: hidden;
  overflow-y: hidden;
  margin-left: -7px;
  margin-top: -7px;
}

.menu-image {
  position: absolute;
  width: 60%;
  top: 20%;
  left: 20%;
  z-index: -1;
  overflow: hidden;
  overflow-y: hidden;
}

/* Estilo dos botões */
.btn {
  position: absolute;
  width: 220px;
  height: 60px;
  cursor: pointer;
  overflow-y: hidden;
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

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
