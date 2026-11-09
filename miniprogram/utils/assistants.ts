// utils/assistants.ts
// 助手工具清单与「最近使用」点击记录。
// 首页展示固定的推荐助手，助手页读取这里记录的最近点击，全部写入本地 Storage。

export interface AssistantTool {
  /** 图标文字 */
  icon: string
  /** 名称 */
  label: string
  /** 简介 */
  desc: string
  /** 跳转页面，缺省表示尚未上线 */
  url?: string
  /** 是否推荐首页展示 */
  suggest?: boolean
}

/** 全部助手工具 */
export const ASSISTANT_TOOLS: AssistantTool[] = [
  {
    icon: '历',
    label: '彝历导航',
    desc: '按公历日期导航到指定彝历',
    suggest: true,
    url: '/subpages/date-navigation/date-navigation',
  },
  { icon: '德',  
    label: '西德推算',
    suggest: true,
    desc: '根据母亲与本人信息推算诺苏西德', 
    url: '/subpages/suigong/suigong', 
  }, 
  {
    icon: '生',
    label: '生辰查询',
    desc: '公历日期查询彝历生辰、黄历生辰',
    suggest: true,
    url: '/subpages/shengchen/shengchen',
  },
  {
    icon: '房',
    label: '房屋修建',
    desc: '修房造屋择吉日',
    suggest: true,
    url: '/subpages/zeri/zeri?event=house',
  },
  // {
  //   icon: '迁',
  //   label: '乔迁吉日',
  //   desc: '乔迁入宅择吉日',
  //   url: '/subpages/zeri/zeri?event=move',
  // },
]

const RECENT_KEY = 'yi-recent-assistants'
/** 最多保留的最近点击数量 */
const RECENT_LIMIT = 5

/** 读取最近点击的助手（最新在前，最多 5 个） */
export function getRecentAssistants(): AssistantTool[] {
  const value = wx.getStorageSync(RECENT_KEY)
  if (!Array.isArray(value)) return []
  return value.slice(0, RECENT_LIMIT)
}

/** 记录一次点击：同名的移到最前，仅保留最新 5 个 */
export function recordAssistant(tool: AssistantTool) {
  const recent = getRecentAssistants().filter(item => item.label !== tool.label)
  recent.unshift(tool)
  wx.setStorageSync(RECENT_KEY, recent.slice(0, RECENT_LIMIT))
}

