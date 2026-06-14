//middleware/validate.middleware.js
import { ZodError } from "zod";

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      req.validatedData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errors: err.errors.map(e => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      next(err);
    }
  };
};