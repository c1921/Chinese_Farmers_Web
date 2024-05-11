function generateMap(seed) {
    let random = new SeededRandom(seed);
    let map = [];
    for (let i = 0; i < 10; i++) {
        map[i] = [];
        for (let j = 0; j < 10; j++) {
            map[i][j] = {
                type: randomTerrainType(random)
            };
        }
    }
    return map;
}

function randomTerrainType(random) {
    const types = ["grass", "water", "forest", "mountain"];
    return types[Math.floor(random.next() * types.length)];
}
