import { prisma } from "../lib/prisma";
import type { Prisma } from "../generated/prisma/client";

type UserUpdateData = {
	username?: string;
	email?: string;
	password?: string;
	bio?: string | null;
	image?: string | null;
};

// Finds a user matching any of the given fields. Empty/undefined fields are ignored:
// `{ id: undefined }` inside an OR would otherwise match every row.
export async function getUser(email: string, username: string, userId?: number) {
	const conditions: Prisma.UserWhereInput[] = [];
	if (email) conditions.push({ email });
	if (username) conditions.push({ username });
	if (userId !== undefined) conditions.push({ id: userId });

	if (conditions.length === 0) return null;

	return prisma.user.findFirst({ where: { OR: conditions } });
}

// Finds a user other than `userId` that already has the given email or username.
export async function findOtherUser(userId: number, email?: string, username?: string) {
	const conditions: Prisma.UserWhereInput[] = [];
	if (email) conditions.push({ email });
	if (username) conditions.push({ username });

	if (conditions.length === 0) return null;

	return prisma.user.findFirst({ where: { id: { not: userId }, OR: conditions } });
}

export async function createUser(username: string, email: string, password: string) {
	return prisma.user.create({
		data: { username, email, password },
	});
}

export async function updateUser(userId: number, data: UserUpdateData) {
	return prisma.user.update({
		where: { id: userId },
		data,
	});
}
