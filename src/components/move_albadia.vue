<template>
  <canvas ref="gameCanvas" class="game-canvas"></canvas>
</template>

<script>
export default {
  name: "GameCanvas",
  data() {
    return {
      canvas: null,
      ctx: null,
      background: new Image(),
      foreground: new Image(),
      player: {
        x: 2500,
        y: 1700,
        size: 30,
        color: "red",
        speed: 5
      },
      keys: { w: false, a: false, s: false, d: false },
      obstacles: [
        { x: 480, y: 380, width: 480, height: 180 },
        { x: 1310, y: 820, width: 350, height: 150 },
        { x: 2080, y: 590, width: 330, height: 140 },
        { x: 1165, y: 1300, width: 290, height: 20 },
        { x: 1155, y: 1320, width: 315, height: 25 },
        { x: 1145, y: 1345, width: 335, height: 120 },
        { x: 1165, y: 1465, width: 290, height: 20 },
        { x: 400, y: 1545, width: 310, height: 20 },
        { x: 380, y: 1545, width: 20, height: 320 },
        { x: 400, y: 1810, width: 310, height: 55 }
      ],
      world: { width: 3000, height: 2000 },
      imagesLoaded: 0
    };
  },
  mounted() {
    this.canvas = this.$refs.gameCanvas;
    this.ctx = this.canvas.getContext("2d");
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvas);
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);

    this.background.src = "/assets/backviews/albadia-cidade.png";
    this.foreground.src = "/assets/backviews/detalhes-albadia.png";
    this.background.onload = this.onImageLoad;
    this.foreground.onload = this.onImageLoad;
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.resizeCanvas);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
  },
  methods: {
    resizeCanvas() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },
    onImageLoad() {
      this.imagesLoaded++;
      if (this.imagesLoaded === 2) {
        this.world.width = this.background.width;
        this.world.height = this.background.height;
        this.gameLoop();
      }
    },
    handleKeyDown(e) {
      const key = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) this.keys[key] = true;
    },
    handleKeyUp(e) {
      const key = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) this.keys[key] = false;
    },
    isColliding(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.size > b.x &&
        a.y < b.y + b.height &&
        a.y + a.size > b.y
      );
    },
    movePlayer(dx, dy) {
      const next = {
        x: this.player.x + dx,
        y: this.player.y + dy,
        size: this.player.size
      };
      for (const block of this.obstacles) {
        if (this.isColliding(next, block)) return;
      }
      this.player.x = Math.max(0, Math.min(this.world.width - this.player.size, next.x));
      this.player.y = Math.max(0, Math.min(this.world.height - this.player.size, next.y));
    },
    update() {
      if (this.keys.w) this.movePlayer(0, -this.player.speed);
      if (this.keys.s) this.movePlayer(0, this.player.speed);
      if (this.keys.a) this.movePlayer(-this.player.speed, 0);
      if (this.keys.d) this.movePlayer(this.player.speed, 0);
    },
    getCameraPosition() {
      const camX = Math.max(0, Math.min(this.player.x - this.canvas.width / 2, this.world.width - this.canvas.width));
      const camY = Math.max(0, Math.min(this.player.y - this.canvas.height / 2, this.world.height - this.canvas.height));
      return { x: camX, y: camY };
    },
    draw() {
      const camera = this.getCameraPosition();
      this.ctx.drawImage(this.background, camera.x, camera.y, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);
      const playerScreenX = this.player.x - camera.x;
      const playerScreenY = this.player.y - camera.y;
      this.ctx.fillStyle = this.player.color;
      this.ctx.fillRect(playerScreenX, playerScreenY, this.player.size, this.player.size);
      this.ctx.drawImage(this.foreground, camera.x, camera.y, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
      for (const block of this.obstacles) {
        this.ctx.fillRect(block.x - camera.x, block.y - camera.y, block.width, block.height);
      }
    },
    gameLoop() {
      this.update();
      this.draw();
      requestAnimationFrame(this.gameLoop);
    }
  }
};
</script>

<style scoped>
.game-canvas {
  display: block;
  background-color: #1e1e1e;
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
  width: 100%;
}
</style>
