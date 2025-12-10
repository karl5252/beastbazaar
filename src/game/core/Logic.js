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

            currentPlayer.updateHerd(animal, currentCount + animalsToAdd);
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

            currentPlayer.updateHerd(animal, currentCount + pairs);
        });
    }


    handleFoxAttack(player) {
        // fox attacks the player and steals rabbits UNLESS player has foxhound then foxhound is removed and herd is intact
        const playerHerd = player.getHerd();
        if ((playerHerd["Foxhound"] ?? 0) > 0) {
            // remove one foxhound
            player.updateHerd("Foxhound", playerHerd["Foxhound"] - 1);
        } else {
            // steal rabbits
            const rabbitsCount = playerHerd["Rabbit"] ?? 0;
            if (rabbitsCount > 0) {
                // transfer rabbits to bank
                player.updateHerd("Rabbit", 0);
                const bankRabbits = this.bankHerd.getHerd()["Rabbit"] ?? 0;
                this.bankHerd.updateHerd("Rabbit", bankRabbits + rabbitsCount);
            }
        }
    }

    handleWolfAttack(player) {
        // wolf attacks the player and steals all animals save for hounds and horse UNLESS player has wolfhound then wolfhound is removed and herd is intact
        const playerHerd = player.getHerd();
        if ((playerHerd["Wolfhound"] ?? 0) > 0) {
            // remove one wolfhound
            player.updateHerd("Wolfhound", playerHerd["Wolfhound"] - 1);
        } else {
            // steal all animals except hounds and horse
            const animalsToSteal = ["Rabbit", "Sheep", "Pig", "Cow"];
            animalsToSteal.forEach(animal => {
                const count = playerHerd[animal] ?? 0;
                if (count > 0) {
                    // transfer animals to bank
                    player.updateHerd(animal, 0);
                    const bankCount = this.bankHerd.getHerd()[animal] ?? 0;
                    this.bankHerd.updateHerd(animal, bankCount + count);
                }
            });
        }
    }
}