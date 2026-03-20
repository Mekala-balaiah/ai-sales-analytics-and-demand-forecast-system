const EXCHANGE_RATE = 83.5;

export const formatCurrency = (val, overrideFormat) => {
  let finalVal = val;
  const symbol = '₹';
  const locale = 'en-IN';
  
  const currencyFormat = overrideFormat || localStorage.getItem('currencyFormat') || 'INR';
  
  // If the data uploaded was in USD, multiply it to show INR
  if (currencyFormat === 'USD_TO_INR') {
    finalVal = val * EXCHANGE_RATE;
  }

  return `${symbol}${finalVal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
