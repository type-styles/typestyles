import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const packagesDirectory = path.join(workspaceRoot, "packages");

const gitSha = process.env.GITHUB_SHA ?? process.argv[2];
if (!gitSha) {
  throw new Error(
    "Missing commit SHA. Provide GITHUB_SHA or pass a SHA as the first argument.",
  );
}

const shortSha = gitSha.slice(0, 12).toLowerCase();
const unstableVersion = `0.0.0-unstable.${shortSha}`;

const packageDirEntries = await fs.readdir(packagesDirectory, {
  withFileTypes: true,
});

const packageJsonPaths = packageDirEntries
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(packagesDirectory, entry.name, "package.json"));

const packageInfos = [];

for (const packageJsonPath of packageJsonPaths) {
  const raw = await fs.readFile(packageJsonPath, "utf8");
  const pkg = JSON.parse(raw);

  if (!pkg.private) {
    packageInfos.push({
      path: packageJsonPath,
      packageJson: pkg,
    });
  }
}

const workspacePackageNames = new Set(
  packageInfos.map((info) => info.packageJson.name),
);

for (const info of packageInfos) {
  info.packageJson.version = unstableVersion;
}

const dependencyFields = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

function convertWorkspaceRange(workspaceRange, resolvedVersion) {
  if (workspaceRange === "workspace:*") {
    return resolvedVersion;
  }

  if (workspaceRange === "workspace:^") {
    return `^${resolvedVersion}`;
  }

  if (workspaceRange === "workspace:~") {
    return `~${resolvedVersion}`;
  }

  if (workspaceRange.startsWith("workspace:")) {
    const remainder = workspaceRange.slice("workspace:".length);
    if (remainder.startsWith("^")) {
      return `^${resolvedVersion}`;
    }
    if (remainder.startsWith("~")) {
      return `~${resolvedVersion}`;
    }
    return resolvedVersion;
  }

  return workspaceRange;
}

for (const info of packageInfos) {
  for (const field of dependencyFields) {
    const dependencyMap = info.packageJson[field];
    if (!dependencyMap) {
      continue;
    }

    for (const [dependencyName, dependencyRange] of Object.entries(
      dependencyMap,
    )) {
      if (
        typeof dependencyRange === "string" &&
        dependencyRange.startsWith("workspace:") &&
        workspacePackageNames.has(dependencyName)
      ) {
        dependencyMap[dependencyName] = convertWorkspaceRange(
          dependencyRange,
          unstableVersion,
        );
      }
    }
  }
}

await Promise.all(
  packageInfos.map(({ path: packageJsonPath, packageJson }) =>
    fs.writeFile(
      packageJsonPath,
      `${JSON.stringify(packageJson, null, 2)}\n`,
      "utf8",
    ),
  ),
);

console.log(
  `Set ${packageInfos.length} packages to unstable version ${unstableVersion}.`,
);
