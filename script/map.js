function generateMap() {
    let map = [];
    for (let i = 0; i < 10; i++) {
        map[i] = [];
        for (let j = 0; j < 10; j++) {
            map[i][j] = {
                type: randomTerrainType()
            };
        }
    }
    return map;
}

function randomTerrainType() {
    const types = ["grass", "water", "forest", "mountain"];
    return types[Math.floor(Math.random() * types.length)];
}
