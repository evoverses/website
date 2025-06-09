export const mapCurrencyRow = (row: any) => {
  return {
    address: row.currency_address,
    decimals: row.currency_decimals,
    symbol: row.currency_symbol,
  };
};
