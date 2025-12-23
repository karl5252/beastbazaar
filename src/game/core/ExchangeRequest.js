// src/game/core/exchange/ExchangeRequest.js
// ExchangeRequest.js
export class ExchangeRequest {
    constructor({id, requestorIndex, targetIndex, offer, want, createdTurn}) {
        this.id = id ?? ExchangeRequest.newId();
        this.requestorIndex = requestorIndex;
        this.targetIndex = targetIndex;     // number (player index OR bank index)
        this.offer = ExchangeRequest.normalizeLeg(offer);
        this.want = ExchangeRequest.normalizeLeg(want);
        this.createdTurn = createdTurn;

        this.status = "pending";
        this.reason = null;
    }


    static normalizeLeg(leg) {
        if (!leg || typeof leg !== "object") return {animal: null, amount: 0};
        const animal = String(leg.animal ?? "");
        const amount = Number(leg.amount ?? 0);
        return {animal, amount: Number.isFinite(amount) ? amount : 0};
    }

    static newId() {
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    isExpired(currentTurn, expiryTurns) {
        if (!Number.isFinite(expiryTurns) || expiryTurns < 0) return false; // -1/NaN = never expire (opcjonalnie)
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
}
