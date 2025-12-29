// game/scenes/MenuScene.js
import {Scene} from 'phaser';
import {getLang, setLang, t} from "../utils/i18n.js";
import {UiButton} from "../ui/UiButton.js";
import {DEPTH} from "../game/constants/Depth.js";

export class MenuScene extends Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const {width, height} = this.cameras.main;

        // Background
        this.add.image(width / 2, height / 2, 'bg')
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
        this.createTitle();
        this.createPlayerSetup();
        this.createDifficultySelector();
        this.createExpirySlider();
        this.createStartButton();
    }

    createLanguageSelector() {
        const {width} = this.cameras.main;
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

        languages.forEach((lang, index) => {
            const x = startX + index * spacing;
            const y = startY;

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

            flagButton.on('pointerover', () => flagButton.setScale(1.2));
            flagButton.on('pointerout', () => flagButton.setScale(1.0));
            flagButton.on('pointerdown', () => {
                setLang(lang.code);

                // Check if assets already loaded
                if (this.registry.get('assetsLoaded')) {
                    // Just restart MenuScene, don't reload Preloader
                    this.scene.restart();
                } else {
                    // First time, go through Preloader
                    this.scene.start('Preloader');
                }
            });
        });

        return container;
    }

    createTitle() {
        const {width} = this.cameras.main;

        // Use atlas sprite for title
        const title = this.add.image(width / 2, 150, 'title')
            .setOrigin(0.5)
            .setScale(0.3); // Adjust to fit screen


        // Optional: Add animal decorations using animals atlas
        // const rabbit = this.add.sprite(width / 2 - 300, 150, 'animals', 'rabbit')
        //     .setScale(0.3);
        // const horse = this.add.sprite(width / 2 + 300, 150, 'animals', 'horse')
        //     .setScale(0.3);
    }

    createPlayerSetup() {
        const {width} = this.cameras.main;
        const centerX = width / 2;
        const y = 280;

        // ===== Row 1: Player Count Controls (all horizontal) =====

        // "Players:" label on the left
        this.add.text(centerX - 250, y, t('menu_players'), {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0, 0.5);

        // Minus button
        const minusBtn = new UiButton(this, centerX + 10, y, {
            key: 'btn_orange',
            w: 50,
            h: 50,
            slice: 16,
            text: '−',
            textStyle: {fontSize: '32px'},
            autoSize: false,
            onClick: () => this.changePlayerCount(-1)
        });
        this.add.existing(minusBtn);

        // Player count display (between buttons)
        this.playerCountText = this.add.text(centerX + 60, y, '2', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Plus button
        const plusBtn = new UiButton(this, centerX + 110, y, {
            key: 'btn_teal',
            w: 50,
            h: 50,
            slice: 16,
            text: '+',
            textStyle: {fontSize: '32px'},
            autoSize: false,
            onClick: () => this.changePlayerCount(1)
        });
        this.add.existing(plusBtn);

        // ===== Row 2: Player Names (below) =====

        const namesY = y + 70;  // 70px below player count row

        // "Names (optional)" label
        this.add.text(centerX - 250, namesY, t('menu_names_optional'), {
            fontSize: '20px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        // Name input buttons (side by side)
        this.playerNameInputs = [];
        const nameStartX = centerX + 50;
        const nameSpacing = 110;

        for (let i = 0; i < 4; i++) {
            const nameBtn = this.createNameButton(
                nameStartX + (i * nameSpacing),
                namesY,
                i
            );
            this.playerNameInputs.push(nameBtn);
        }
    }

    createNameButton(x, y, index) {
        const nameBtn = new UiButton(this, x, y, {
            key: 'btn_violet',
            w: 100,
            h: 40,
            slice: 16,
            text: `P${index + 1}`,
            textStyle: {fontSize: '20px'},
            autoSize: false,
            onClick: () => {
                if (index < this.gameSettings.playerCount) {
                    this.openNameInput(index, nameBtn);
                }
            }
        });

        this.add.existing(nameBtn);
        nameBtn.visible = index < this.gameSettings.playerCount;
        return nameBtn;
    }

    openNameInput(index, btnObj) {
        const currentName = this.gameSettings.playerNames[index];
        const newName = prompt(t('menu_enter_player_name', {number: index + 1}), currentName);

        if (newName && newName.trim()) {
            const trimmedName = newName.trim().slice(0, 12);
            this.gameSettings.playerNames[index] = trimmedName;
            const displayName = trimmedName.length > 8 ? trimmedName.slice(0, 8) + '...' : trimmedName;
            btnObj.label.setText(displayName);
        }
    }

    /*createNameButton(x, y, index) {
        // Use UiButton for name buttons
        const nameBtn = new UiButton(this, x, y, {
            atlas: 'buttons',
            key: 'btn_violet',
            w: 100,
            h: 40,
            slice: 16,
            text: `P${index + 1}`,
            textStyle: {fontSize: '20px'},
            autoSize: false,
            onClick: () => {
                if (index < this.gameSettings.playerCount) {
                    this.openNameInput(index, nameBtn);
                }
            }
        });

        nameBtn.visible = index < this.gameSettings.playerCount;
        return nameBtn;
    }

    openNameInput(index, btnObj) {
        const currentName = this.gameSettings.playerNames[index];
        const newName = prompt(t('menu_enter_player_name', {number: index + 1}), currentName);

        if (newName && newName.trim()) {
            const trimmedName = newName.trim().slice(0, 12);
            this.gameSettings.playerNames[index] = trimmedName;
            const displayName = trimmedName.length > 8 ? trimmedName.slice(0, 8) + '...' : trimmedName;
            btnObj.label.setText(displayName);
        }
    */

    createDifficultySelector() {
        const {width} = this.cameras.main;
        const centerX = width / 2;
        const y = 400;

        this.add.text(centerX, y, t('menu_difficulty'), {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#ffffff',          // White
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.easyBtn = new UiButton(this, centerX - 120, y + 40, {
            atlas: 'buttons',
            key: 'btn_violet',
            w: 160,
            h: 60,
            slice: 16,
            text: t('difficulty_easy'),
            textStyle: {fontSize: '24px'},
            autoSize: false,
            onClick: () => this.setDifficulty('easy')
        });
        this.add.existing(this.easyBtn);
        this.easyBtn.setEnabled(true);

        this.mediumBtn = new UiButton(this, centerX + 120, y + 40, {
            atlas: 'buttons',
            key: 'btn_yellow',
            w: 160,
            h: 60,
            slice: 16,
            text: t('difficulty_medium'),
            textStyle: {fontSize: '24px'},
            autoSize: false,
            onClick: () => this.setDifficulty('medium')
        });
        this.add.existing(this.mediumBtn);
        this.mediumBtn.setEnabled(false);
    }

    createExpirySlider() {
        const {width} = this.cameras.main;
        const centerX = width / 2;
        const y = 540;

        this.add.text(centerX, y - 40, t('menu_trade_expiry'), {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#ffffff',          // White
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Slider track
        const sliderBg = this.add.rectangle(centerX, y, 300, 20, 0x888888)
            .setStrokeStyle(2, 0x444444);

        const handleX = centerX - 150 + (this.gameSettings.tradeExpiry - 3) * 75;
        const sliderHandle = this.add.circle(handleX, y, 15, 0xff6600)
            .setInteractive({draggable: true, useHandCursor: true});

        this.expiryText = this.add.text(centerX, y + 40,
            `${this.gameSettings.tradeExpiry} ${t('menu_turns')}`, {
                fontSize: '28px',
                fontFamily: 'Arial Black',
                color: '#ffffff',      // White
                stroke: '#000000',
                strokeThickness: 5
            }).setOrigin(0.5);

        // Range labels
        this.add.text(centerX - 150, y + 25, '3', {
            fontSize: '20px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(centerX + 150, y + 25, '7', {
            fontSize: '20px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        sliderHandle.on('drag', (pointer, dragX) => {
            const minX = centerX - 150;
            const maxX = centerX + 150;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);

            sliderHandle.x = clampedX;

            const percent = (clampedX - minX) / (maxX - minX);
            const value = Math.round(3 + percent * 4);

            this.gameSettings.tradeExpiry = value;
            this.expiryText.setText(`${value} ${t('menu_turns')}`);
        });
    }

    createStartButton() {
        const {width} = this.cameras.main;

        const btn = new UiButton(this, width / 2, 720, {
            key: 'btn_yellow',          // Just the image key, no atlas
            w: 400,
            h: 100,
            slice: 16,
            text: t('menu_start_game'),
            textStyle: {fontSize: '42px'},
            autoSize: false,
            onClick: () => this.startGame()
        });

        this.add.existing(btn);

        this.tweens.add({
            targets: btn,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    changePlayerCount(delta) {
        const newCount = this.gameSettings.playerCount + delta;
        if (newCount < 2 || newCount > 4) return;

        this.gameSettings.playerCount = newCount;
        this.playerCountText.setText(newCount.toString());

        this.playerNameInputs.forEach((input, i) => {
            input.visible = i < newCount;
        });
    }

    setDifficulty(difficulty) {
        this.gameSettings.difficulty = difficulty;

        // Update button enabled states
        this.easyBtn.setEnabled(difficulty === 'easy');
        this.mediumBtn.setEnabled(difficulty === 'medium');
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