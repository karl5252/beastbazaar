import {PlayerState} from "../../src/game/core/PlayerState.js";
import {Logic} from "../../src/game/core/Logic.js";
import {setHerd} from "../helpers/helper.js";

describe("Logic - Edge Cases", () => {
    let logic;
    let p1, p2;

    beforeEach(() => {
        p1 = new PlayerState("Player1", 0);
        p2 = new PlayerState("Player2", 1);
        logic = new Logic([p1, p2]);
        logic.startTurn();
    });

    describe("processDiceRoll - return values", () => {
        it("should return proper structure for double predator attack", () => {
            setHerd(p1, {Rabbit: 5, Sheep: 3});

            const result = logic.processDiceRoll(p1, "Fox", "Wolf");

            expect(result.ok).toBe(true);
            expect(result.type).toBe("predators");
            expect(result.predators).toEqual(["Fox", "Wolf"]);
            expect(logic.turnState.hasRolled).toBe(true);
        });

        it("should return proper structure for single predator", () => {
            setHerd(p1, {Rabbit: 5});

            const result = logic.processDiceRoll(p1, "Fox", "Sheep");

            expect(result.ok).toBe(true);
            expect(result.type).toBe("predator");
            expect(result.predator).toBe("Fox");
        });

        it("should return proper structure for double roll breeding", () => {
            setHerd(p1, {Rabbit: 4});

            const result = logic.processDiceRoll(p1, "Rabbit", "Rabbit");

            expect(result.ok).toBe(true);
            expect(result.type).toBe("breeding");
            expect(result.animal).toBe("Rabbit");
            expect(result.gained).toBeGreaterThan(0);
        });

        it("should return proper structure when no animals to breed", () => {
            const result = logic.processDiceRoll(p1, "Rabbit", "Sheep");

            expect(result.ok).toBe(true);
            expect(result.type).toBe("no_breeding");
            expect(result.reason).toBe("no_animals");
        });
    });

    describe("bank overflow scenarios", () => {
        it("should cull excess animals when bank is full during fox attack", () => {
            // Fill bank with rabbits
            setHerd(logic.bankHerd, {Rabbit: 60}); // Max capacity
            setHerd(p1, {Rabbit: 10});

            logic.processDiceRoll(p1, "Fox", "Sheep");

            // All rabbits should be gone (culled because bank is full)
            expect(p1.getHerd().Rabbit).toBe(0);
            expect(logic.bankHerd.getHerd().Rabbit).toBe(60); // Bank unchanged
        });

        it("should partially return animals when bank has limited space", () => {
            setHerd(logic.bankHerd, {Sheep: 22}); // 2 spaces left (max is 24)
            setHerd(p1, {Sheep: 5});

            logic.returnToBankWithCull(p1, "Sheep", 5);

            expect(p1.getHerd().Sheep).toBe(0); // All removed from player
            expect(logic.bankHerd.getHerd().Sheep).toBe(24); // Only 2 added, 3 culled
        });

        it("should handle wolf attack with full bank", () => {
            setHerd(logic.bankHerd, {
                Rabbit: 60,
                Sheep: 24,
                Pig: 20,
                Cow: 12
            });
            setHerd(p1, {Rabbit: 5, Sheep: 3, Pig: 2, Cow: 1});

            const result = logic.handleWolfAttack(p1);

            expect(result.protected).toBe(false);
            expect(p1.getHerd().Rabbit).toBe(0);
            expect(p1.getHerd().Sheep).toBe(0);
            expect(p1.getHerd().Pig).toBe(0);
            expect(p1.getHerd().Cow).toBe(0);
        });
    });

    describe("breeding with bank limitations", () => {
        it("should only give what bank has available", () => {
            setHerd(logic.bankHerd, {Rabbit: 1}); // Only 1 left
            setHerd(p1, {Rabbit: 10}); // 5 pairs = should get 5, but bank only has 1

            const result = logic.processDiceRoll(p1, "Rabbit", "Cow");

            expect(result.ok).toBe(true);
            expect(result.gained.Rabbit).toBe(1);
            expect(p1.getHerd().Rabbit).toBe(11); // Only got 1
            expect(logic.bankHerd.getHerd().Rabbit).toBe(0);
        });

        it("should handle double roll when bank is empty", () => {
            setHerd(logic.bankHerd, {Sheep: 0}); // Empty
            setHerd(p1, {Sheep: 6}); // 3 pairs

            const result = logic.processDiceRoll(p1, "Sheep", "Sheep");

            expect(result.ok).toBe(true);
            expect(result.gained).toBe(0); // Couldn't get any
            expect(p1.getHerd().Sheep).toBe(6); // Unchanged
        });
    });

    describe("turn state management", () => {
        it("should prevent rolling twice in one turn", () => {
            const result1 = logic.processDiceRoll(p1, "Rabbit", "Rabbit");
            expect(result1.ok).toBe(true);

            const result2 = logic.processDiceRoll(p1, "Sheep", "Sheep");
            expect(result2.ok).toBe(false);
            expect(result2.reason).toBe("already_rolled");
        });

        it("should prevent exchanging twice in one turn", () => {
            setHerd(p1, {Rabbit: 12});
            setHerd(logic.bankHerd, {Sheep: 10});

            const result1 = logic.exchangeWithBank("Rabbit", "Sheep");
            expect(result1.ok).toBe(true);

            const result2 = logic.exchangeWithBank("Rabbit", "Sheep");
            expect(result2.ok).toBe(false);
            expect(result2.reason).toBe("already_exchanged");
        });

        it("should reset turn state when starting new turn", () => {
            logic.processDiceRoll(p1, "Rabbit", "Rabbit");
            expect(logic.turnState.hasRolled).toBe(true);

            logic.endTurn();
            logic.startTurn();

            expect(logic.turnState.hasRolled).toBe(false);
            expect(logic.turnState.hasExchanged).toBe(false);
        });

        it("should prevent wrong player from rolling", () => {
            expect(logic.currentPlayerIndex).toBe(0); // p1's turn

            const result = logic.processDiceRoll(p2, "Rabbit", "Rabbit");

            expect(result.ok).toBe(false);
            expect(result.reason).toBe("not_your_turn");
        });
    });

    describe("dog protection mechanics", () => {
        it("should use foxhound to protect against fox", () => {
            setHerd(p1, {Rabbit: 10, Foxhound: 2});

            const result = logic.handleFoxAttack(p1);

            expect(result.protected).toBe(true);
            expect(result.cost).toBe("Foxhound");
            expect(p1.getHerd().Foxhound).toBe(1); // Lost 1
            expect(p1.getHerd().Rabbit).toBe(10); // Kept all rabbits
        });

        it("should use wolfhound to protect against wolf", () => {
            setHerd(p1, {Rabbit: 5, Sheep: 3, Wolfhound: 1});

            const result = logic.handleWolfAttack(p1);

            expect(result.protected).toBe(true);
            expect(result.cost).toBe("Wolfhound");
            expect(p1.getHerd().Wolfhound).toBe(0); // Lost it
            expect(p1.getHerd().Rabbit).toBe(5); // Kept all
            expect(p1.getHerd().Sheep).toBe(3);
        });

        it("should not protect horse from wolf", () => {
            setHerd(p1, {Rabbit: 2, Horse: 3});
            setHerd(logic.bankHerd, {Rabbit: 58});

            logic.handleWolfAttack(p1);

            expect(p1.getHerd().Rabbit).toBe(0); // Lost
            expect(p1.getHerd().Horse).toBe(3); // Kept
        });
    });

    describe("bank exchange validation", () => {
        it("should fail when player lacks animals to exchange", () => {
            setHerd(p1, {Rabbit: 5}); // Need 6

            const result = logic.exchangeWithBank("Rabbit", "Sheep");

            expect(result.ok).toBe(false);
            expect(result.reason).toBe("player_lacks_from");
        });

        it("should fail when bank lacks animals to give", () => {
            setHerd(p1, {Rabbit: 6});
            setHerd(logic.bankHerd, {Sheep: 0}); // Empty

            const result = logic.exchangeWithBank("Rabbit", "Sheep");

            expect(result.ok).toBe(false);
            expect(result.reason).toBe("bank_lacks_to");
        });

        it("should fail for invalid exchange rate", () => {
            setHerd(p1, {Rabbit: 10});

            const result = logic.exchangeWithBank("Rabbit", "Horse");

            expect(result.ok).toBe(false);
            expect(result.reason).toBe("no_rate");
        });
    });

    describe("victory condition edge cases", () => {
        it("should not win with all animals except one", () => {
            setHerd(p1, {
                Rabbit: 1,
                Sheep: 1,
                Pig: 1,
                Cow: 1,
                Horse: 0 // Missing horse
            });

            const result = logic.endTurn();

            expect(result.winnerIndex).toBe(null);
        });

        it("should win with more than minimum required", () => {
            setHerd(p1, {
                Rabbit: 10,
                Sheep: 5,
                Pig: 3,
                Cow: 2,
                Horse: 1
            });

            const result = logic.endTurn();

            expect(result.winnerIndex).toBe(0);
        });

        it("should not win with only hounds", () => {
            setHerd(p1, {
                Foxhound: 3,
                Wolfhound: 2
            });

            const result = logic.endTurn();

            expect(result.winnerIndex).toBe(null);
        });
    });

    describe("multi-player turn rotation", () => {
        it("should rotate through all players", () => {
            const p3 = new PlayerState("Player3", 2);
            logic.addPlayer(p3);

            expect(logic.currentPlayerIndex).toBe(0);

            logic.endTurn();
            expect(logic.currentPlayerIndex).toBe(1);

            logic.endTurn();
            expect(logic.currentPlayerIndex).toBe(2);

            logic.endTurn();
            expect(logic.currentPlayerIndex).toBe(0); // Back to start
        });

        it("should increment turn number", () => {
            expect(logic.turnNumber).toBe(0);

            logic.endTurn();
            expect(logic.turnNumber).toBe(1);

            logic.endTurn();
            expect(logic.turnNumber).toBe(2);
        });
    });
});