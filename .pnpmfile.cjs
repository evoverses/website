/**
 * Hook to modify package dependencies during resolution.
 * @type {import("@pnpm/types").ReadPackageHook}
 */
const readPackage = (pkg) => {
  if (pkg.name === "use-sync-external-store") {
    pkg.peerDependencies["react"] = "*";
  }
  return pkg;
};

/**
 * Export hooks for pnpm file configuration.
 * @type {import("pnpm").PnpOoptions}
 */
module.exports = {
  hooks: {
    readPackage,
  },
};
