import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

declare global {
	namespace Express {
		interface Request {
			userId?: number;
		}
	}
}

type TokenResult =
	| { status: "missing" }
	| { status: "invalid" }
	| { status: "valid"; userId: number };

function readToken(req: Request): TokenResult {
	const header = req.headers.authorization;
	if (!header) return { status: "missing" };

	const [scheme, token, ...rest] = header.split(" ");
	if (scheme !== "Token" || !token || rest.length > 0) return { status: "invalid" };

	try {
		const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
		if (typeof payload === "object" && typeof payload.userId === "number") {
			return { status: "valid", userId: payload.userId };
		}
	} catch {
	}
	return { status: "invalid" };
}

function unauthorized(res: Response, message: string) {
	res.status(401).json({ errors: { token: [message] } });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const result = readToken(req);
	if (result.status === "missing") return unauthorized(res, "is missing");
	if (result.status === "invalid") return unauthorized(res, "is invalid");

	req.userId = result.userId;
	next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
	const result = readToken(req);
	if (result.status === "invalid") return unauthorized(res, "is invalid");

	if (result.status === "valid") req.userId = result.userId;
	next();
}
