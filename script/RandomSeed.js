class SeededRandom {
    constructor(seed) {
        this.modulus = 2**31 - 1;  // 大素数作为模数
        this.multiplier = 48271;   // 适合的乘数
        this.increment = 0;        // 增量通常设为0
        this.seed = seed;
    }

    next() {
        this.seed = (this.seed * this.multiplier + this.increment) % this.modulus;
        return this.seed / this.modulus;
    }
}
