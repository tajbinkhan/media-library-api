import z from "zod";

import { validateString } from "@/validators/commonRules";

export const mediaNameSchema = z.object({
	name: validateString("Media Name")
});

export type MediaNameSchemaType = z.infer<typeof mediaNameSchema>;
