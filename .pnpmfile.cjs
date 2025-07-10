/**
 * Hook to modify package dependencies during resolution.
 * @type {import("@pnpm/types").ReadPackageHook}
 */
const readPackage = (pkg) => {
  switch (pkg.name) {
    case "use-sync-external-store": {
      pkg.peerDependencies["react"] = "*";
      break;
    }
    case "react-day-picker": {
      pkg.peerDependencies["react"] = "*";
      pkg.peerDependencies["date-fns"] = "*";
      break;
    }
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
