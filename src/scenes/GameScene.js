import Phaser from 'phaser'
import {Player} from "../entities/Player.js";
import {Obstacle} from "../entities/Obstacle.js";
import {DEPTH} from "../game/constants/Depth.js";
import {logger} from "../utils/Logger.js";
import {EventNames} from "../events/EventNames.js";
import {EventBus} from "../EventBus.js";
import {GameUI} from "../ui/GameUi.js";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('game')

    }

    create() {

        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
        this.escKey.on('down', () => {
            this.handlePauseToggle()
        })

        // Q quits to menu (only when paused)
        this.quitKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q)
        this.quitKey.on('down', () => {
            if (this.isPaused) {
                this.quitToMainMenu()
            }
        })


    }

    handlePauseToggle() {
        this.isPaused = !this.isPaused

        if (this.isPaused) {
            this.physics.pause();
            this.tweens.pauseAll();
            this.time.paused = true;

            // Disable player input
            this.player.inputProvider.disableInput(999999); // Huge number = indefinite

            EventBus.emit(EventNames.PAUSE_ON);
            logger.debug('⏸ Game paused');
        } else {
            this.physics.resume();
            this.tweens.resumeAll();
            this.time.paused = false;

            // Re-enable player input
            this.player.inputProvider.inputDisabledUntil = 0;

            EventBus.emit(EventNames.PAUSE_OFF);
            logger.debug('▶ Game resumed');
        }
    }

    quitToMainMenu() {

        // CRITICAL FIX: Unpause before quitting
        if (this.isPaused) {
            this.isPaused = false
            this.physics.resume()
            this.tweens.resumeAll()
            this.time.paused = false
        }

        // Remove keyboard listeners BEFORE transitioning
        if (this.escKey) {
            this.escKey.removeAllListeners()
            this.escKey = null
        }
        if (this.quitKey) {
            this.quitKey.removeAllListeners()
            this.quitKey = null
        }

        // Stop physics (now that it's unpaused)
        this.physics.pause()
        this.shutdown()
        this.scene.stop('game')
        this.scene.start('menu')
        logger.info('Returned to main menu from game scene')
    }




    triggerGameOver() {
        if (this.sfx?.loose) {
            this.sfx.loose.play();
        }
        logger.info('Game Over!', {
            finalScore: this.score,
            finalDistance: Math.floor(this.distance)
        });

        this.isPaused = true;
        this.physics.pause();
        this.tweens.pauseAll();
        this.time.paused = true;
        this.player.inputProvider.disableInput(999999);

        if (this.escKey) {
            this.escKey.removeAllListeners()
            this.escKey = null
        }

        // Save score locally
        const currentBest = parseInt(localStorage.getItem('surfboy_topscore')) || 0;
        const isNewBest = this.score > currentBest;

        if (isNewBest) {
            localStorage.setItem('surfboy_topscore', this.score.toString());
            logger.info('NEW BEST SCORE!', {score: this.score});
        }

        EventBus.emit(EventNames.GAME_OVER, {
            score: this.score,
            distance: Math.floor(this.distance),
            isNewBest: isNewBest,
            previousBest: currentBest
        });
    }


    update(time, delta) {
        if (this.isPaused) {
            return;
        }

    }

    shutdown() {

        this.isPaused = false;

        if (this.music) {
            this.music.stop();
            this.music = null;
        }

        this.sfx = null

        logger.info('GameScene shutdown complete');
    }

}
