// utils/zeri.ts
// 通用择日规则：结婚、订婚、房屋修建等事项共用同一套「综合吉凶」判断。
// 数据来源全部为彝历库：库纠、狼色、木色则尼、塔博，以及按年龄推算的本人岁位。
// 规则为传统民俗整理，仅作文化参考。

import {
  DIRECTION_CN,
  ZODIAC_CN,
  getKujior,
  getLaSe,
  getXiDe,
  getYiTaBoo,
  getZeTa
} from '../plugin/yi-lunar/index'

/** 综合吉凶等级 */
export type ZeriLevel = '吉' | '平' | '凶' | '忌'

/** 择日事项 */
export type ZeriEventKey = 'marriage' | 'engagement' | 'house' | 'move' | 'open' | 'travel'

export type ZeriGender = 'male' | 'female' | ''

export interface ZeriEvent {
  key: ZeriEventKey
  /** 图标文字 */
  icon: string
  /** 事项名称 */
  label: string
  /** 用于「宜…」文案的事项描述 */
  action: string
}

export interface ZeriPerson {
  /** 属相在 ZODIAC_CN 中的下标 */
  zodiacIndex: number
  /** 彝族虚岁 */
  age: number
  gender: ZeriGender
}

/** 某一天的择日结果 */
export interface ZeriDay {
  level: ZeriLevel
  /** 吉凶原因，如「库纠为能阿低，是吉祥之日，宜修房造屋。」 */
  reasons: string[]
  /** 库纠（彝文、中文） */
  kuJiorYi: string
  kuJior: string
  /** 狼色 */
  laSe: string
  /** 木色则尼 */
  zeta: string
  /** 当日属相下标 */
  dayZodiacIndex: number
  /** 本人岁位（彝文、中文） */
  xiDeYi: string
  xiDeCn: string
}

/** 全部择日事项：所有好日子共用这一个功能 */
export const ZERI_EVENTS: ZeriEvent[] = [
  { key: 'marriage', icon: '囍', label: '结婚', action: '结婚嫁娶' },
  { key: 'engagement', icon: '约', label: '订婚', action: '订婚纳彩' },
  { key: 'house', icon: '房', label: '房屋修建', action: '修房造屋' },
  { key: 'move', icon: '迁', label: '乔迁', action: '乔迁入宅' },
  { key: 'open', icon: '开', label: '开业', action: '开业立市' },
  { key: 'travel', icon: '行', label: '出行', action: '出门远行' }
]

/** 按 key 查找事项 */
export function findEvent(key: string | undefined): ZeriEvent | undefined {
  if (!key) return undefined
  return ZERI_EVENTS.find((item) => item.key === key)
}

/** 库纠中判定为吉祥的日子 */
const KUJIOR_GOOD = ['能阿低']
/** 库纠中判定为破败的日子 */
const KUJIOR_BAD = ['库', '库诺']

/** 各事项的吉方（DIRECTION_CN 下标）：本人岁位临吉方时更利行事 */
const GOOD_DIRECTIONS: Record<ZeriEventKey, number[]> = {
  marriage: [6, 7],   // 东、东南
  engagement: [6, 0], // 东、南
  house: [6],         // 东（布都，日出之方）
  move: [6, 0],       // 东、南
  open: [0, 6],       // 南、东
  travel: [6, 2]      // 东、西
}

/**
 * 综合判断某一天的吉凶。
 * 依据：
 * 1. 当日属相与本人属相相冲 → 忌；
 * 2. 当日塔博方位与本人岁位同方 → 忌；
 * 3. 库纠为「库/库诺」→ 凶，「能阿低」→ 吉，其余为平；
 * 4. 本人岁位落在该事项吉方 → 吉（房屋修建为东方布都时取日出之象）。
 */
export function evaluateDay(
  dateStr: string,
  person: ZeriPerson,
  eventKey: ZeriEventKey,
  monthStart: number
): ZeriDay {
  const event = findEvent(eventKey) || ZERI_EVENTS[0]
  const yi = getYiTaBoo(dateStr, monthStart)
  const ku = getKujior(dateStr).kujior
  const laSe = getLaSe(dateStr)
  const zeta = getZeTa(dateStr) || ['', '']
  const xiDe = getXiDe(person.age, person.gender === 'female')
  const xiDeIndex = DIRECTION_CN.indexOf(xiDe[1])
  const dayZodiac = ZODIAC_CN[yi.dayZodiacIndex] || ''
  const personZodiac = ZODIAC_CN[person.zodiacIndex] || ''

  const reasons: string[] = []
  let avoid = false
  let bad = false
  let good = false

  // 1. 属相相冲（十二生肖相差六位）
  if (person.zodiacIndex >= 0 && Math.abs(yi.dayZodiacIndex - person.zodiacIndex) === 6) {
    avoid = true
    reasons.push(`今日为${dayZodiac}日，与本人${personZodiac}相冲，不宜${event.action}。`)
  }

  // 2. 塔博方位与本人岁位同方
  const tabooDirs = [yi.tabooSon[1], yi.tabooMon[1], yi.tabooFat[1]]
  if (xiDeIndex >= 0 && tabooDirs.indexOf(xiDe[1]) >= 0) {
    avoid = true
    reasons.push(`今日塔博在${xiDe[1]}，与本人岁位同方，忌${event.action}。`)
  }

  // 3. 库纠吉凶
  if (KUJIOR_BAD.indexOf(ku[1]) >= 0) {
    bad = true
    reasons.push(`库纠为${ku[1]}，为破败之日，不宜${event.action}。`)
  } else if (KUJIOR_GOOD.indexOf(ku[1]) >= 0) {
    good = true
    reasons.push(`库纠为${ku[1]}，是吉祥之日，宜${event.action}。`)
  } else {
    reasons.push(`库纠为${ku[1]}，无大吉亦无大凶，可斟酌行事。`)
  }

  // 4. 本人岁位临该事项吉方
  if (xiDeIndex >= 0 && GOOD_DIRECTIONS[event.key].indexOf(xiDeIndex) >= 0) {
    good = true
    if (event.key === 'house' && xiDeIndex === 6) {
      reasons.push('岁位在布都（东），太阳升起之方，在日出时开工、日出时落成，为吉祥之象。')
    } else {
      reasons.push(`岁位在${xiDe[1]}，为${event.label}吉方，行事顺遂。`)
    }
  }

  const level: ZeriLevel = avoid ? '忌' : bad ? '凶' : good ? '吉' : '平'

  return {
    level,
    reasons,
    kuJiorYi: ku[0],
    kuJior: ku[1],
    laSe: laSe[1],
    zeta: zeta[1] || '',
    dayZodiacIndex: yi.dayZodiacIndex,
    xiDeYi: xiDe[0],
    xiDeCn: xiDe[1]
  }
}
