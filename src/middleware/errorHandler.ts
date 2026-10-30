import type { ErrorRequestHandler } from "express";
import { HttpError } from "../errors";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	if (err instanceof HttpError) {
		res.status(err.status).json({ errors: err.errors });
		return;
	}

	console.error(err);
	res.status(500).json({ errors: { server: ["internal error"] } });
};
