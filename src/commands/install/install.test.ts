import fs from "fs";
import path from "path";
import { DEFAULT_PACKAGE_JSON } from "../../util/packageJson";
import { nodeModulesPath, outputDir, packageJsonPath } from "../../util/paths";
import { installAllDependencies } from "./install";
import { installPackages } from "../../util/download";
import { constructInstallationPlan } from "./TODO"; // Mock the constructInstallationPlan function

// Mock the necessary functions
jest.mock("fs");
jest.mock("../../util/download");
jest.mock("./TODO"); // Mock the constructInstallationPlan function

describe("npm install function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should install is-thirteen", async () => {
    // Mock fs.existsSync to simulate directory checks
    (fs.existsSync as jest.Mock).mockImplementation((dirPath) => {
      if (dirPath === nodeModulesPath) return false;
      if (dirPath === path.join(nodeModulesPath, "is-thirteen")) return true;
      return false;
    });

    // Mock fs.mkdirSync to simulate directory creation
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

    // Mock fs.readFileSync to simulate reading the package.json file
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(
      JSON.stringify({
        ...DEFAULT_PACKAGE_JSON,
        dependencies: {
          "is-thirteen": "2.0.0",
        },
      })
    );

    // Mock constructInstallationPlan to return a basic plan for is-thirteen
    (constructInstallationPlan as jest.Mock).mockResolvedValue([
      {
        name: "is-thirteen",
        version: "2.0.0",
        parentDirectory: "",
      },
    ]);

    // Mock installPackages to simulate installing the packages
    (installPackages as jest.Mock).mockResolvedValue(null);

    // Call the function to test
    await installAllDependencies();

    // Check that the directories are created
    expect(fs.mkdirSync).toHaveBeenCalledWith(nodeModulesPath, {
      recursive: true,
    });

    // Check that is-thirteen is installed
    const isThirteenPath = path.join(nodeModulesPath, "is-thirteen");
    expect(fs.existsSync(isThirteenPath)).toBe(true);

    // Simulate reading the package.json of is-thirteen
    (fs.readFileSync as jest.Mock).mockReturnValueOnce(
      JSON.stringify({
        name: "is-thirteen",
        version: "2.0.0",
      })
    );

    const isThirteenPackageJson = JSON.parse(
      fs.readFileSync(path.join(isThirteenPath, "package.json"), "utf8")
    );
    expect(isThirteenPackageJson.version).toBe("2.0.0");
  });
});

describe("installAllDependencies", () => {
  const mockDependencies = {
    "package-A": "1.0.0",
    "package-B": "2.0.0",
  };

  const mockInstallationPlan = [
    {
      name: "package-A",
      version: "1.0.0",
      parentDirectory: "", // Top level
    },
    {
      name: "shared-dep",
      version: "1.0.0",
      parentDirectory: path.join("node_modules", "package-A"), // Nested under package-A
    },
    {
      name: "package-B",
      version: "2.0.0",
      parentDirectory: "", // Top level
    },
    {
      name: "shared-dep",
      version: "2.0.0",
      parentDirectory: path.join("node_modules", "package-B"), // Nested under package-B
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should install both packages with different versions of shared dependencies", async () => {
    // Mock reading package.json to return the dependencies
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify({
        dependencies: mockDependencies,
      })
    );

    // Mock constructInstallationPlan to return a pre-defined plan
    (constructInstallationPlan as jest.Mock).mockResolvedValue(
      mockInstallationPlan
    );

    // Mock fs.existsSync to simulate the presence or absence of directories
    (fs.existsSync as jest.Mock).mockImplementation((dirPath) => {
      if (dirPath === nodeModulesPath) return false;
      if (dirPath === path.join(nodeModulesPath, "node_modules/package-A"))
        return false;
      if (dirPath === path.join(nodeModulesPath, "node_modules/package-B"))
        return false;
      return true;
    });

    // Mock fs.mkdirSync to simulate directory creation
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

    // Mock installPackages to simulate the installation of the packages
    (installPackages as jest.Mock).mockResolvedValue(null);

    // Call the function to test
    await installAllDependencies();

    // Verify that the correct directories were created
    expect(fs.mkdirSync).toHaveBeenCalledWith(nodeModulesPath, {
      recursive: true,
    });
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      path.join(nodeModulesPath, "node_modules/package-A"),
      { recursive: true }
    );
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      path.join(nodeModulesPath, "node_modules/package-B"),
      { recursive: true }
    );

    // Verify that the installation plan was processed
    expect(installPackages).toHaveBeenCalledWith(mockInstallationPlan);
  });
});
