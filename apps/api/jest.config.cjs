module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.json",
      useESM: true
    }
  },
  moduleNameMapper: {
    "^@api/(.*)$": "<rootDir>/src/$1",
    "^@shared$": "<rootDir>/../../packages/shared/src/index.ts",
    "^@shared/(.*)$": "<rootDir>/../../packages/shared/src/$1"
  }
};
