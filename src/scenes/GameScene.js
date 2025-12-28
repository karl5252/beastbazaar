// game/scenes/GameScene.js
import {Scene} from "phaser";
import {t} from "../utils/i18n.js";
import {UiButton} from "../ui/UiButton.js";
import {GameController} from "../GameController.js";
import {DEPTH} from "../game/constants/Depth.js";

export class GameScene extends Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        if (!data || !data.playerCount) {
            console.warn('[GameScene] No config provided, using TEST config');
            this.gameConfig = {
                playerCount: 2,
                playerNames: ['TestPlayer1', 'TestPlayer2'],
                difficulty: 'easy',
                tradeExpiry: 5,
                debug: true
            };
        } else {
            this.gameConfig = data;
        }
    }

    create() {
        const {width, height} = this.cameras.main;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0xf5deb3);

        // Inject Phaser's EventEmitter into GameController
        this.controller = new GameController(
            this.gameConfig,
            this.events
        );

        // Subscribe to events
        this.events.on('game:state', this.onStateUpdate, this);
        this.events.on('ui:error', this.onError, this);
        this.events.on('game:victory', this.onVictory, this);

        // Get initial state synchronously
        this.currentState = this.controller.getPublicState();

        // Create UI elements with initial state
        this.createUI();
    }

    createUI() {
        this.createHUD();
        this.createPlayerHerdDisplay();
        this.createActionButtons();
        this.createBankStatusBar();
        this.createTradeFeed();
    }

    createHUD() {
        const {width} = this.cameras.main;
        const hudHeight = 80;

        this.add.rectangle(width / 2, hudHeight / 2, width, hudHeight, 0x8b4513)
            .setDepth(DEPTH.HUD);

        const turnText = this.add.text(20, hudHeight / 2,
            `${t('game_turn')} ${this.currentState.turnNumber}`, {
                fontSize: '28px',
                fontFamily: 'Arial Black',
                color: '#ffffff'
            }).setOrigin(0, 0.5).setDepth(DEPTH.HUD_ELEMENTS);

        const playerName = this.currentState.currentPlayerName;
        const playerText = this.add.text(width / 2, hudHeight / 2,
            `🎲 ${playerName}'s ${t('game_turn')}`, {
                fontSize: '32px',
                fontFamily: 'Arial Black',
                color: '#ffdd00',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(DEPTH.HUD_ELEMENTS);

        const menuBtn = this.add.text(width - 20, hudHeight / 2, '⚙️', {
            fontSize: '36px'
        }).setOrigin(1, 0.5)
            .setInteractive({useHandCursor: true})
            .setDepth(DEPTH.HUD_ELEMENTS);

        menuBtn.on('pointerover', () => menuBtn.setScale(1.1));
        menuBtn.on('pointerout', () => menuBtn.setScale(1));
        menuBtn.on('pointerdown', () => this.openGameMenu());

        this.hudElements = {turnText, playerText, menuBtn};
    }

    createPlayerHerdDisplay() {
        const {width} = this.cameras.main;
        const panelX = width / 2;
        const panelY = 220;
        const panelWidth = 900;
        const panelHeight = 160;

        this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xffffff, 0.9)
            .setStrokeStyle(4, 0x8b4513)
            .setDepth(DEPTH.HUD);

        const playerName = this.currentState.currentPlayerName;
        this.add.text(panelX, panelY - panelHeight / 2 + 25,
            `${playerName}'${playerName.endsWith('s') ? '' : 's'} ${t('game_herd')}`, {
                fontSize: '28px',
                fontFamily: 'Arial Black',
                color: '#8b4513'
            }).setOrigin(0.5).setDepth(DEPTH.HUD_ELEMENTS);

        // Use animal sprites from atlas instead of emojis
        const animals = ['rabbit', 'sheep', 'pig', 'cow', 'horse'];
        const dogs = ['foxhound', 'wolfhound'];

        const startX = panelX - 350;
        const y1 = panelY + 10;

        this.herdSprites = {};
        this.herdTexts = {};

        // Main animals row
        animals.forEach((animal, i) => {
            const x = startX + (i * 150);
            const animalKey = animal.charAt(0).toUpperCase() + animal.slice(1); // Capitalize
            const count = this.currentState.currentPlayerHerd[animalKey];

            // Animal sprite
            const sprite = this.add.sprite(x - 20, y1, 'animals', animal)
                .setScale(0.1)
                .setDepth(DEPTH.HUD_ELEMENTS);

            // Count text
            const text = this.add.text(x + 30, y1,
                `×${count}`, {
                    fontSize: '28px',
                    fontFamily: 'Arial Black',
                    color: count > 0 ? '#000000' : '#888888'
                }).setOrigin(0, 0.5).setDepth(DEPTH.HUD_ELEMENTS);

            this.herdSprites[animalKey] = sprite;
            this.herdTexts[animalKey] = text;
        });

        // Dogs row
        const y2 = panelY + 60;
        dogs.forEach((animal, i) => {
            const x = startX + (i * 150);
            const animalKey = animal.charAt(0).toUpperCase() + animal.slice(1);
            const count = this.currentState.currentPlayerHerd[animalKey];

            const sprite = this.add.sprite(x - 20, y2, 'animals', animal)
                .setScale(0.08)
                .setDepth(DEPTH.HUD_ELEMENTS);

            const text = this.add.text(x + 30, y2,
                `×${count}`, {
                    fontSize: '24px',
                    fontFamily: 'Arial',
                    color: count > 0 ? '#000000' : '#888888'
                }).setOrigin(0, 0.5).setDepth(DEPTH.HUD_ELEMENTS);

            this.herdSprites[animalKey] = sprite;
            this.herdTexts[animalKey] = text;
        });
    }

    createActionButtons() {
        const {width} = this.cameras.main;
        const centerX = width / 2;
        const y = 420;
        const spacing = 240;

        // Roll Dice button
        this.rollBtn = new UiButton(this, centerX - spacing * 1.5, y, {
            atlas: 'buttons',
            key: 'btn_orange',
            w: 200,
            h: 120,
            slice: 16,
            text: `${t('game_roll')}\n🎲`,
            textStyle: {fontSize: '24px'},
            autoSize: false,
            onClick: () => this.onRollDice()
        });
        this.add.existing(this.rollBtn);

        // Trade button
        this.tradeBtn = new UiButton(this, centerX - spacing * 0.5, y, {
            atlas: 'buttons',
            key: 'btn_violet',
            w: 200,
            h: 120,
            slice: 16,
            text: `${t('game_trade')}\n🔄`,
            textStyle: {fontSize: '24px'},
            autoSize: false,
            onClick: () => this.onOpenTrade()
        });
        this.add.existing(this.tradeBtn);

        // Bank button
        this.bankBtn = new UiButton(this, centerX + spacing * 0.5, y, {
            atlas: 'buttons',
            key: 'btn_teal',
            w: 200,
            h: 120,
            slice: 16,
            text: `${t('game_bank')}\n💰`,
            textStyle: {fontSize: '24px'},
            autoSize: false,
            onClick: () => this.onOpenBank()
        });
        this.add.existing(this.bankBtn);

        // End Turn button
        this.endTurnBtn = new UiButton(this, centerX + spacing * 1.5, y, {
            atlas: 'buttons',
            key: 'btn_yellow',
            w: 200,
            h: 120,
            slice: 16,
            text: `${t('game_end_turn')}\n▶▶`,
            textStyle: {fontSize: '24px'},
            autoSize: false,
            onClick: () => this.onEndTurn()
        });
        this.add.existing(this.endTurnBtn);

        this.updateButtonStates();
    }

    createBankStatusBar() {
        const {width} = this.cameras.main;
        const y = 580;
        const barHeight = 60;

        this.add.rectangle(width / 2, y, width, barHeight, 0xd2b48c, 0.9)
            .setStrokeStyle(3, 0x8b4513);

        this.add.text(20, y, '📊 ' + t('game_bank') + ':', {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: '#8b4513'
        }).setOrigin(0, 0.5);

        const animals = ['rabbit', 'sheep', 'pig', 'cow', 'horse', 'foxhound', 'wolfhound'];

        const startX = 180;
        const spacing = 120;

        this.bankSprites = {};
        this.bankTexts = {};

        animals.forEach((animal, i) => {
            const x = startX + (i * spacing);
            const animalKey = animal.charAt(0).toUpperCase() + animal.slice(1);
            const count = this.currentState.bankHerd[animalKey];

            // Sprite
            const sprite = this.add.sprite(x - 15, y, 'animals', animal)
                .setScale(0.06);

            // Count
            const text = this.add.text(x + 20, y,
                `×${count}`, {
                    fontSize: '18px',
                    fontFamily: 'Arial',
                    color: '#000000'
                }).setOrigin(0, 0.5);

            this.bankSprites[animalKey] = sprite;
            this.bankTexts[animalKey] = text;
        });
    }

    createTradeFeed() {
        const {width, height} = this.cameras.main;
        const panelX = width / 2;
        const panelY = 740;
        const panelWidth = width - 40;
        const panelHeight = height - panelY - 20;

        this.add.rectangle(panelX, panelY + panelHeight / 2,
            panelWidth, panelHeight, 0xffffff, 0.9)
            .setStrokeStyle(3, 0x8b4513);

        const tradeCount = this.currentState.pendingTrades.length;
        this.add.text(30, panelY + 15,
            `📜 ${t('game_pending_trades')} (${tradeCount})`, {
                fontSize: '24px',
                fontFamily: 'Arial Black',
                color: '#8b4513'
            });

        this.tradeItemContainer = this.add.container(0, 0);
        this.updateTradeFeed(this.currentState.pendingTrades);
    }

    updateButtonStates() {
        this.rollBtn.setEnabled(!this.currentState.hasRolled);
        this.bankBtn.setEnabled(!this.currentState.hasExchanged);
    }

    updateTradeFeed(trades) {
        this.tradeItemContainer.removeAll(true);
        // TODO: Create trade items
    }

    onStateUpdate(state) {
        console.log('[GameScene] Received state update:', state);

        this.currentState = state;

        // Update HUD
        this.hudElements.turnText.setText(`${t('game_turn')} ${state.turnNumber}`);
        this.hudElements.playerText.setText(
            `🎲 ${state.currentPlayerName}'s ${t('game_turn')}`
        );

        // Update player herd
        Object.keys(state.currentPlayerHerd).forEach(animal => {
            const count = state.currentPlayerHerd[animal];
            if (this.herdTexts[animal]) {
                this.herdTexts[animal].setText(`×${count}`);
                this.herdTexts[animal].setColor(count > 0 ? '#000000' : '#888888');
            }
            if (this.herdSprites[animal]) {
                this.herdSprites[animal].setAlpha(count > 0 ? 1 : 0.3);
            }
        });

        // Update bank
        Object.keys(state.bankHerd).forEach(animal => {
            const count = state.bankHerd[animal];
            if (this.bankTexts[animal]) {
                this.bankTexts[animal].setText(`×${count}`);
            }
        });

        // Update buttons
        this.rollBtn.setEnabled(!state.hasRolled);
        this.bankBtn.setEnabled(!state.hasExchanged);

        // Update trades
        this.updateTradeFeed(state.pendingTrades);
    }

    onError(errorResult) {
        console.error('[GameScene] Error:', errorResult);
    }

    onVictory(victoryData) {
        console.log('[GameScene] Victory!', victoryData);
    }

    onRollDice() {
        console.log('Roll dice clicked');
        this.controller.rollDice();
    }

    onOpenBank() {
        console.log('Bank clicked');
    }

    onOpenTrade() {
        console.log('Trade clicked');
    }

    onEndTurn() {
        console.log('End turn clicked');
        this.controller.endTurn();
    }

    openGameMenu() {
        console.log('Menu clicked');
    }

    shutdown() {
        this.events.off('game:state', this.onStateUpdate, this);
        this.events.off('ui:error', this.onError, this);
        this.events.off('game:victory', this.onVictory, this);
    }
}