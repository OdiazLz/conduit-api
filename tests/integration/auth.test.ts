import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { auth, registerUser, uniqueName } from "../helpers";

describe("auth", () => {
	it("registers a user and never returns the password", async () => {
		const username = uniqueName("reg");
		const res = await request(app)
			.post("/api/users")
			.send({ user: { username, email: `${username}@test.com`, password: "password123" } });

		expect(res.status).toBe(201);
		expect(res.body.user).toEqual({
			email: `${username}@test.com`,
			username,
			token: expect.any(String),
			bio: null,
			image: null,
		});
		expect(res.body.user).not.toHaveProperty("password");
	});

	it("returns 409 naming the field that is already taken", async () => {
		const existing = await registerUser("dup");
		const res = await request(app)
			.post("/api/users")
			.send({ user: { username: existing.username, email: "other@test.com", password: "password123" } });

		expect(res.status).toBe(409);
		expect(res.body).toEqual({ errors: { username: ["has already been taken"] } });
	});

	it("uses the same 401 for unknown email and wrong password", async () => {
		const user = await registerUser("login");

		const wrongPassword = await request(app)
			.post("/api/users/login")
			.send({ user: { email: user.email, password: "not-the-password" } });
		const unknownEmail = await request(app)
			.post("/api/users/login")
			.send({ user: { email: "nobody@test.com", password: "password123" } });

		expect(wrongPassword.status).toBe(401);
		expect(unknownEmail.status).toBe(401);
		expect(wrongPassword.body).toEqual({ errors: { credentials: ["invalid"] } });
		expect(unknownEmail.body).toEqual(wrongPassword.body);
	});

	it("rejects the Bearer scheme, only 'Token <jwt>' is valid", async () => {
		const user = await registerUser("scheme");

		const bearer = await request(app).get("/api/user").set("Authorization", `Bearer ${user.token}`);
		const token = await request(app).get("/api/user").set(auth(user.token));

		expect(bearer.status).toBe(401);
		expect(token.status).toBe(200);
	});

	it("returns 422 with the spec error format when a field is blank", async () => {
		const res = await request(app)
			.post("/api/users")
			.send({ user: { username: "", email: "a@test.com", password: "password123" } });

		expect(res.status).toBe(422);
		expect(res.body.errors.username).toEqual(["can't be blank"]);
	});
});
