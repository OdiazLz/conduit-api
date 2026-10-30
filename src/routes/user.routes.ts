import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getCurrentUser, loginUser, registerUser, updateUserProfile } from "../services/auth.service";
import { parseBody } from "../validation/common";
import { loginSchema, registerSchema, updateUserSchema } from "../validation/users.schemas";

const router = Router();

router.post("/users", async (req, res) => {
    const { username, email, password } = parseBody(registerSchema, req.body, "user");
    const user = await registerUser(username, email, password);
    res.status(201).json({ user });
});

router.post("/users/login", async (req, res) => {
    const { email, password } = parseBody(loginSchema, req.body, "user");
    const user = await loginUser(email, password);
    res.status(200).json({ user });
});

router.get("/user", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req.userId!);
    res.status(200).json({ user });
});

router.put("/user", requireAuth, async (req, res) => {
    const data = parseBody(updateUserSchema, req.body, "user");
    const user = await updateUserProfile(req.userId!, data);
    res.status(200).json({ user });
});

export default router;
