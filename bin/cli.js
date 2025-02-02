#!/usr/bin/env node
/**
 * Marvins Code Quality Analyzer CLI 
 * Copyright (c) 2025
 *
 * Author: Fatih Aydin
 * License: MIT
 *
 * This tool analyzes TypeScript source files and calculates key code quality metrics.
 */

// =============================================================
// Global Definitions and Helper Functions
// =============================================================

const path = require('path');
const fs = require('fs');
const { analyzeMethods } = require('../lib/analyzer');

// ANSI color codes for output formatting
const colors = {
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  purple:  '\x1b[35m',
  reset:   '\x1b[0m'
};

// Formatting variables for bold and italics
const bold = '\x1b[1m';
const italicStart = '\x1b[3m';
const italicReset = '\x1b[23m';

// Define the path for the config file (located in the current working directory)
const configPath = path.resolve(process.cwd(), 'config.json');

// Default configuration values
const defaultConfig = {
  cyclomatic: { medium: 6, high: 10 },
  maintainabilityIndex: { low: 40, medium: 60 },
  loc: { medium: 20, high: 40 },
  commentDensityMultiplier: 5
};

/**
 * Loads the configuration file.
 * If the file does not exist, it creates one with default values.
 */
function loadConfig() {
  if (!fs.existsSync(configPath)) {
    try {
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    } catch (error) {
      console.log(`${colors.red}Failed to create config file: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  } else {
    try {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.log(`${colors.red}Failed to read config file: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }
}

/**
 * Saves the configuration to the config file.
 */
function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.log(`${colors.red}Failed to save config file: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Prints a colorful help message.
 */
function printHelp() {
  console.log(`${bold}${colors.blue}===========================================================${colors.reset}`);
  console.log(`${bold}${colors.magenta}              Marvins Code Quality Analyzer             ${colors.reset}`);
  console.log(`${bold}${colors.blue}===========================================================${colors.reset}\n`);

  console.log(`${bold}${colors.blue}Usage:${colors.reset}\n`);

  // Help command
  console.log(`  ${colors.yellow}marvins help${colors.reset}`);
  console.log(`      ${colors.white}- Display this help message${colors.reset}\n`);

  // Configure command for updating metric thresholds
  console.log(`  ${colors.yellow}marvins configure -t <metric> <value1> <value2>${colors.reset}`);
  console.log(`      ${colors.white}- Update metric thresholds (Valid metrics: ${colors.green}cyclomatic, maintainabilityIndex, loc${colors.white})${colors.reset}`);
  console.log(`      ${colors.white}  Example: ${colors.yellow}marvins configure -t cyclomatic 6 10${colors.reset}\n`);

  // Configure command for updating comment density multiplier
  console.log(`  ${colors.yellow}marvins configure -d <value>${colors.reset}`);
  console.log(`      ${colors.white}- Update the comment density multiplier${colors.reset}`);
  console.log(`      ${colors.white}  Example: ${colors.yellow}marvins configure -d 7${colors.reset}\n`);

  // Analyze command
  console.log(`  ${colors.yellow}marvins analyze -f {typescript filePath}${colors.reset}`);
  console.log(`      ${colors.white}- Analyze the specified TypeScript file${colors.reset}`);
  console.log(`      ${colors.white}  Example: ${colors.yellow}marvins analyze -f src/app.ts${colors.reset}\n`);

  console.log(`${bold}${colors.blue}Description:${colors.reset}`);
  console.log(`Marvins analyzes TypeScript source files to calculate key code quality metrics such as:`);
  console.log(`  - Cyclomatic Complexity`);
  console.log(`  - Halstead Volume`);
  console.log(`  - Lines of Code (LOC)`);
  console.log(`  - Maintainability Index (MI)`);
  console.log(`  - Comment Density\n`);

  console.log(`${bold}${colors.blue}Configuration:${colors.reset}`);
  console.log(`Configuration values are stored in a ${colors.magenta}config.json${colors.reset} file in the current directory.`);
  console.log(`If the file does not exist, it will be created with default values:\n`);
  console.log(`${colors.green}{
  "cyclomatic": { "medium": 6, "high": 10 },
  "maintainabilityIndex": { "low": 40, "medium": 60 },
  "loc": { "medium": 20, "high": 40 },
  "commentDensityMultiplier": 5
}${colors.reset}\n`);

  console.log(`${bold}${colors.blue}Enjoy using Marvins to keep your code clean and maintainable!${colors.reset}\n`);
}

/**
 * Determines the appropriate color for Cyclomatic Complexity based on thresholds.
 */
function colorForCyclomatic(cc, config) {
  if (cc >= config.cyclomatic.high) {
    return colors.red;
  } else if (cc >= config.cyclomatic.medium) {
    return colors.yellow;
  } else {
    return colors.green;
  }
}

/**
 * Determines the appropriate color for Maintainability Index based on thresholds.
 */
function colorForMI(mi, config) {
  if (mi < config.maintainabilityIndex.low) {
    return colors.red;
  } else if (mi < config.maintainabilityIndex.medium) {
    return colors.yellow;
  } else {
    return colors.green;
  }
}

/**
 * Determines the appropriate color for Lines Of Code based on thresholds.
 */
function colorForLOC(loc, config) {
  if (loc >= config.loc.high) {
    return colors.red;
  } else if (loc >= config.loc.medium) {
    return colors.yellow;
  } else {
    return colors.green;
  }
}

// =============================================================
// Command-Line Processing and Main Logic
// =============================================================

// Process command-line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`${colors.red}Usage:
  marvins help
  marvins configure -t <metric> <value1> <value2>
  marvins configure -d <value>
  marvins analyze -f {typescript filePath}${colors.reset}`);
  process.exit(1);
}

const command = args[0];

if (command === 'help') {
  printHelp();
  process.exit(0);
}

// 'configure' command: update threshold values or comment density multiplier in config.json
if (command === 'configure') {
  if (args.length < 3) {
    console.log(`${colors.red}Usage:
  marvins configure -t <metric> <value1> <value2>
  marvins configure -d <value>${colors.reset}`);
    process.exit(1);
  }
  
  // Update comment density multiplier
  if (args[1] === '-d') {
    const multiplier = parseFloat(args[2]);
    if (isNaN(multiplier)) {
      console.log(`${colors.red}Error: <value> must be a numeric value.${colors.reset}`);
      process.exit(1);
    }
    const config = loadConfig();
    config.commentDensityMultiplier = multiplier;
    saveConfig(config);
    console.log(`${colors.green}Comment density multiplier updated to: ${multiplier}${colors.reset}`);
    process.exit(0);
  }
  
  // Update a metric threshold
  else if (args[1] === '-t') {
    if (args.length < 5) {
      console.log(`${colors.red}Usage: marvins configure -t <metric> <value1> <value2>${colors.reset}`);
      process.exit(1);
    }
    const metric = args[2];
    const value1 = parseFloat(args[3]);
    const value2 = parseFloat(args[4]);
    if (isNaN(value1) || isNaN(value2)) {
      console.log(`${colors.red}Error: <value1> and <value2> must be numeric values.${colors.reset}`);
      process.exit(1);
    }
  
    // Define mapping for metric keys
    const metricKeys = {
      cyclomatic: { first: 'medium', second: 'high' },
      maintainabilityIndex: { first: 'low', second: 'medium' },
      loc: { first: 'medium', second: 'high' }
    };
  
    if (!metricKeys[metric]) {
      console.log(`${colors.red}Unknown metric '${metric}'. Valid metrics: ${Object.keys(metricKeys).join(', ')}${colors.reset}`);
      process.exit(1);
    }
  
    const config = loadConfig();
    // Update only the specified metric while keeping other settings unchanged
    config[metric] = {};
    config[metric][metricKeys[metric].first] = value1;
    config[metric][metricKeys[metric].second] = value2;
    saveConfig(config);
    console.log(`${colors.green}Configuration updated for '${metric}': ${metricKeys[metric].first}: ${value1}, ${metricKeys[metric].second}: ${value2}${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}Usage:
  marvins configure -t <metric> <value1> <value2>
  marvins configure -d <value>${colors.reset}`);
    process.exit(1);
  }
}

// 'analyze' command: analyze the provided TypeScript file
else if (command === 'analyze') {
  if (args[1] !== '-f' || args.length < 3) {
    console.log(`${colors.red}Usage: marvins analyze -f {typescript filePath}${colors.reset}`);
    process.exit(1);
  }
  
  const config = loadConfig();
  const filePath = args[2];
  const absolutePath = path.resolve(process.cwd(), filePath);
  
  console.log(`${bold}${colors.blue}===========================================================${colors.reset}`);
  console.log(`${bold}${colors.magenta}              Marvins Code Quality Analyzer             ${colors.reset}`);
  console.log(`${bold}${colors.blue}===========================================================${colors.reset}\n`);
  
  try {
    // Pass the comment density multiplier from config to the analyzer
    const { results, commentDensity } = analyzeMethods(absolutePath, config.commentDensityMultiplier);
    const cdPercent = (commentDensity * 100).toFixed(1);
    if (results.length === 0) {
      console.log(`${colors.red}No functions or methods were found in the provided file.${colors.reset}`);
    } else {
      console.log(`${italicStart}${colors.yellow}Calculated Comment Density(%): ${cdPercent}${italicReset}${colors.reset}`);
      console.log();
      console.log(`${colors.cyan}Analysis Results:${colors.reset}`);
      console.log(`${colors.cyan}------------------------------------------${colors.reset}`);
      results.forEach(result => {
        const ccColor = colorForCyclomatic(result.cyclomatic, config);
        const miColor = colorForMI(result.maintainabilityIndex, config);
        const locColor = colorForLOC(result.loc, config);
        
        console.log(`Method: ${colors.cyan}${result.methodName}${colors.reset}`);
        console.log(`${bold}Calculated Halstead Volume:${colors.reset} ${result.halsteadVolume.toFixed(2)}`);
        console.log(`  - Cyclomatic Complexity: ${ccColor}${result.cyclomatic}${colors.reset}`);
        console.log(`  - Lines of Code (LOC): ${locColor}${result.loc}${colors.reset}`);
        console.log(`  - Maintainability Index: ${miColor}${result.maintainabilityIndex.toFixed(2)}${colors.reset}`);
        console.log(`${colors.cyan}------------------------------------------${colors.reset}`);
      });
      
      console.log();
      console.log(`${colors.yellow}Keep your code clean and maintainable!${colors.reset}`);
      console.log(`${colors.purple}Happy coding with Marvins!${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}Error during analysis: ${error.message}${colors.reset}`);
    process.exit(1);
  }
} else {
  console.log(`${colors.red}Unknown command. Valid commands: help, configure, analyze${colors.reset}`);
  process.exit(1);
}
