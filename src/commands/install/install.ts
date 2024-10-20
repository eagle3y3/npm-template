import fs from "fs";
import path from "path";
import { installPackages } from "../../util/download";
import { DEFAULT_PACKAGE_JSON } from "../../util/packageJson";
import { nodeModulesPath, packageJsonPath } from "../../util/paths";
import { constructInstallationPlan } from "./TODO"; // Assuming the `constructInstallationPlan` function is already updated

/**
 * This is the function that is called when the `install` CLI command is run
 */
export async function installAllDependencies() {
  console.log("Installing dependencies...");

  // Delete the node_modules folder if it exists - it is assumed that we always install from scratch
  if (fs.existsSync(nodeModulesPath)) {
    fs.rmSync(nodeModulesPath, { recursive: true });
  }
  fs.mkdirSync(nodeModulesPath);

  // Make sure package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(DEFAULT_PACKAGE_JSON, undefined, 2)
    );
  }

  // Get top-level dependencies from package.json
  const topLevelDependencies: Record<string, string> = JSON.parse(
    fs.readFileSync(packageJsonPath, "utf8")
  ).dependencies;

  // Construct an installation plan that includes nested dependencies
  const installationPlan =
    await constructInstallationPlan(topLevelDependencies);

  // Ensure that directories exist before proceeding with installation
  installationPlan.forEach((dep) => {
    const depDirectory = path.join(nodeModulesPath, dep.parentDirectory || "");
    ensureParentDirectories(depDirectory);
  });

  // Process the installation plan, installing each package in the correct directory
  await installPackages(installationPlan);
}

/**
 * Function to ensure that the parent directory exists before installing a package.
 * This will create the necessary directories for nested installations.
 */
function ensureParentDirectories(parentDirectory: string) {
  if (!fs.existsSync(parentDirectory)) {
    fs.mkdirSync(parentDirectory, { recursive: true });
  }
}
