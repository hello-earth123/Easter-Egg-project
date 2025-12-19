export function createPlayerAnims(scene) {
  const keys = ["player_walk", "player_hit", "player_death", "player_cast_small", "player_buff", "player_cast_big"]

  keys.forEach((key) => {
    if (!scene.scene.manager.keys[key]){
      switch (key){
        case "player_walk":
          scene.anims.create({
            key: "player_walk",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                start: 0,
                end: 5,
            }),
            frameRate: 10,
            repeat: -1,
          });
          break;
        case "player_hit":
          scene.anims.create({
            key: "player_hit",
            frames: scene.anims.generateFrameNumbers("playerSheet", {
                start: 30,
                end: 32,
            }),
            frameRate: 12,
            repeat: 0
          });
          break;
        case "player_death":
            scene.anims.create({
              key: "player_death",
              frames: scene.anims.generateFrameNumbers("playerSheet", {
                  start: 36,
                  end: 40,
              }),
              frameRate: 8,
              repeat: 0
            });
          break;
        case "player_cast_small":
            scene.anims.create({
                key: "player_cast_small",
                frames: scene.anims.generateFrameNumbers("playerSheet", { start: 18, end: 21 }),
                frameRate: 12,
                repeat: 0
            });
          break;
        case "player_buff":
          scene.anims.create({
              key: "player_buff",
              frames: scene.anims.generateFrameNumbers("playerSheet", { start: 24, end: 27 }),
              frameRate: 10,
              repeat: 0
          });
          break;
        case "player_cast_big":
          scene.anims.create({
              key: "player_cast_big",
              frames: scene.anims.generateFrameNumbers("playerSheet", { start: 42, end: 47 }),
              frameRate: 10,
              repeat: 0
          });
          break;
      }
    }
  })
}
