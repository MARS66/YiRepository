import { defineConfig } from "tsup";

export default defineConfig([
  // Node.js / 浏览器通用的常规构建（ESM + CJS + 类型声明）
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "es2020",
    treeshake: true,
  },
  // 微信小程序构建：纯 CJS、全量打包、无 sourcemap、低版本 ES6 语法
  {
    entry: ["src/index.ts"],
    outDir: "miniprogram_dist",
    format: ["cjs"],
    target: "es2015",
    clean: true,
    sourcemap: false,
    splitting: false,
    treeshake: true,
    noExternal: [/.*/],
    outExtension: () => ({ js: ".js" }),
  },
]);
