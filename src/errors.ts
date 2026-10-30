export type ErrorDetails = Record<string, string[]>;

export class HttpError extends Error {
	constructor(
		public readonly status: number,
		message: string,
		public readonly errors: ErrorDetails = {},
	) {
		super(message);
		this.name = new.target.name;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class ValidationError extends HttpError {
	constructor(errors: ErrorDetails = {}, message = "Validation failed") {
		super(422, message, errors);
	}
}

export class UnauthorizedError extends HttpError {
	constructor(message = "Unauthorized", errors: ErrorDetails = {}) {
		super(401, message, errors);
	}
}

export class ForbiddenError extends HttpError {
	constructor(message = "Forbidden", errors: ErrorDetails = {}) {
		super(403, message, errors);
	}
}

export class NotFoundError extends HttpError {
	constructor(message = "Not found", errors: ErrorDetails = {}) {
		super(404, message, errors);
	}
}

export class ConflictError extends HttpError {
	constructor(message = "Conflict", errors: ErrorDetails = {}) {
		super(409, message, errors);
	}
}
