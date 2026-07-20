import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_AUTH_URL || import.meta.env.VITE_API_URL,
	credentials: "include",
});
