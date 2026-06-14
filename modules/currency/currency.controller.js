import { getRates, convertINR } from "./currency.service.js";

export const convertPrice = async (req, res, next) => {
  try {
    const { amount, currency } = req.query;

    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        message: "amount and currency are required",
      });
    }

    const rates = await getRates();

    const convertedAmount = convertINR(Number(amount), rates, currency);

    return res.json({
      success: true,
      base: "INR",
      currency,
      amount: convertedAmount,
    });

  } catch (error) {
    next(error);
  }
};