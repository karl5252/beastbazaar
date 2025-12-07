// InputProvider.js

import {logger} from "./utils/Logger.js";

export class BaseInputProvider {
    constructor(scene) {
        this.scene = scene
        this.scheme = 'arrows'
        logger.debug('InputProvider using scheme:', this.scheme)
    }

    getIntent() {
        // Override in child classes
        return {
            moveX: 0,
            moveY: 0,
            fire: false,

        }
    }
}

export class KeyboardInputProvider extends BaseInputProvider {
    constructor(scene) {
        super(scene);
        this.setupKeys();
        this.lastFireState = false;
        this.inputDisabledUntil = 0;
    }

    disableInput(timeMs) {
        this.inputDisabledUntil = this.scene.time.now + timeMs;
    }

    getIntent() {
        // short-circuit when disabled
        if (this.inputDisabledUntil && this.scene.time.now < this.inputDisabledUntil) {
            // keep lastFireState roughly in sync so we don't "just press" after unlock
            this.lastFireState = this.fireKey.isDown;
            return {moveX: 0, moveY: 0, fire: false, disabled: true};
        }

        let moveX = 0, moveY = 0;
        if (this.moveKeys.left.isDown) moveX -= 1;
        if (this.moveKeys.right.isDown) moveX += 1;
        if (this.moveKeys.up.isDown) moveY -= 1;
        if (this.moveKeys.down.isDown) moveY += 1;

        const currentFireState = this.fireKey.isDown;
        const firePressed = currentFireState && !this.lastFireState;
        this.lastFireState = currentFireState;

        return {moveX, moveY, fire: firePressed, disabled: false};
    }

    setupKeys() {
        // Movement keys based on scheme
        if (this.scheme === 'wasd') {
            this.moveKeys = {
                // eslint-disable-next-line no-undef
                left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
                up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
            }

            // WASD action keys
            this.fireKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

        } else {
            // Default arrow key scheme
            this.moveKeys = {
                left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
                right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
                up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
                down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
            }

            // Arrow keys action keys
            this.fireKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

        }

        console.debug(`Keyboard controls setup for ${this.scheme} scheme`)
    }

}
