<template>
  <div id="game-container"></div>
</template>

<script>
import Phaser from "phaser";
import MainScene from "../phaser/scenes/MainScene";

export default {
  mounted() {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: "game-container",
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 } },
      },
      scene: [MainScene],
    };
    new Phaser.Game(config);
  },
};
</script>

<style>
#game-container {
  width: 100%;
  height: 100%;
}
</style>
