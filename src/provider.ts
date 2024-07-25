import { FlagsmithClientProvider as BuggyFlagsmithClientProvider } from "@openfeature/flagsmith-client-provider";
import { FlagsmithClientProvider as FixedFlagsmithClientProvider } from "./temp_fixedProvider.ts";

export const Provider =
  import.meta.env.VITE_PROVIDER === "local"
    ? FixedFlagsmithClientProvider
    : BuggyFlagsmithClientProvider;
