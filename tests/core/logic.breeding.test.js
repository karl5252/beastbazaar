import {PlayerState} from "../../src/game/core/PlayerState.js";
import {Logic} from "../../src/game/core/Logic.js";
import {setHerd} from "../helpers/helper.js";

describe("breeding logic tests", () => {
    let player;
    let logic;

    beforeEach(() => {
        player = new PlayerState();
        logic = new Logic();
    });

    it("test rule if player herd is empty and dice shows different animals dont update herd", () => {
        let player = new PlayerState();
        let logic = new Logic();

        // Simulate dice roll with different animals
        logic.processDiceRoll(player, "Rabbit", "Sheep");
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
        setHerd(player, {Sheep: 4});
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

    it("test rule if player has even number of animals in herd and rolls animal he gets animals based on number of pairs he has", () => {
        setHerd(player, {Pig: 4});
        logic.processDiceRoll(player, "Pig", "Pig");
        expect(player.getHerd()).toEqual({
            "Rabbit": 0,
            "Sheep": 0,
            "Pig": 6, // +2 pigs from 2 pairs
            "Cow": 0,
            "Horse": 0,
            "Foxhound": 0,
            "Wolfhound": 0
        });
    })

    it("test rule if player has odd number of animals in herd and rolls animal he gets animals based on number of pairs he has", () => {
        setHerd(player, {Cow: 5});
        logic.processDiceRoll(player, "Cow", "Cow");
        expect(player.getHerd()).toEqual({
            "Rabbit": 0,
            "Sheep": 0,
            "Pig": 0,
            "Cow": 7, // +2 cows from 2 pairs
            "Horse": 0,
            "Foxhound": 0,
            "Wolfhound": 0
        });
    })

    it("test rule  if herd is updated when player has animals in herd and player rolls matching animals albeit other than already had.", () => {
        setHerd(player, {Rabbit: 4});

        logic.processDiceRoll(player, "Pig", "Pig");
        expect(player.getHerd()).toEqual({
            "Cow": 0,
            "Horse": 0,
            "Foxhound": 0,
            "Wolfhound": 0,
            "Sheep": 0,
            "Rabbit": 4,
            "Pig": 1,
        })
    })

    it("test rule if herd is updated correctly when player has three rabbits and rolls a cow on one dice and a rabbit on the other.", () => {
        setHerd(player, {Rabbit: 3});
        logic.processDiceRoll(player, "Cow", "Rabbit");
        expect(player.getHerd()).toEqual({
            "Cow": 0,
            "Horse": 0,
            "Foxhound": 0,
            "Wolfhound": 0,
            "Sheep": 0,
            "Rabbit": 4,
            "Pig": 0,
        })
    })


});