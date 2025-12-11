/*
Tests for midpointCalculation.js

Run with:
    node test/midpointCalculation.test.js
*/

const assert = require("node:assert");
const { calculateMidpoint } = require("../src/midpointCalculation.ts");

// Small helper to compare floating point numbers
function assertAlmostEqual(actual, expected, message, epsilon = 1e-6) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff < epsilon, `${message} (expected ${expected}, got ${actual})`);
}

// Test 1: Two simple points
function testTwoPointsSimple() {
  const locations = [
    { lat: 0, lng: 0 },
    { lat: 10, lng: 10 },
  ];

  const midpoint = calculateMidpoint(locations);

  assertAlmostEqual(midpoint.lat, 5, "Midpoint latitude for two simple points");
  assertAlmostEqual(
    midpoint.lng,
    5,
    "Midpoint longitude for two simple points",
  );
}

// Test 2: Multiple points (3 points)
function testThreePoints() {
  const locations = [
    { lat: 0, lng: 0 },
    { lat: 10, lng: 0 },
    { lat: 20, lng: 0 },
  ];

  // Average lat = (0 + 10 + 20) / 3 = 10
  // Average lng = (0 + 0 + 0) / 3 = 0
  const midpoint = calculateMidpoint(locations);

  assertAlmostEqual(midpoint.lat, 10, "Midpoint latitude for three points");
  assertAlmostEqual(midpoint.lng, 0, "Midpoint longitude for three points");
}

// Test 3: Negative coordinates (e.g., western hemisphere longitudes)
function testNegativeCoordinates() {
  const locations = [
    { lat: 41.0, lng: -87.0 },
    { lat: 39.0, lng: -89.0 },
  ];

  // Average lat = (41 + 39) / 2 = 40
  // Average lng = (-87 + -89) / 2 = -88
  const midpoint = calculateMidpoint(locations);

  assertAlmostEqual(midpoint.lat, 40, "Midpoint latitude with negative coords");
  assertAlmostEqual(
    midpoint.lng,
    -88,
    "Midpoint longitude with negative coords",
  );
}

// Test 4: All points the same -> midpoint should be the same point
function testIdenticalPoints() {
  const locations = [
    { lat: 5, lng: 5 },
    { lat: 5, lng: 5 },
    { lat: 5, lng: 5 },
    { lat: 5, lng: 5 },
  ];

  const midpoint = calculateMidpoint(locations);

  assertAlmostEqual(midpoint.lat, 5, "Midpoint latitude for identical points");
  assertAlmostEqual(midpoint.lng, 5, "Midpoint longitude for identical points");
}

// Test 5: Empty array should throw an error
function testEmptyArrayThrows() {
  assert.throws(
    () => calculateMidpoint([]),
    /non-empty array/,
    "Expected error for empty locations array",
  );
}

// Test 6: Invalid point (missing lat or lng) should throw
function testInvalidPointThrows() {
  const locations = [
    { lat: 0, lng: 0 },
    // Missing lng here
    { lat: 10 },
  ];

  assert.throws(
    () => calculateMidpoint(locations),
    /valid numeric 'lat' and 'lng'/,
    "Expected error for invalid location object",
  );
}

// Run all tests
function runTests() {
  console.log("Running midpoint tests...");

  const tests = [
    testTwoPointsSimple,
    testThreePoints,
    testNegativeCoordinates,
    testIdenticalPoints,
    testEmptyArrayThrows,
    testInvalidPointThrows,
  ];

  for (const test of tests) {
    try {
      test();
      console.log(`✅ ${test.name} passed`);
    } catch (err) {
      console.error(`❌ ${test.name} failed`);
      console.error(err);
      process.exitCode = 1;
    }
  }

  console.log("Finished midpoint tests.");
}

runTests();
