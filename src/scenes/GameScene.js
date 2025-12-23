import {Scene} from 'phaser';
import {DEPTH} from "../game/constants/Depth.js";
import {t} from "../utils/i18n.js";

export class GameScene extends Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        // Store game settings from MenuScene
        this.gameConfig = {
            playerCount: data.playerCount || 2,
            playerNames: data.playerNames || ['Player 1', 'Player 2'],
            difficulty: data.difficulty || 'easy',
            tradeExpiry: data.tradeExpiry || 5
        };

        // Mock game state (will be replaced with Logic later)
        this.mockState = {
            currentPlayerIndex: 0,
            turnNumber: 1,
            currentPlayerHerd: {
                Rabbit: 5,
                Sheep: 2,
                Pig: 1,
                Cow: 0,
                Horse: 0,
                Foxhound: 1,
                Wolfhound: 0
            },
            bankHerd: {
                Rabbit: 45,
                Sheep: 20,
                Pig: 15,
                Cow: 10,
                Horse: 3,
                Foxhound: 3,
                Wolfhound: 2
            },
            pendingTrades: [
                {
                    id: 'trade_1',
                    requestorName: 'John',
                    targetName: 'Maria',
                    offer: {animal: 'Sheep', amount: 3},
                    want: {animal: 'Rabbit', amount: 6},
                    turnsLeft: 2
                }
            ],
            hasRolled: false,
            hasExchanged: false
        };
    }

    create() {
        const {width, height} = this.cameras.main;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0xf5deb3);

        // Create UI sections
        this.createHUD();
        this.createPlayerHerdDisplay();
        this.createActionButtons();
        this.createBankStatusBar();
        this.createTradeFeed();
    }

    createHUD() {
        const {width} = this.cameras.main;
        const hudHeight = 80;

        // HUD Background
        const hudBg = this.add.rectangle(width / 2, hudHeight / 2, width, hudHeight, 0x8b4513)
            .setDepth(DEPTH.HUD);

        // Left side - Turn info
        const turnText = this.add.text(20, hudHeight / 2,
            `${t('game_turn')} ${this.mockState.turnNumber}`, {
                fontSize: '28px',
                fontFamily: 'Arial Black',
                color: '#ffffff'
            }).setOrigin(0, 0.5).setDepth(DEPTH.HUD_ELEMENTS);

        // Center - Current player
        const playerName = this.gameConfig.playerNames[this.mockState.currentPlayerIndex];
        const playerText = this.add.text(width / 2, hudHeight / 2,
            `🎲 ${playerName}'s ${t('game_turn')}`, {
                fontSize: '32px',
                fontFamily: 'Arial Black',
                color: '#ffdd00',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(DEPTH.HUD_ELEMENTS);

        // Right side - Settings/Menu button
        const menuBtn = this.add.text(width - 20, hudHeight / 2, '⚙️', {
            fontSize: '36px'
        }).setOrigin(1, 0.5)
            .setInteractive({useHandCursor: true})
            .setDepth(DEPTH.HUD_ELEMENTS);

        menuBtn.on('pointerover', () => menuBtn.setScale(1.1));
        menuBtn.on('pointerout', () => menuBtn.setScale(1));
        menuBtn.on('pointerdown', () => this.openGameMenu());

        // Store references for updates
        this.hudElements = {
            turnText,
            playerText,
            menuBtn
        };
    }

    createPlayerHerdDisplay() {
        const {width} = this.cameras.main;
        const panelX = width / 2;
        const panelY = 220;
        const panelWidth = 900;
        const panelHeight = 160;

        // Panel background
        const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xffffff, 0.9)
            .setStrokeStyle(4, 0x8b4513)
            .setDepth(DEPTH.HUD);

        // Title
        const playerName = this.gameConfig.playerNames[this.mockState.currentPlayerIndex];
        const title = this.add.text(panelX, panelY - panelHeight / 2 + 25,
            `${playerName}'${playerName.endsWith('s') ? '' : 's'} ${t('game_herd')}`, {
                fontSize: '28px',
                fontFamily: 'Arial Black',
                color: '#8b4513'
            }).setOrigin(0.5).setDepth(DEPTH.HUD_ELEMENTS);

        // Animal counts
        // TODO: before loaidng animal sprites lets use emojis as placeholder.
        const animalIcons = {
            Rabbit: '🐰',
            Sheep: '🐑',
            Pig: '🐷',
            Cow: '🐮',
            Horse: '🐴',
            Foxhound: '🦊🐕',
            Wolfhound: '🐺🐕'
        };

        const animals = ['Rabbit', 'Sheep', 'Pig', 'Cow', 'Horse'];
        const dogs = ['Foxhound', 'Wolfhound'];

        // Main animals row
        const startX = panelX - 350;
        const y1 = panelY + 10;

        this.herdTexts = {};

        animals.forEach((animal, i) => {
            const x = startX + (i * 150);
            const count = this.mockState.currentPlayerHerd[animal];

            const text = this.add.text(x, y1,
                `${animalIcons[animal]}×${count}`, {
                    fontSize: '32px',
                    fontFamily: 'Arial',
                    color: count > 0 ? '#000000' : '#888888'
                }).setOrigin(0.5).setDepth(DEPTH.HUD_ELEMENTS);

            this.herdTexts[animal] = text;
        });

        // Dogs row
        const y2 = panelY + 60;
        dogs.forEach((animal, i) => {
            const x = startX + (i * 150);
            const count = this.mockState.currentPlayerHerd[animal];

            const text = this.add.text(x, y2,
                `${animalIcons[animal]}×${count}`, {
                    fontSize: '28px',
                    fontFamily: 'Arial',
                    color: count > 0 ? '#000000' : '#888888'
                }).setOrigin(0.5).setDepth(DEPTH.HUD_ELEMENTS);

            this.herdTexts[animal] = text;
        });
    }

    createActionButtons() {
        const {width} = this.cameras.main;
        const centerX = width / 2;
        const y = 420;
        const spacing = 240;

        // Roll Dice button
        this.rollBtn = this.createGameButton(
            centerX - spacing * 1.5, y,
            `${t('game_roll')}\n🎲`,
            'orange',
            () => this.onRollDice()
        );

        // Trade button
        this.tradeBtn = this.createGameButton(
            centerX - spacing * 0.5, y,
            `${t('game_trade')}\n🔄`,
            'purple',
            () => this.onOpenTrade()
        );

        // Bank button
        this.bankBtn = this.createGameButton(
            centerX + spacing * 0.5, y,
            `${t('game_bank')}\n💰`,
            'teal',
            () => this.onOpenBank()
        );

        // End Turn button
        this.endTurnBtn = this.createGameButton(
            centerX + spacing * 1.5, y,
            `${t('game_end_turn')}\n▶▶`,
            'yellow',
            () => this.onEndTurn()
        );

        // Update button states based on game state
        this.updateButtonStates();
    }

    createGameButton(x, y, text, color, onClick) {
        const width = 200;
        const height = 120;

        const container = this.add.container(x, y);

        const colorMap = {
            orange: 0xff6600,
            teal: 0x00cccc,
            purple: 0x9370db,
            yellow: 0xffaa00
        };

        const bg = this.add.rectangle(0, 0, width, height, colorMap[color] || 0x888888)
            .setStrokeStyle(6, 0xffffff);

        const label = this.add.text(0, 0, text, {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        container.add([bg, label]);
        container.setSize(width, height);
        container.setInteractive(
            new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
            Phaser.Geom.Rectangle.Contains
        );

        container.on('pointerover', () => {
            if (container.alpha === 1) {
                this.tweens.add({
                    targets: container,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100
                });
            }
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
            if (container.alpha === 1) {
                this.tweens.add({
                    targets: container,
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 50,
                    yoyo: true,
                    onComplete: onClick
                });
            }
        });

        return container;
    }

    createBankStatusBar() {
        const {width} = this.cameras.main;
        const y = 580;
        const barHeight = 60;

        // Background
        const bg = this.add.rectangle(width / 2, y, width, barHeight, 0xd2b48c, 0.9)
            .setStrokeStyle(3, 0x8b4513);

        // Bank label
        this.add.text(20, y, '📊 ' + t('game_bank') + ':', {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: '#8b4513'
        }).setOrigin(0, 0.5);

        // Bank counts
        const animals = ['Rabbit', 'Sheep', 'Pig', 'Cow', 'Horse', 'Foxhound', 'Wolfhound'];
        const icons = ['🐰', '🐑', '🐷', '🐮', '🐴', '🦊🐕', '🐺🐕'];

        const startX = 180;
        const spacing = 120;

        this.bankTexts = {};

        animals.forEach((animal, i) => {
            const x = startX + (i * spacing);
            const count = this.mockState.bankHerd[animal];

            const text = this.add.text(x, y,
                `${icons[i]}×${count}`, {
                    fontSize: '20px',
                    fontFamily: 'Arial',
                    color: '#000000'
                }).setOrigin(0, 0.5);

            this.bankTexts[animal] = text;
        });
    }

    createTradeFeed() {
        const {width, height} = this.cameras.main;
        const panelX = width / 2;
        const panelY = 740;
        const panelWidth = width - 40;
        const panelHeight = height - panelY - 20;

        // Background
        const bg = this.add.rectangle(panelX, panelY + panelHeight / 2,
            panelWidth, panelHeight, 0xffffff, 0.9)
            .setStrokeStyle(3, 0x8b4513);

        // Header
        const tradeCount = this.mockState.pendingTrades.length;
        this.add.text(30, panelY + 15,
            `📜 ${t('game_pending_trades')} (${tradeCount})`, {
                fontSize: '24px',
                fontFamily: 'Arial Black',
                color: '#8b4513'
            });

        // "See All" button (if needed)
        if (tradeCount > 2) {
            const seeAllBtn = this.add.text(width - 30, panelY + 15,
                `${t('game_see_all')} ▼`, {
                    fontSize: '20px',
                    fontFamily: 'Arial',
                    color: '#0066cc'
                }).setOrigin(1, 0).setInteractive({useHandCursor: true});

            seeAllBtn.on('pointerover', () => seeAllBtn.setScale(1.05));
            seeAllBtn.on('pointerout', () => seeAllBtn.setScale(1));
            seeAllBtn.on('pointerdown', () => this.openAllTrades());
        }

        // Trade items
        this.tradeItemContainer = this.add.container(0, 0);
        this.updateTradeFeed();
    }

    updateTradeFeed() {
        // Clear existing items
        this.tradeItemContainer.removeAll(true);

        const {width} = this.cameras.main;
        const startY = 770;
        const itemHeight = 80;

        // Show max 2 trades
        const visibleTrades = this.mockState.pendingTrades.slice(0, 2);

        visibleTrades.forEach((trade, i) => {
            const y = startY + (i * itemHeight);

            this.createTradeItem(30, y, trade);
        });
    }

    createTradeItem(x, y, trade) {
        const {width} = this.cameras.main;
        const itemWidth = width - 60;
        const itemHeight = 70;

        // Background
        const bg = this.add.rectangle(x + itemWidth / 2, y + itemHeight / 2,
            itemWidth, itemHeight, 0xf0e68c)
            .setStrokeStyle(2, 0x8b4513);

        // Trade text
        const tradeText = `${trade.requestorName} → ${trade.targetName}: ` +
            `${trade.offer.amount}${this.getAnimalIcon(trade.offer.animal)} ` +
            `${t('game_for')} ` +
            `${trade.want.amount}${this.getAnimalIcon(trade.want.animal)}`;

        const text = this.add.text(x + 20, y + 15, tradeText, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#000000'
        });

        // Expiry text
        const expiryText = this.add.text(x + 20, y + 45,
            `${t('game_expires_in')} ${trade.turnsLeft} ${t('game_turns')}`, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#666666'
            });

        // Accept button
        const acceptBtn = this.add.text(width - 200, y + itemHeight / 2,
            `✓ ${t('game_accept')}`, {
                fontSize: '20px',
                fontFamily: 'Arial Black',
                color: '#ffffff',
                backgroundColor: '#00cc00',
                padding: {x: 16, y: 8}
            }).setOrigin(0.5).setInteractive({useHandCursor: true});

        acceptBtn.on('pointerover', () => acceptBtn.setScale(1.05));
        acceptBtn.on('pointerout', () => acceptBtn.setScale(1));
        acceptBtn.on('pointerdown', () => this.onAcceptTrade(trade.id));

        // Reject button
        const rejectBtn = this.add.text(width - 80, y + itemHeight / 2,
            `✗ ${t('game_reject')}`, {
                fontSize: '20px',
                fontFamily: 'Arial Black',
                color: '#ffffff',
                backgroundColor: '#cc0000',
                padding: {x: 16, y: 8}
            }).setOrigin(0.5).setInteractive({useHandCursor: true});

        rejectBtn.on('pointerover', () => rejectBtn.setScale(1.05));
        rejectBtn.on('pointerout', () => rejectBtn.setScale(1));
        rejectBtn.on('pointerdown', () => this.onRejectTrade(trade.id));

        this.tradeItemContainer.add([bg, text, expiryText, acceptBtn, rejectBtn]);
    }

    getAnimalIcon(animal) {
        const icons = {
            Rabbit: '🐰',
            Sheep: '🐑',
            Pig: '🐷',
            Cow: '🐮',
            Horse: '🐴',
            Foxhound: '🦊🐕',
            Wolfhound: '🐺🐕'
        };
        return icons[animal] || '';
    }

    updateButtonStates() {
        // Disable roll button if already rolled
        this.rollBtn.alpha = this.mockState.hasRolled ? 0.5 : 1;

        // Disable bank button if already exchanged
        this.bankBtn.alpha = this.mockState.hasExchanged ? 0.5 : 1;
    }

    // ===== Button Callbacks (placeholders) =====

    onRollDice() {
        console.log('Roll dice clicked');
        // TODO: Show dice animation, call Logic.processDiceRoll()
        this.showPlaceholderMessage('Rolling dice...');
    }

    onOpenTrade() {
        console.log('Trade clicked');
        // TODO: Open trade modal
        this.showPlaceholderMessage('Opening trade modal...');
    }

    onOpenBank() {
        console.log('Bank clicked');
        // TODO: Open bank exchange modal
        this.showPlaceholderMessage('Opening bank exchange...');
    }

    onEndTurn() {
        console.log('End turn clicked');
        // TODO: Call Logic.endTurn(), update UI
        this.showPlaceholderMessage('Ending turn...');
    }

    onAcceptTrade(tradeId) {
        console.log('Accept trade:', tradeId);
        // TODO: Call ExchangeManager.acceptRequest()
        this.showPlaceholderMessage('Accepting trade...');
    }

    onRejectTrade(tradeId) {
        console.log('Reject trade:', tradeId);
        // TODO: Remove trade from list
        this.showPlaceholderMessage('Rejecting trade...');
    }

    openGameMenu() {
        console.log('Game menu clicked');
        // TODO: Open pause/settings modal
        this.showPlaceholderMessage('Opening menu...');
    }

    openAllTrades() {
        console.log('See all trades clicked');
        // TODO: Open full trades modal
        this.showPlaceholderMessage('Showing all trades...');
    }

    showPlaceholderMessage(message) {
        const {width, height} = this.cameras.main;

        const toast = this.add.text(width / 2, height / 2, message, {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: {x: 40, y: 20}
        }).setOrigin(0.5).setDepth(DEPTH.OVERLAY);

        this.tweens.add({
            targets: toast,
            alpha: 0,
            duration: 2000,
            delay: 500,
            onComplete: () => toast.destroy()
        });
    }
}