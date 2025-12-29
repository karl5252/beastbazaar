// game/ui/DiceRollModal.js

import {DEPTH} from "../game/constants/Depth.js";

export class DiceRollModal extends Phaser.GameObjects.Container {
    constructor(scene, onComplete) {
        super(scene, 0, 0);

        this.onCompleteCallback = onComplete;

        const {width, height} = scene.cameras.main;
        this.x = width / 2;
        this.y = height / 2;

        this.createOverlay(scene, width, height);
        this.createDiceAnimation(scene);

        this.setDepth(DEPTH.OVERLAY + 100);
        this.setAlpha(0);

        // Entrance animation
        scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 200,
            ease: 'Power2',
            onComplete: () => this.startDiceRoll()
        });
    }

    createOverlay(scene, screenWidth, screenHeight) {
        const overlay = scene.add.rectangle(
            0, 0,
            screenWidth * 2, screenHeight * 2,
            0x000000,
            0.8
        );
        overlay.setOrigin(0.5);
        this.add(overlay);
    }

    createDiceAnimation(scene) {
        // Green dice
        this.greenDice = scene.add.sprite(-150, 0, 'dices', 'green_rabbit')
            .setScale(0.5)
            .setOrigin(0.5);
        this.add(this.greenDice);

        // Red dice
        this.redDice = scene.add.sprite(150, 0, 'dices', 'red_rabbit')
            .setScale(0.5)
            .setOrigin(0.5);
        this.add(this.redDice);

        // "Rolling..." text
        this.rollingText = scene.add.text(0, 150, 'Rolling...', {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.add(this.rollingText);
    }

    startDiceRoll() {
        // Spin animation for both dice
        const spinDuration = 100;
        const totalSpins = 10;
        let spinCount = 0;

        // Possible dice faces
        const greenFaces = ['green_rabbit', 'green_sheep', 'green_pig', 'green_horse', 'green_fox'];
        const redFaces = ['red_rabbit', 'red_sheep', 'red_pig', 'red_cow', 'red_wolf'];

        // Spin timer
        const spinTimer = this.scene.time.addEvent({
            delay: spinDuration,
            repeat: totalSpins - 1,
            callback: () => {
                spinCount++;

                // Random faces
                const randomGreen = Phaser.Utils.Array.GetRandom(greenFaces);
                const randomRed = Phaser.Utils.Array.GetRandom(redFaces);

                this.greenDice.setFrame(randomGreen);
                this.redDice.setFrame(randomRed);

                // Slight scale bounce
                this.scene.tweens.add({
                    targets: [this.greenDice, this.redDice],
                    scaleX: 0.55,
                    scaleY: 0.55,
                    duration: 50,
                    yoyo: true
                });

                // Last spin - show final results
                if (spinCount === totalSpins) {
                    this.showFinalResults();
                }
            }
        });
    }

    showFinalResults() {
        // Wait a moment, then close
        this.scene.time.delayedCall(800, () => {
            this.close();
        });
    }

    setFinalResults(greenResult, redResult) {
        // Set the actual results
        const greenFrame = `green_${greenResult.toLowerCase()}`;
        const redFrame = `red_${redResult.toLowerCase()}`;

        this.greenDice.setFrame(greenFrame);
        this.redDice.setFrame(redFrame);

        // Pop animation
        this.scene.tweens.add({
            targets: [this.greenDice, this.redDice],
            scaleX: 0.6,
            scaleY: 0.6,
            duration: 150,
            ease: 'Back.easeOut',
            yoyo: true
        });

        // Update text
        this.rollingText.setText('🎲');
    }

    close() {
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                if (this.onCompleteCallback) {
                    this.onCompleteCallback();
                }
                this.destroy();
            }
        });
    }
}