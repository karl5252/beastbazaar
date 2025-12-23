import {Player} from "./Player.js";

export class Logic {
    constructor(players=[]) {
        this.players = players;
        this.currentPlayerIndex = 0;
        this.exchangeRequests = [];
        // init bank herd as PLAYER "bank"
        this.bankHerd = new Player("MainHerd", 99)
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

    processDiceRoll(currentPlayer, greenDiceResult, redDiceResult) {
        // 1. Fox / Wolf attack
        if (greenDiceResult === "Fox" || redDiceResult === "Fox") {
            if (this.handleFoxAttack?.(currentPlayer)) {
                return;
            }
        }

        if (greenDiceResult === "Wolf" || redDiceResult === "Wolf") {
            if (this.handleWolfAttack?.(currentPlayer)) {
                return;
            }
        }

        const herd = currentPlayer.getHerd();

        // 2. Matched dice
        if (greenDiceResult === redDiceResult) {
            const animal = greenDiceResult;
            const currentCount = herd[animal] ?? 0;
            const pairs = Math.floor(currentCount / 2);

            // jeśli nie ma żadnego, dostaje 1
            const animalsToAdd = Math.max(pairs, 1);

            this.bankHerd.transfer_animal(currentPlayer, animal, currentCount + animalsToAdd);
            return;
        }

        // 3. Different dice

        // jeśli nie ma żadnych zwierząt, nic się nie dzieje
        const hasAnimals = Object.values(herd).some(count => count > 0);
        if (!hasAnimals) {
            return;
        }

        // dla każdej kości: jeśli gracz ma ten gatunek, dostaje tyle, ile ma par
        [greenDiceResult, redDiceResult].forEach(animal => {
            const currentCount = herd[animal] ?? 0;
            if (currentCount <= 0) {
                return;
            }

            const pairs = Math.floor(currentCount / 2);
            if (pairs <= 0) {
                return; // zero par -> zero bonusu
            }

            this.bankHerd.transfer_animal(currentPlayer, animal, currentCount + pairs);
        });
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
            player.transfer_animal(this.bankHerd, "Rabbit", rabbits);
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
                player.transfer_animal(this.bankHerd, animal, count);
            }
        });

        return true;
    }
}