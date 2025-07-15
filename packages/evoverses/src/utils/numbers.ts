import { EM_DASH, pluralize } from "@workspace/evoverses/utils/strings";

export const sanitizeDate = (date: Date) => new Date(Number(date.getTime().toString().slice(0, 10)) * 1000);

export const formatNumberWithSuffix = (
  value: number | bigint | string | undefined,
  options: {
    defaultValue?: string
    prefix?: string
    suffix?: string
    postfix?: string
    minDecimals?: number
    maxDecimals?: number
    genericLessThan?: number
  } = {},
) => {
  const opts = { defaultValue: EM_DASH, ...options };
  const postfix = opts.postfix ? ` ${opts.postfix}` : "";
  if (!value) {
    return opts.defaultValue + postfix || "";
  }
  value = Number(value);

  const prefix = opts.prefix || "";

  if (opts.genericLessThan && value < opts.genericLessThan && value !== 0) {
    return prefix + `< ${opts.genericLessThan}` + postfix;
  }
  const scales = [
    { suffix: "", divisor: 1 },
    { suffix: "K", divisor: 1_000 },
    { suffix: "M", divisor: 1_000_000 },
    { suffix: "B", divisor: 1_000_000_000 },
    { suffix: "T", divisor: 1_000_000_000_000 },
  ];

  const absValue = value < 0 ? -value : value;

  const scale = scales.reverse().find((s) => absValue >= s.divisor) || scales[scales.length - 1]!;
  const scaledValue = absValue / scale.divisor;
  const maxDecimals = opts.maxDecimals || 1;
  const formattedValue = scaledValue >= 10 ? Math.floor(scaledValue) : opts.minDecimals === undefined
    ? Number(scaledValue.toFixed(maxDecimals))
    : Number(scaledValue.toFixed(maxDecimals)).toFixed(opts.minDecimals);

  const preNum = value < 0 ? "-" : "";
  const suffix = opts.suffix || scale.suffix;
  return prefix + preNum + formattedValue + suffix + postfix;
};

export const formatUsd = (value: number | string, opts?: Intl.NumberFormatOptions) => Number(value)
  .toLocaleString("en-US", {
    currency: "USD",
    style: "currency",
    ...opts,
  });

const rgbToHsl = (r: number, g: number, b: number): [ number, number, number ] => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (
    max + min
  ) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min); // Saturation
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [ h * 360, s * 100, l * 100 ]; // Return H, S (%), L (%)
};
export const filterVibrantColors = ([ r, g, b ]: [ number, number, number ]): boolean => {
  const [ , s, l ] = rgbToHsl(r, g, b);
  const minSaturation = 50;
  const maxLightness = 75;

  return s > minSaturation && l < maxLightness;
};

export const atLeastTwoUnderThreshold = (r: number, g: number, b: number, threshold: number) => (
  (r < threshold && g < threshold) || // R and G are below the threshold
  (g < threshold && b < threshold) || // G and B are below the threshold
  (r < threshold && b < threshold)    // R and B are below the threshold
);
export const atLeastTwoOverThreshold = (r: number, g: number, b: number, threshold: number) => (
  (r > threshold && g > threshold) || // R and G are above the threshold
  (g > threshold && b > threshold) || // G and B are above the threshold
  (r > threshold && b > threshold)    // R and B are above the threshold
);

export const formatTime = (time: number): string => `${String(Math.floor(time / 3600))
  .padStart(2, "0")}:${String(Math.floor((
  time % 3600
) / 60)).padStart(2, "0")}:${String(Math.floor(time % 60)).padStart(2, "0")}`;

export const calculateRemainingTime = (timestamp: number) => Math.max(0, timestamp - Math.floor(Date.now() / 1000));

export const makeArray = (length: number, startAt: number = 0): number[] => Array.from(
  { length: Math.floor(Math.max(length, 0)) },
  (_, i) => i + startAt,
);

export const toPercent = (
  value: number | string | bigint | undefined | null,
  total: number | string | bigint | undefined | null,
  zeroDefault?: boolean,
) => {
  if (!value || !total) {
    return zeroDefault ? 0 : EM_DASH;
  }
  const v = Number(value);
  const t = Number(total);
  if (isNaN(v) || isNaN(t) || t === 0) {
    return 0;
  }
  return Number((
    Number(value) / Number(total) * 100
  ).toFixed(1));
};

/**
 * Generates an array of numbers from `from` to `to` (inclusive).
 * If `from` is greater than `to`, it generates the array in reverse order.
 *
 * @param from - The starting number.
 * @param to - The ending number.
 * @returns An array of numbers from `from` to `to`.
 */
export const range = <T extends number | bigint = number>(from: T, to: T): T[] => {
  const step = from <= to ? 1 : -1;
  return Array.from({ length: Math.abs(Number(to) - Number(from)) + 1 }, (_, i) => Number(from) + i * step)
    .map(v => typeof from === "bigint"
      ? BigInt(v)
      : Number(v)) as T[];
};

const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180.0);
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
};

export const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  const fudge = 0.75; // degrees
  const start = polarToCartesian(cx, cy, r, startAngle - fudge);
  const end = polarToCartesian(cx, cy, r, endAngle + fudge);
  const largeArcFlag = endAngle - startAngle >= 180 ? "1" : "0";

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    `Z`,
  ].join(" ");
};

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type DateIsh = Date | number | string
export const toDate = (date: DateIsh) => sanitizeDate(
  date instanceof Date
    ? date
    : new Date(
      typeof date === "string" && !/^[0-9]+$/.test(date)
        ? Date.parse(date)
        : Number(date),
    ),
);

export const toTimestampSeconds = (date: DateIsh) => {
  const d = toDate(date);
  return d.getFullYear() < 2020 ? 0 : Math.floor(d.getTime() / 1000);
};

export const timeSince = (date: DateIsh, now?: Date) => toDate(now ?? Date.now()).getTime() - toDate(date).getTime();

export const secondsSince = (date: DateIsh) => Math.floor(timeSince(date) / 1000);
export const minutesSince = (date: DateIsh) => secondsSince(date) / 60;
export const hoursSince = (date: DateIsh) => minutesSince(date) / 60;

export const daysSince = (date: DateIsh) => hoursSince(date) / 24;

export const ageFormatter = (days: number) => {
  const age = daysSince(days);
  if (age < 1) {
    return "< 1 Day";
  }
  if (age < 7) {
    return `${Math.floor(age)} ${pluralize(Math.floor(age), "Day")}`;
  }
  if (age < 28) {
    return `${Math.floor(age / 7)} ${pluralize(Math.floor(age / 7), "Week")}`;
  }
  if (age < 365) {
    return `${Math.floor(age / 30) || 1} ${pluralize(Math.floor(age / 30) || 1, "Day")}`;
  }
  return `${Math.floor(age / 365)} ${pluralize(Math.floor(age / 365), "Year")}`;
};
