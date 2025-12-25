import Phaser from 'phaser';

import {GameScene} from './scenes/GameScene.js';
import {Preloader} from "./scenes/Preloader.js";
import {Boot} from "./scenes/Boot.js";
import {MenuScene} from "./scenes/MenuScene.js";

import * as NineSlicePkg from 'phaser3-nineslice';

console.log('[NineSlice] module keys:', Object.keys(NineSlicePkg));
// IMPORTANT: Use Plugin export
const NineSlicePlugin = NineSlicePkg.Plugin;

const config = {
    type: Phaser.AUTO,
    parent: 'app',
    width: 1024,
    height: 768,
    pixelArt: false,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {debug: false, gravity: {y: 0}},
    },
    scene: [Boot, Preloader, MenuScene, GameScene],
    plugins: {
        global: [
            {
                key: 'NineSlicePlugin',
                plugin: NineSlicePlugin,
                start: true
            }
        ]
    }
};

export default new Phaser.Game(config);
