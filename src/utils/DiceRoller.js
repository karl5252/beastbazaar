// game/utils/DiceRoller.js

import {DICE_CONFIG} from "../game/constants/DiceConfig.js";

export class DiceRoller {
    constructor(difficulty = 'EASY') {
        this.setDifficulty(difficulty);
    }

    setDifficulty(difficulty) {
        const difficultyKey = difficulty.toUpperCase();

        if (!DICE_CONFIG[difficultyKey]) {
            console.warn(`Unknown difficulty: ${difficulty}, defaulting to EASY`);
            this.config = DICE_CONFIG.EASY;
        } else {
            this.config = DICE_CONFIG[difficultyKey];
        }
    }

    /**
     * Roll a single die based on its configuration
     * @param {string} color - 'green' or 'red'
     * @returns {string} - Animal or predator name
     */
    rollDie(color) {
        const diceKey = color === 'green' ? 'greenDice' : 'redDice';
        const diceConfig = this.config[diceKey];

        if (!diceConfig) {
            throw new Error(`Invalid dice color: ${color}`);
        }

        // Build weighted array based on config
        // e.g., { Rabbit: 6, Sheep: 2 } → ['Rabbit', 'Rabbit', ..., 'Sheep', 'Sheep']
        const weightedOptions = [];

        Object.entries(diceConfig).forEach(([animal, weight]) => {
            for (let i = 0; i < weight; i++) {
                weightedOptions.push(animal);
            }
        });

        // Pick random from weighted array
        const randomIndex = Math.floor(Math.random() * weightedOptions.length);
        return weightedOptions[randomIndex];
    }

    /**
     * Roll both dice at once
     * @returns {{ green: string, red: string }}
     */
    rollBoth() {
        return {
            green: this.rollDie('green'),
            red: this.rollDie('red')
        };
    }

    /**
     * Get total sides for a die (useful for UI)
     */
    getDiceSides(color) {
        const diceKey = color === 'green' ? 'greenDice' : 'redDice';
        const diceConfig = this.config[diceKey];

        return Object.values(diceConfig).reduce((sum, weight) => sum + weight, 0);
    }

    /**
     * Get all possible outcomes for a die (useful for animations)
     */
    getPossibleOutcomes(color) {
        const diceKey = color === 'green' ? 'greenDice' : 'redDice';
        return Object.keys(this.config[diceKey]);
    }
}