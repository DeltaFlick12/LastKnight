<template>
  <div class="class-select">
    <h1>Escolha sua Classe</h1>
    <div class="classes">
      <div v-for="c in classes" :key="c.name" class="card" @click="selectClass(c)">
        <h2>{{ c.name }}</h2>
        <p>{{ c.desc }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const classes = ref([
  { name: 'Guerreiro', desc: 'Equilibrado e fácil de jogar.' },
  { name: 'Arqueiro', desc: 'Rápido e preciso à distância.' },
  { name: 'Mago', desc: 'Ataques mágicos poderosos em área.' },
  { name: 'Shielder', desc: 'Tanque com muita defesa.' },
])

const selectClass = (chosen) => {
  localStorage.setItem('playerClass', chosen.name)
  router.push('/story') // vai para o jogo
}
</script>

<style scoped>
.class-select {
  padding: 30px;
  text-align: center;
  background-color: black;
  color: white;
  height: 100vh;
}
.classes {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
}
.card {
  background: #1e1e1e;
  border: 2px solid #8b5e3c;
  border-radius: 10px;
  padding: 20px;
  width: 200px;
  cursor: pointer;
  transition: 0.2s;
}
.card:hover {
  background: #333;
}
</style>