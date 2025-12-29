import {Scene} from 'phaser';
import {t} from "../utils/i18n.js";

export class HowToPlayScene extends Scene {
    constructor() {
        super('HowToPlayScene');
    }

    create() {
        const {width, height} = this.cameras.main;

        // Dark overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
            .setInteractive();

        // Panel background
        const panelWidth = Math.min(1200, width * 0.9);
        const panelHeight = Math.min(800, height * 0.9);

        const panel = this.add.rectangle(
            width / 2, height / 2,
            panelWidth, panelHeight,
            0xf5deb3
        ).setStrokeStyle(8, 0x8b4513);

        // Title
        this.add.text(width / 2, height / 2 - panelHeight / 2 + 60, t('how_to_play_title'), {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#8b4513'
        }).setOrigin(0.5);

        // Content
        const content = [
            t('how_to_play_objective'),
            '',
            t('how_to_play_turn'),
            '1. ' + t('how_to_play_roll'),
            '2. ' + t('how_to_play_trade'),
            '3. ' + t('how_to_play_end'),
            '',
            t('how_to_play_breeding'),
            t('how_to_play_predators'),
            t('how_to_play_dogs'),
        ].join('\n');

        this.add.text(width / 2, height / 2, content, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#000000',
            align: 'left',
            lineSpacing: 8,
            wordWrap: {width: panelWidth - 100}
        }).setOrigin(0.5);

        // Close button
        const closeBtn = this.add.text(width / 2, height / 2 + panelHeight / 2 - 60,
            t('button_close'), {
                fontSize: '32px',
                fontFamily: 'Arial Black',
                color: '#ffffff',
                backgroundColor: '#ff6600',
                padding: {x: 40, y: 16}
            }).setOrigin(0.5).setInteractive({useHandCursor: true});

        closeBtn.on('pointerover', () => closeBtn.setScale(1.05));
        closeBtn.on('pointerout', () => closeBtn.setScale(1));
        closeBtn.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('MenuScene');
        });
    }
}