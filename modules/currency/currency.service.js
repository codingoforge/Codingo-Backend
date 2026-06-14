const API_KEY = process.env.EXCHANGE_API_KEY;

let cachedRates = null;
let lastFetch = 0;

// Get exchange rates (INR base)
export const getRates = async () => {
  const now = Date.now();

  // 10 min cache
  if (cachedRates && now - lastFetch < 10 * 60 * 1000) {
    return cachedRates;
  }

  const res = await fetch(
    `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/INR`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch exchange rates");
  }

  const data = await res.json();

  if (data.result !== "success") {
    throw new Error(data["error-type"] || "API error");
  }

  cachedRates = data.conversion_rates;
  lastFetch = now;

  return cachedRates;
};

// Convert INR → selected currency
export const convertINR = (amount, rates, currency) => {
  const code = currency.toUpperCase();

  if (!rates[code]) {
    throw new Error("Unsupported currency");
  }

  return amount * rates[code];
};