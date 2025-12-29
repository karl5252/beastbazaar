// game/ui/HowToPlayModal.js
import {Modal} from "./Modal.js";
import {UiButton} from "./UiButton.js";
import {t} from "../utils/i18n.js";

export class HowToPlayModal extends Modal {
    constructor(scene) {
        super(scene, {
            width: 800,
            height: 650,
            title: t('how_to_play_title') || 'HOW TO PLAY',
            showCloseButton: true,
            onClose: () => console.log('[HowToPlayModal] Closed')
        });

        this.createContent();
    }

    createContent() {
        let currentY = -260;
        const lineSpacing = 35;
        const sectionSpacing = 50;

        // Objective (big and bold)
        const objective = this.scene.add.text(0, currentY,
            '🎯 ' + (t('how_to_play_objective') || 'Collect one of each: Rabbit, Sheep, Pig, Cow, Horse'), {
                fontSize: '22px',
                fontFamily: 'Arial Black',
                color: '#d9534f',
                align: 'center',
                wordWrap: {width: 750}
            }).setOrigin(0.5);
        this.addContent(objective);
        currentY += sectionSpacing;

        // Turn structure section
        const turnTitle = this.scene.add.text(0, currentY,
            t('how_to_play_turn') || 'On your turn:', {
                fontSize: '20px',
                fontFamily: 'Arial Black',
                color: '#5cb85c'
            }).setOrigin(0.5);
        this.addContent(turnTitle);
        currentY += lineSpacing;

        // Turn steps with icons
        const steps = [
            {icon: 'icon_dice', text: t('how_to_play_roll') || '1. Roll dice to breed animals'},
            {icon: 'icon_trade', text: t('how_to_play_trade') || '2. Trade with bank or other players (optional)'},
            {icon: 'icon_turn', text: t('how_to_play_end') || '3. End your turn'}
        ];

        steps.forEach(step => {
            const stepContainer = this.scene.add.container(-320, currentY);

            // Icon
            const icon = this.scene.add.sprite(0, 0, step.icon)
                .setScale(0.06)
                .setOrigin(0, 0.5);
            stepContainer.add(icon);

            // Text
            const text = this.scene.add.text(40, 0, step.text, {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#333333'
            }).setOrigin(0, 0.5);
            stepContainer.add(text);

            this.addContent(stepContainer);
            currentY += lineSpacing;
        });

        currentY += 20;

        // Game rules section
        const rulesTitle = this.scene.add.text(0, currentY,
            '📜 Rules:', {
                fontSize: '20px',
                fontFamily: 'Arial Black',
                color: '#f0ad4e'
            }).setOrigin(0.5);
        this.addContent(rulesTitle);
        currentY += lineSpacing;

        // Breeding rule with animal icons
        const breedingContainer = this.scene.add.container(-350, currentY);

        const breedingText = this.scene.add.text(0, 0,
            t('how_to_play_breeding') || '• Roll doubles to breed! Get 1 animal, or more if you have pairs.', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#555555',
                wordWrap: {width: 700}
            }).setOrigin(0, 0);
        breedingContainer.add(breedingText);
        this.addContent(breedingContainer);
        currentY += lineSpacing + 10;

        // Predators rule with icons
        const predatorsContainer = this.scene.add.container(-350, currentY);

        // Fox icon
        const foxIcon = this.scene.add.sprite(5, 0, 'animals', 'fox')
            .setScale(0.05)
            .setOrigin(0, 0.5);
        predatorsContainer.add(foxIcon);

        // Wolf icon
        const wolfIcon = this.scene.add.sprite(35, 0, 'animals', 'wolf')
            .setScale(0.05)
            .setOrigin(0, 0.5);
        predatorsContainer.add(wolfIcon);

        const predatorsText = this.scene.add.text(65, 0,
            t('how_to_play_predators') || 'Fox eats rabbits, Wolf eats all (except horses & dogs)!', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#d9534f',
                wordWrap: {width: 635}
            }).setOrigin(0, 0.5);
        predatorsContainer.add(predatorsText);
        this.addContent(predatorsContainer);
        currentY += lineSpacing + 10;

        // Dogs protection rule with icons
        const dogsContainer = this.scene.add.container(-350, currentY);

        // Foxhound icon
        const foxhoundIcon = this.scene.add.sprite(5, 0, 'animals', 'foxhound')
            .setScale(0.05)
            .setOrigin(0, 0.5);
        dogsContainer.add(foxhoundIcon);

        // Wolfhound icon
        const wolfhoundIcon = this.scene.add.sprite(35, 0, 'animals', 'wolfhound')
            .setScale(0.05)
            .setOrigin(0, 0.5);
        dogsContainer.add(wolfhoundIcon);

        const dogsText = this.scene.add.text(65, 0,
            t('how_to_play_dogs') || 'Foxhound protects from Fox, Wolfhound from Wolf.', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#5cb85c',
                wordWrap: {width: 635}
            }).setOrigin(0, 0.5);
        dogsContainer.add(dogsText);
        this.addContent(dogsContainer);
        currentY += sectionSpacing;

        // Exchange rates section
        const exchangeTitle = this.scene.add.text(0, currentY,
            '💱 ' + (t('bank_trade_instructions') || 'Exchange Rates:'), {
                fontSize: '18px',
                fontFamily: 'Arial Black',
                color: '#4a90e2'
            }).setOrigin(0.5);
        this.addContent(exchangeTitle);
        currentY += lineSpacing;

        // Compact exchange rates
        const rates = [
            {from: 'rabbit', to: 'sheep', text: '6→1'},
            {from: 'sheep', to: 'pig', text: '2→1'},
            {from: 'pig', to: 'cow', text: '3→1'},
            {from: 'cow', to: 'horse', text: '2→1'}
        ];

        const ratesContainer = this.scene.add.container(0, currentY);
        const rateSpacing = 100;
        const startX = -200;

        rates.forEach((rate, i) => {
            const x = startX + (i * rateSpacing);

            const fromSprite = this.scene.add.sprite(x - 15, 0, 'animals', rate.from)
                .setScale(0.04);
            ratesContainer.add(fromSprite);

            const rateText = this.scene.add.text(x, 0, rate.text, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#555555'
            }).setOrigin(0.5);
            ratesContainer.add(rateText);

            const toSprite = this.scene.add.sprite(x + 25, 0, 'animals', rate.to)
                .setScale(0.04);
            ratesContainer.add(toSprite);
        });

        this.addContent(ratesContainer);
        currentY += lineSpacing;

        // Dogs exchange
        const dogsRates = this.scene.add.text(0, currentY,
            '🐑 ↔ 🦊  |  🐮 ↔ 🐺', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#666666'
            }).setOrigin(0.5);
        this.addContent(dogsRates);

        // Close button at bottom
        currentY += sectionSpacing + 20;
        const closeBtn = new UiButton(this.scene, 0, currentY, {
            color: 'green',
            size: 'm',
            text: t('close') || 'Got it!',
            textStyle: {fontSize: '20px'},
            onClick: () => this.close()
        });
        this.scene.add.existing(closeBtn);
        this.addContent(closeBtn);
    }
}