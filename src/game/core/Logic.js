import {PlayerState} from "./PlayerState.js";
import {BANK_MAX} from "../constants/BankConfig.js";
import {EXCHANGE_RATES} from "../constants/ExchangeRates.js";
import {WIN_REQUIREMENTS} from "../constants/Constants.js";

export class Logic {
    constructor(players=[]) {
        this.players = players;
        this.currentPlayerIndex = 0;
        this.turnNumber = 0;

        this.turnState = {
            hasRolled: false,
            hasExchanged: false,
        };

        // Initialize bank herd as a PlayerState "bank"
        this.bankHerd = new PlayerState("MainHerd", 99);
        this.bankHerd.updateHerd("Rabbit", 60);
        this.bankHerd.updateHerd("Sheep", 24);
        this.bankHerd.updateHerd("Pig", 20);
        this.bankHerd.updateHerd("Cow", 12);
        this.bankHerd.updateHerd("Horse", 4);
        this.bankHerd.updateHerd("Foxhound", 4);
        this.bankHerd.updateHerd("Wolfhound", 2);
    }

    addPlayer(player) {
        player.index = this.players.length;
        this.players.push(player);
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    startTurn() {
        this.turnState.hasRolled = false;
        this.turnState.hasExchanged = false;
    }

    endTurn() {
        const current = this.getCurrentPlayer();

        if (checkVictoryCondition(current)) {
            return {ok: true, winnerIndex: current.index};
        }

        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.turnNumber += 1;
        this.startTurn();

        return {
            ok: true,
            winnerIndex: null,
            currentPlayerIndex: this.currentPlayerIndex,
            turnNumber: this.turnNumber
        };
    }

    processDiceRoll(currentPlayer, greenDiceResult, redDiceResult) {
        if (currentPlayer.index !== this.getCurrentPlayer().index) {
            return {ok: false, reason: "not_your_turn"};
        }
        if (this.turnState.hasRolled) {
            return {ok: false, reason: "already_rolled"};
        }

        const hasFox = greenDiceResult === "Fox" || redDiceResult === "Fox";
        const hasWolf = greenDiceResult === "Wolf" || redDiceResult === "Wolf";

        // Handle predator attacks
        if (hasFox && hasWolf) {
            this.handleFoxAttack(currentPlayer);
            this.handleWolfAttack(currentPlayer);
            this.turnState.hasRolled = true;
            return {ok: true, type: "predators", predators: ["Fox", "Wolf"]};
        }

        if (hasFox) {
            this.handleFoxAttack(currentPlayer);
            this.turnState.hasRolled = true;
            return {ok: true, type: "predator", predator: "Fox"};
        }

        if (hasWolf) {
            this.handleWolfAttack(currentPlayer);
            this.turnState.hasRolled = true;
            return {ok: true, type: "predator", predator: "Wolf"};
        }

        // Handle breeding
        const herd = currentPlayer.getHerd();

        // Both dice show the same animal
        if (greenDiceResult === redDiceResult) {
            const animal = greenDiceResult;
            const currentCount = herd[animal] ?? 0;
            const pairs = Math.floor(currentCount / 2);

            // Even with no animals, rolling a pair grants 1
            const gain = Math.max(pairs, 1);

            const bankCount = this.bankHerd.getHerd()[animal] ?? 0;
            const actualGain = Math.min(gain, bankCount);

            if (actualGain > 0) {
                this.bankHerd.transfer_animal(currentPlayer, animal, actualGain);
            }

            this.turnState.hasRolled = true;
            return {ok: true, type: "breeding", animal, gained: actualGain};
        }

        // Different animals rolled - need to own at least one animal to breed
        const hasAnimals = Object.values(herd).some(count => count > 0);
        if (!hasAnimals) {
            this.turnState.hasRolled = true;
            return {ok: true, type: "no_breeding", reason: "no_animals"};
        }

        const gained = {};
        [greenDiceResult, redDiceResult].forEach(animal => {
            const currentCount = herd[animal] ?? 0;
            if (currentCount <= 0) return;

            const pairs = Math.floor(currentCount / 2);
            if (pairs <= 0) return;

            const gain = pairs;
            const bankCount = this.bankHerd.getHerd()[animal] ?? 0;
            const actualGain = Math.min(gain, bankCount);

            if (actualGain > 0) {
                this.bankHerd.transfer_animal(currentPlayer, animal, actualGain);
                gained[animal] = actualGain;
            }
        });

        this.turnState.hasRolled = true;
        return {ok: true, type: "breeding", gained};
    }

    handleFoxAttack(player) {
        const herd = player.getHerd();
        const foxhounds = herd["Foxhound"] ?? 0;

        // If player has a foxhound, sacrifice it instead
        if (foxhounds > 0) {
            player.updateHerd("Foxhound", foxhounds - 1);
            return {protected: true, cost: "Foxhound"};
        }

        // Otherwise, lose all rabbits
        const rabbits = herd["Rabbit"] ?? 0;
        if (rabbits > 0) {
            this.returnToBankWithCull(player, "Rabbit", rabbits);
            return {protected: false, lost: {Rabbit: rabbits}};
        }

        return {protected: false, lost: {}};
    }

    handleWolfAttack(player) {
        const herd = player.getHerd();
        const wolfhounds = herd["Wolfhound"] ?? 0;

        // If player has a wolfhound, sacrifice it instead
        if (wolfhounds > 0) {
            player.updateHerd("Wolfhound", wolfhounds - 1);
            return {protected: true, cost: "Wolfhound"};
        }

        // Otherwise, lose all vulnerable animals (not Horse or hounds)
        const lost = {};
        ["Rabbit", "Sheep", "Pig", "Cow"].forEach(animal => {
            const count = herd[animal] ?? 0;
            if (count > 0) {
                this.returnToBankWithCull(player, animal, count);
                lost[animal] = count;
            }
        });

        return {protected: false, lost};
    }

    // Handle main herd flow
    canBankReceive(animal) {
        const max = BANK_MAX[animal] ?? 0;
        const current = this.bankHerd.getHerd()[animal] ?? 0;
        return Math.max(0, max - current);
    }

    returnToBank(sender, animal, amount) {
        if (amount <= 0) return 0;

        const space = this.canBankReceive(animal);
        const actual = Math.min(amount, space);
        if (actual > 0) {
            sender.transfer_animal(this.bankHerd, animal, actual);
        }
        return actual;
    }

    /**
     * Method to be used only to handle ILLEGAL state
     * Returns animals to bank, culling overflow if bank is full
     * @param sender - Player returning animals
     * @param animal - Animal type
     * @param amount - Number to return
     * @returns {number} - Amount actually returned to bank (not including culled)
     */
    returnToBankWithCull(sender, animal, amount) {
        if (amount <= 0) return 0;

        const bankCount = this.bankHerd.getHerd()[animal] ?? 0;
        const max = BANK_MAX[animal] ?? bankCount; // If no max, use current bank count
        const space = Math.max(0, max - bankCount);

        const actual = Math.min(amount, space);    // How much bank can take
        const overflow = amount - actual;          // How much to cull

        // 1) Return to bank as much as possible
        if (actual > 0) {
            sender.transfer_animal(this.bankHerd, animal, actual);
        }

        // 2) Remove overflow from sender (cull)
        if (overflow > 0) {
            const senderCount = sender.getHerd()[animal] ?? 0;
            sender.updateHerd(animal, Math.max(0, senderCount - overflow));
        }

        return actual;
    }

    exchangeWithBank(animalFrom, animalTo) {
        const player = this.getCurrentPlayer();
        if (this.turnState.hasExchanged) {
            return {ok: false, reason: "already_exchanged"};
        }

        const res = exchangeWithBankAtomic({
            player,
            bank: this.bankHerd,
            animalFrom,
            animalTo
        });

        if (res.ok) {
            this.turnState.hasExchanged = true;
        }

        return res;
    }
}

function move(herdA, herdB, animal, amount) {
    if ((herdA[animal] ?? 0) < amount) return false;
    herdA[animal] = (herdA[animal] ?? 0) - amount;
    herdB[animal] = (herdB[animal] ?? 0) + amount;
    return true;
}

export function exchangeWithBankAtomic({player, bank, animalFrom, animalTo}) {
    const rate = EXCHANGE_RATES[`${animalFrom}->${animalTo}`];
    if (!rate) return {ok: false, reason: "no_rate"};

    const p = player.getHerd();
    const b = bank.getHerd();

    if ((p[animalFrom] ?? 0) < rate.give) {
        return {ok: false, reason: "player_lacks_from"};
    }
    if ((b[animalTo] ?? 0) < rate.get) {
        return {ok: false, reason: "bank_lacks_to"};
    }

    // Execute both transfers - controlled order for atomicity
    const move1 = move(p, b, animalFrom, rate.give);
    const move2 = move(b, p, animalTo, rate.get);

    if (!move1 || !move2) {
        // This should never happen given the checks above, but safety fallback
        return {ok: false, reason: "transfer_failed"};
    }

    return {ok: true, exchanged: {gave: rate.give, got: rate.get}};
}

export function checkVictoryCondition(player) {
    const h = player.getHerd();
    return WIN_REQUIREMENTS.every(a => (h[a] ?? 0) >= 1);
}