import {Scene} from 'phaser';
import {getLang, setLang, t} from "../utils/i18n.js";
import {DEPTH} from "../game/constants/Depth.js";

export class MenuScene extends Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const {width, height} = this.cameras.main;

        // Background
        this.add.image(width / 2, height / 2, 'menu_background_boot')
            .setDisplaySize(width, height);

        // Game settings
        this.gameSettings = {
            playerCount: 2,
            playerNames: ['Farmer1', 'Farmer2', 'Farmer3', 'Farmer4'],
            difficulty: 'easy',
            tradeExpiry: 5
        };

        // UI Elements
        this.createLanguageSelector();
        //this.createHowToButton(); // ugly needs fixing
        this.createTitle();
        this.createPlayerSetup();
        this.createDifficultySelector();
        this.createExpirySlider();
        this.createStartButton();
    }

    createLanguageSelector() {
        const {width, height} = this.cameras.main;
        const scale = this.getUIScaleFactor();
        const flagSize = Math.floor(32 * scale);

        const startX = 60;
        const startY = 40;
        const spacing = flagSize + 8;
        const currentLang = getLang();

        const languages = [
            {code: 'en', flag: '🇬🇧'},
            {code: 'pl', flag: '🇵🇱'},
            {code: 'ru', flag: '🇷🇺'},
            {code: 'es', flag: '🇪🇸'}
        ];

        const container = this.add.container(0, 0).setDepth(DEPTH.HUD);
        let hoverSfxCooldown = 0;

        languages.forEach((lang, index) => {
            const x = startX + index * spacing;
            const y = startY;

            // Highlight current language
            if (lang.code === currentLang) {
                const highlight = this.add.circle(x, y, flagSize * 0.6, 0xffaa00, 0.3);
                container.add(highlight);
            }

            const flagButton = this.add
                .text(x, y, lang.flag, {
                    fontSize: Math.floor(flagSize * 0.8) + 'px',
                    color: '#ffffff'
                })
                .setOrigin(0.5)
                .setInteractive({useHandCursor: true});

            container.add(flagButton);

            flagButton.on('pointerover', () => {
                flagButton.setScale(1.2);
                const now = Date.now();
                if (now > hoverSfxCooldown) {
                    // this.sound.play('menu_hover');
                    hoverSfxCooldown = now + 120;
                }
            });

            flagButton.on('pointerout', () => flagButton.setScale(1.0));

            flagButton.on('pointerdown', () => {
                setLang(lang.code);
                // this.sound.play('button_click');

                // Reload scene to refresh all text
                this.scene.restart();
            });
        });

        return container;
    }

    createHowToButton() {
        const {width} = this.cameras.main;

        const btn = this.add.text(width - 40, 40, `${t('menu_how_to_play')}`, {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#8b4513',
            padding: {x: 16, y: 8}
        })
            .setOrigin(1, 0.5)
            .setInteractive({useHandCursor: true})
            .setDepth(DEPTH.HUD);

        btn.on('pointerover', () => {
            btn.setScale(1.05);
            // this.sound.play('menu_hover');
        });

        btn.on('pointerout', () => btn.setScale(1));

        btn.on('pointerdown', () => {
            // this.sound.play('button_click');
            this.scene.launch('HowToPlayScene');
            this.scene.pause();
        });
    }

    createTitle() {
        const {width} = this.cameras.main;

        const title = this.add.text(width / 2, 150, t('menu_title'), {
            fontSize: '72px',
            fontFamily: 'Arial Black',
            color: '#8b4513',
            stroke: '#ffffff',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Add cute animal sprites if available
        // const rabbit = this.add.sprite(width / 2 - 200, 150, 'rabbit_hat');
        // const horse = this.add.sprite(width / 2 + 200, 150, 'horse_hat');
    }

    createPlayerSetup() {
        const {width} = this.cameras.main;
        const centerX = width / 2;
        const y = 280;

        // Player count label and controls
        this.add.text(centerX - 200, y, t('menu_players'), {
            fontSize: '32px',
            color: '#000000'
        }).setOrigin(0, 0.5);

        this.playerCountText = this.add.text(centerX - 80, y, '2', {
            fontSize: '48px',
            color: '#8b4513',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);

        this.createJellyButton(
            centerX - 130, y,
            '−', 'orange',
            () => this.changePlayerCount(-1),
            {width: 50, height: 50, fontSize: '32px'}
        );

        this.createJellyButton(
            centerX - 30, y,
            '+', 'teal',
            () => this.changePlayerCount(1),
            {width: 50, height: 50, fontSize: '32px'}
        );

        // Name inputs
        this.add.text(centerX + 50, y - 20, t('menu_names_optional'), {
            fontSize: '20px',
            color: '#666666'
        });

        this.playerNameInputs = [];
        for (let i = 0; i < 4; i++) {
            const nameBtn = this.createNameButton(
                centerX + 150 + (i * 120), y + 10,
                i
            );
            this.playerNameInputs.push(nameBtn);
        }
    }

    createNameButton(x, y, index) {
        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 100, 40, 0x9370db, 1)
            .setStrokeStyle(2, 0xffffff);

        const text = this.add.text(0, 0, `P${index + 1}`, {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        container.add([bg, text]);
        container.setSize(100, 40);
        container.setInteractive(
            new Phaser.Geom.Rectangle(-50, -20, 100, 40),
            Phaser.Geom.Rectangle.Contains
        );

        container.on('pointerover', () => {
            container.setScale(1.05);
        });

        container.on('pointerout', () => {
            container.setScale(1);
        });

        container.on('pointerdown', () => {
            if (index < this.gameSettings.playerCount) {
                this.openNameInput(index, text);
            }
        });

        container.visible = index < this.gameSettings.playerCount;
        container.nameText = text;

        return container;
    }

    openNameInput(index, textObj) {
        // For now, use browser prompt (we can make fancy later)
        const currentName = this.gameSettings.playerNames[index];
        const newName = prompt(t('menu_enter_player_name', {number: index + 1}), currentName);

        if (newName && newName.trim()) {
            const trimmedName = newName.trim().slice(0, 12);
            this.gameSettings.playerNames[index] = trimmedName;
            textObj.setText(trimmedName.length > 8 ? trimmedName.slice(0, 8) + '...' : trimmedName);
        }
    }

    createDifficultySelector() {
        const {width} = this.cameras.main;
        const centerX = width / 2;
        const y = 400;

        this.add.text(centerX, y - 40, t('menu_difficulty'), {
            fontSize: '32px',
            color: '#000000'
        }).setOrigin(0.5);

        this.easyBtn = this.createJellyButton(
            centerX - 120, y,
            t('difficulty_easy'), 'purple',
            () => this.setDifficulty('easy'),
            {width: 160, height: 60, fontSize: '24px'}
        );
        this.easyBtn.isSelected = true;
        this.easyBtn.alpha = 1;

        this.mediumBtn = this.createJellyButton(
            centerX + 120, y,
            t('difficulty_medium'), 'yellow',
            () => this.setDifficulty('medium'),
            {width: 160, height: 60, fontSize: '24px'}
        );
        this.mediumBtn.isSelected = false;
        this.mediumBtn.alpha = 0.6;
    }

    createExpirySlider() {
        const {width} = this.cameras.main;
        const centerX = width / 2;
        const y = 540;

        this.add.text(centerX, y - 40, t('menu_trade_expiry'), {
            fontSize: '32px',
            color: '#000000'
        }).setOrigin(0.5);

        // Slider track
        const sliderBg = this.add.rectangle(centerX, y, 300, 20, 0x888888)
            .setStrokeStyle(2, 0x444444);

        // Slider handle
        const handleX = centerX - 150 + (this.gameSettings.tradeExpiry - 3) * 75;
        const sliderHandle = this.add.circle(handleX, y, 15, 0xff6600)
            .setInteractive({draggable: true, useHandCursor: true});

        this.expiryText = this.add.text(centerX, y + 40,
            `${this.gameSettings.tradeExpiry} ${t('menu_turns')}`, {
                fontSize: '28px',
                color: '#000000'
            }).setOrigin(0.5);

        // Range labels
        this.add.text(centerX - 150, y + 25, '3', {
            fontSize: '20px', color: '#666666'
        }).setOrigin(0.5);
        this.add.text(centerX + 150, y + 25, '7', {
            fontSize: '20px', color: '#666666'
        }).setOrigin(0.5);

        // Drag handling
        sliderHandle.on('drag', (pointer, dragX) => {
            const minX = centerX - 150;
            const maxX = centerX + 150;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);

            sliderHandle.x = clampedX;

            // Map position to 3-7 range
            const percent = (clampedX - minX) / (maxX - minX);
            const value = Math.round(3 + percent * 4);

            this.gameSettings.tradeExpiry = value;
            this.expiryText.setText(`${value} ${t('menu_turns')}`);
        });
    }

    createStartButton() {
        const {width} = this.cameras.main;

        const btn = this.createJellyButton(
            width / 2, 720,
            t('menu_start_game'),
            'orange',
            () => this.startGame(),
            {width: 400, height: 100, fontSize: '42px'}
        );

        // Pulse animation
        this.tweens.add({
            targets: btn,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    createJellyButton(x, y, text, color, onClick, opts = {}) {
        const width = opts.width || 200;
        const height = opts.height || 60;
        const fontSize = opts.fontSize || '28px';

        const container = this.add.container(x, y);

        // For now, use simple rectangle (replace with NineSlice later)
        const colorMap = {
            orange: 0xff6600,
            teal: 0x00cccc,
            purple: 0x9370db,
            yellow: 0xffaa00
        };

        const bg = this.add.rectangle(0, 0, width, height, colorMap[color] || 0x888888)
            .setStrokeStyle(4, 0xffffff);

        const label = this.add.text(0, 0, text, {
            fontSize,
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        container.add([bg, label]);
        container.setSize(width, height);
        container.setInteractive(
            new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
            Phaser.Geom.Rectangle.Contains
        );

        // Hover effects
        container.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });

        container.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        container.on('pointerdown', () => {
            this.tweens.add({
                targets: container,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: onClick
            });
        });

        return container;
    }

    changePlayerCount(delta) {
        const newCount = this.gameSettings.playerCount + delta;
        if (newCount < 2 || newCount > 4) return;

        this.gameSettings.playerCount = newCount;
        this.playerCountText.setText(newCount.toString());

        // Update name button visibility
        this.playerNameInputs.forEach((input, i) => {
            input.visible = i < newCount;
        });
    }

    setDifficulty(difficulty) {
        this.gameSettings.difficulty = difficulty;

        // Update button states
        this.easyBtn.alpha = difficulty === 'easy' ? 1 : 0.6;
        this.mediumBtn.alpha = difficulty === 'medium' ? 1 : 0.6;
    }

    startGame() {
        this.scene.start('GameScene', {
            playerCount: this.gameSettings.playerCount,
            playerNames: this.gameSettings.playerNames.slice(0, this.gameSettings.playerCount),
            difficulty: this.gameSettings.difficulty,
            tradeExpiry: this.gameSettings.tradeExpiry
        });
    }

    getUIScaleFactor() {
        const {width} = this.cameras.main;
        return Math.max(0.8, Math.min(1.5, width / 1920));
    }
}