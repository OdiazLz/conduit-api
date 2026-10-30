import { Router } from "express";
import type { z } from "zod";
import { ValidationError } from "../errors";
import { requireAuth } from "../middleware/auth";
import { getCurrentUser, loginUser, registerUser, updateUserProfile } from "../services/auth.service";
import { formatZodErrors, loginSchema, registerSchema, updateUserSchema } from "../validation/users.schemas";

const router = Router();

function parseUser<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
    const result = schema.safeParse((body as { user?: unknown } | undefined)?.user ?? {});
    if (!result.success) {
        throw new ValidationError(formatZodErrors(result.error).errors);
    }
    return result.data;
}

// Express 5 forwards rejected promises to the error handler, so no try/catch needed.

router.post("/users", async (req, res) => {
    const { username, email, password } = parseUser(registerSchema, req.body);
    const user = await registerUser(username, email, password);
    res.status(201).json({ user });
});

router.post("/users/login", async (req, res) => {
    const { email, password } = parseUser(loginSchema, req.body);
    const user = await loginUser(email, password);
    res.status(200).json({ user });
});

router.get("/user", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req.userId!);
    res.status(200).json({ user });
});

router.put("/user", requireAuth, async (req, res) => {
    const data = parseUser(updateUserSchema, req.body);
    const user = await updateUserProfile(req.userId!, data);
    res.status(200).json({ user });
});

export default router;
