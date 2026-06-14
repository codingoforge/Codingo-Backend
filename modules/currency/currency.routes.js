import express from "express";
import { convertPrice } from "./currency.controller.js";

const router = express.Router();

// GET /api/currency/convert?amount=1000&currency=USD
router.get("/convert", convertPrice);

export default router;