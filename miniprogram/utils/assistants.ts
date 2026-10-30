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
}

/** 全部助手工具 */
export const ASSISTANT_TOOLS: AssistantTool[] = [
  {
    icon: '历',
    label: '彝历查询',
    desc: '选择公历日期查询彝历、生辰八字',
    url: '/pages/date-navigation/date-navigation',
  },
  { icon: '命',  
    label: '喜得推算',
    desc: '依母亲与本人岁数推算命宫方位', 
    url: '/pages/suigong/suigong', 
  },
  { icon: '合', label: '生肖合婚', desc: '文化参考与相处建议' },
  { icon: '德', label: '西德合婚', desc: '彝族传统文化参考' },
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

