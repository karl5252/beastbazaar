// src/game/scenes/MenuScene.js
import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('menu');
    }

    create() {

        // Copyright text
        this.createCopyright();

        // Version
        this.createVersionText();

        this.events.on('wake', this.onSceneWake, this);

    }




    createCopyright() {
        const centerX = 400;
        const copyrightY = 550;

        const copyright = this.add.text(centerX, copyrightY, '© 2025    WEE GAMES', {
            fontSize: '16px',
            fontFamily: 'Courier New, monospace',
            color: '#9ca3af', // Gray
            align: 'center'
        });
        copyright.setOrigin(0.5);
    }



    createVersionText() {
        // add version text at bottom right
        // read buildInfo.json via import.meta.env.VITE_APP_VERSION
        const centerX = 780;
        const versionY = 580;

        const version = import.meta.env.VITE_APP_VERSION || 'dev';

        const versionText = this.add.text(centerX, versionY, `v${version}`, {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            color: '#6b7280', // Dark Gray
            align: 'right'
        });
        versionText.setOrigin(1, 0.5);

    }

    onSceneWake() {
        // Reload top score from storage
        //this.topScore = this.loadTopScore();

        // Update the display
        //this.updateTopScoreDisplay();
    }



    shutdown() {
        this.events.off('wake', this.onSceneWake, this);
    }
}