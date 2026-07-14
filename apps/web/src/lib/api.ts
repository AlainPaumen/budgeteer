import type { App } from "@my-app/api-types";
import { treaty } from "@my-app/api-types";

export const eden = treaty<App>("http://localhost:3000");
