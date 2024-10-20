import fs from "fs";
import https from "https";
import path from "path";
import { DependencyInstallation } from "../types";
import { nodeModulesPath } from "./paths";
import { getPackageInfo } from "./registry";
const tar = require("tar");

export async function installPackages(
  dependencies: DependencyInstallation[]
): Promise<void> {
  for (const dep of dependencies) {
    await installSinglePackage(dep);
  }
}

async function downloadToNodeModules(
  dep: DependencyInstallation,
  shasum: string
): Promise<void> {
  // Construct the download URL
  const url = `https://registry.npmjs.org/${dep.name}/-/${dep.name}-${dep.version}.tgz`;
  const tarballPath = path.join(
    nodeModulesPath,
    `${dep.name.replace("@", "%40").replace("/", "%2F")}-${dep.version}.tgz`
  );

  // Download the tarball
  await new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(tarballPath);
    https
      .get(url, (response) => {
        response.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          resolve(null);
        });
      })
      .on("error", (error) => {
        fileStream.close();
        fs.unlink(tarballPath, () => {}); // Delete the file if an error occurs
        reject(error);
      });
  });

  // Extract the tarball
  try {
    console.log(`Extracting tarball to ${nodeModulesPath}`);
    await tar.extract({
      file: tarballPath,
      cwd: nodeModulesPath,
    });
    console.log(`Extraction complete`);
  } catch (e) {
    console.error(`Error extracting package ${dep.name}@${dep.version}:`, e);
    return;
  } finally {
    // Delete the tarball
    fs.unlinkSync(tarballPath);
  }

  // Move to target directory
  const destParentPath = dep.parentDirectory
    ? path.join(nodeModulesPath, dep.parentDirectory) // Use the parent directory if provided
    : nodeModulesPath;

  // Ensure the destination path exists
  if (!fs.existsSync(destParentPath)) {
    fs.mkdirSync(destParentPath, { recursive: true });
  }

  const destPath = path.join(destParentPath, dep.name);

  // Check if the package directory exists
  const oldPath = path.join(nodeModulesPath, "package");
  if (!fs.existsSync(oldPath)) {
    console.error(`Source directory does not exist: ${oldPath}`);
    return;
  }

  // Use retry logic to handle potential file locks
  await retryRenameSync(oldPath, destPath);
}

async function retryRenameSync(
  oldPath: string,
  newPath: string,
  retries: number = 5
) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Check if the destination path already exists
      if (fs.existsSync(newPath)) {
        console.warn(
          `Destination path ${newPath} already exists, skipping rename.`
        );
        return;
      }

      // Attempt to rename
      fs.renameSync(oldPath, newPath);
      console.log(`Successfully renamed ${oldPath} to ${newPath}`);
      return;
    } catch (err) {
      // Cast the error to NodeJS.ErrnoException
      const error = err as NodeJS.ErrnoException;

      // Retry for 'EPERM' and 'EBUSY' errors
      if (
        (error.code === "EPERM" || error.code === "EBUSY") &&
        attempt < retries - 1
      ) {
        console.warn(
          `Rename failed (attempt ${attempt + 1}/${retries}), retrying in 1 second...`
        );
        await new Promise((res) => setTimeout(res, 1000)); // Wait 1 second before retrying
      } else {
        console.error(`Failed to rename ${oldPath} to ${newPath}`, error);
        throw error; // Give up after retries
      }
    }
  }
}

export async function installSinglePackage(dep: DependencyInstallation) {
  console.log(`Installing ${dep.name}@${dep.version}...`);

  try {
    const data = await getPackageInfo(dep);
    await downloadToNodeModules(
      {
        ...dep,
        version: data.version,
      },
      data.dist.shasum
    );
  } catch (e) {
    console.error(`Error installing package ${dep.name}@${dep.version}:`, e);
    return;
  }
}
