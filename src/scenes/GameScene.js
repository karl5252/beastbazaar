// game/scenes/GameScene.js
import {Scene} from "phaser";
import {t} from "../utils/i18n.js";
import {UiButton} from "../ui/UiButton.js";
import {GameController} from "../GameController.js";
import {DEPTH} from "../game/constants/Depth.js";
import {BankTradeModal} from "../ui/BankTradeModal.js";
import {PlayerTradeModal} from "../ui/PlayerTradeModal.js";
import {Toast} from "../ui/Toast.js";
import {GameMenuModal} from "../ui/GameMenuModal.js";
import {DiceRollModal} from "../ui/DiceRollModal.js";

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
        this.events.on('ui:toast', this.onToast, this); // ← Add toast listener

        this.currentState = this.controller.getPublicState();
        this.activeModal = null;

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
        this.createTradeFeed();
        this.createBankStatusBar();
    }

    // game/scenes/GameScene.js

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

        // Replace emoji with icon sprite
        const menuBtn = this.add.sprite(width - 40, hudHeight / 2, 'icon_settings')
            .setScale(0.08)
            .setOrigin(0.5)
            .setInteractive({useHandCursor: true})
            .setDepth(DEPTH.HUD_ELEMENTS);

        menuBtn.on('pointerover', () => menuBtn.setScale(0.09));
        menuBtn.on('pointerout', () => menuBtn.setScale(0.08));
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
        const y = 720;  // ← Moved down from 580 to 680 (100px lower)
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

            const sprite = this.add.sprite(x - 15, y, 'animals', animal)
                .setScale(0.06);

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
        const {width} = this.cameras.main;
        const panelX = width / 2;
        const panelY = 550;  // ← New position (below action buttons)
        const panelWidth = width - 40;
        const panelHeight = 110;  // ← Fixed height

        // Background panel
        this.add.rectangle(panelX, panelY + panelHeight / 2,
            panelWidth, panelHeight, 0xffffff, 0.9)
            .setStrokeStyle(3, 0x8b4513);

        // Title
        this.tradeFeedTitle = this.add.text(30, panelY + 15,
            `${t('game_pending_trades')} (0)`, {
                fontSize: '20px',
                fontFamily: 'Arial Black',
                color: '#8b4513'
            });

        // Scrollable container for trade items
        this.tradeItemContainer = this.add.container(40, panelY + 50);

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
        // Update title with count
        const tradeCount = trades.length;
        this.tradeFeedTitle.setText(`${t('game_pending_trades')} (${tradeCount})`);

        // Clear existing trade items
        this.tradeItemContainer.removeAll(true);

        if (trades.length === 0) {
            // Show "no trades" message
            const noTradesText = this.add.text(450, 10,
                t('no_pending_trades') || 'No active trade offers', {
                    fontSize: '18px',
                    fontFamily: 'Arial',
                    color: '#888888',
                    align: 'center'
                }).setOrigin(0.5);
            this.tradeItemContainer.add(noTradesText);
            return;
        }

        // Create trade offer cards (horizontal layout)
        const cardWidth = 280;
        const spacing = 20;
        let currentX = 0;

        trades.forEach((trade, index) => {
            const tradeCard = this.createTradeCard(trade, currentX, 0);
            this.tradeItemContainer.add(tradeCard);
            currentX += cardWidth + spacing;
        });

        // TODO: Add scroll buttons if trades overflow
    }

    createTradeCard(trade, x, y) {
        const container = this.add.container(x, y);
        const cardWidth = 260;
        const cardHeight = 60;

        // Card background
        const bg = this.add.rectangle(cardWidth / 2, cardHeight / 2,
            cardWidth, cardHeight, 0xf5f5dc)
            .setStrokeStyle(2, 0x8b4513);
        container.add(bg);

        // Get player names
        const requestorName = this.controller.logic.players[trade.requestorIndex]?.name || `Player ${trade.requestorIndex + 1}`;
        const targetName = trade.targetIndex === 99
            ? 'Bank'
            : this.controller.logic.players[trade.targetIndex]?.name || `Player ${trade.targetIndex + 1}`;

        // Requestor info
        const requestorText = this.add.text(10, 10,
            requestorName, {
                fontSize: '14px',
                fontFamily: 'Arial Black',
                color: '#555555'
            }).setOrigin(0);
        container.add(requestorText);

        // Offer with icon instead of arrow emoji
        const offerText = this.add.text(10, 30,
            `${trade.offer.amount}× ${trade.offer.animal}`, {
                fontSize: '13px',
                fontFamily: 'Arial',
                color: '#000000'
            }).setOrigin(0);
        container.add(offerText);

        // Small arrow icon
        const arrowIcon = this.add.sprite(95, 30, 'icon_right_arrow')
            .setScale(0.04)
            .setOrigin(0, 0.5);
        container.add(arrowIcon);

        // Want
        const wantText = this.add.text(110, 30,
            `${trade.want.amount}× ${trade.want.animal}`, {
                fontSize: '13px',
                fontFamily: 'Arial',
                color: '#000000'
            }).setOrigin(0);
        container.add(wantText);

        // Target info with icon
        const targetArrow = this.add.sprite(10, 48, 'icon_right_arrow')
            .setScale(0.03)
            .setOrigin(0, 0.5);
        container.add(targetArrow);

        const targetText = this.add.text(20, 48,
            targetName, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#888888'
            }).setOrigin(0);
        container.add(targetText);

        // Action buttons (only show if current player is the target)
        const currentPlayerIndex = this.currentState.currentPlayerIndex;

        if (trade.targetIndex === currentPlayerIndex) {
            // Accept button (checkmark)
            const acceptBtn = new UiButton(this, cardWidth - 70, cardHeight / 2, {
                color: 'green',
                size: 'xs',
                text: '✓',
                textStyle: {fontSize: '20px'},
                onClick: () => this.onAcceptTrade(trade.id)
            });
            this.add.existing(acceptBtn);
            container.add(acceptBtn);

            // Reject button (X)
            const rejectBtn = new UiButton(this, cardWidth - 25, cardHeight / 2, {
                color: 'orange',
                size: 'xs',
                text: '✗',
                textStyle: {fontSize: '20px'},
                onClick: () => this.onRejectTrade(trade.id)
            });
            this.add.existing(rejectBtn);
            container.add(rejectBtn);

            // Highlight card for current player
            bg.setFillStyle(0xffffcc);
        }

        return container;
    }

    onAcceptTrade(tradeId) {
        console.log('[GameScene] Accepting trade:', tradeId);
        const result = this.controller.acceptTrade({requestId: tradeId});

        if (!result.ok) {
            console.error('[GameScene] Failed to accept trade:', result.reason);
        }
    }

    onRejectTrade(tradeId) {
        console.log('[GameScene] Rejecting trade:', tradeId);
        const result = this.controller.rejectTrade({requestId: tradeId});

        if (!result.ok) {
            console.error('[GameScene] Failed to reject trade:', result.reason);
        }
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

    onToast(toastData) {
        Toast.show(this, toastData.message, toastData.type);
    }

    onError(errorResult) {
        console.error('[GameScene] Error:', errorResult);

        // Show error as toast
        const errorMessages = {
            'already_rolled': 'You already rolled this turn!',
            'already_exchanged': 'You already exchanged this turn!',
            'not_your_turn': 'Not your turn!',
            'player_lacks_from': 'Not enough animals!',
            'bank_lacks_to': 'Bank out of stock!',
            'requestor_lacks_offer': 'Cannot complete trade - not enough animals!',
            'acceptor_lacks_want': 'Cannot complete trade - other player lacks animals!',
        };

        const message = errorMessages[errorResult.reason] || `Error: ${errorResult.reason}`;
        Toast.show(this, message, 'error');
    }

    onVictory(victoryData) {
        console.log('[GameScene] Victory!', victoryData);
    }

    onRollDice() {
        console.log('Roll dice clicked');

        // 1. FIRST: Get the actual dice roll result
        const result = this.controller.rollDice();

        if (!result.ok) {
            console.error('[GameScene] Roll failed:', result.reason);
            return;
        }

        // 2. THEN: Show animation with the real results
        if (result.diceResults) {
            const diceModal = new DiceRollModal(
                this,
                result.diceResults.green,
                result.diceResults.red,
                () => {
                    // Animation complete callback
                    console.log('[GameScene] Dice animation complete');
                }
            );
            this.add.existing(diceModal);
        }
    }

    processDiceRoll() {
        // Dice roll is already done, just let state update handle UI
        console.log('[GameScene] Dice roll complete');
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

        // Create game menu modal
        this.activeModal = new GameMenuModal(this);
        this.add.existing(this.activeModal);
    }

    shutdown() {
        this.events.off('game:state', this.onStateUpdate, this);
        this.events.off('ui:error', this.onError, this);
        this.events.off('game:victory', this.onVictory, this);
        this.events.off('ui:toast', this.onToast, this); // ← Clean up
    }
}