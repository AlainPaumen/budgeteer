import type { App } from "@my-app/api-types";
import { treaty } from "@my-app/api-types";

export const eden = treaty<App>(import.meta.env.VITE_API_URL || "", {
	fetch: {
		credentials: "include",
	},
});
