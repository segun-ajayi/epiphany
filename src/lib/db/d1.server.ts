import { getRequest } from "@tanstack/react-start/server";

import { getDatabase } from "./runtime.server";

export async function getContentDatabase() {
  return getDatabase(getRequest());
}
