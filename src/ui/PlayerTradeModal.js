// game/ui/PlayerTradeModal.js
import {Modal} from "./Modal.js";
import {UiButton} from "./UiButton.js";
import {t} from "../utils/i18n.js";

export class PlayerTradeModal extends Modal {
    constructor(scene, controller) {
        super(scene, {
            width: 900,
            height: 700,
            title: t('player_trade_title') || '🔄 Trade with Players',
            showCloseButton: true,
            onClose: () => console.log('[PlayerTradeModal] Closed')
        });

        this.controller = controller;
        this.currentState = controller.getPublicState();

        // Trade offer data
        this.selectedTargetPlayer = null;
        this.offerAnimal = null;
        this.offerAmount = 1;
        this.wantAnimal = null;
        this.wantAmount = 1;

        // Subscribe to state updates
        this.scene.events.on('game:state', this.onStateUpdate, this);
        this.scene.events.on('ui:error', this.onError, this);

        this.createTradeInterface();
    }

    createTradeInterface() {
        // Instructions
        const instructions = this.scene.add.text(0, -310,
            t('player_trade_instructions') || 'Create a trade offer for another player', {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#555555',
                align: 'center',
                wordWrap: {width: 850}
            }).setOrigin(0.5);
        this.addContent(instructions);

        this.createPlayerSelector();
        this.createOfferSection();
        this.createWantSection();
        this.createActionButtons();
    }

    createPlayerSelector() {
        const y = -260;

        const label = this.scene.add.text(-350, y,
            t('trade_with') || 'Trade with:', {
                fontSize: '20px',
                fontFamily: 'Arial Black',
                color: '#8b4513'
            }).setOrigin(0, 0.5);
        this.addContent(label);

        // Get other players (not current player)
        const currentPlayerIndex = this.currentState.currentPlayerIndex;
        const otherPlayers = this.controller.logic.players.filter(
            p => p.index !== currentPlayerIndex
        );

        this.playerButtons = {};
        const startX = -150;
        const spacing = 180;

        otherPlayers.forEach((player, i) => {
            const x = startX + (i * spacing);

            const btn = new UiButton(this.scene, x, y, {
                color: 'violet',
                size: 's',
                text: player.name,
                textStyle: {fontSize: '18px'},
                onClick: () => this.selectPlayer(player.index)
            });
            this.scene.add.existing(btn);
            this.addContent(btn);

            this.playerButtons[player.index] = btn;
        });
    }


    createOfferSection() {
        const x = -300;
        const y = -150;

        // Section title
        const title = this.scene.add.text(x, y,
            t('trade_you_offer') || 'You Offer:', {
                fontSize: '24px',
                fontFamily: 'Arial Black',
                color: '#8b4513'
            }).setOrigin(0.5);
        this.addContent(title);

        // Animal selection
        const tradableAnimals = ['Rabbit', 'Sheep', 'Pig', 'Cow', 'Horse', 'Foxhound', 'Wolfhound'];

        this.offerAnimalButtons = {};

        tradableAnimals.forEach((animal, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const btnX = x - 60 + (col * 120);
            const btnY = y + 60 + (row * 80);

            const count = this.currentState.currentPlayerHerd[animal] || 0;

            const btn = this.createAnimalButton(
                btnX, btnY,
                animal,
                count,
                () => this.selectOfferAnimal(animal)
            );

            this.offerAnimalButtons[animal] = btn;
        });

        // Quantity selector for offer
        this.createQuantitySelector(x, y + 350, 'offer');
    }

    createWantSection() {
        const x = 300;
        const y = -150;

        // Section title
        const title = this.scene.add.text(x, y,
            t('trade_you_want') || 'You Want:', {
                fontSize: '24px',
                fontFamily: 'Arial Black',
                color: '#8b4513'
            }).setOrigin(0.5);
        this.addContent(title);

        // Animal selection
        const tradableAnimals = ['Rabbit', 'Sheep', 'Pig', 'Cow', 'Horse', 'Foxhound', 'Wolfhound'];

        this.wantAnimalButtons = {};

        tradableAnimals.forEach((animal, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const btnX = x - 60 + (col * 120);
            const btnY = y + 60 + (row * 80);

            // For want section, we don't show counts (unknown what other player has)
            const btn = this.createAnimalButton(
                btnX, btnY,
                animal,
                null, // No count display
                () => this.selectWantAnimal(animal)
            );

            this.wantAnimalButtons[animal] = btn;
        });

        // Quantity selector for want
        this.createQuantitySelector(x, y + 350, 'want');
    }

    createAnimalButton(x, y, animal, count, onClick) {
        const container = this.scene.add.container(x, y);

        const bg = this.scene.add.rectangle(0, 0, 100, 65, 0xeeeeee)
            .setStrokeStyle(2, 0x999999);

        const sprite = this.scene.add.sprite(0, -8, 'animals', animal.toLowerCase())
            .setScale(0.06);

        let text = null;
        if (count !== null) {
            text = this.scene.add.text(0, 20, `×${count}`, {
                fontSize: '16px',
                fontFamily: 'Arial Black',
                color: count > 0 ? '#000000' : '#888888'
            }).setOrigin(0.5);
            container.add([bg, sprite, text]);
        } else {
            container.add([bg, sprite]);
        }

        bg.setInteractive({useHandCursor: true});
        bg.on('pointerover', () => {
            if (count === null || count > 0) {
                bg.setFillStyle(0xffffcc);
            }
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(0xeeeeee);
        });
        bg.on('pointerdown', () => {
            if (count === null || count > 0) {
                onClick();
            }
        });

        this.addContent(container);

        return {container, bg, sprite, text, animal};
    }

    createQuantitySelector(x, y, type) {
        // Minus button
        const minusBtn = new UiButton(this.scene, x - 80, y, {
            color: 'orange',
            size: 'xs',
            text: '−',
            textStyle: {fontSize: '24px'},
            onClick: () => this.changeQuantity(type, -1)
        });
        this.scene.add.existing(minusBtn);
        this.addContent(minusBtn);

        // Quantity display
        const quantityText = this.scene.add.text(x, y, '1', {
            fontSize: '28px',
            fontFamily: 'Arial Black',
            color: '#000000'
        }).setOrigin(0.5);
        this.addContent(quantityText);

        // Plus button
        const plusBtn = new UiButton(this.scene, x + 80, y, {
            color: 'teal',
            size: 'xs',
            text: '+',
            textStyle: {fontSize: '24px'},
            onClick: () => this.changeQuantity(type, 1)
        });
        this.scene.add.existing(plusBtn);
        this.addContent(plusBtn);

        if (type === 'offer') {
            this.offerMinusBtn = minusBtn;
            this.offerQuantityText = quantityText;
            this.offerPlusBtn = plusBtn;
        } else {
            this.wantMinusBtn = minusBtn;
            this.wantQuantityText = quantityText;
            this.wantPlusBtn = plusBtn;
        }
    }

    createActionButtons() {
        const y = 290;

        // Create Offer button
        this.createOfferBtn = new UiButton(this.scene, 0, y, {
            color: 'green',
            size: 'l',
            text: t('trade_create_offer') || 'Create Trade Offer',
            textStyle: {fontSize: '24px'},
            onClick: () => this.createOffer()
        });
        this.createOfferBtn.setEnabled(false);
        this.scene.add.existing(this.createOfferBtn);
        this.addContent(this.createOfferBtn);
    }

    selectPlayer(playerIndex) {
        console.log('[PlayerTradeModal] Selected player:', playerIndex);

        // Deselect previous
        if (this.selectedTargetPlayer !== null && this.playerButtons[this.selectedTargetPlayer]) {
            this.playerButtons[this.selectedTargetPlayer].setHighlighted(false);
        }

        this.selectedTargetPlayer = playerIndex;

        // Highlight selected
        if (this.playerButtons[playerIndex]) {
            this.playerButtons[playerIndex].setHighlighted(true);
        }

        this.updateCreateButtonState();
    }

    selectOfferAnimal(animal) {
        console.log('[PlayerTradeModal] Selected offer animal:', animal);

        if (this.offerAnimal && this.offerAnimalButtons[this.offerAnimal]) {
            this.offerAnimalButtons[this.offerAnimal].bg.setFillStyle(0xeeeeee);
        }

        this.offerAnimal = animal;
        this.offerAmount = 1;
        this.offerQuantityText.setText('1');

        if (this.offerAnimalButtons[animal]) {
            this.offerAnimalButtons[animal].bg.setFillStyle(0xaaffaa);
        }

        this.updateCreateButtonState();
    }

    selectWantAnimal(animal) {
        console.log('[PlayerTradeModal] Selected want animal:', animal);

        if (this.wantAnimal && this.wantAnimalButtons[this.wantAnimal]) {
            this.wantAnimalButtons[this.wantAnimal].bg.setFillStyle(0xeeeeee);
        }

        this.wantAnimal = animal;
        this.wantAmount = 1;
        this.wantQuantityText.setText('1');

        if (this.wantAnimalButtons[animal]) {
            this.wantAnimalButtons[animal].bg.setFillStyle(0xaaffaa);
        }

        this.updateCreateButtonState();
    }

    changeQuantity(type, delta) {
        if (type === 'offer') {
            const newAmount = this.offerAmount + delta;
            if (newAmount < 1) return;

            // Check max based on what player has
            if (this.offerAnimal) {
                const maxAvailable = this.currentState.currentPlayerHerd[this.offerAnimal] || 0;
                if (newAmount > maxAvailable) return;
            }

            this.offerAmount = newAmount;
            this.offerQuantityText.setText(`${this.offerAmount}`);
        } else {
            const newAmount = this.wantAmount + delta;
            if (newAmount < 1) return;
            if (newAmount > 99) return; // Reasonable max

            this.wantAmount = newAmount;
            this.wantQuantityText.setText(`${this.wantAmount}`);
        }

        this.updateCreateButtonState();
    }

    updateCreateButtonState() {
        // Enable create button if all required fields are filled
        const canCreate =
            this.selectedTargetPlayer !== null &&
            this.offerAnimal !== null &&
            this.offerAmount > 0 &&
            this.wantAnimal !== null &&
            this.wantAmount > 0 &&
            this.offerAnimal !== this.wantAnimal; // Can't trade same animal

        this.createOfferBtn.setEnabled(canCreate);
    }

    // game/ui/PlayerTradeModal.js

    createOffer() {
        console.log('[PlayerTradeModal] Creating trade offer:', {
            target: this.selectedTargetPlayer,
            targetType: typeof this.selectedTargetPlayer,
            offer: `${this.offerAmount}x ${this.offerAnimal}`,
            want: `${this.wantAmount}x ${this.wantAnimal}`
        });

        // Debug: Check what we're actually sending
        const tradeData = {
            targetIndex: this.selectedTargetPlayer,
            offer: {
                animal: this.offerAnimal,
                amount: this.offerAmount
            },
            want: {
                animal: this.wantAnimal,
                amount: this.wantAmount
            }
        };

        console.log('[PlayerTradeModal] Trade data:', tradeData);
        console.log('[PlayerTradeModal] targetIndex is integer?', Number.isInteger(tradeData.targetIndex));

        const result = this.controller.postTradeRequest(tradeData);

        console.log('[PlayerTradeModal] Result:', result);

        if (result.ok) {
            console.log('[PlayerTradeModal] Trade offer created successfully!');
            this.close();
        } else {
            console.error('[PlayerTradeModal] Failed to create trade offer:', result.reason);
        }
    }

    onStateUpdate(state) {
        console.log('[PlayerTradeModal] State updated');
        this.currentState = state;

        // Update animal counts in offer section
        Object.keys(this.offerAnimalButtons).forEach(animal => {
            const count = state.currentPlayerHerd[animal] || 0;
            if (this.offerAnimalButtons[animal].text) {
                this.offerAnimalButtons[animal].text.setText(`×${count}`);
                this.offerAnimalButtons[animal].text.setColor(count > 0 ? '#000000' : '#888888');
            }
        });

        this.updateCreateButtonState();
    }

    onError(errorResult) {
        console.error('[PlayerTradeModal] Error:', errorResult);

        const errorText = this.scene.add.text(0, 250,
            `Error: ${errorResult.reason}`, {
                fontSize: '18px',
                color: '#ff0000',
                fontFamily: 'Arial Black'
            }).setOrigin(0.5);
        this.addContent(errorText);

        this.scene.time.delayedCall(3000, () => {
            errorText.destroy();
        });
    }

    destroy() {
        this.scene.events.off('game:state', this.onStateUpdate, this);
        this.scene.events.off('ui:error', this.onError, this);

        super.destroy();
    }
}