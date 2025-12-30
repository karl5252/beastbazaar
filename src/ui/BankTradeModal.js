// game/ui/BankTradeModal.js
import {Modal} from "./Modal.js";
import {UiButton} from "./UiButton.js";
import {t} from "../utils/i18n.js";
import {EXCHANGE_RATES} from "../game/constants/ExchangeRates.js";
import {logger} from "../utils/Logger.js";

export class BankTradeModal extends Modal {
    constructor(scene, controller) {
        super(scene, {
            width: 900,
            height: 650,
            title: t('bank_trade_title') || ' Bank Exchange',
            showCloseButton: true,
            onClose: () => logger.log('[BankTradeModal] Closed')
        });

        this.controller = controller;
        this.currentState = controller.getPublicState();

        // Track selected animals
        this.selectedGive = null;  // What player wants to give
        this.selectedGet = null;   // What player wants to receive

        // Subscribe to state updates
        this.scene.events.on('game:state', this.onStateUpdate, this);
        this.scene.events.on('ui:error', this.onError, this);

        this.createTradeInterface();
    }

    createTradeInterface() {
        // Instructions
        const instructions = this.scene.add.text(0, -260,
            t('bank_trade_instructions') || 'Select animals to exchange with the bank', {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#555555',
                align: 'center',
                wordWrap: {width: 800}
            }).setOrigin(0.5);
        this.addContent(instructions);

        this.createExchangeRatesReference();

        this.createGiveSection();
        this.createExchangeArrow();
        this.createReceiveSection();
        this.createConfirmButton();
    }

    createGiveSection() {
        const x = -300;
        const y = -150;

        // Section title
        const title = this.scene.add.text(x, y,
            t('bank_give') || 'Give:', {
                fontSize: '24px',
                fontFamily: 'Arial Black',
                color: '#8b4513'
            }).setOrigin(0.5);
        this.addContent(title);

        // Animals player can give (tradeable animals)
        const tradableAnimals = ['Rabbit', 'Sheep', 'Pig', 'Cow', 'Horse', 'Foxhound', 'Wolfhound'];

        this.giveButtons = {};

        tradableAnimals.forEach((animal, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const btnX = x - 60 + (col * 120);  // Reduced spacing: 160 → 120
            const btnY = y + 60 + (row * 80);    // Reduced spacing: 100 → 80

            const count = this.currentState.currentPlayerHerd[animal] || 0;

            const btn = this.createAnimalButton(
                btnX, btnY,
                animal,
                count,
                () => this.selectGive(animal)
            );

            this.giveButtons[animal] = btn;
        });
    }

    createReceiveSection() {
        const x = 300;
        const y = -150;

        // Section title
        const title = this.scene.add.text(x, y,
            t('bank_receive') || 'Receive:', {
                fontSize: '24px',
                fontFamily: 'Arial Black',
                color: '#8b4513'
            }).setOrigin(0.5);
        this.addContent(title);

        // Animals player can receive
        const tradableAnimals = ['Rabbit', 'Sheep', 'Pig', 'Cow', 'Horse', 'Foxhound', 'Wolfhound'];

        this.receiveButtons = {};

        tradableAnimals.forEach((animal, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const btnX = x - 60 + (col * 120);  // Reduced spacing: 160 → 120
            const btnY = y + 60 + (row * 80);    // Reduced spacing: 100 → 80

            const bankCount = this.currentState.bankHerd[animal] || 0;

            const btn = this.createAnimalButton(
                btnX, btnY,
                animal,
                bankCount,
                () => this.selectReceive(animal)
            );

            this.receiveButtons[animal] = btn;
        });
    }

    createAnimalButton(x, y, animal, count, onClick) {
        const container = this.scene.add.container(x, y);

        // Smaller background: 140x80 → 100x65
        const bg = this.scene.add.rectangle(0, 0, 100, 65, 0xeeeeee)
            .setStrokeStyle(2, 0x999999);

        // Smaller animal sprite: 0.08 → 0.06
        const sprite = this.scene.add.sprite(0, -8, 'animals', animal.toLowerCase())
            .setScale(0.06);

        // Smaller count text
        const text = this.scene.add.text(0, 20, `×${count}`, {
            fontSize: '16px',  // Reduced: 18px → 16px
            fontFamily: 'Arial Black',
            color: count > 0 ? '#000000' : '#888888'
        }).setOrigin(0.5);

        container.add([bg, sprite, text]);

        // Make interactive
        bg.setInteractive({useHandCursor: true});
        bg.on('pointerover', () => {
            if (count > 0) bg.setFillStyle(0xffffcc);
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(0xeeeeee);
        });
        bg.on('pointerdown', () => {
            if (count > 0) onClick();
        });

        this.addContent(container);

        return {container, bg, sprite, text, animal};
    }

    createExchangeArrow() {
        // Replace emoji with icon sprite
        const arrow = this.scene.add.sprite(0, 0, 'icon_right_arrow')
            .setScale(0.15)
            .setOrigin(0.5);
        this.addContent(arrow);

        // Exchange rate display
        this.rateText = this.scene.add.text(0, 60, '', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#555555',
            align: 'center'
        }).setOrigin(0.5);
        this.addContent(this.rateText);
    }

    createConfirmButton() {
        this.confirmBtn = new UiButton(this.scene, 0, 250, {
            color: 'green',
            size: 'l',
            text: t('bank_confirm') || 'Confirm Exchange',
            textStyle: {fontSize: '24px'},
            onClick: () => this.confirmExchange()
        });
        this.confirmBtn.setEnabled(false);
        this.scene.add.existing(this.confirmBtn);
        this.addContent(this.confirmBtn);
    }

    selectGive(animal) {
        logger.log('[BankTradeModal] Selected give:', animal);

        // Deselect previous
        if (this.selectedGive && this.giveButtons[this.selectedGive]) {
            this.giveButtons[this.selectedGive].bg.setFillStyle(0xeeeeee);
        }

        this.selectedGive = animal;

        // Highlight selected
        if (this.giveButtons[animal]) {
            this.giveButtons[animal].bg.setFillStyle(0xaaffaa);
        }

        this.updateExchangePreview();
    }

    selectReceive(animal) {
        logger.log('[BankTradeModal] Selected receive:', animal);

        // Deselect previous
        if (this.selectedGet && this.receiveButtons[this.selectedGet]) {
            this.receiveButtons[this.selectedGet].bg.setFillStyle(0xeeeeee);
        }

        this.selectedGet = animal;

        // Highlight selected
        if (this.receiveButtons[animal]) {
            this.receiveButtons[animal].bg.setFillStyle(0xaaffaa);
        }

        this.updateExchangePreview();
    }

    updateExchangePreview() {
        if (!this.selectedGive || !this.selectedGet) {
            this.rateText.setText('');
            this.confirmBtn.setEnabled(false);
            return;
        }

        // Check if exchange rate exists
        const rateKey = `${this.selectedGive}->${this.selectedGet}`;
        const rate = EXCHANGE_RATES[rateKey];

        if (!rate) {
            this.rateText.setText(' No exchange rate');
            this.confirmBtn.setEnabled(false);
            return;
        }

        // Show exchange rate
        this.rateText.setText(
            `${rate.give} ${this.selectedGive} → ${rate.get} ${this.selectedGet}`
        );

        // Check if player has enough
        const playerCount = this.currentState.currentPlayerHerd[this.selectedGive] || 0;
        const bankCount = this.currentState.bankHerd[this.selectedGet] || 0;

        const canTrade = playerCount >= rate.give && bankCount >= rate.get;
        this.confirmBtn.setEnabled(canTrade);

        if (!canTrade) {
            if (playerCount < rate.give) {
                this.rateText.setText(
                    this.rateText.text + '\n Not enough animals'
                );
            } else if (bankCount < rate.get) {
                this.rateText.setText(
                    this.rateText.text + '\n Bank out of stock'
                );
            }
        }
    }

    confirmExchange() {
        if (!this.selectedGive || !this.selectedGet) return;

        logger.log('[BankTradeModal] Confirming exchange:',
            this.selectedGive, '→', this.selectedGet);

        // Call controller to perform exchange
        const result = this.controller.exchangeWithBank(
            this.selectedGive,
            this.selectedGet
        );

        if (result.ok) {
            logger.log('[BankTradeModal] Exchange successful!');
            // Close modal after successful exchange
            this.close();
        } else {
            logger.error('[BankTradeModal] Exchange failed:', result.reason);
        }
    }

    onStateUpdate(state) {
        logger.log('[BankTradeModal] State updated');
        this.currentState = state;

        // Update animal counts in buttons
        Object.keys(this.giveButtons).forEach(animal => {
            const count = state.currentPlayerHerd[animal] || 0;
            this.giveButtons[animal].text.setText(`×${count}`);
            this.giveButtons[animal].text.setColor(count > 0 ? '#000000' : '#888888');
        });

        Object.keys(this.receiveButtons).forEach(animal => {
            const count = state.bankHerd[animal] || 0;
            this.receiveButtons[animal].text.setText(`×${count}`);
            this.receiveButtons[animal].text.setColor(count > 0 ? '#000000' : '#888888');
        });

        this.updateExchangePreview();
    }

    onError(errorResult) {
        logger.error('[BankTradeModal] Error:', errorResult);

        // Show error message
        const errorText = this.scene.add.text(0, 200,
            `Error: ${errorResult.reason}`, {
                fontSize: '20px',
                color: '#ff0000',
                fontFamily: 'Arial Black'
            }).setOrigin(0.5);
        this.addContent(errorText);

        // Fade out error after 3 seconds
        this.scene.time.delayedCall(3000, () => {
            errorText.destroy();
        });
    }

    destroy() {
        // Unsubscribe from events
        this.scene.events.off('game:state', this.onStateUpdate, this);
        this.scene.events.off('ui:error', this.onError, this);

        super.destroy();
    }

    createExchangeRatesReference() {
        const y = -230;

        const ratesText = this.scene.add.text(0, y,
            '6🐰→1🐑  2🐑→1🐷  3🐷→1🐮  2🐮→1🐴  |  1🐑↔1🦊  1🐮↔1🐺', {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#666666',
                align: 'center'
            }).setOrigin(0.5);
        this.addContent(ratesText);

    }
}