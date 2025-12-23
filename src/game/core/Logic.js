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

        // init bank herd as PLAYER "bank"
        this.bankHerd = new PlayerState("MainHerd", 99)
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

        return {ok: true, winnerIndex: null, currentPlayerIndex: this.currentPlayerIndex, turnNumber: this.turnNumber};
    }

    processDiceRoll(currentPlayer, greenDiceResult, redDiceResult) {
        if (currentPlayer.index !== this.getCurrentPlayer().index) {
            return {ok: false, reason: "not_your_turn"};
        }
        if (this.turnState.hasRolled) return {ok: false, reason: "already_rolled"};

        const hasFox = greenDiceResult === "Fox" || redDiceResult === "Fox";
        const hasWolf = greenDiceResult === "Wolf" || redDiceResult === "Wolf";

        // both
        if (hasFox && hasWolf) {
            this.handleFoxAttack(currentPlayer);
            this.handleWolfAttack(currentPlayer);
            return;
        }

        // singular
        if (hasFox) {
            this.handleFoxAttack(currentPlayer);
            return;
        }

        if (hasWolf) {
            this.handleWolfAttack(currentPlayer);
            return;
        }

        const herd = currentPlayer.getHerd();

        if (greenDiceResult === redDiceResult) {
            const animal = greenDiceResult;
            const currentCount = herd[animal] ?? 0;
            const pairs = Math.floor(currentCount / 2);

            const gain = Math.max(pairs, 1);

            const bankCount = this.bankHerd.getHerd()[animal] ?? 0;
            const actualGain = Math.min(gain, bankCount);

            if (actualGain > 0) {
                this.bankHerd.transfer_animal(currentPlayer, animal, actualGain);
            }
            return;
        }

        const hasAnimals = Object.values(herd).some(count => count > 0);
        if (!hasAnimals) return;

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
            }
        });

        this.turnState.hasRolled = true;
        return {ok: true};
    }



    handleFoxAttack(player) {
        const herd = player.getHerd();
        const foxhounds = herd["Foxhound"] ?? 0;

        if (foxhounds > 0) {
            player.updateHerd("Foxhound", foxhounds - 1);
            return true;
        }

        const rabbits = herd["Rabbit"] ?? 0;
        if (rabbits > 0) {
            this.returnToBankWithCull(player, "Rabbit", rabbits);
        }
        return true;
    }


    handleWolfAttack(player) {
        const herd = player.getHerd();
        const wolfhounds = herd["Wolfhound"] ?? 0;

        if (wolfhounds > 0) {
            player.updateHerd("Wolfhound", wolfhounds - 1);
            return true;
        }

        ["Rabbit", "Sheep", "Pig", "Cow"].forEach(animal => {
            const count = herd[animal] ?? 0;
            if (count > 0) {
                this.returnToBankWithCull(player, animal, count);
            }
        });

        return true;
    }

    // handle main herd flow
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
     * @param sender
     * @param animal
     * @param amount
     * @returns {number}
     */
    returnToBankWithCull(sender, animal, amount) {
        if (amount <= 0) return 0;

        const bankCount = this.bankHerd.getHerd()[animal] ?? 0;
        const max = BANK_MAX[animal] ?? bankCount; // no max no limits
        const space = Math.max(0, max - bankCount);

        const actual = Math.min(amount, space);      // how muhc ank can take
        const overflow = amount - actual;            // how muhc to cull

        // 1) return to bank as much as possible
        if (actual > 0) {
            sender.transfer_animal(this.bankHerd, animal, actual);
        }

        // 2) remove from sender (cull)
        if (overflow > 0) {
            const senderCount = sender.getHerd()[animal] ?? 0;
            sender.updateHerd(animal, Math.max(0, senderCount - overflow));
        }

        return actual;
    }

    exchangeWithBank(animalFrom, animalTo) {
        const player = this.getCurrentPlayer();
        if (this.turnState.hasExchanged) return {ok: false, reason: "already_exchanged"};

        const res = exchangeWithBankAtomic({player, bank: this.bankHerd, animalFrom, animalTo});
        if (res.ok) this.turnState.hasExchanged = true;

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

    if ((p[animalFrom] ?? 0) < rate.give) return {ok: false, reason: "player_lacks_from"};
    // jeśli bank:
    if ((b[animalTo] ?? 0) < rate.get) return {ok: false, reason: "bank_lacks_to"};

    // dwa ruchy, ale na surowych obiektach, w kontrolowanej kolejności
    move(p, b, animalFrom, rate.give);
    move(b, p, animalTo, rate.get);

    return {ok: true};
}

export function checkVictoryCondition(player) {
    const h = player.getHerd();
    return WIN_REQUIREMENTS.every(a => (h[a] ?? 0) >= 1);
}