// game/ui/Modal.js

import {DEPTH} from "../game/constants/Depth.js";

export class Modal extends Phaser.GameObjects.Container {
    constructor(scene, config = {}) {
        super(scene, 0, 0);

        const {
            width = 800,
            height = 600,
            title = 'Modal',
            showCloseButton = true,
            onClose = null
        } = config;

        this.modalWidth = width;
        this.modalHeight = height;
        this.onCloseCallback = onClose;

        // Center position
        const {width: screenWidth, height: screenHeight} = scene.cameras.main;
        this.x = screenWidth / 2;
        this.y = screenHeight / 2;

        this.createOverlay(scene, screenWidth, screenHeight);
        this.createPanel(scene, width, height);
        this.createHeader(scene, title, showCloseButton);

        // Container for modal content (will be populated by child classes)
        this.contentContainer = scene.add.container(0, 40);
        this.add(this.contentContainer);

        this.setDepth(DEPTH.OVERLAY);
        this.setAlpha(0);

        // Entrance animation
        scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 200,
            ease: 'Power2'
        });
    }

    createOverlay(scene, screenWidth, screenHeight) {
        // Semi-transparent dark overlay that covers entire screen
        this.overlay = scene.add.rectangle(
            0, 0,
            screenWidth * 2, screenHeight * 2,
            0x000000,
            0.7
        );
        this.overlay.setOrigin(0.5);
        this.overlay.setInteractive();
        this.add(this.overlay);
    }

    createPanel(scene, width, height) {
        // Rounded rectangle using graphics
        const graphics = scene.add.graphics();

        // Fill
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 20);

        // Border
        graphics.lineStyle(4, 0x8b4513, 1);
        graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 20);

        this.add(graphics);
    }

    createHeader(scene, title, showCloseButton) {
        const headerY = -this.modalHeight / 2 + 40;

        // Title text
        this.titleText = scene.add.text(0, headerY, title, {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#8b4513',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.add(this.titleText);

        // Close button (X)
        if (showCloseButton) {
            const closeBtn = scene.add.text(
                this.modalWidth / 2 - 40,
                headerY,
                '✖',
                {
                    fontSize: '32px',
                    color: '#cc0000'
                }
            ).setOrigin(0.5);

            closeBtn.setInteractive({useHandCursor: true});
            closeBtn.on('pointerover', () => closeBtn.setScale(1.2));
            closeBtn.on('pointerout', () => closeBtn.setScale(1));
            closeBtn.on('pointerdown', () => this.close());

            this.add(closeBtn);
        }
    }

    close() {
        // Exit animation
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 150,
            ease: 'Power2',
            onComplete: () => {
                if (this.onCloseCallback) {
                    this.onCloseCallback();
                }
                this.destroy();
            }
        });
    }

    // Helper method to add content to the modal
    addContent(gameObject) {
        this.contentContainer.add(gameObject);
    }
}