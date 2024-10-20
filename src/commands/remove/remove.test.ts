import fs from "fs";
import path from "path";
import { removePackages } from "./remove";
import { packageJsonPath } from "../../util/paths";

jest.mock("fs");

interface MockPackageJson {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  [key: string]: any; // Allows for additional properties
}

describe("removePackages", () => {
  const mockPackageJson: MockPackageJson = {
    dependencies: {
      "is-fourteen": "^0.0.2",
      "another-package": "^1.0.0",
    },
    devDependencies: {
      "dev-package": "^0.1.0",
    },
  };

  beforeEach(() => {
    (fs.existsSync as jest.Mock).mockImplementation(
      (path) => path === packageJsonPath
    );
    (fs.readFileSync as jest.Mock).mockImplementation(() =>
      JSON.stringify(mockPackageJson)
    );
    (fs.writeFileSync as jest.Mock).mockImplementation((path, data) => {
      // Do not modify mockPackageJson here
      // Just check what data is being written
      // console.log(data); // Uncomment for debugging
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("removes a package from dependencies", async () => {
    await removePackages(["is-fourteen"]);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      packageJsonPath,
      JSON.stringify(
        {
          dependencies: {
            "another-package": "^1.0.0",
          },
          devDependencies: {
            "dev-package": "^0.1.0",
          },
        },
        null,
        2
      )
    );
  });

  it("removes a package from devDependencies", async () => {
    await removePackages(["dev-package"]);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      packageJsonPath,
      JSON.stringify(
        {
          dependencies: {
            "is-fourteen": "^0.0.2",
            "another-package": "^1.0.0",
          },
          devDependencies: {},
        },
        null,
        2
      )
    );
  });

  it("does not remove a non-existent package", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    await removePackages(["non-existent-package"]);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error: non-existent-package not found in dependencies or devDependencies."
    );

    // Verify that package.json is not updated
    expect(fs.writeFileSync).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("handles the case where package.json does not exist", async () => {
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false); // Simulate package.json not found
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await removePackages(["is-fourteen"]);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error: package.json not found."
    );
    expect(fs.writeFileSync).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
