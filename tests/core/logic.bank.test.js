import {PlayerState} from "../../src/game/core/PlayerState.js";
import {Logic} from "../../src/game/core/Logic.js";
import {setHerd} from "../helpers/helper.js";

describe("bank logic tests", () => {
    let player;
    let logic;

    beforeEach(() => {
        player = new PlayerState();
        logic = new Logic();
        logic.addPlayer(player);
        logic.startTurn();
    });

    it("test rule that bank cannot be debited if there is not sufficient amount of animals to transfer should transfer whatever is available", () => {
        // bank has 1 rabbit left
        // player has two pais of rabbits
        // player rolls rabbits and should get only 1 rabbit from bank
        logic.bankHerd.updateHerd("Rabbit", 1);
        player.updateHerd("Rabbit", 4); // 2 pairs
        setHerd(logic.bankHerd, {Rabbit: 1});
        setHerd(player, {Rabbit: 4});

        logic.processDiceRoll(player, "Rabbit", "Sheep");
        expect(player.getHerd()).toEqual({
            "Rabbit": 5, // +1 rabbit from bank
            "Sheep": 0,
            "Pig": 0,
            "Cow": 0,
            "Horse": 0,
            "Foxhound": 0,
            "Wolfhound": 0
        });
        expect(logic.bankHerd.getHerd()).toEqual({
            "Rabbit": 0, // bank is out of rabbits
            "Sheep": 24,
            "Pig": 20,
            "Cow": 12,
            "Horse": 4,
            "Foxhound": 4,
            "Wolfhound": 2
        });
    })

    it("test rule if player returns animal then main herd is not updated over the max value", () => {
            // bank limit for rabbits is 60
        // PlayerState has 2 more rabbits  - wrong state that happens when calculation gets a hiccup
        // PlayerState rolls Fox
            // Bank is overflown - wrong ste of bank
            player.updateHerd("Rabbit", 2); // 1 pair
            const bankInitialState = JSON.parse(JSON.stringify(logic.bankHerd.getHerd()));


            logic.processDiceRoll(player, 'Cow', 'Fox'); // bye bye rabbits
            expect(logic.bankHerd.getHerd()).toEqual(bankInitialState);
            expect(player.getHerd().Rabbit).toBe(0);
        }
    );
});