import z from "zod";

import { validateString } from "@/validators/commonRules";

export const mediaNameSchema = z.object({
	name: validateString("Media Name"),
	altText: validateString("Alt Text").optional()
});

export type MediaNameSchemaType = z.infer<typeof mediaNameSchema>;
