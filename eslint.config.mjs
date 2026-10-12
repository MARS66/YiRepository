import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "miniprogram_dist", "node_modules", "coverage"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
