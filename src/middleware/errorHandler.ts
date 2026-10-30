import type { ErrorRequestHandler } from "express";
import { HttpError } from "../errors";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	if (err instanceof HttpError) {
		res.status(err.status).json({ errors: err.errors });
		return;
	}

	// Malformed JSON body (thrown by express.json()).
	if (err?.type === "entity.parse.failed") {
		res.status(422).json({ errors: { body: ["is not valid JSON"] } });
		return;
	}

	console.error(err);
	res.status(500).json({ errors: { server: ["internal error"] } });
};
