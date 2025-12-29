// game/ui/BankTradeModal.js
import {Modal} from "./Modal.js";
import {UiButton} from "./UiButton.js";
import {t} from "../utils/i18n.js";

export class BankTradeModal extends Modal {
    constructor(scene, controller) {
        super(scene, {
            width: 900,
            height: 650,
            title: t('bank_trade_title'),
            showCloseButton: true,
            onClose: () => console.log('[BankTradeModal] Closed')
        });

        this.controller = controller;
        this.currentState = controller.getPublicState();

        this.createTradeInterface();
    }

    createTradeInterface() {
        // Instructions
        const instructions = this.scene.add.text(0, -250,
            t('bank_trade_instructions'), {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#555555',
                align: 'center',
                wordWrap: {width: 800}
            }).setOrigin(0.5);
        this.addContent(instructions);

        // TODO: Add trade selection UI
        // - "Give" section with animal buttons
        // - Arrow/exchange icon
        // - "Receive" section with animal buttons
        // - Confirm button

        // Placeholder: Test button
        const testBtn = new UiButton(this.scene, 0, 200, {
            color: 'green',
            size: 'm',
            text: 'Exchange Coming Soon',
            textStyle: {fontSize: '24px'},
            onClick: () => this.close()
        });
        this.scene.add.existing(testBtn);
        this.addContent(testBtn);
    }
}