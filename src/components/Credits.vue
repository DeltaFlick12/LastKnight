<template>
  <div class="credits">
    <h1>🎉 Parabéns!</h1>
    <p>Você derrotou Magnus e salvou o reino!</p>
    <button @click="$router.push('/')">Voltar ao Menu</button>
  </div>
</template>

<style scoped>
.credits {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: black;
  color: white;
  font-family: 'Press Start 2P', cursive;
  text-align: center;
}
</style>