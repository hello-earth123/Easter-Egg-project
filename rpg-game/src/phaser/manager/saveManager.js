import { getCurrentScene } from "./sceneRegistry";

function collectPlayerData(skillState) {
    const scene = getCurrentScene();
    return {
        stats: scene.playerStats,
        inventory: scene.inventoryData,
        slots: scene.slotData,
        scene: scene.scene.key,
        skill: skillState
    };
}

export function saveGame(skillState) {
    const data = collectPlayerData(skillState);
    const scene = getCurrentScene();
    
    fetch("http://127.0.0.1:8000/api/save_game/3/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(() => {
        console.log("게임 저장 완료!");
        scene.textBar = "게임이 저장되었습니다!";
    })
    .catch(err => console.error(err));
}

// saveManager.js에 추가해야 하는 함수
export async function loadGame() {
    const res = await fetch("http://127.0.0.1:8000/api/save_game/3/");
    const data = await res.json();
    return data; 
}