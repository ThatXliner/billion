import { cx } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: Parameters<typeof cx>) => twMerge(cx(inputs));

// Export theme tokens for React Native
export * from "./theme-tokens";
export * from "./slider";
export * from "./article-depth-control";
