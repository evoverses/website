export const bigIntJsonReplacer = (key: string, value: any): any => {
  if (typeof value === 'bigint') {
    return { '__bigintval__': value.toString() };
  }
  return value;
}

export const bigIntJsonReviver = (key: string, value: any): any => {
  if (value != null && typeof value === 'object' && '__bigintval__' in value) {
    return BigInt(value['__bigintval__']);
  }
  return value;
}

export const getSafeResponseError = async (response: Response) => {
  const base = `${response.status}::${response.statusText}`;
  try {
    return `${base}::${JSON.stringify(await response.json(), null, 2)}`;
  } catch {
    try {
      return `${base}::${await response.text()}`;
    } catch {
      return base;
    }
  }
};
