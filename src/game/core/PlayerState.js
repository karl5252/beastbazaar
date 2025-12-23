export class PlayerState {
    constructor(name="testPlayer", index=0) {
        this.name = name;
        this.index = index;
        this.herd = {
            "Rabbit": 0,
            "Sheep": 0,
            "Pig": 0,
            "Cow": 0,
            "Horse": 0,
            "Foxhound": 0,
            "Wolfhound": 0
        };

    }

    getHerd() {
        return this.herd;
    }

    updateHerd(animalType, count) {
        this.herd[animalType] = count;
    }

    /**
     * Transfer a specified count of animals from the current player to the recipient player.
     * Ensures the current player has enough animals to transfer.
     * @param recipientPlayer
     * @param animalType
     * @param count
     * @returns {boolean}
     */

    transfer_animal(recipientPlayer, animalType, count) {
        // check if animal type is in herd at all if not return false

        if(!(animalType in this.herd)) {
            return false;
        }
        // get available count
        let availableCount = this.getHerd()[animalType] ?? 0;
        if (availableCount >= count) {
            // deduct from sender
            this.herd[animalType] -= count;
            // add to recipient
            let recipientCount = recipientPlayer.getHerd()[animalType] || 0;
            recipientPlayer.updateHerd(animalType, recipientCount + count);
            return true;
        } else {
            return false;
        }
    }

    transfer_from(senderPlayer, animalType, count) {
        return senderPlayer.transfer_animal(this, animalType, count);
    }

}