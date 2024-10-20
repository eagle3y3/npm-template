import fs from "fs";
import { packageJsonPath } from "../../util/paths";

export async function removePackages(packages: string[]) {
  // Ensure package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    console.error("Error: package.json not found.");
    return;
  }

  // Read and parse the existing package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  let updated = false;

  // Iterate over each package to remove it from dependencies or devDependencies
  packages.forEach((packageName) => {
    if (packageJson.dependencies && packageJson.dependencies[packageName]) {
      // Remove the package from dependencies
      delete packageJson.dependencies[packageName];
      console.log(`${packageName} has been removed from dependencies.`);
      updated = true;
    } else if (
      packageJson.devDependencies &&
      packageJson.devDependencies[packageName]
    ) {
      // Remove the package from devDependencies
      delete packageJson.devDependencies[packageName];
      console.log(`${packageName} has been removed from devDependencies.`);
      updated = true;
    } else {
      console.error(
        `Error: ${packageName} not found in dependencies or devDependencies.`
      );
    }
  });

  // Write the updated package.json back to disk if any packages were removed
  if (updated) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log("package.json has been updated.");
  } else {
    console.log("No packages were removed.");
  }
}
