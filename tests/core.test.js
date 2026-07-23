const assert = require("assert");
const core = require("../src/core");

core.LEVELS.forEach((level) => {
  const result = core.simulate(level, core.parseProgram(level.solution));
  assert.strictEqual(
    result.completed,
    true,
    `${level.id} should be completed by its reference solution`
  );
  assert(
    result.finalState.energySpent <= level.parEnergy + 0.00001,
    `${level.id} reference solution should meet the energy target`
  );
});

{
  const level = core.LEVELS.find((entry) => entry.id === "ice-slide");
  const result = core.simulate(level, core.parseProgram("FF"));
  assert.deepStrictEqual(
    result.events[1].path.map((point) => [point.x, point.y]),
    [
      [1, 3],
      [1, 2],
      [1, 1]
    ],
    "ice should slide until the next non-ice tile"
  );
}

{
  const level = core.LEVELS[0];
  const result = core.simulate(level, core.parseProgram("LFF"));
  assert.strictEqual(result.stoppedReason, "collision");
  assert.strictEqual(result.finalState.x, level.start.x);
  assert.strictEqual(result.finalState.y, level.start.y);
}

console.log(`Validated ${core.LEVELS.length} RoboNavi levels.`);
