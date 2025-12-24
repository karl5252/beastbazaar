import {Scene} from "phaser";
import {t} from "../utils/i18n.js";
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

        // HUD Background
        this.add.rectangle(width / 2, hudHeight / 2, width, hudHeight, 0x8b4513)
            .setDepth(DEPTH.HUD);

        // Left side - Turn info
        const turnText = this.add.text(20, hudHeight / 2,
            `${t('game_turn')} ${this.currentState.turnNumber}`, {
                fontSize: '28px',
                fontFamily: 'Arial Black',
                color: '#ffffff'
            }).setOrigin(0, 0.5).setDepth(DEPTH.HUD_ELEMENTS);

        // Center - Current player
        const playerName = this.currentState.currentPlayerName;
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
        this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xffffff, 0.9)
            .setStrokeStyle(4, 0x8b4513)
            .setDepth(DEPTH.HUD);

        // Title
        const playerName = this.currentState.currentPlayerName;
        this.add.text(panelX, panelY - panelHeight / 2 + 25,
            `${playerName}'${playerName.endsWith('s') ? '' : 's'} ${t('game_herd')}`, {
                fontSize: '28px',
                fontFamily: 'Arial Black',
                color: '#8b4513'
            }).setOrigin(0.5).setDepth(DEPTH.HUD_ELEMENTS);

        // Animal icons
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

        const startX = panelX - 350;
        const y1 = panelY + 10;

        this.herdTexts = {};

        // Main animals
        animals.forEach((animal, i) => {
            const x = startX + (i * 150);
            const count = this.currentState.currentPlayerHerd[animal];

            const text = this.add.text(x, y1,
                `${animalIcons[animal]}×${count}`, {
                    fontSize: '32px',
                    fontFamily: 'Arial',
                    color: count > 0 ? '#000000' : '#888888'
                }).setOrigin(0.5).setDepth(DEPTH.HUD_ELEMENTS);

            this.herdTexts[animal] = text;
        });

        // Dogs
        const y2 = panelY + 60;
        dogs.forEach((animal, i) => {
            const x = startX + (i * 150);
            const count = this.currentState.currentPlayerHerd[animal];

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

        this.rollBtn = this.createGameButton(
            centerX - spacing * 1.5, y,
            `${t('game_roll')}\n🎲`,
            'orange',
            () => this.onRollDice()
        );

        this.tradeBtn = this.createGameButton(
            centerX - spacing * 0.5, y,
            `${t('game_trade')}\n🔄`,
            'purple',
            () => this.onOpenTrade()
        );

        this.bankBtn = this.createGameButton(
            centerX + spacing * 0.5, y,
            `${t('game_bank')}\n💰`,
            'teal',
            () => this.onOpenBank()
        );

        this.endTurnBtn = this.createGameButton(
            centerX + spacing * 1.5, y,
            `${t('game_end_turn')}\n▶▶`,
            'yellow',
            () => this.onEndTurn()
        );

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

        this.add.rectangle(width / 2, y, width, barHeight, 0xd2b48c, 0.9)
            .setStrokeStyle(3, 0x8b4513);

        this.add.text(20, y, '📊 ' + t('game_bank') + ':', {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: '#8b4513'
        }).setOrigin(0, 0.5);

        const animals = ['Rabbit', 'Sheep', 'Pig', 'Cow', 'Horse', 'Foxhound', 'Wolfhound'];
        const icons = ['🐰', '🐑', '🐷', '🐮', '🐴', '🦊🐕', '🐺🐕'];

        const startX = 180;
        const spacing = 120;

        this.bankTexts = {};

        animals.forEach((animal, i) => {
            const x = startX + (i * spacing);
            const count = this.currentState.bankHerd[animal];

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

        this.tradeItemContainer = this.add.container(0, 0);
        this.updateTradeFeed(this.currentState.pendingTrades);
    }

    updateButtonStates() {
        this.rollBtn.alpha = this.currentState.hasRolled ? 0.5 : 1;
        this.bankBtn.alpha = this.currentState.hasExchanged ? 0.5 : 1;
    }

    updateTradeFeed(trades) {
        this.tradeItemContainer.removeAll(true);

        const startY = 770;
        const itemHeight = 80;

        trades.slice(0, 2).forEach((trade, i) => {
            const y = startY + (i * itemHeight);
            this.createTradeItem(30, y, trade);
        });
    }

    createTradeItem(x, y, trade) {
        // TODO: Implement trade item display
        console.log('Creating trade item:', trade);
    }

    onStateUpdate(state) {
        console.log('[GameScene] Received state update:', state);

        // Update stored state
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
                this.herdTexts[animal].setText(`${this.getAnimalIcon(animal)}×${count}`);
                this.herdTexts[animal].setColor(count > 0 ? '#000000' : '#888888');
            }
        });

        // Update bank
        Object.keys(state.bankHerd).forEach(animal => {
            const count = state.bankHerd[animal];
            if (this.bankTexts[animal]) {
                this.bankTexts[animal].setText(`${this.getAnimalIcon(animal)}×${count}`);
            }
        });

        // Update buttons
        this.rollBtn.alpha = state.hasRolled ? 0.5 : 1;
        this.bankBtn.alpha = state.hasExchanged ? 0.5 : 1;

        // Update trades
        this.updateTradeFeed(state.pendingTrades);
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

    onError(errorResult) {
        console.error('[GameScene] Error:', errorResult);
        // TODO: Show error toast
    }

    onVictory(victoryData) {
        console.log('[GameScene] Victory!', victoryData);
        // TODO: Go to victory scene
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

    openAllTrades() {
        console.log('All trades clicked');
    }

    shutdown() {
        this.events.off('game:state', this.onStateUpdate, this);
        this.events.off('ui:error', this.onError, this);
        this.events.off('game:victory', this.onVictory, this);
    }
}