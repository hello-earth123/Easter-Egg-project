export default class CutscenePlayer {
    constructor(scene) {
        this.scene = scene;
        this.ui = scene.dialogueUI;
    }

    async play(script) {
        // 컷씬, 대화창 활성화 (space바 키)
        this.scene.dialogueActive = true;
        // 플레이어 못움직이게
        this.scene.cutsceneLock = true;
        for (const cmd of script) {
            if (cmd.cmd === "say") {
                await this.runSay(cmd.text);
            }
            if (cmd.cmd === "wait") {
                await this.delay(cmd.time);
            }
            if (cmd.cmd === "end") break;
        }

        this.ui.hide();
        this.scene.dialogueActive = false;
        this.scene.cutsceneLock = false;
    }

    async runSay(text) {
        const promise = this.ui.showLine(text);

        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (!this.ui.waitForNext) {
                    clearInterval(check);
                    resolve();
                }
            }, 30);
        });
    }

    delay(ms) {
        return new Promise((resolve) => this.scene.time.delayedCall(ms, resolve));
    }
}
