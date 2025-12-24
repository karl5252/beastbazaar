// game/scenes/DebugLaunchScene.js
import {Scene} from 'phaser';

export class DebugLaunchScene extends Scene {
    constructor() {
        super('DebugLaunch');
    }

    create() {
        const {width, height} = this.cameras.main;

        this.add.text(width / 2, height / 2 - 100, 'DEBUG LAUNCHER', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Launch MenuScene button
        const menuBtn = this.add.text(width / 2, height / 2, '[ MENU SCENE ]', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: {x: 20, y: 10}
        }).setOrigin(0.5).setInteractive({useHandCursor: true});

        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Quick launch GameScene button
        const gameBtn = this.add.text(width / 2, height / 2 + 80, '[ GAME SCENE (TEST) ]', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffaa00',
            backgroundColor: '#000000',
            padding: {x: 20, y: 10}
        }).setOrigin(0.5).setInteractive({useHandCursor: true});

        gameBtn.on('pointerdown', () => {
            this.scene.start('GameScene', {
                playerCount: 2,
                playerNames: ['Alice', 'Bob'],
                difficulty: 'easy',
                tradeExpiry: 5,
                debug: true
            });
        });
    }
}