/**
 * Marvins Code Quality Analyzer CLI 
 * Copyright (c) 2025
 *
 * Author: Fatih Aydin
 * License: MIT
 *
 * This tool analyzes TypeScript source files and calculates key code quality metrics.
 */


const ts = require('typescript');
const fs = require('fs');

/**
 * Determines if the given AST node is a decision point.
 */
function isDecisionPoint(node) {
  switch (node.kind) {
    case ts.SyntaxKind.IfStatement:
    case ts.SyntaxKind.ForStatement:
    case ts.SyntaxKind.ForOfStatement:
    case ts.SyntaxKind.ForInStatement:
    case ts.SyntaxKind.WhileStatement:
    case ts.SyntaxKind.DoStatement:
    case ts.SyntaxKind.CaseClause:            // Each case in a switch statement
    case ts.SyntaxKind.CatchClause:
    case ts.SyntaxKind.ConditionalExpression: // Ternary operator ?:
      return true;
  }
  if (ts.isBinaryExpression(node)) {
    if (
      node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
      node.operatorToken.kind === ts.SyntaxKind.BarBarToken
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Recursively calculates the Cyclomatic Complexity for a given AST node.
 */
function calculateCyclomaticComplexity(node) {
  let complexity = 1;
  function visit(n) {
    if (isDecisionPoint(n)) {
      complexity++;
    }
    ts.forEachChild(n, visit);
  }
  visit(node);
  return complexity;
}

/**
 * Calculates a simple Halstead Volume from the source code.
 * Volume = (Total operators + Total operands) * log2(Vocabulary)
 */
function calculateHalsteadVolume(sourceCode) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, sourceCode);
  let token = scanner.scan();

  let totalOperators = 0;
  let totalOperands = 0;
  const uniqueOperators = new Set();
  const uniqueOperands = new Set();

  while (token !== ts.SyntaxKind.EndOfFileToken) {
    const tokenText = scanner.getTokenText();
    switch (token) {
      // Count operators (extend as needed)
      case ts.SyntaxKind.PlusToken:
      case ts.SyntaxKind.MinusToken:
      case ts.SyntaxKind.AsteriskToken:
      case ts.SyntaxKind.SlashToken:
      case ts.SyntaxKind.PercentToken:
      case ts.SyntaxKind.EqualsEqualsToken:
      case ts.SyntaxKind.EqualsEqualsEqualsToken:
      case ts.SyntaxKind.ExclamationEqualsToken:
      case ts.SyntaxKind.ExclamationEqualsEqualsToken:
      case ts.SyntaxKind.LessThanToken:
      case ts.SyntaxKind.GreaterThanToken:
      case ts.SyntaxKind.LessThanEqualsToken:
      case ts.SyntaxKind.GreaterThanEqualsToken:
      case ts.SyntaxKind.AmpersandAmpersandToken:
      case ts.SyntaxKind.BarBarToken:
      case ts.SyntaxKind.QuestionToken:
      case ts.SyntaxKind.ColonToken:
      case ts.SyntaxKind.PlusPlusToken:
      case ts.SyntaxKind.MinusMinusToken:
      case ts.SyntaxKind.EqualsToken:
      case ts.SyntaxKind.PlusEqualsToken:
      case ts.SyntaxKind.MinusEqualsToken:
      case ts.SyntaxKind.AsteriskEqualsToken:
      case ts.SyntaxKind.SlashEqualsToken:
      case ts.SyntaxKind.PercentEqualsToken:
        totalOperators++;
        uniqueOperators.add(tokenText);
        break;
      
      // Count operands (identifiers, literals, booleans)
      case ts.SyntaxKind.Identifier:
      case ts.SyntaxKind.NumericLiteral:
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
        totalOperands++;
        uniqueOperands.add(tokenText);
        break;
      
      default:
        break;
    }
    token = scanner.scan();
  }
  const vocabulary = uniqueOperators.size + uniqueOperands.size;
  const length = totalOperators + totalOperands;
  const volume = vocabulary > 0 ? length * Math.log2(vocabulary) : 0;
  return volume;
}

/**
 * Calculates the Lines Of Code (LOC) in the given source code.
 */
function calculateLOC(sourceCode) {
  return sourceCode.split('\n').length;
}

/**
 * Calculates the Comment Density (CD) of the source code.
 * CD = (Number of comment lines) / (Total number of lines)
 */
function calculateCommentDensity(sourceCode) {
  const lines = sourceCode.split('\n');
  let commentLines = 0;
  let inBlockComment = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (inBlockComment) {
      commentLines++;
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
    } else if (trimmed.startsWith('//')) {
      commentLines++;
    } else if (trimmed.startsWith('/*')) {
      commentLines++;
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
    }
  }
  return lines.length > 0 ? commentLines / lines.length : 0;
}

/**
 * Calculates the Maintainability Index (MI) using the standard formula plus comment density bonus.
 *
 * MI = (171 - 5.2 * ln(V) - 0.23 * CC - 16.2 * ln(LOC)) * (100 / 171) + Bonus
 * Comment Bonus = commentDensityMultiplier[from config] * sin( sqrt(2.4 * commentDensity) )
 *
 * V: Halstead Volume, CC: Cyclomatic Complexity, LOC: Lines Of Code, commentDensity: Comment Density
 */
function calculateMaintainabilityIndex(cyclomatic, halsteadVolume, loc, commentDensity, commentDensityMultiplier) {
  const safeVolume = halsteadVolume > 0 ? halsteadVolume : 1;
  const safeLOC = loc > 0 ? loc : 1;
  const baseMI = (171 - 5.2 * Math.log(safeVolume) - 0.23 * cyclomatic - 16.2 * Math.log(safeLOC)) * 100 / 171;
  const bonus = commentDensityMultiplier * Math.sin(Math.sqrt(2.4 * commentDensity));
  const mi = baseMI + bonus;
  return Math.max(0, mi);
}

/**
 * Reads a file and returns its contents.
 */
function readSourceFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Analyzes all functions and class methods in a given TypeScript file.
 * Additionally, calculates the overall Comment Density (CD) of the file.
 * For each method, the MI is calculated by incorporating the file's comment density multiplier.
 *
 * @param {string} filePath - The path to the TypeScript file.
 * @param {number} [commentDensityMultiplier=5] - The bonus multiplier value to adjust the MI calculation.
 * @returns {object} - An object containing analysis results and comment density.
 */
function analyzeMethods(filePath, commentDensityMultiplier = 5) {
  const sourceCode = readSourceFile(filePath);
  const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);
  const results = [];

  // Calculate global comment density for the file
  const commentDensity = calculateCommentDensity(sourceCode);

  function traverse(node) {
    if (
      node.kind === ts.SyntaxKind.FunctionDeclaration ||
      node.kind === ts.SyntaxKind.MethodDeclaration
    ) {
      const methodText = node.getText(sourceFile);
      const methodName = node.name ? node.name.getText(sourceFile) : '<anonymous>';
      if (node.body) {
        const cyclomatic = calculateCyclomaticComplexity(node.body);
        const halsteadVolume = calculateHalsteadVolume(methodText);
        const loc = calculateLOC(methodText);
        const maintainabilityIndex = calculateMaintainabilityIndex(cyclomatic, halsteadVolume, loc, commentDensity, commentDensityMultiplier);
        results.push({
          methodName,
          cyclomatic,
          halsteadVolume,
          loc,
          maintainabilityIndex
        });
      }
    }
    ts.forEachChild(node, traverse);
  }

  traverse(sourceFile);
  return { results, commentDensity };
}

module.exports = {
  analyzeMethods
};
