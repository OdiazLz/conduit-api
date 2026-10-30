import request from "supertest";
import app from "../src/app";

let counter = 0;

// Unique names per call so tests don't collide on the shared database.
export function uniqueName(prefix: string) {
	counter += 1;
	return `${prefix}_${Date.now()}_${counter}`;
}

export async function registerUser(prefix = "user") {
	const username = uniqueName(prefix);
	const res = await request(app)
		.post("/api/users")
		.send({ user: { username, email: `${username}@test.com`, password: "password123" } });
	return { username, email: `${username}@test.com`, token: res.body.user.token as string };
}

export function auth(token: string) {
	return { Authorization: `Token ${token}` };
}

export async function createArticle(token: string, article: Record<string, unknown> = {}) {
	const res = await request(app)
		.post("/api/articles")
		.set(auth(token))
		.send({
			article: { title: "Title", description: "Description", body: "Body", ...article },
		});
	return res.body.article;
}
