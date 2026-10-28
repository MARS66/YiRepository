---
name: "miniprogram-prototype-to-page"
description: "从原型设计稿（HTML/CSS）实现微信小程序页面。包含 px→rpx 转换、SCSS 嵌套、组件注册、数据绑定。当用户需要根据设计稿还原小程序页面时调用。"
---

# 微信小程序原型设计稿 → 页面还原

本 skill 定义了从原型设计稿（HTML/CSS）到微信小程序页面的完整还原流程，适用于 YiLive 项目。

## 触发条件

当用户提出以下需求时调用：
- 根据原型设计稿实现小程序页面
- 将 HTML/CSS 原型转换为小程序 WXML/WXSS
- 还原设计稿中的视觉效果到小程序页面
- 使用 layout 组件插槽填充页面内容

## 项目上下文

- 项目根目录：`/miniprogram/`
- 设计稿基准宽度：375px（iPhone 6/7/8）
- 样式方案：SCSS（`.scss`），支持嵌套语法
- 布局组件：`/components/layout/layout`，提供 `<slot></slot>` 默认插槽
- 全局 CSS 变量定义在 `app.scss` 中：`--coal`、`--fire`、`--gold`、`--cream`、`--paper`、`--muted`、`--line`、`--green`、`--shadow`

## 还原流程

### 第 1 步：分析原型设计稿

1. 找到原型文件（通常在 `/prototype/` 目录下）
2. 读取 `index.html` 中对应页面的 DOM 结构
3. 读取 `styles.css` 中对应的样式规则
4. 识别页面包含的内容区域和组件层级

### 第 2 步：分析现有项目结构

1. 确认目标页面的 WXML/WXSS/TS/JSON 文件位置
2. 检查 layout 组件是否已注册（在页面 JSON 的 `usingComponents` 中）
3. 阅读 layout 组件的实现，了解插槽位置和已有样式
4. 参考已有页面的 SCSS 嵌套风格（如 `layout.scss`）

### 第 3 步：注册必要组件

在页面 JSON 文件中注册 layout 组件：

```json

## 通用规则

### 底部间距

页面最后一个模块必须添加 `margin-bottom: 40rpx`（对应设计稿 20px），防止滑动到底部时内容与 tabbar 粘连，确保视觉层次清晰。

```scss
// 最后一个模块
.card.detail-card {
  padding-bottom: 0;
  margin-bottom: 40rpx;  // 底部留白，避免与 tabbar 粘连
}
```