import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { ConflictError, NotFoundError, UnauthorizedError, type ErrorDetails } from "../errors";
import type { User } from "../generated/prisma/client";
import { createUser, findOtherUser, getUser, updateUser } from "../repositories/users.repository";

type UserUpdateInput = {
    username?: string;
    email?: string;
    password?: string;
    bio?: string | null;
    image?: string | null;
};

function signToken(userId: number) {
    return jwt.sign({ userId }, JWT_SECRET, { algorithm: "HS256", expiresIn: "1h" });
}

function toUserResponse(user: User, token: string) {
    return {
        email: user.email,
        token,
        username: user.username,
        bio: user.bio,
        image: user.image,
    };
}

// Throws 409 naming which of email/username is already used by `existing`.
function throwIfTaken(existing: User | null, email?: string, username?: string) {
    if (!existing) return;

    const errors: ErrorDetails = {};
    if (email && existing.email === email) errors.email = ["has already been taken"];
    if (username && existing.username === username) errors.username = ["has already been taken"];
    throw new ConflictError("User with this email or username already exists", errors);
}

export async function registerUser(username: string, email: string, password: string) {
    throwIfTaken(await getUser(email, username), email, username);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(username, email, hashedPassword);
    return toUserResponse(user, signToken(user.id));
}

export async function loginUser(email: string, password: string) {
    const user = await getUser(email, "");
    const isPasswordValid = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !isPasswordValid) {
        throw new UnauthorizedError("Invalid credentials", { credentials: ["invalid"] });
    }

    return toUserResponse(user, signToken(user.id));
}

export async function getCurrentUser(userId: number) {
    const user = await getUser("", "", userId);
    if (!user) {
        throw new NotFoundError("User not found", { user: ["not found"] });
    }

    return toUserResponse(user, signToken(user.id));
}

export async function updateUserProfile(userId: number, data: UserUpdateInput) {
    throwIfTaken(await findOtherUser(userId, data.email, data.username), data.email, data.username);

    const updates = data.password
        ? { ...data, password: await bcrypt.hash(data.password, 10) }
        : data;

    const updatedUser = await updateUser(userId, updates);
    return toUserResponse(updatedUser, signToken(updatedUser.id));
}
