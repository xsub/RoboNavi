const assert = require("assert");
const core = require("../src/core");
const generator = require("../src/generator");

{
  const level = {
    id: "two-route-test",
    width: 5,
    height: 5,
    energyMax: 10,
    parEnergy: 10,
    parRuns: 1,
    start: { x: 1, y: 2, direction: "east" },
    goals: [{ x: 3, y: 2 }],
    grid: [
      ".....",
      ".....",
      ".....",
      ".....",
      "....."
    ],
    walls: [
      { axis: "vertical", x: 2, y: 2 },
      { axis: "vertical", x: 3, y: 2 },
      { axis: "horizontal", x: 2, y: 2 },
      { axis: "horizontal", x: 2, y: 3 }
    ]
  };
  const result = generator.dijkstra(level, level.start, level.goals[0], 100);
  assert.strictEqual(result.reachable, true);
  assert.strictEqual(result.distance, 4);
  assert.strictEqual(result.routeCount, 2);
}

{
  const level = {
    id: "astar-turn-test",
    width: 6,
    height: 6,
    energyMax: 20,
    parEnergy: 20,
    parRuns: 1,
    start: { x: 1, y: 4, direction: "north" },
    goals: [{ x: 4, y: 1 }],
    grid: [
      "######",
      "#....#",
      "#.##.#",
      "#....#",
      "#....#",
      "######"
    ]
  };
  const solution = generator.aStar(level, level.start, level.goals[0]);
  assert.strictEqual(solution.found, true);
  const result = core.simulate(level, solution.commands);
  assert.strictEqual(result.completed, true);
  assert.strictEqual(result.finalState.energySpent, solution.energy);
}

[
  { size: 9, minSolutions: 2, density: "relaxed", seed: 11 },
  { size: 11, minSolutions: 4, density: "balanced", seed: 42 },
  { size: 13, minSolutions: 8, density: "dense", seed: 99 },
  { size: 13, minSolutions: 2, density: "balanced", seed: 20260723 }
].forEach((options) => {
  const level = generator.generateLevel(options);
  core.validateLevel(level);

  assert.strictEqual(level.generated, true);
  assert.strictEqual(Array.isArray(level.walls), true);
  assert.strictEqual(
    level.grid.some((row) => row.includes("#")),
    false,
    `${level.id} should use edge walls instead of blocked wall tiles`
  );
  level.walls.forEach((wall) => {
    assert(
      wall.axis === "horizontal" || wall.axis === "vertical",
      `${level.id} should contain canonical edge-wall segments`
    );
  });
  assert(
    level.generation.routeCount >= options.minSolutions,
    `${level.id} should provide at least ${options.minSolutions} shortest routes`
  );
  assert(
    level.energyMax >= level.parEnergy * 1.25,
    `${level.id} should include a practical energy reserve above the A* target`
  );

  const result = core.simulate(level, core.parseProgram(level.solution));
  assert.strictEqual(result.completed, true, `${level.id} A* solution should complete`);
  assert(
    result.finalState.energySpent <= level.parEnergy + 0.00001,
    `${level.id} A* solution should meet the reference energy target`
  );
});

console.log("Validated Dijkstra, A*, and procedural RoboNavi levels.");
