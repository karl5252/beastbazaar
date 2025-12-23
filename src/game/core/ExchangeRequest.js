// src/game/core/exchange/ExchangeRequest.js

export class ExchangeRequest {
    constructor({requestorIndex, targetIndex, offer, want, createdTurn}) {
        this.id = ExchangeRequest.newId();
        this.requestorIndex = requestorIndex;
        this.targetIndex = targetIndex;     // Player index OR bank index
        this.offer = ExchangeRequest.normalizeLeg(offer);
        this.want = ExchangeRequest.normalizeLeg(want);
        this.createdTurn = createdTurn;

        this.status = "pending";  // "pending" | "accepted" | "rejected" | "expired" | "invalid"
        this.reason = null;
    }

    /**
     * Normalize a leg object to ensure it has valid animal and amount
     */
    static normalizeLeg(leg) {
        if (!leg || typeof leg !== "object") {
            return {animal: null, amount: 0};
        }
        const animal = String(leg.animal ?? "");
        const amount = Number(leg.amount ?? 0);
        return {
            animal,
            amount: Number.isFinite(amount) ? amount : 0
        };
    }

    /**
     * Generate a unique ID for the request
     */
    static newId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }

    /**
     * Check if the request has expired based on turn count
     * @param currentTurn - The current turn number
     * @param expiryTurns - Number of turns before expiry (0 = expires immediately, -1 = never)
     */
    isExpired(currentTurn, expiryTurns) {
        // Handle special cases
        if (!Number.isFinite(expiryTurns) || expiryTurns < 0) {
            return false; // Never expire
        }

        return (currentTurn - this.createdTurn) >= expiryTurns;
    }

    markInvalid(reason = "invalid") {
        this.status = "invalid";
        this.reason = reason;
    }

    markExpired() {
        this.status = "expired";
        this.reason = "expired";
    }

    markAccepted() {
        this.status = "accepted";
        this.reason = null;
    }

    markRejected(reason = "rejected") {
        this.status = "rejected";
        this.reason = reason;
    }

    /**
     * Get a human-readable description of the exchange
     */
    getDescription() {
        return `${this.offer.amount}x ${this.offer.animal} for ${this.want.amount}x ${this.want.animal}`;
    }

    /**
     * Create a serializable representation of the request
     */
    toJSON() {
        return {
            id: this.id,
            requestorIndex: this.requestorIndex,
            targetIndex: this.targetIndex,
            offer: {...this.offer},
            want: {...this.want},
            createdTurn: this.createdTurn,
            status: this.status,
            reason: this.reason
        };
    }
}






