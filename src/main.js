import Phaser from 'phaser'

import {GameScene} from './scenes/GameScene.js'
import {Preloader} from "./scenes/Preloader.js";
import {Boot} from "./scenes/Boot.js";
import {MenuScene} from "./scenes/MenuScene.js";

const config = {
	type: Phaser.AUTO,
	parent: 'app',
	width: 800,
	height: 600,
    pixelArt: false,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
		default: 'arcade',
		arcade: {
            debug: false,
            gravity: {y: 0},
		},
	},
    scene: [
        Boot,
        Preloader,
        MenuScene,
        GameScene
    ],
}

export default new Phaser.Game(config)
