# wx-calendar 日历组件使用说明

`@lspriv/wx-calendar` 是一个微信小程序日历组件，支持 **月 / 周 / 日程** 三种视图、年面板、日期标记（日程、角标、节假日、日期文字）、主题样式定制、插件扩展，同时兼容 **WebView** 与 **Skyline** 渲染。

本仓库当前安装版本：`1.8.4`（`package.json` 中声明为 `^1.7.2`），构建产物位于 `miniprogram/miniprogram_npm/@lspriv/wx-calendar`。

## 目录

- [1. 环境与安装](#1-环境与安装)
- [2. 注册组件](#2-注册组件)
- [3. 快速开始](#3-快速开始)
- [4. Props 属性](#4-props-属性)
- [5. marks 日期标记](#5-marks-日期标记)
- [6. Events 事件](#6-events-事件)
- [7. Methods 实例方法](#7-methods-实例方法)
- [8. 样式定制](#8-样式定制)
- [9. 布局区域与视图控制](#9-布局区域与视图控制)
- [10. 渲染模式（WebView / Skyline）](#10-渲染模式webview--skyline)
- [11. 插件机制](#11-插件机制)
- [12. 本仓库中的使用示例](#12-本仓库中的使用示例)
- [13. 常见问题](#13-常见问题)

---

## 1. 环境与安装

官方要求：小程序基础库 `SDKVersion >= 3.0.0`。

> 本仓库 `project.config.json` 中 `libVersion` 为 `2.32.3`，使用 WebView 渲染时组件功能正常；若后续切换 Skyline 渲染，建议同步升级基础库。

安装依赖：

```bash
npm i @lspriv/wx-calendar -S
```

安装后在微信开发者工具菜单栏执行 **工具 → 构建 npm**。

构建结果：

```
miniprogram/miniprogram_npm/@lspriv/wx-calendar/
```

> `project.config.json` 已配置 `packNpmManually: true` 和 `packNpmRelationList`，构建产物会输出到 `miniprogram/miniprogram_npm`。

### 类型提示（可选）

组件是原生小程序组件而非纯 JS 库，若需要正确的 TS 类型提示，可在 `tsconfig.json` / `jsconfig.json` 中增加路径映射：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@lspriv/wx-calendar/*": ["./node_modules/@lspriv/wx-calendar/dist/*"]
    }
  }
}
```

之后可这样引入类型：

```ts
import type {
  CalendarExport,
  CalendarDay,
  CalendarMark,
  CalendarEventDetail,
  Plugin,
  PluginService
} from '@lspriv/wx-calendar/lib';
```

---

## 2. 注册组件

在页面 JSON 或 `app.json` 中注册：

```json
{
  "usingComponents": {
    "calendar": "@lspriv/wx-calendar"
  }
}
```

本仓库已在 [calendar.json](file:///Users/kevin/mine_projects/YiLive/miniprogram/pages/calendar/calendar.json) 中完成注册。

---

## 3. 快速开始

### WXML

```html
<calendar
  id="calendar"
  view="month"
  date="{{ today }}"
  weekstart="{{ 0 }}"
  darkmode="{{ isDark }}"
  marks="{{ marks }}"
  bindload="onCalendarLoad"
  bindclick="onCalendarClick"
  bindchange="onCalendarChange"
  bindviewchange="onViewChange"
/>
```

### TS / JS

```ts
Page({
  data: {
    today: '2026-10-28',   // 也可以传时间戳
    isDark: false,
    marks: []
  },

  onCalendarLoad(e: WechatMiniprogram.CustomEvent) {
    // 此时才能 selectComponent 拿到实例
    const calendar = this.selectComponent('#calendar');
    console.log('calendar loaded', e.detail, calendar);
  }
})
```

> **重要**：`selectComponent('#calendar')` 必须在 `bindload` 之后调用。组件在加载完成前，`export()` 返回 `null`。

---

## 4. Props 属性

所有属性均为可选。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `view` | `string` | `month` | 初始视图：`month` 月视图、`week` 周视图、`schedule` 日程视图 |
| `date` | `string \| number` | 当前时间戳 | 初始选中日期，支持 `YYYY-MM-DD` 字符串或时间戳 |
| `marks` | `array` | `[]` | 日期标记（日程、角标、节假日、日期文字、日期样式），详见第 5 节 |
| `weekstart` | `number` | `0` | 周首日，`0~6` 分别对应 日、一、二、三、四、五、六 |
| `vibrate` | `boolean` | `true` | 点击选择日期时是否震动 |
| `darkmode` | `boolean` | `false` | 是否启用深色模式（需系统处于深色模式时生效） |
| `font` | `string` | `''` | 追加字体，会与默认字体 `ui-sans-serif` 合并 |
| `style` | `string` | `''` | 容器内联样式，常用于覆盖 CSS 变量（见第 8 节） |
| `sameChecked` | `boolean` | `false` | 选中圆圈外观在「非今日」与「今日」保持一致 |
| `customNavBar` | `boolean` | `true` | 组件所在页面是否为自定义导航栏，用于调整年面板布局 |
| `viewGesture` | `boolean` | `true` | 是否允许通过上下滑动手势切换周 / 月视图 |
| `areas` | `array` | 全部区域 | 需要显示的布局区域，见第 9 节 |
| `alignDate` | `string` | `center` | 日期排布方式：`center` 居中、`baseline` 基线对齐 |
| `showRest` | `boolean` | `true` | 是否显示非本月日期 |

另外组件声明了外部类名 `i-class`，可通过 `class` 透传到组件根节点：

```html
<calendar class="my-calendar" />
```

### 固定视图

组件默认允许上下滑动在周 / 月之间切换。若要锁定为周视图：

```html
<calendar
  view="week"
  view-gesture="{{ false }}"
  areas="{{ ['header', 'title', 'subinfo', 'today'] }}"
/>
```

- `view` 只决定**初始**视图；
- `view-gesture` 关闭手势切换；
- `areas` 去掉 `viewbar` 和 `dragbar`，隐藏视图切换按钮和底部拖动条。

---

## 5. marks 日期标记

### 5.1 数据结构

```ts
type CalendarDay = {
  year: number;
  month: number; // 1 ~ 12
  day: number;
};

// 普通标记
type CalendarMark = {
  // 日期二选一：
  date?: string | number | Date | CalendarDay; // 'YYYY-MM-DD' | 时间戳 | Date
  year?: number;
  month?: number;
  day?: number;

  type: 'schedule' | 'corner' | 'festival' | 'solar';
  text: string;
  style?: string | Record<string, string | number>;
};

// 日期样式标记
type CalendarStyleMark = {
  date?: string | number | Date | CalendarDay;
  year?: number;
  month?: number;
  day?: number;

  type: 'style';
  style: string | Record<string, string | number>;
};
```

> 通过 `setData` 传递时，`date` 建议使用 `'YYYY-MM-DD'` 字符串或时间戳，避免 `Date` 对象在数据传输过程中被序列化导致失效。

### 5.2 各类型渲染位置

| `type` | 渲染位置 | 说明 |
| --- | --- | --- |
| `solar` | 日期数字 | **会替换原本的日期数字**，常用于把某天显示成特殊文字 |
| `festival` | 日期下方小字 | 常见于节假日、农历、节气等说明文字 |
| `corner` | 日期数字右上角 | 角标，建议只放 1 个字符（组件只按单字符校正位置） |
| `schedule` | 日期下方的日程条目 | 同一天可以有**多条** |
| `style` | 整个日期单元格 | 直接给日期容器加样式，如背景、圆角、颜色 |

> 除 `schedule` 外，同一天同一 `type` 只保留一条，后设置的会覆盖先设置的。

### 5.3 样式写法

`style` 支持字符串或对象两种写法：

```ts
// 字符串
{ year: 2026, month: 10, day: 1, type: 'corner', text: '休', style: 'color: #dd442f;font-size: 20rpx;' }

// 对象
{ year: 2026, month: 10, day: 1, type: 'style', style: { backgroundColor: '#f5f5f5', borderRadius: '12rpx' } }
```

### 5.4 示例

```ts
const marks = [
  // 日程：同一天可以有多条
  { date: '2026-10-28', type: 'schedule', text: '项目评审' },
  { date: '2026-10-28', type: 'schedule', text: '团队例会', style: 'color: #9c2d25;' },

  // 日期下方文字
  { year: 2026, month: 10, day: 1, type: 'festival', text: '国庆节', style: 'color: #dd442f;' },

  // 角标
  { year: 2026, month: 10, day: 1, type: 'corner', text: '休', style: 'color: #dd442f;' },

  // 替换日期数字
  { year: 2026, month: 10, day: 18, type: 'solar', text: '十八' },

  // 日期单元格样式
  { year: 2026, month: 10, day: 20, type: 'style', style: 'background: #fdf2e9;border-radius: 12rpx;' }
];
```

### 5.5 动态生成标记的建议

组件渲染的是「三个面板」的数据，`bindload` / `bindchange` 的 `detail.range` 会给出当前实际渲染的日期范围（包含前后月相邻日期）。推荐基于该范围生成 `marks`，避免一次性生成整年数据。

```ts
onCalendarLoad(e) {
  this.buildMarks(e.detail.range);
},

onCalendarChange(e) {
  this.buildMarks(e.detail.range);
},

buildMarks(range: [CalendarDay, CalendarDay]) {
  if (!range || range.length < 2) return;
  const [start, end] = range;
  const marks = [];
  // 遍历 start ~ end，逐天 push 标记
  this.setData({ marks });
}
```

修改 `marks` 属性后，组件会自动刷新对应日期的标记。

---

## 6. Events 事件

| 事件 | 触发时机 | `detail` |
| --- | --- | --- |
| `bindload` | 组件初始化完成，仅触发一次 | `checked`、`view`、`range` |
| `bindclick` | 点击任意日期 | `checked`、`view` |
| `bindchange` | 选中日期发生变化 | `checked`、`view`、`range`、`source` |
| `bindviewchange` | 周 / 月视图切换完成 | `view`、`checked` |
| `bindschedule` | 点击日程条目 | `schedule` 或 `schedules`、`all` |

### 6.1 公共字段

```ts
type CalendarDay = { year: number; month: number; day: number };

type CalendarEventDetail = {
  checked?: CalendarDay; // 当前选中日期
  view?: 'month' | 'week' | 'schedule'; // 当前视图
  range?: [start: CalendarDay, end: CalendarDay]; // 当前渲染的日期范围
  source?: 'click' | 'gesture' | 'annual' | 'manual';
};
```

`source` 取值：

| 值 | 含义 |
| --- | --- |
| `click` | 用户点击日期 |
| `gesture` | 左右滑动切换月份 |
| `annual` | 年面板选择月份 |
| `manual` | 调用实例方法 `checked(date)` 跳转 |

### 6.2 `bindload`

```ts
onCalendarLoad(e: WechatMiniprogram.CustomEvent) {
  const { checked, view, range } = e.detail;
  // checked: 当前选中日期
  // view: 当前视图
  // range: [起始日期, 结束日期]
}
```

> `selectComponent` 应在此事件之后调用。

### 6.3 `bindclick`

```ts
onCalendarClick(e: WechatMiniprogram.CustomEvent) {
  const { checked } = e.detail;
}
```

- 每次点击日期都会触发，即使点击的是已选中的日期；
- 如需避免频繁处理，请自行做防抖或判断日期是否变化；
- 周视图下，点击非当前周的日期不会触发。

### 6.4 `bindchange`

```ts
onCalendarChange(e: WechatMiniprogram.CustomEvent) {
  const { checked, view, range, source } = e.detail;
}
```

- 点击选中新日期、滑动切换月份、年面板跳转、调用 `checked()` 都会触发；
- 点击已选中的日期不会触发；
- 需要重新生成标记时，优先使用 `range`。

### 6.5 `bindviewchange`

```ts
onViewChange(e: WechatMiniprogram.CustomEvent) {
  const { view } = e.detail; // 'month' | 'week' | 'schedule'
}
```

### 6.6 `bindschedule`

```ts
onScheduleTap(e: WechatMiniprogram.CustomEvent) {
  if (e.detail.all) {
    // 点击「+N」，返回该日全部日程
    console.log(e.detail.schedules);
  } else {
    // 点击单条日程
    console.log(e.detail.schedule);
  }
}
```

单条日程结构：

```ts
type ScheduleEventDetail = {
  text: string;
  style?: string | Record<string, string | number>;
  date: CalendarDay;
  plugin?: string; // 来源插件 KEY
  info?: {
    dtStart?: Date;
    dtEnd?: Date;
    origin?: string;
    originKey?: string;
    summary?: string;
    description?: string;
  } | null;
};
```

---

## 7. Methods 实例方法

在 `bindload` 之后通过 `selectComponent` 获取实例。由于组件使用了 `wx://component-export`，拿到的是导出对象（`CalendarExport`），包含以下方法：

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `version` | `string` | 组件版本号 |
| `checked` | `(date: string \| number \| Date \| CalendarDay) => Promise<void>` | 选中指定日期（会触发 `bindchange`，`source: 'manual'`） |
| `toggleView` | `(view?: 'month' \| 'week' \| 'schedule') => void` | 切换视图；不传参时在周 / 月之间切换 |
| `openAnnual` | `() => Promise<void>` | 打开年面板 |
| `getMarks` | `(date: CalendarDay) => PluginEntireMarks` | 获取指定日期的完整标记（含插件生成的标记） |
| `getPlugin` | `(key: string) => Plugin` | 获取插件实例 |
| `updateDates` | `(dates?: CalendarDay[]) => Promise<void>` | 刷新指定日期的标记；不传参则刷新全部 |

### 使用示例

```ts
Page({
  data: { today: '2026-10-28' },

  onCalendarLoad() {
    this.calendar = this.selectComponent('#calendar') as any;

    console.log(this.calendar.version);

    // 跳转到今天
    this.calendar.checked('2026-10-28');

    // 切换到周视图
    this.calendar.toggleView('week');

    // 打开年面板
    this.calendar.openAnnual();

    // 获取某天的标记
    const marks = this.calendar.getMarks({ year: 2026, month: 10, day: 28 });

    // 只刷新某几天的标记
    this.calendar.updateDates([{ year: 2026, month: 10, day: 28 }]);
  }
})
```

---

## 8. 样式定制

组件开启了 `styleIsolation: "isolated"`，页面样式无法直接命中组件内部节点。支持两种定制方式：

1. 通过 `style` 属性设置 CSS 变量；
2. 通过 `class`（`i-class`）设置外部类。

### 8.1 通过 `style` 覆盖变量

```html
<calendar style="--wc-primary: #9c2d25; --wc-bg-light: #fffdf7; --wc-date-size: 32rpx;" />
```

本仓库 [calendar.ts](file:///Users/kevin/mine_projects/YiLive/miniprogram/pages/calendar/calendar.ts#L43-L43) 就是通过 `calendarStyle` 一次性注入了明暗两套主题变量。

### 8.2 主题色与字号变量

主题色：

```css
--wc-primary: #409eff;      /* 主题色 */
--wc-primary-2: rgba(64,158,255,.1); /* 主题色浅色背景 */
--wc-panel-height: 600rpx;  /* 面板基础高度 */
```

字号：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `--wc-title-size` | `46rpx` | 左上角日期标题 |
| `--wc-title-sub-size` | `20rpx` | 标题右侧描述 |
| `--wc-operator-size` | `22rpx` | 视图控制按钮 |
| `--wc-week-size` | `20rpx` | 星期 |
| `--wc-date-size` | `36rpx` | 日期数字 |
| `--wc-mark-size` | `20rpx` | 日期下方文字 |
| `--wc-corner-size` | `16rpx` | 日期角标 |
| `--wc-schedule-size` | `16rpx` | 日程文字 |
| `--wc-dot-size` | `10rpx` | 日期上方圆点 |
| `--wc-dot-offset-x` | `0` | 圆点水平偏移 |
| `--wc-dot-offset-y` | `0` | 圆点垂直偏移 |
| `--wc-dot-opacity` | `1` | 圆点透明度 |
| `--wc-annual-title-size` | `50rpx` | 年面板年份标题 |
| `--wc-annual-title-sub-size` | `18rpx` | 年面板标题右侧信息 |

### 8.3 浅色主题变量

```css
--wc-bg-light
--wc-title-color-light
--wc-title-sub-color-light
--wc-op-bg-light
--wc-op-color-light
--wc-week-color-light
--wc-date-color-light
--wc-mark-color-light
--wc-dot-color-light
--wc-schedule-color-light
--wc-schedule-bg-light
--wc-today-color-light
--wc-solar-color-light
--wc-checked-color-light
--wc-checked-mark-color-light
--wc-checked-dot-color-light
--wc-checked-today-color-light
--wc-checked-bg-light
--wc-checked-today-bg-light
--wc-control-bg-light
--wc-annual-bg-light
--wc-annual-title-color-light
--wc-annual-title-sub-color-light
```

### 8.4 深色主题变量

深色变量与浅色一一对应，后缀为 `-dark`：

```css
--wc-bg-dark
--wc-title-color-dark
--wc-title-sub-color-dark
--wc-op-bg-dark
--wc-op-color-dark
--wc-week-color-dark
--wc-date-color-dark
--wc-mark-color-dark
--wc-dot-color-dark
--wc-schedule-color-dark
--wc-schedule-bg-dark
--wc-today-color-dark
--wc-solar-color-dark
--wc-checked-color-dark
--wc-checked-mark-color-dark
--wc-checked-dot-color-dark
--wc-checked-today-color-dark
--wc-checked-bg-dark
--wc-checked-today-bg-dark
--wc-control-bg-dark
--wc-annual-bg-dark
--wc-annual-title-color-dark
--wc-annual-title-sub-color-dark
```

> 深色模式生效条件：`darkmode="{{ true }}"` **且** 系统处于深色模式。

### 8.5 年面板 Canvas 字体颜色

年面板通过 Canvas 绘制，相关颜色从以下变量读取。注意：年面板颜色只从 `style` 属性字符串中解析，不支持 `var()` 形式，也不能通过外部 class 覆盖。

```css
--wc-annual-cv-month-color-light / -dark
--wc-annual-cv-week-color-light / -dark
--wc-annual-cv-date-color-light / -dark
--wc-annual-cv-rest-color-light / -dark
--wc-annual-cv-checked-color-light / -dark
--wc-annual-cv-checked-bg-light / -dark
--wc-annual-cv-present-color-light / -dark
```

---

## 9. 布局区域与视图控制

`areas` 控制需要显示的布局区域，可取值：

| 区域 | 说明 |
| --- | --- |
| `header` | 整个头部区域（同时隐藏下面所有头部元素） |
| `title` | 左上角「YYYY年MM月」标题 |
| `subinfo` | 标题右侧的描述信息（如今日、第几周、N天前/后） |
| `today` | 「回到今日」按钮 |
| `viewbar` | 周 / 月视图切换按钮 |
| `dragbar` | 底部拖动控制条 |

默认全部显示。`areas` 中未列出的区域会被隐藏。

示例：只保留标题和「回到今日」，隐藏视图切换与拖动条

```html
<calendar areas="{{ ['header', 'title', 'subinfo', 'today'] }}" />
```

> 隐藏 `viewbar` / `dragbar` 只是去掉 UI，若还要禁止滑动手势切换视图，需同时设置 `view-gesture="{{ false }}"`。

---

## 10. 渲染模式（WebView / Skyline）

组件内部会根据当前页面渲染器自动选择模板与交互实现：

| 渲染模式 | 行为 |
| --- | --- |
| WebView | 使用 `swiper` + `transition` 事件处理左右滑动、面板过渡 |
| Skyline | 使用 `worklet` 手势与动画处理拖拽、视图切换、年面板过渡 |

使用 Skyline 时请注意：

1. 页面 / 全局需开启 Skyline 渲染（`renderer: "skyline"`）；
2. 开发者工具需开启 **编译 worklet 代码**（`project.config.json` 中 `setting.compileWorklet`）；
3. 本仓库当前 `compileWorklet` 为 `false`、`app.json` 未指定 skyline 渲染器，因此运行在 WebView 模式。

---

## 11. 插件机制

组件支持通过插件扩展日期标记、年月数据、事件拦截等能力。插件需在组件创建前注册。

### 11.1 使用插件

```js
const { WxCalendar } = require('@lspriv/wx-calendar/lib');
const { LunarPlugin } = require('@lspriv/wc-plugin-lunar');

// options 为插件选项
WxCalendar.use(LunarPlugin, options);

// 清理某个插件
// WxCalendar.clearPlugin('lunar');

// 清理全部插件
// WxCalendar.clearPlugin();
```

> `WxCalendar.use()` 应放在 `app.js` 或页面模块顶层，确保在组件实例化之前执行。

### 11.2 插件能做什么

| 钩子 | 作用 |
| --- | --- |
| `PLUGIN_TRACK_DATE` | 为周 / 月 / 日程面板的某一天生成标记或修改标记 |
| `PLUGIN_TRACK_YEAR` | 为年面板生成 `subinfo`、休息日 / 工作日、日期样式 |
| `PLUGIN_TRACK_SCHEDULE` | 点击日程时补充日程详情（标题、时间、描述等） |
| `PLUGIN_CATCH_TAP` | 拦截日期点击，可阻止默认选中行为 |
| `PLUGIN_CATCH_MANUAL` | 拦截日期跳转（今日按钮、`checked()` 方法等） |
| `PLUGIN_ON_LOAD` / `CLICK` / `CHANGE` / `VIEWCHANGE` | 响应日历事件，可取消或替换组件对外事件 |
| `PLUGIN_ON_INITIALIZE` / `ATTACH` / `DETACHED` | 跟随组件生命周期初始化 / 挂载 / 销毁 |
| `PLUGIN_DATES_FILTER` | 过滤日期或日期范围，供其他组件调用 |

### 11.3 官方插件

- `@lspriv/wc-plugin-lunar`：农历
- `@lspriv/wc-plugin-disabled`：日期禁用
- `@lspriv/wc-plugin-multiple`：多选
- `@lspriv/wc-plugin-ics`：ICS 日历订阅

插件开发细节（`WcPlugin`、`Track`、`Catch`、`On`、`Filter` 装饰器等）可参考组件包内 [README.md](file:///Users/kevin/mine_projects/YiLive/node_modules/@lspriv/wx-calendar/README.md)。

---

## 12. 本仓库中的使用示例

页面文件：

- [calendar.wxml](file:///Users/kevin/mine_projects/YiLive/miniprogram/pages/calendar/calendar.wxml)
- [calendar.ts](file:///Users/kevin/mine_projects/YiLive/miniprogram/pages/calendar/calendar.ts)
- [calendar.scss](file:///Users/kevin/mine_projects/YiLive/miniprogram/pages/calendar/calendar.scss)

当前用法要点：

```html
<calendar
  id="calendar"
  areas="{{ calendarAreas }}"
  marks="{{ marks }}"
  weekstart="0"
  darkmode="{{ isDark }}"
  style="{{ calendarStyle }}"
  bindload="onCalendarLoad"
  bindclick="onCalendarClick"
  bindchange="onCalendarChange"
/>
```

```ts
data: {
  calendarAreas: ['header', 'title', 'subinfo', 'today'], // 隐藏 viewbar 和 dragbar
  isDark: false,
  calendarStyle: 'width: 100%; --wc-primary: #9c2d25; ...',
  marks: []
}
```

- `areas` 只保留四个区域，界面上没有视图切换按钮和拖动条；
- 主题通过 `calendarStyle` 注入 CSS 变量，明暗两套颜色同时配置；
- `onCalendarLoad` / `onCalendarChange` 中根据 `detail.range` 动态生成 `marks`；
- 节假日使用 `corner`、`festival`、`solar` 三类标记组合实现：角标「休」、日期下方节日名、周末 / 节假日日期数字变红。

> 当前页面未设置 `view-gesture="{{ false }}"`，因此手势仍可在周 / 月视图间滑动切换。若需完全锁定视图，请补充该属性。

---

## 13. 常见问题

### Q1：`selectComponent` 返回 `null`

组件在 `bindload` 之前不导出实例。请把 `selectComponent` 放到 `bindload` 回调中。

### Q2：组件不显示或高度异常

- 组件根节点宽度依赖父容器，请确保父容器有明确宽度（如 `width: 100%`）；
- 可通过 `--wc-panel-height` 调整主面板基础高度；
- 页面若使用自定义导航栏，保持 `customNavBar` 默认 `true`；若未使用自定义导航栏，请设置 `custom-nav-bar="{{ false }}"`。

### Q3：深色模式不生效

需要同时满足：

1. `darkmode="{{ true }}"`；
2. 系统 / 微信处于深色模式。

### Q4：修改 `marks` 后没有更新

- 确保通过 `setData` 更新 `marks` 属性，而不是直接修改数组；
- 若只是局部更新，可调用实例方法 `updateDates([...])` 指定需要刷新的日期；
- 日期字段必须提供 `date` 或 `year + month + day`，缺一不可。

### Q5：`solar` 标记把日期数字覆盖了

这是 `solar` 的设计行为：它会替换日期数字。只想在日期下方显示文字请用 `festival`。

### Q6：角标位置偏移

`corner` 定位在日期数字右上角，默认按单字符校正。多字符或特殊位置需求，请通过 `style` 自行设置 `right` / `top` 等偏移量，例如：

```ts
{ type: 'corner', text: '休', style: 'right: -32rpx; font-size: 20rpx;' }
```

### Q7：周视图下点击某些日期无反应

周视图只允许选中当前展示周内的日期，非当前周日期会被忽略。

### Q8：年面板打开后布局错位

年面板会参考页面导航栏高度计算位置。若页面不是自定义导航栏，必须设置 `custom-nav-bar="{{ false }}"`。

### Q9：日程过多把日期格子撑开

组件会根据面板周数限制每天展示的日程数量，超出部分显示「+N」，点击会触发 `bindschedule` 且 `detail.all === true`。

---

## 参考

- 官方仓库：<https://github.com/lspriv/wx-calendar>
- 组件包内文档：[README.md](file:///Users/kevin/mine_projects/YiLive/node_modules/@lspriv/wx-calendar/README.md)
- 类型定义：[lib.d.ts](file:///Users/kevin/mine_projects/YiLive/miniprogram/miniprogram_npm/@lspriv/wx-calendar/lib.d.ts)、[interface/calendar.d.ts](file:///Users/kevin/mine_projects/YiLive/miniprogram/miniprogram_npm/@lspriv/wx-calendar/interface/calendar.d.ts)、[interface/component.d.ts](file:///Users/kevin/mine_projects/YiLive/miniprogram/miniprogram_npm/@lspriv/wx-calendar/interface/component.d.ts)
