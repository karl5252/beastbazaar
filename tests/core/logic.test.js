import {Player} from "../../src/game/core/Player.js";
import {Logic} from "../../src/game/core/Logic.js";

describe("game logic tests", () => {
    let player;
    let logic;

    beforeEach(() => {
        player = new Player();
        logic = new Logic();
    });

    it("test rule if player herd is empty and dice shows different animals dont update herd", () => {
        let player = new Player();
        let logic = new Logic();

        // Simulate dice roll with different animals
        logic.processDiceRoll(player, ["Rabbit", "Sheep"]);
        expect(player.getHerd()).toEqual({
            "Rabbit": 0,
            "Sheep": 0,
            "Pig": 0,
            "Cow": 0,
            "Horse": 0,
            "Foxhound": 0,
            "Wolfhound": 0
        });
    })

    it("test tule if player rolls same animal his herd will be updated accordingly with one animal of type", () => {
        logic.processDiceRoll(player, "Rabbit", "Rabbit");
        expect(player.getHerd()).toEqual({
            "Rabbit": 1,
            "Sheep": 0,
            "Pig": 0,
            "Cow": 0,
            "Horse": 0,
            "Foxhound": 0,
            "Wolfhound": 0
        });
    })

    it("test rule if player has  herd of animal and animal is rolled he gets animals based on number of pairs he has", () => {
        player.updateHerd("Sheep", 4); // 2 pairs
        logic.processDiceRoll(player, "Sheep", "Cow");
        expect(player.getHerd()).toEqual({
            "Rabbit": 0,
            "Sheep": 6, // +2 sheep from 2 pairs
            "Pig": 0,
            "Cow": 0,
            "Horse": 0,
            "Foxhound": 0,
            "Wolfhound": 0
        });
    })


})
