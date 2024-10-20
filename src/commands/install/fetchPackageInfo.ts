/**
 * Fetch package information from the npm registry using the fetch API.
 *
 * @param packageName The name of the package to fetch.
 * @param version The version of the package. Defaults to 'latest' if not provided.
 * @returns The full package information including version, dependencies, and tarball URL.
 */

export async function fetchPackageInfo(
  packageName: string,
  version: string = "latest"
): Promise<any> {
  const url = `https://registry.npmjs.org/${packageName}/${version}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching package info: ${response.statusText}`);
    }

    const packageInfo = await response.json();
    return packageInfo;
  } catch (error) {
    throw new Error(
      `Failed to fetch package info for ${packageName}@${version}: ${error}`
    );
  }
}
