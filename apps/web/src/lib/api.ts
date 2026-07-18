import type { App } from "@my-app/api-types";
import { treaty } from "@my-app/api-types";

export const eden = treaty<App>(
	import.meta.env.VITE_API_URL || "http://localhost:3000",
	{
		fetch: {
			credentials: "include",
		},
	},
);
