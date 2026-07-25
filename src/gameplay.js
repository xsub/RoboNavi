(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./core"));
  } else {
    root.RoboNaviGameplay = factory(root.RoboNaviCore);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (core) {
  "use strict";

  var ALL_COMMANDS = [
    "turn-left",
    "forward",
    "turn-right",
    "battery",
    "induct"
  ];

  var LESSONS = {
    0: "forwardBattery",
    1: "turns",
    2: "sand",
    3: "ice",
    6: "relayTimer",
    7: "induct",
    14: "water"
  };

  function campaignIndex(level, explicitIndex) {
    if (level && level.generated) return -1;
    if (Number.isInteger(explicitIndex) && explicitIndex >= 0) {
      return explicitIndex;
    }
    return core.LEVELS.indexOf(level);
  }

  function availableCommands(level, explicitIndex) {
    var index = campaignIndex(level, explicitIndex);
    if (index < 0) return ALL_COMMANDS.slice();
    if (index === 0) return ["forward", "battery"];
    if (index < 7) {
      return ["turn-left", "forward", "turn-right", "battery"];
    }
    return ALL_COMMANDS.slice();
  }

  function lessonKey(level, explicitIndex) {
    var index = campaignIndex(level, explicitIndex);
    return Object.prototype.hasOwnProperty.call(LESSONS, index)
      ? LESSONS[index]
      : "practice";
  }

  function isCommandAvailable(level, explicitIndex, command) {
    return (
      availableCommands(level, explicitIndex).indexOf(core.commandType(command)) !==
      -1
    );
  }

  function normalizeInsertIndex(commands, index) {
    return Math.max(
      0,
      Math.min(commands.length, Math.floor(Number(index) || 0))
    );
  }

  function insertCommand(commands, index, command) {
    var result = commands.slice();
    var insertAt = normalizeInsertIndex(result, index);
    result.splice(insertAt, 0, core.normalizeCommand(command));
    return result;
  }

  function removeCommand(commands, index) {
    var result = commands.slice();
    var removeAt = Math.floor(Number(index));
    if (removeAt >= 0 && removeAt < result.length) {
      result.splice(removeAt, 1);
    }
    return result;
  }

  function moveCommand(commands, fromIndex, toIndex) {
    var result = commands.slice();
    var from = Math.floor(Number(fromIndex));
    if (from < 0 || from >= result.length) return result;
    var to = Math.max(
      0,
      Math.min(result.length - 1, Math.floor(Number(toIndex)))
    );
    if (from === to) return result;
    var command = result.splice(from, 1)[0];
    result.splice(to, 0, command);
    return result;
  }

  function scoreBreakdown(level, finalState, runCount) {
    var complete = core.isComplete(level, finalState);
    var energyPassed =
      complete && finalState.energySpent <= level.parEnergy + 0.00001;
    var runsPassed = complete && runCount <= level.parRuns;
    return {
      complete: complete,
      energy: energyPassed,
      runs: runsPassed,
      stars:
        (complete ? 1 : 0) + (energyPassed ? 1 : 0) + (runsPassed ? 1 : 0),
      energySpent: finalState.energySpent,
      energyTarget: level.parEnergy,
      runCount: runCount,
      runTarget: level.parRuns
    };
  }

  return {
    ALL_COMMANDS: ALL_COMMANDS,
    availableCommands: availableCommands,
    insertCommand: insertCommand,
    isCommandAvailable: isCommandAvailable,
    lessonKey: lessonKey,
    moveCommand: moveCommand,
    removeCommand: removeCommand,
    scoreBreakdown: scoreBreakdown
  };
});
