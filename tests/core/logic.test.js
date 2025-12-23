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

    it("test rule if player has even number of animals in herd and rolls animal he gets animals based on number of pairs he has", () => {
        player.updateHerd("Pig", 4); // 2 pairs
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
        player.updateHerd("Cow", 5); // 2 pairs
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

    it("test rule if player has no foxhound and rolls fox he loses all rabbits ONLY", () => {
        player.updateHerd("Rabbit", 1)
        player.updateHerd("Sheep", 1)
        player.updateHerd("Pig", 1)
        player.updateHerd("Cow", 1)
        player.updateHerd("Horse", 1)
        player.updateHerd("Wolfhound", 1)
        logic.processDiceRoll(player, "Rabbit", "Fox");
        expect(player.getHerd()).toEqual({
            "Rabbit": 0, // lost rabbits
            "Sheep": 1,
            "Pig": 1,
            "Cow": 1,
            "Horse": 1,
            "Foxhound": 0,
            "Wolfhound": 1
        });
    })

    it("test rule if player has foxhound and rolls fox he loses one foxhound ONLY", () => {
        player.updateHerd("Rabbit", 1)
        player.updateHerd("Sheep", 1)
        player.updateHerd("Pig", 1)
        player.updateHerd("Cow", 1)
        player.updateHerd("Horse", 1)
        player.updateHerd("Foxhound", 1)
        player.updateHerd("Wolfhound", 1)
        logic.processDiceRoll(player, "Sheep", "Fox");
        expect(player.getHerd()).toEqual({
            "Rabbit": 1,
            "Sheep": 1,
            "Pig": 1,
            "Cow": 1,
            "Horse": 1,
            "Foxhound": 0, // lost one foxhound
            "Wolfhound": 1
        });
    })

    it("test rule if player has no wolfhound and rolls wolf he loses all animals except hounds and horse", () => {
        player.updateHerd("Rabbit", 1)
        player.updateHerd("Sheep", 1)
        player.updateHerd("Pig", 1)
        player.updateHerd("Cow", 1)
        player.updateHerd("Horse", 1)
        player.updateHerd("Foxhound", 1)
        player.updateHerd("Wolfhound", 0)
        logic.processDiceRoll(player, "Cow", "Wolf");
        expect(player.getHerd()).toEqual({
            "Rabbit": 0, // lost
            "Sheep": 0,  // lost
            "Pig": 0,    // lost
            "Cow": 0,    // lost
            "Horse": 1,
            "Foxhound": 1,
            "Wolfhound": 0
        });
    })

    it("test rule if player has wolfhound and rolls wolf he loses one wolfhound ONLY", () => {
        player.updateHerd("Rabbit", 1)
        player.updateHerd("Sheep", 1)
        player.updateHerd("Pig", 1)
        player.updateHerd("Cow", 1)
        player.updateHerd("Horse", 1)
        player.updateHerd("Foxhound", 1)
        player.updateHerd("Wolfhound", 1)
        logic.processDiceRoll(player, "Pig", "Wolf");
        expect(player.getHerd()).toEqual({
            "Rabbit": 1,
            "Sheep": 1,
            "Pig": 1,
            "Cow": 1,
            "Horse": 1,
            "Foxhound": 1,
            "Wolfhound": 0 // lost one wolfhound
        });
    })

    it("test rule if player has no animals and rolls fox and wolf herd remains unchanged", () => {
        logic.processDiceRoll(player, "Fox", "Wolf");
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

    it("test rule if player has some animals and rolls fox and wolf only the relevant animals are affected", () => {
        player.updateHerd("Rabbit", 2)
        player.updateHerd("Sheep", 2)
        player.updateHerd("Pig", 2)
        player.updateHerd("Cow", 2)
        player.updateHerd("Horse", 1)
        player.updateHerd("Foxhound", 0)
        player.updateHerd("Wolfhound", 0)
        logic.processDiceRoll(player, "Fox", "Wolf");
        expect(player.getHerd()).toEqual({
            "Rabbit": 0, // lost rabbits
            "Sheep": 0,  // lost sheep
            "Pig": 0,    // lost pigs
            "Cow": 0,    // lost cows
            "Horse": 1,
            "Foxhound": 0,
            "Wolfhound": 0
        });
    })

    it("test rule that bank cannot be debted if there is not sufficient amount of animals to transfer should transfer whatever is available", () => {
       // bank has 1 rabbit left
        // player has two pais of rabbits
        // player rolls rabbits and should get only 1 rabbit from bank
        logic.bankHerd.updateHerd("Rabbit", 1);
        player.updateHerd("Rabbit", 4); // 2 pairs
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


})
