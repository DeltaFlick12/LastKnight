<template>
  <div class="story-container">
    <img src="@/assets/background.png" alt="Background" class="background-image" />
    <div class="story-content">
      <h1>Modo História</h1>
      <p>Aqui começa a jornada...</p>
    </div>
  </div>
</template>

<style scoped>
.story-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  font-family: 'Georgia', serif;
  color: white;
  text-shadow: 1px 1px 2px #000;
}

.background-image {
  position: fixed;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  filter: blur(2px);
  margin-left: -7px;
  margin-top: -7px;
}

.story-content {
  position: absolute;
  top: 30%;
  left: 10%;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 30px;
  border-radius: 12px;
  max-width: 600px;
}

.story-content h1 {
  font-size: 3rem;
  margin-bottom: 20px;
}

.story-content p {
  font-size: 1.5rem;
}
</style>
