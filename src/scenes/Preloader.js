// game/scenes/Preloader.js
import {Scene} from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        const {width, height} = this.cameras.main;

        // Progress bar
        const barWidth = 400;
        const barHeight = 30;
        const barX = (width - barWidth) / 2;
        const barY = height / 2;

        const progressBox = this.add.rectangle(
            width / 2, height / 2,
            barWidth + 10, barHeight + 10,
            0x222222
        );

        const progressBar = this.add.rectangle(
            barX, barY,
            0, barHeight,
            0x00ff00
        ).setOrigin(0, 0.5);

        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        const percentText = this.add.text(width / 2, height / 2, '0%', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.width = barWidth * value;
            percentText.setText(`${Math.floor(value * 100)}%`);
        });

        this.load.on('complete', () => {
            progressBox.destroy();
            progressBar.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // ===== Load Individual Button Images =====
        const buttonColors = ['yellow', 'orange', 'teal', 'green', 'violet', 'pink'];
        const buttonSizes = ['xs', 's', 'm', 'l'];

        buttonColors.forEach(color => {
            buttonSizes.forEach(size => {
                const key = `btn_${color}_${size}`;
                if (!this.textures.exists(key)) {
                    this.load.image(key, `assets/ui/btn_${color}_${size}.png`);
                }
            });
        });

        // ===== Load Atlases =====

        if (!this.textures.exists('animals')) {
            this.load.atlas('animals',
                'assets/atlas/animals-0.png',
                'assets/atlas/animals.json'
            );
        }

        if (!this.textures.exists('dices')) {
            this.load.atlas('dices',
                'assets/atlas/dices.png',
                'assets/atlas/dices.json'
            );
        }

        // ===== Other Assets =====

        if (!this.textures.exists('menu_background_boot')) {
            this.load.image('menu_background_boot', 'assets/splash_screen_pixel.png');
        }

        if (!this.textures.exists('title')) {
            this.load.image('title', 'assets/ui/title.png');
        }
        if (!this.textures.exists('bg')) {
            this.load.image('bg', 'assets/ui/bg.png');
        }
    }

    create() {
        this.scene.start('MenuScene');
    }
}