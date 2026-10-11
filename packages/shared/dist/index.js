"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOARD_LIMIT = exports.MIN_MATCH_CONFIDENCE = exports.MAX_FIND_ATTEMPTS = exports.HIDER_POINT_FACTOR = exports.HUNTER_POINT_FACTOR = void 0;
exports.isDifficulty = isDifficulty;
exports.hunterPoints = hunterPoints;
exports.hiderPoints = hiderPoints;
exports.HUNTER_POINT_FACTOR = 10;
exports.HIDER_POINT_FACTOR = 5;
exports.MAX_FIND_ATTEMPTS = 3;
/** A yes below this confidence is forced to no. Uncertainty never scores. */
exports.MIN_MATCH_CONFIDENCE = 0.72;
exports.BOARD_LIMIT = 40;
function isDifficulty(value) {
    return value === 1 || value === 2 || value === 3;
}
function hunterPoints(difficulty) {
    return exports.HUNTER_POINT_FACTOR * difficulty;
}
function hiderPoints(difficulty) {
    return exports.HIDER_POINT_FACTOR * difficulty;
}
