# Marvins Code Quality Analyzer

## Introduction

**Marvins Code Quality Analyzer** is a command-line tool designed to analyze TypeScript source files and provide valuable insights into your code's quality. By calculating several key metrics, Marvins helps developers identify potential issues, understand code complexity, and ensure maintainability.

The tool leverages the TypeScript compiler API to generate an **Abstract Syntax Tree (AST)**, which is then traversed to compute various code quality metrics. These metrics include:

- **Cyclomatic Complexity (CC)**
- **Halstead Volume (V)**
- **Lines of Code (LOC)**
- **Maintainability Index (MI)**
- **Comment Density (CD)**

## Code Quality Metrics

### Cyclomatic Complexity (CC)

- **Definition:**  
  Cyclomatic Complexity measures the number of linearly independent paths through a program's source code. It provides a quantitative measure of the program's decision structure.

- **Calculation:**  
  Marvins traverses the AST and increases the complexity count for each decision point (e.g., `if`, `for`, `while`, `switch` cases, and logical operators such as `&&` or `||`).

### Halstead Volume (V)

- **Definition:**  
  Halstead Volume is derived from the number of operators and operands in the code. It represents the size of the implementation of an algorithm.

- **Calculation:**  
  The volume is calculated using the formula:  
  $`
  \text{Volume} = (\text{Total Operators} + \text{Total Operands}) \times \log_2(\text{Vocabulary})
  `$
  where **Vocabulary** is the sum of unique operators and operands.

### Lines of Code (LOC)

- **Definition:**  
  LOC counts the total number of lines in a source file. While simple, it can be a useful indicator of code size and complexity.

### Maintainability Index (MI)

- **Definition:**  
  The Maintainability Index is a compound metric that provides an indication of how maintainable (or difficult to maintain) the code is.

- **Calculation:**  
  Marvins uses the following formula:  
  $`
  \text{MI} = \left(171 - 5.2 \times \ln(V) - 0.23 \times \text{CC} - 16.2 \times \ln(\text{LOC})\right) \times \frac{100}{171} + \text{Bonus}
  `$
  
  - **Bonus:**  
    The bonus is computed as:  
    $`
    \text{Bonus} = \text{commentDensityMultiplier} \times \sin\left(\sqrt{2.4 \times \text{Comment Density}}\right)
    `$
  
  - **Comment Density Multiplier:**  
    This value is configurable and adjusts the contribution of the comment density to the final MI.

### Comment Density (CD)

- **Definition:**  
  Comment Density is the ratio of comment lines to total lines of code, giving insight into how well the code is documented.

- **Calculation:**  
  It is computed as:  
  $`
  \text{Comment Density} = \frac{\text{Number of Comment Lines}}{\text{Total Number of Lines}}
  `$

## Abstract Syntax Tree (AST)

An **Abstract Syntax Tree (AST)** is a tree representation of the abstract syntactic structure of source code. Each node in the tree denotes a construct in the source code. In Marvins, the TypeScript compiler API is used to generate an AST from a source file. This AST is then traversed to:

- Identify decision points (e.g., conditional statements, loops) for calculating Cyclomatic Complexity.
- Analyze tokens to count operators and operands for Halstead Volume.
- Extract methods and functions to compute individual metrics.

Using the AST allows Marvins to perform a detailed and accurate analysis of code structure and quality.

## Command-Line Interface (CLI)

Marvins is operated entirely via the command line. The CLI supports several commands to configure thresholds, update multipliers, and perform analysis on TypeScript files.

### Configuration File

Marvins uses a `config.json` file located in the current working directory to store default thresholds and multipliers. If this file does not exist, it is automatically created with the following default values:

```json
{
  "cyclomatic": { "medium": 6, "high": 10 },
  "maintainabilityIndex": { "low": 40, "medium": 60 },
  "loc": { "medium": 30, "high": 50 },
  "commentDensityMultiplier": 5
}
```

### Installiation
You can install globally Marvins by using npm commands: 

```
npm i -g marvins
``` 

or

download and go to main folder and run:

```
npm i -g .
```

that's it!

### CLI Commands and Usage

#### 1. Help Command

```bash
marvins help
```

- **Description:**  
  Displays the help message with detailed information about available commands and usage examples.

#### 2. Configure Command

Marvins provides two configuration options:

##### a. Update Metric Thresholds

```bash
marvins configure -t <metric> <value1> <value2>
```

- **Parameters:**
  - `<metric>`: The metric to update. Valid options are:
    - `cyclomatic`
    - `maintainabilityIndex`
    - `loc`
  - `<value1>`: The first threshold value (e.g., "medium" for cyclomatic or LOC, "low" for maintainabilityIndex).
  - `<value2>`: The second threshold value (e.g., "high" for cyclomatic or LOC, "medium" for maintainabilityIndex).

- **Example:**

  ```bash
  marvins configure -t cyclomatic 6 10
  ```

  This updates the cyclomatic complexity thresholds to a medium value of 6 and a high value of 10.

##### b. Update Comment Density Multiplier

```bash
marvins configure -d <value>
```

- **Parameters:**
  - `<value>`: A numeric value that updates the comment density multiplier used in the MI calculation.

- **Example:**

  ```bash
  marvins configure -d 7
  ```

  This updates the comment density multiplier to 7.

#### 3. Analyze Command

```bash
marvins analyze -f {typescript filePath}
```

- **Parameters:**
  - `{typescript filePath}`: Path to the TypeScript file you wish to analyze.

- **Description:**  
  Analyzes the specified TypeScript file and displays the computed metrics, including:
  - Calculated Comment Density.
  - Cyclomatic Complexity.
  - Halstead Volume.
  - Lines of Code.
  - Maintainability Index.

- **Example:**

  ```bash
  marvins analyze -f src/app.ts
  ```

  This command analyzes the `src/app.ts` file and outputs the analysis results.

## Conclusion

Marvins Code Quality Analyzer is a powerful tool that leverages static analysis and AST traversal to provide insights into code quality. By monitoring metrics such as Cyclomatic Complexity, Halstead Volume, Lines of Code, Maintainability Index, and Comment Density, developers can better understand and improve their codebase.

For further information or assistance, simply run:

```bash
marvins help
```

Enjoy using Marvins to keep your code clean, maintainable, and of high quality!

*Note: As a Quentin Tarantino fan, the name is inspired by the movie [*Pulp Fiction*](https://en.wikipedia.org/wiki/Pulp_Fiction).* 
