
// Exchange rates: How many animals to trade
// Format: 'AnimalGive->AnimalReceive': { give: X, get: Y }
import {ANIMAL_TYPES} from "../config/AnimalConfig.js";

export const EXCHANGE_RATES = {
    // Upgrade trades
    [`${ANIMAL_TYPES.RABBIT}->${ANIMAL_TYPES.SHEEP}`]: { give: 6, get: 1 },
    [`${ANIMAL_TYPES.SHEEP}->${ANIMAL_TYPES.PIG}`]: { give: 2, get: 1 },
    [`${ANIMAL_TYPES.PIG}->${ANIMAL_TYPES.COW}`]: { give: 3, get: 1 },
    [`${ANIMAL_TYPES.COW}->${ANIMAL_TYPES.HORSE}`]: { give: 2, get: 1 },

    // Downgrade trades (reverse)
    [`${ANIMAL_TYPES.SHEEP}->${ANIMAL_TYPES.RABBIT}`]: { give: 1, get: 6 },
    [`${ANIMAL_TYPES.PIG}->${ANIMAL_TYPES.SHEEP}`]: { give: 1, get: 2 },
    [`${ANIMAL_TYPES.COW}->${ANIMAL_TYPES.PIG}`]: { give: 1, get: 3 },
    [`${ANIMAL_TYPES.HORSE}->${ANIMAL_TYPES.COW}`]: { give: 1, get: 2 },

    // Dog trades
    [`${ANIMAL_TYPES.SHEEP}->${ANIMAL_TYPES.FOXHOUND}`]: { give: 1, get: 1 },
    [`${ANIMAL_TYPES.FOXHOUND}->${ANIMAL_TYPES.SHEEP}`]: { give: 1, get: 1 },
    [`${ANIMAL_TYPES.COW}->${ANIMAL_TYPES.WOLFHOUND}`]: { give: 1, get: 1 },
    [`${ANIMAL_TYPES.WOLFHOUND}->${ANIMAL_TYPES.COW}`]: { give: 1, get: 1 }
};

/**
 * Get exchange rate between two animals
 * @param {string} fromAnimal - Animal to trade away
 * @param {string} toAnimal - Animal to receive
 * @returns {Object|null} - { give, get } or null if no rate exists
 */
export function getExchangeRate(fromAnimal, toAnimal) {
    const key = `${fromAnimal}->${toAnimal}`;
    return EXCHANGE_RATES[key] || null;
}

/**
 * Check if a trade is valid based on exchange rates
 * @param {string} fromAnimal
 * @param {string} toAnimal
 * @param {number} giveCount
 * @param {number} getCount
 * @returns {boolean}
 */
export function isValidTradeRatio(fromAnimal, toAnimal, giveCount, getCount) {
    const rate = getExchangeRate(fromAnimal, toAnimal);
    if (!rate) return false;

    // Check if the ratio matches (allow multiples)
    const expectedRatio = rate.give / rate.get;
    const actualRatio = giveCount / getCount;

    return Math.abs(expectedRatio - actualRatio) < 0.001; // Float comparison tolerance
}