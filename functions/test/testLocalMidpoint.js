const { calculateMidpoint } = require("../lib/midpointCalculation.js");

// Some sample locations to test with
const locations = [
  { lat: 41.8708, lng: -87.6505 }, // UIC
  { lat: 41.8781, lng: -87.6298 }, // Downtown Chicago
  { lat: 41.792, lng: -87.6 }, // Hyde Park-ish
];

try {
  const midpoint = calculateMidpoint(locations);
  console.log("Input locations:", locations);
  console.log("Calculated midpoint:", midpoint);
} catch (err) {
  console.error("Error calculating midpoint:");
  console.error(err);
}
