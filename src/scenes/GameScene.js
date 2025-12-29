// game/scenes/GameScene.js
import {Scene} from "phaser";
import {t} from "../utils/i18n.js";
import {UiButton} from "../ui/UiButton.js";
import {GameController} from "../GameController.js";
import {DEPTH} from "../game/constants/Depth.js";
import {BankTradeModal} from "../ui/BankTradeModal.js";
import {PlayerTradeModal} from "../ui/PlayerTradeModal.js";

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

        // track modal
        this.activeModal = null;

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
            `${playerName}'s ${t('game_turn')}`, {
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
        this.herdTitleText = this.add.text(panelX, panelY - panelHeight / 2 + 25,
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

        // Roll Dice button - ICON + small text
        this.rollBtn = new UiButton(this, centerX - spacing * 1.5, y, {
            color: 'green',
            size: 'm',
            icon: 'icon_dice',
            iconScale: 0.10,
            text: t('game_roll'),    // Just "Roll" not "Roll\n🎲"
            textStyle: {fontSize: '18px'},
            onClick: () => this.onRollDice()
        });
        this.add.existing(this.rollBtn);

        // Trade button - ICON + small text
        this.tradeBtn = new UiButton(this, centerX - spacing * 0.5, y, {
            color: 'violet',
            size: 'm',
            icon: 'icon_trade',
            iconScale: 0.10,
            text: t('game_trade'),
            textStyle: {fontSize: '18px'},
            onClick: () => this.onOpenTrade()
        });
        this.add.existing(this.tradeBtn);

        // Bank button - ICON + small text
        this.bankBtn = new UiButton(this, centerX + spacing * 0.5, y, {
            color: 'teal',
            size: 'm',
            icon: 'icon_bank',
            iconScale: 0.10,
            text: t('game_bank'),
            textStyle: {fontSize: '18px'},
            onClick: () => this.onOpenBank()
        });
        this.add.existing(this.bankBtn);

        // End Turn button - ICON + small text
        this.endTurnBtn = new UiButton(this, centerX + spacing * 1.5, y, {
            color: 'yellow',
            size: 'm',
            icon: 'icon_turn',
            iconScale: 0.10,
            text: t('game_end_turn'),
            textStyle: {fontSize: '18px'},
            onClick: () => this.onEndTurn()
        });
        this.add.existing(this.endTurnBtn);

        this.endTurnHint = this.add.text(
            this.endTurnBtn.x,
            this.endTurnBtn.y - 80,
            t('hint_roll_first'),
            {
                fontSize: '18px',
                fontFamily: 'Arial Black',
                color: '#ff6600',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setVisible(false);
        this.tweens.add({
            targets: this.endTurnHint,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        this.updateButtonStates();
    }

    createBankStatusBar() {
        const {width} = this.cameras.main;
        const y = 580;
        const barHeight = 60;

        this.add.rectangle(width / 2, y, width, barHeight, 0xd2b48c, 0.9)
            .setStrokeStyle(3, 0x8b4513);

        this.add.text(20, y, t('game_bank') + ':', {
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
            `${t('game_pending_trades')} (${tradeCount})`, {
                fontSize: '24px',
                fontFamily: 'Arial Black',
                color: '#8b4513'
            });

        this.tradeItemContainer = this.add.container(0, 0);
        this.updateTradeFeed(this.currentState.pendingTrades);
    }

    updateButtonStates() {
        // Roll button: disabled after rolling
        this.rollBtn.setEnabled(!this.currentState.hasRolled);

        // Bank button: disabled after exchanging
        this.bankBtn.setEnabled(!this.currentState.hasExchanged);

        // End Turn button: ONLY enabled after player has rolled
        this.endTurnBtn.setEnabled(this.currentState.hasRolled);

        if (this.endTurnHint) {
            this.endTurnHint.setVisible(!this.currentState.hasRolled);
        }
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
            `${state.currentPlayerName}'s ${t('game_turn')}`
        );

        const playerName = state.currentPlayerName;
        this.herdTitleText.setText(
            `${playerName}'${playerName.endsWith('s') ? '' : 's'} ${t('game_herd')}`
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

        // Update button states (includes END TURN lock)
        this.updateButtonStates();

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

        // Close existing modal if any
        if (this.activeModal) {
            this.activeModal.close();
            this.activeModal = null;
        }

        // Create and show bank trade modal
        this.activeModal = new BankTradeModal(this, this.controller);
        this.add.existing(this.activeModal);
    }

    onOpenTrade() {
        console.log('Trade clicked');

        // Close existing modal if any
        if (this.activeModal) {
            this.activeModal.close();
            this.activeModal = null;
        }

        // Create player trade modal
        this.activeModal = new PlayerTradeModal(this, this.controller);
        this.add.existing(this.activeModal);
    }

    onEndTurn() {
        console.log('End turn clicked');
        this.controller.endTurn();
    }

    openGameMenu() {
        console.log('Menu clicked');

        // Close existing modal if any
        if (this.activeModal) {
            this.activeModal.close();
            this.activeModal = null;
        }

        // TODO: Create game menu modal
        // this.activeModal = new GameMenuModal(this);
        // this.add.existing(this.activeModal);
    }

    shutdown() {
        this.events.off('game:state', this.onStateUpdate, this);
        this.events.off('ui:error', this.onError, this);
        this.events.off('game:victory', this.onVictory, this);
    }
}