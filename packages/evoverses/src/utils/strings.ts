export const currencyOpts = {
  currency: "USD",
  style: "currency",
};

export const toTitleCase = (str: string) => {
  const value = str
    .split(/[-\s]/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  const overrides: Record<string, string> = {
    Pfps: "PFPs",
    Ai: "AI",
  };
  return overrides[value] || value;
};

export const toKebabCase = (str: string) => str.replace(/([a-z])([A-Z])/g, "$1-$2")
  .replace(/[\s_]+/g, "-")
  .toLowerCase();

export const normalize = (s: string) => s.toLowerCase().replace(" ", "-");

/**
 * Shortens a given address string based on specified options.
 *
 * @param {string} address - The full address string to be shortened.
 * @param {Object} [options={}] - Configuration options for the shortening process.
 * @param {number} [options.start=6] - The number of characters to include from the start of the address.
 * @param {number} [options.end=4] - The number of characters to include from the end of the address.
 * @param {string} [options.separator="..."] - The string used to separate the start and end portions in the default
 *   format.
 * @param {"default"|"start"|"start_hash"|"end"} [options.format="default"] - Determines how the address is shortened:
 *   - "default": Keeps the start and end portions, separated by the provided separator.
 *   - "start": Includes only the specified `start` characters from the address (excluding the initial "0x").
 *   - "start_hash": Includes only the specified `start` characters from the beginning of the address.
 *   - "end": Includes only the specified `end` characters from the end of the address.
 *
 * @returns {string} The shortened address based on the provided options.
 */
export const shortenAddress = (
  address: string,
  options: {
    start?: number;
    end?: number;
    separator?: string;
    format?: "default" | "start" | "start_hash" | "end";
  } = {},
): string => {
  const { start, end, separator, format } = { start: 6, end: 4, separator: "...", format: "default", ...options };
  switch (format) {
    case "start":
      return address.slice(2, 2 + start);
    case "start_hash":
      return address.slice(0, start);
    case "end":
      return address.slice(-end);
    default:
      return address.slice(0, start) + separator + address.slice(-end);
  }
};

export const prioritySort = (a: string, b: string, priority: string[]) => {
  const indexA = priority.indexOf(a);
  const indexB = priority.indexOf(b);

  // Handle cases where the value doesn't exist in the priority array:
  if (indexA === -1 && indexB === -1) {
    return 0;
  } // Both not in priority, keep original order
  if (indexA === -1) {
    return 1;
  } // `a` is not in priority, move it to the end
  if (indexB === -1) {
    return -1;
  } // `b` is not in priority, move it to the end

  // Compare based on index in a priority array
  return indexA - indexB;
};

export const onlyUniqueStringFilter = (value: string, index: number, array: string[]) => array.indexOf(value) === index;

export const EM_DASH = "\u2014";

export const decodeHtmlEntities = (str?: string): string => {
  if (!str) {
    return "";
  }
  const parser = new DOMParser();
  return parser.parseFromString(str, "text/html").body.textContent || "";
};

export const compareByNameProperty = (a: { name: string }, b: {
  name: string
}) => a.name.toLowerCase().localeCompare(b.name.toLowerCase());

export const pluralize = (val: number | bigint, word: string, plural = word + "s") => [ 1, -1 ].includes(Number(val))
  ? word
  : plural;
