import { message } from "@maplab-oss/helloworld-system";
import { t } from "../instance";

export const helloWorld = t.procedure.query(() => {
  return { message };
});
