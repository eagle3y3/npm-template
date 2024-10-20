# Take-Home Project

## Overview

The core features are focused on managing dependencies using the `install` and `remove` commands. I initially was focused on doing the install but then I realized that the remove command was also needed after accidentally making a typo installing a dependency using `test:add` there's some strange caching that happens, and without `remove` you will always get installation errors. I then finished up the nested dependencies feature for installing.

## Installation

To install the necessary dependencies for the project, run:

```bash
npm install
```

## Scripts

Here are the main scripts defined in the `package.json`:

### Build the Project

```bash
npm run build
```

This compiles the TypeScript files into JavaScript and outputs them in the `dist/` directory.

### Test Install Command

```bash
npm run test:install
```

This command builds the project and then runs the `install` functionality. It is designed to simulate installing dependencies within the package manager, ensuring that all required dependencies are correctly handled.

### Test Remove Command

```bash
npm run test:remove
```

This command builds the project and then runs the `remove` functionality. It simulates the removal of dependencies from the project, checking if unnecessary dependencies can be safely removed.

## Running Tests

To run the test suite, use:

```bash
npm run test
```

This will execute the tests using Jest in a single process (using `--runInBand`), ensuring that all functionalities, including the `install` and `remove` features, are thoroughly tested.
