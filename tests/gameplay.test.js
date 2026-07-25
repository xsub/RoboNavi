const assert = require("assert");
const core = require("../src/core");
const gameplay = require("../src/gameplay");

{
  assert.deepStrictEqual(
    gameplay.availableCommands(core.LEVELS[0], 0),
    ["forward", "battery"],
    "the first lesson should expose only movement and battery installation"
  );
  assert.strictEqual(
    gameplay.isCommandAvailable(core.LEVELS[0], 0, "turn-left"),
    false
  );
  assert.strictEqual(gameplay.lessonKey(core.LEVELS[7], 7), "induct");
}

{
  const source = ["forward", "battery"];
  const inserted = gameplay.insertCommand(source, 1, "turn-right");
  assert.deepStrictEqual(inserted, ["forward", "turn-right", "battery"]);
  assert.deepStrictEqual(source, ["forward", "battery"], "queue edits are immutable");
  assert.deepStrictEqual(
    gameplay.moveCommand(inserted, 2, 0),
    ["battery", "forward", "turn-right"]
  );
  assert.deepStrictEqual(
    gameplay.removeCommand(inserted, 1),
    ["forward", "battery"]
  );
}

{
  const level = core.LEVELS[0];
  const completed = core.simulate(level, core.parseProgram(level.solution));
  const perfect = gameplay.scoreBreakdown(level, completed.finalState, 1);
  assert.deepStrictEqual(
    {
      complete: perfect.complete,
      energy: perfect.energy,
      runs: perfect.runs,
      stars: perfect.stars
    },
    { complete: true, energy: true, runs: true, stars: 3 }
  );

  const expensiveState = core.cloneState(completed.finalState);
  expensiveState.energySpent = level.parEnergy + 1;
  const expensive = gameplay.scoreBreakdown(level, expensiveState, 2);
  assert.strictEqual(expensive.stars, 1);
  assert.strictEqual(expensive.energy, false);
  assert.strictEqual(expensive.runs, false);
}

console.log("RoboNavi gameplay tests passed.");
