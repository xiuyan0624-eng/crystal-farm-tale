// ==================== 游戏数据定义 ====================

export type Element = 'wood' | 'fire' | 'water' | 'earth' | 'light'

/**
 * 元素与品质是「内容色」，不参与界面配色：都从奶油纸面派生，饱和度和界面一致。
 * 界面本身只有莓红（动作）和鼠尾草（辅助）两种强调；元素/品质只出现在
 * 小圆点、宝石图标和品质 pill 上。
 */
export const ELEMENTS: Record<Element, { name: string; icon: string; color: string }> = {
  wood: { name: '木', icon: '🌿', color: '#7C9B64' },
  fire: { name: '火', icon: '🔥', color: '#C05248' },
  water: { name: '水', icon: '💧', color: '#6E8FA8' },
  earth: { name: '土', icon: '⛰️', color: '#C9922F' },
  light: { name: '光', icon: '✨', color: '#D98BA8' },
}

export const ELEMENT_LIST: Element[] = ['wood', 'fire', 'water', 'earth', 'light']

// 元素克制：木克土 土克水 水克火 火克木，光不参与克制
export const ELEMENT_COUNTER: Record<Element, Element> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'wood',
  light: 'light',
}

/** 战斗克制倍率：克制×1.5，被克×0.75，光系/同系×1.0 */
export function counterMul(atkEl: Element, defEl: Element): number {
  if (atkEl === 'light' || defEl === 'light') return 1
  if (ELEMENT_COUNTER[atkEl] === defEl) return 1.5
  if (ELEMENT_COUNTER[defEl] === atkEl) return 0.75
  return 1
}

// -------------------- 作物 --------------------
export interface CropDef {
  id: string
  name: string
  icon: string
  growTime: number // 秒
  yield: number
  crystalElement: Element | 'any' // 水晶偏向（any=全属性均衡）
  crystalChance: number
  seedPrice: number
  sellPrice: number
  unlockLv: number // 农场等级解锁
  /** 只能在特定地块类型里种（温室/池塘） */
  onlyKind?: PlotKind
  /** 成熟后换一张图（如莲藕开花） */
  imgRipe?: string
}

export const CROPS: CropDef[] = [
  { id: 'carrot', name: '胡萝卜', icon: '🥕', growTime: 30, yield: 2, crystalElement: 'earth', crystalChance: 0.06, seedPrice: 10, sellPrice: 10, unlockLv: 1 },
  { id: 'leaf', name: '白菜', icon: '🥬', growTime: 45, yield: 2, crystalElement: 'water', crystalChance: 0.08, seedPrice: 15, sellPrice: 22, unlockLv: 2 },
  { id: 'tomato', name: '番茄', icon: '🍅', growTime: 60, yield: 2, crystalElement: 'fire', crystalChance: 0.11, seedPrice: 22, sellPrice: 42, unlockLv: 3 },
  { id: 'corn', name: '金玉米', icon: '🌽', growTime: 85, yield: 2, crystalElement: 'light', crystalChance: 0.15, seedPrice: 35, sellPrice: 75, unlockLv: 5 },
  { id: 'pumpkin', name: '南瓜', icon: '🎃', growTime: 115, yield: 2, crystalElement: 'earth', crystalChance: 0.20, seedPrice: 55, sellPrice: 130, unlockLv: 7 },
  { id: 'berry', name: '草莓', icon: '🍓', growTime: 150, yield: 2, crystalElement: 'wood', crystalChance: 0.26, seedPrice: 80, sellPrice: 230, unlockLv: 9 },
  { id: 'ginseng', name: '人参', icon: '🫚', growTime: 200, yield: 1, crystalElement: 'any', crystalChance: 0.35, seedPrice: 120, sellPrice: 460, unlockLv: 12 },
  { id: 'orchid', name: '兰花', icon: '🌸', growTime: 240, yield: 2, crystalElement: 'light', crystalChance: 0.45, seedPrice: 260, sellPrice: 880, unlockLv: 16, onlyKind: 'greenhouse' },
  { id: 'lotus', name: '莲藕', icon: '🪷', growTime: 300, yield: 2, crystalElement: 'water', crystalChance: 0.55, seedPrice: 320, sellPrice: 1180, unlockLv: 20, onlyKind: 'pond', imgRipe: 'lotus_flower' },
]

// -------------------- 农场等级 --------------------
export const farmExpForLevel = (lv: number) => lv * 40

// -------------------- 土地等级 --------------------
export interface PlotLevelDef {
  lv: number
  name: string
  color: string
  speedMul: number    // 生长速度倍率
  qualAdd: number     // 品质权重加成
  crystalAdd: number  // 水晶掉率加成
  cost: { coins: number; fert?: number; midCrystal?: number; topCrystal?: number }
}
export const PLOT_LEVELS: PlotLevelDef[] = [
  { lv: 0, name: '普通土地', color: '#a1887f', speedMul: 1.0, qualAdd: 0, crystalAdd: 0, cost: { coins: 0 } },
  { lv: 1, name: '黑土地', color: '#5d4037', speedMul: 1.2, qualAdd: 0.08, crystalAdd: 0.03, cost: { coins: 300, fert: 3 } },
  { lv: 2, name: '灵土', color: '#7c9cc4', speedMul: 1.5, qualAdd: 0.18, crystalAdd: 0.08, cost: { coins: 1200, midCrystal: 3 } },
  { lv: 3, name: '仙土', color: '#d4af37', speedMul: 2.0, qualAdd: 0.35, crystalAdd: 0.15, cost: { coins: 4000, topCrystal: 2 } },
]
export const MAX_PLOTS = 24

// -------------------- 扩建地块类型 --------------------
export type PlotKind = 'soil' | 'greenhouse' | 'pond'
export interface PlotKindDef {
  id: PlotKind
  name: string
  icon: string
  /** 改造成本（金币） */
  price: number
  desc: string
  growMul: number
  qualAdd: number
  crystalAdd: number
}
export const PLOT_KINDS: Record<PlotKind, PlotKindDef> = {
  soil: { id: 'soil', name: '农田', icon: '🟫', price: 0, desc: '普通地块', growMul: 1, qualAdd: 0, crystalAdd: 0 },
  greenhouse: { id: 'greenhouse', name: '温室', icon: '🏡', price: 1400, desc: '生长 ×1.35、品质 +15%，可种兰花', growMul: 1.35, qualAdd: 0.15, crystalAdd: 0 },
  pond: { id: 'pond', name: '池塘', icon: '💧', price: 1800, desc: '水晶掉率 +20%，可种莲藕', growMul: 1, qualAdd: 0, crystalAdd: 0.20 },
}
export const PLOT_KIND_LIST: PlotKindDef[] = [PLOT_KINDS.greenhouse, PLOT_KINDS.pond]
export const plotExpandCost = (current: number) => 150 + (current - 6) * 100

// -------------------- 肥料 --------------------
export const FERTILIZERS = [
  { id: 'fert', name: '普通肥料', icon: '🟫', qualAdd: 0.10 },
  { id: 'fert_rare', name: '稀有肥料', icon: '🤎', qualAdd: 0.25 },
]

// -------------------- 动物 --------------------
export interface AnimalDef {
  id: string
  name: string
  icon: string
  price: number
  foods: string[]
  produceId: string
  produceName: string
  produceIcon: string
  produceTime: number
  crystalElement: Element | 'any'
  crystalChance: number
  sellPrice: number
  fert?: string   // 收集时额外产出的肥料 id
  fertN?: number
}

export const ANIMALS: AnimalDef[] = [
  { id: 'chicken', name: '咕咕鸡', icon: '🐔', price: 80, foods: ['carrot', 'corn'], produceId: 'egg', produceName: '暖鸡蛋', produceIcon: '🥚', produceTime: 40, crystalElement: 'fire', crystalChance: 0.4, sellPrice: 20, fert: 'fert', fertN: 2 },
  { id: 'sheep', name: '绵绵羊', icon: '🐑', price: 120, foods: ['leaf', 'berry'], produceId: 'wool', produceName: '云朵羊毛', produceIcon: '☁️', produceTime: 50, crystalElement: 'wood', crystalChance: 0.4, sellPrice: 28, fert: 'fert_rare', fertN: 1 },
  { id: 'cow', name: '花奶牛', icon: '🐄', price: 180, foods: ['corn', 'pumpkin'], produceId: 'milk', produceName: '醇香牛奶', produceIcon: '🥛', produceTime: 60, crystalElement: 'water', crystalChance: 0.45, sellPrice: 38, fert: 'fert', fertN: 3 },
  { id: 'bee', name: '小蜜蜂', icon: '🐝', price: 800, foods: ['berry', 'leaf'], produceId: 'honey', produceName: '花蜜', produceIcon: '🍯', produceTime: 90, crystalElement: 'any', crystalChance: 0.5, sellPrice: 60 },
]

// -------------------- 精灵图鉴体系 --------------------
export type FeedStat = 'nature' | 'vigor' | 'mana'

export type Rarity = 'common' | 'fine' | 'rare' | 'epic' | 'legend'
export type Stage = 'baby' | 'adult' | 'complete' | 'ultimate'
export type Line = 'baby' | 'attack' | 'support' | 'special' | 'limited'

export const RARITIES: Record<Rarity, { name: string; color: string }> = {
  common: { name: '普通', color: '#A9968A' },
  fine: { name: '优质', color: '#7C9B64' },
  rare: { name: '稀有', color: '#6E8FA8' },
  epic: { name: '史诗', color: '#9A7BA8' },
  legend: { name: '传说', color: '#C9922F' },
}

export const STAGES: Record<Stage, { name: string; minLv: number }> = {
  baby: { name: '幼体', minLv: 1 },
  adult: { name: '成体', minLv: 10 },
  complete: { name: '完全体', minLv: 30 },
  ultimate: { name: '究极体', minLv: 50 },
}

export const EVOLVE_LEVEL = { adult: 10, complete: 30, ultimate: 50 }

export interface SkillDef { name: string; desc: string; mul: number; kind: 'dmg' | 'heal' }

export interface SpriteSpecies {
  id: string
  element: Element
  name: string
  rarity: Rarity
  stage: Stage
  line: Line
  lineName?: string   // 进化线名，如「藤蔓线」
  icon: string        // emoji（进化形态用）
  img?: string        // 贴图 key（15 只幼体有）
  desc: string        // 外形描述
  farm?: string       // 农场特长
  passive?: string    // 被动（限定传说）
  skills: SkillDef[]
  evoAttack?: string  // 幼体：攻击线进化目标
  evoSupport?: string // 幼体：功能线进化目标
  evolvesTo?: string  // 成体/完全体：下一阶段
}

const dmg = (name: string, desc: string, mul: number): SkillDef => ({ name, desc, mul, kind: 'dmg' })
const heal = (name: string, desc: string, mul: number): SkillDef => ({ name, desc, mul, kind: 'heal' })

export const SPECIES: SpriteSpecies[] = [
  // ==================== 木系（生长·缠绕·生命）====================
  { id: 'yaya', element: 'wood', name: '芽芽', rarity: 'common', stage: 'baby', line: 'baby', icon: '🌱', img: 'yaya', desc: '顶着两片嫩叶的小芽精灵', farm: '收获+5%', skills: [], evoAttack: 'chanraoteng', evoSupport: 'huajing' },
  { id: 'tengxu', element: 'wood', name: '藤须', rarity: 'common', stage: 'baby', line: 'baby', icon: '🌿', img: 'tengxu', desc: '一条会扭动的小藤蔓，末端有卷须', farm: '施肥+5%', skills: [], evoAttack: 'chanraoteng', evoSupport: 'huajing' },
  { id: 'hualing', element: 'wood', name: '花铃', rarity: 'fine', stage: 'baby', line: 'baby', icon: '🌸', img: 'hualing', desc: '花朵形状的铃铛，摇动飘花瓣', farm: '浇水+8%', skills: [], evoAttack: 'chanraoteng', evoSupport: 'huajing' },
  { id: 'chanraoteng', element: 'wood', name: '缠绕藤', rarity: 'rare', stage: 'adult', line: 'attack', lineName: '藤蔓线', icon: '🥀', desc: '藤蔓成精，能伸出枝条', skills: [dmg('缠绕', '单体伤害并定身1回合', 1.6)], evolvesTo: 'jingjiyao' },
  { id: 'jingjiyao', element: 'wood', name: '荆棘妖', rarity: 'epic', stage: 'complete', line: 'attack', lineName: '藤蔓线', icon: '🌵', desc: '浑身尖刺的藤蔓妖，受击会炸刺', skills: [dmg('荆棘牢笼', '群体伤害并定身', 2.2)], evolvesTo: 'shangushumo' },
  { id: 'shangushumo', element: 'wood', name: '上古树魔', rarity: 'legend', stage: 'ultimate', line: 'attack', lineName: '藤蔓线', icon: '🌳', desc: '参天古树成精，树冠遮天', skills: [dmg('万藤缚天', '全体高伤并控制1回合', 3.0)] },
  { id: 'huajing', element: 'wood', name: '花精', rarity: 'rare', stage: 'adult', line: 'support', lineName: '花灵线', icon: '🌷', desc: '小花精灵，身后飘着花瓣', skills: [heal('花露', '治疗自身并解除负面', 0.35)], evolvesTo: 'baihuaxian' },
  { id: 'baihuaxian', element: 'wood', name: '百花仙子', rarity: 'epic', stage: 'complete', line: 'support', lineName: '花灵线', icon: '💐', desc: '花冠少女，走过处花开', skills: [heal('百花盛开', '大量治疗并净化', 0.5)], evolvesTo: 'shengmingzhishu' },
  { id: 'shengmingzhishu', element: 'wood', name: '生命之树', rarity: 'legend', stage: 'ultimate', line: 'support', lineName: '花灵线', icon: '🌲', desc: '发光巨树，枝头结满果实', skills: [heal('生命恩泽', '持续大量回复', 0.7)] },
  { id: 'xianggutongzi', element: 'wood', name: '香菇童子', rarity: 'rare', stage: 'baby', line: 'special', icon: '🍄', desc: '菌盖斗笠的小蘑菇精灵', farm: '防虫效果+50%', skills: [dmg('孢子迷雾', '伤害并降低敌人命中', 1.4)] },
  { id: 'pugongying', element: 'wood', name: '蒲公英信使', rarity: 'rare', stage: 'baby', line: 'special', icon: '🎐', desc: '蒲公英球形状，随风飘', farm: '作物生长+10%', skills: [dmg('风之信标', '伤害并提升全队速度', 1.3)] },
  { id: 'shijiemiao', element: 'wood', name: '世界树苗', rarity: 'legend', stage: 'baby', line: 'limited', icon: '🎄', desc: '发着绿光的传说树苗，根须连着大地', farm: '全场精灵体力恢复翻倍', passive: '战斗后掉落翻倍', skills: [heal('森罗万象', '全体回血+攻击提升', 0.8)], evolvesTo: 'senluo' },
  { id: 'senluo', element: 'wood', name: '森罗树灵', rarity: 'legend', stage: 'ultimate', line: 'limited', icon: '🌳', img: 'senluo', desc: '世界树苗长成的森罗之树，根脉铺满整片农场', farm: '全场精灵体力恢复翻倍', passive: '战斗后掉落翻倍', skills: [heal('森罗万象', '全体回血+攻击提升', 1.0)] },

  // ==================== 水系（流动·变幻·冰冻）====================
  { id: 'shuizhu', element: 'water', name: '水珠仔', rarity: 'common', stage: 'baby', line: 'baby', icon: '💧', img: 'shuizhu', desc: '透明小水珠，会折射光', farm: '浇水+5%', skills: [], evoAttack: 'qingliushi', evoSupport: 'bingjingtong' },
  { id: 'paopaoyu', element: 'water', name: '泡泡鱼', rarity: 'common', stage: 'baby', line: 'baby', icon: '🐟', img: 'paopaoyu', desc: '鱼形泡泡，游来游去', farm: '浇水+5%', skills: [], evoAttack: 'qingliushi', evoSupport: 'bingjingtong' },
  { id: 'lulu', element: 'water', name: '露露', rarity: 'fine', stage: 'baby', line: 'baby', icon: '☔', img: 'lulu', desc: '清晨露水精灵，戴水滴帽', farm: '浇水+8%', skills: [], evoAttack: 'qingliushi', evoSupport: 'bingjingtong' },
  { id: 'qingliushi', element: 'water', name: '清流使', rarity: 'rare', stage: 'adult', line: 'attack', lineName: '波涛线', icon: '🌊', desc: '水流法师，手捧水球', skills: [dmg('水弹', '单体法术伤害', 1.6)], evolvesTo: 'bibofashi' },
  { id: 'bibofashi', element: 'water', name: '碧波法师', rarity: 'epic', stage: 'complete', line: 'attack', lineName: '波涛线', icon: '🌀', desc: '波浪长袍，脚踩水纹', skills: [dmg('惊涛骇浪', '群体法术伤害', 2.2)], evolvesTo: 'canghai' },
  { id: 'canghai', element: 'water', name: '沧海龙王', rarity: 'legend', stage: 'ultimate', line: 'attack', lineName: '波涛线', icon: '🐉', desc: '龙形水神，鳞片如浪', skills: [dmg('怒海狂涛', '全场群体高伤', 3.0)] },
  { id: 'bingjingtong', element: 'water', name: '冰晶童', rarity: 'rare', stage: 'adult', line: 'support', lineName: '寒冰线', icon: '🧊', desc: '冰晶组成的小精灵', skills: [dmg('冰锥', '单体伤害并减速', 1.5)], evolvesTo: 'shuanghuashi' },
  { id: 'shuanghuashi', element: 'water', name: '霜华使', rarity: 'epic', stage: 'complete', line: 'support', lineName: '寒冰线', icon: '❄️', desc: '霜雪袍法师，呼气成冰', skills: [heal('霜之护甲', '冰霜护盾恢复自身', 0.4)], evolvesTo: 'jibingnvwang' },
  { id: 'jibingnvwang', element: 'water', name: '极冰女王', rarity: 'legend', stage: 'ultimate', line: 'support', lineName: '寒冰线', icon: '👸', desc: '冰之女王，王冠为万年寒冰', skills: [dmg('绝对零度', '群体高伤并冻结', 2.6)] },
  { id: 'yunduoshou', element: 'water', name: '云朵兽', rarity: 'rare', stage: 'baby', line: 'special', icon: '☁️', desc: '蓬松小云朵，会下雨', farm: '自动浇水范围+1', skills: [dmg('云雾', '伤害并降低敌人命中', 1.3)] },
  { id: 'zhenzhubei', element: 'water', name: '珍珠贝', rarity: 'rare', stage: 'baby', line: 'special', icon: '🦪', desc: '张合的蚌壳，内含珍珠', farm: '水晶掉率+10%', skills: [heal('珍珠护盾', '为自身附加护盾', 0.45)] },
  { id: 'chaoxi', element: 'water', name: '潮汐圣兽', rarity: 'legend', stage: 'baby', line: 'limited', icon: '🌕', desc: '半透明的潮汐巨兽，随月相变化', farm: '每回合自动治疗全队', passive: '战斗后缓慢自愈', skills: [dmg('潮汐往复', '群体控制+伤害', 2.8)], evolvesTo: 'canglan' },
  { id: 'canglan', element: 'water', name: '沧澜圣王', rarity: 'legend', stage: 'ultimate', line: 'limited', icon: '🌊', img: 'canglan', desc: '潮汐圣兽完全展开的形态，海流随呼吸涨落', farm: '每回合自动治疗全队', passive: '战斗后缓慢自愈', skills: [dmg('沧澜覆海', '群体控制+伤害', 3.2)] },

  // ==================== 火系（燃烧·爆发·熔岩）====================
  { id: 'huomiao', element: 'fire', name: '火苗仔', rarity: 'common', stage: 'baby', line: 'baby', icon: '🔥', img: 'huomiao', desc: '一小簇跳动的火苗', farm: '驱虫+5%', skills: [], evoAttack: 'yanzhao', evoSupport: 'rongyanquan' },
  { id: 'tanqiu', element: 'fire', name: '炭球', rarity: 'common', stage: 'baby', line: 'baby', icon: '⚫', img: 'tanqiu', desc: '半燃的炭球，偶尔爆火星', farm: '驱虫+5%', skills: [], evoAttack: 'yanzhao', evoSupport: 'rongyanquan' },
  { id: 'zhuling', element: 'fire', name: '烛灵', rarity: 'fine', stage: 'baby', line: 'baby', icon: '🕯️', img: 'zhuling', desc: '蜡烛精灵，头顶烛火', farm: '驱虫+8%', skills: [], evoAttack: 'yanzhao', evoSupport: 'rongyanquan' },
  { id: 'yanzhao', element: 'fire', name: '焰爪', rarity: 'rare', stage: 'adult', line: 'attack', lineName: '烈焰线', icon: '🐾', desc: '火焰小兽，爪子冒火', skills: [dmg('火焰爪', '单体火伤', 1.7)], evolvesTo: 'chiyanwuzhe' },
  { id: 'chiyanwuzhe', element: 'fire', name: '炽焰武者', rarity: 'epic', stage: 'complete', line: 'attack', lineName: '烈焰线', icon: '🥋', desc: '火焰武士，出拳带火', skills: [dmg('烈焰拳', '高暴击单体伤害', 2.4)], evolvesTo: 'yanyuzhanshen' },
  { id: 'yanyuzhanshen', element: 'fire', name: '炎狱战神', rarity: 'legend', stage: 'ultimate', line: 'attack', lineName: '烈焰线', icon: '😈', desc: '地狱炎神，脚下熔岩翻滚', skills: [dmg('末日审判', '超高单体爆发', 3.2)] },
  { id: 'rongyanquan', element: 'fire', name: '熔岩犬', rarity: 'rare', stage: 'adult', line: 'support', lineName: '熔岩线', icon: '🐕', desc: '岩浆小狗，脚印留火', skills: [dmg('岩浆吐息', '伤害并附加灼烧', 1.5)], evolvesTo: 'baoyanshou' },
  { id: 'baoyanshou', element: 'fire', name: '爆炎兽', rarity: 'epic', stage: 'complete', line: 'support', lineName: '熔岩线', icon: '🌋', desc: '全身裂纹冒岩浆的巨兽', skills: [dmg('熔岩喷发', '范围灼烧伤害', 2.1)], evolvesTo: 'dixinyanmo' },
  { id: 'dixinyanmo', element: 'fire', name: '地心炎魔', rarity: 'legend', stage: 'ultimate', line: 'support', lineName: '熔岩线', icon: '👹', desc: '从地心爬出的岩浆魔', skills: [dmg('岩浆海', '全场持续灼烧', 2.7)] },
  { id: 'denglonggui', element: 'fire', name: '灯笼鬼', rarity: 'rare', stage: 'baby', line: 'special', icon: '🏮', desc: '提着灯笼的火鬼', farm: '夜间作物生长+15%', skills: [dmg('鬼火', '伤害并降低敌人攻击', 1.4)] },
  { id: 'zhadanji', element: 'fire', name: '炸蛋鸡', rarity: 'rare', stage: 'baby', line: 'special', icon: '🐔', desc: '会下炸弹蛋的火鸡', farm: '驱虫范围+1', skills: [dmg('爆裂蛋', '投掷炸弹造成范围伤害', 1.8)] },
  { id: 'zhuque', element: 'fire', name: '朱雀', rarity: 'legend', stage: 'baby', line: 'limited', icon: '🦅', desc: '四象朱雀，尾羽燃烧', farm: '全队攻击+10%', passive: '死亡后自动复活1次', skills: [dmg('南明离火', '无视防御的高额伤害', 3.0)], evolvesTo: 'zhuming' },
  { id: 'zhuming', element: 'fire', name: '朱雀·朱明', rarity: 'legend', stage: 'ultimate', line: 'limited', icon: '🔥', img: 'zhuming', desc: '南明离火凝成的朱雀真身，双翼展开半片天', farm: '全队攻击+10%', passive: '死亡后自动复活1次', skills: [dmg('朱明焚天', '无视防御的高额伤害', 3.4)] },

  // ==================== 土系（厚重·守护·大地）====================
  { id: 'tudundun', element: 'earth', name: '土墩墩', rarity: 'common', stage: 'baby', line: 'baby', icon: '🟤', img: 'tudundun', desc: '圆圆的小土堆，顶着一株草', farm: '施肥+5%', skills: [], evoAttack: 'yandunbing', evoSupport: 'shaxingzhe' },
  { id: 'shitouzi', element: 'earth', name: '石头仔', rarity: 'common', stage: 'baby', line: 'baby', icon: '🪨', img: 'shitouzi', desc: '长脸的鹅卵石，表情呆呆', farm: '看守+5%', skills: [], evoAttack: 'yandunbing', evoSupport: 'shaxingzhe' },
  { id: 'shalijing', element: 'earth', name: '沙粒精', rarity: 'fine', stage: 'baby', line: 'baby', icon: '✨', img: 'shalijing', desc: '沙粒聚成的小人', farm: '施肥+8%', skills: [], evoAttack: 'yandunbing', evoSupport: 'shaxingzhe' },
  { id: 'yandunbing', element: 'earth', name: '岩盾兵', rarity: 'rare', stage: 'adult', line: 'attack', lineName: '岩石线', icon: '🛡️', desc: '岩块组成的战士', skills: [dmg('落石', '单体岩石伤害', 1.5)], evolvesTo: 'shanyuejuren' },
  { id: 'shanyuejuren', element: 'earth', name: '山岳巨人', rarity: 'epic', stage: 'complete', line: 'attack', lineName: '岩石线', icon: '⛰️', desc: '小山般的岩石巨人', skills: [dmg('崩岩', '范围伤害并嘲讽', 2.0)], evolvesTo: 'daditan' },
  { id: 'daditan', element: 'earth', name: '大地泰坦', rarity: 'legend', stage: 'ultimate', line: 'attack', lineName: '岩石线', icon: '🗿', desc: '顶天立地的泰坦，背生山脉', skills: [dmg('山崩地裂', '群体高伤+眩晕', 2.8)] },
  { id: 'shaxingzhe', element: 'earth', name: '沙行者', rarity: 'rare', stage: 'adult', line: 'support', lineName: '沙暴线', icon: '🏜️', desc: '披斗篷的沙漠行者', skills: [dmg('扬沙', '伤害并降低敌人命中', 1.4)], evolvesTo: 'shabaoshou' },
  { id: 'shabaoshou', element: 'earth', name: '沙暴兽', rarity: 'epic', stage: 'complete', line: 'support', lineName: '沙暴线', icon: '🌪️', desc: '卷着沙尘的巨兽', skills: [dmg('沙暴漩涡', '持续伤害并定身', 1.9)], evolvesTo: 'huangmozhuzhu' },
  { id: 'huangmozhuzhu', element: 'earth', name: '荒漠之主', rarity: 'legend', stage: 'ultimate', line: 'support', lineName: '沙暴线', icon: '👑', desc: '沙漠帝王，所过之处成沙海', skills: [dmg('死亡沙海', '群体高伤并削弱', 2.5)] },
  { id: 'nirenou', element: 'earth', name: '泥人偶', rarity: 'rare', stage: 'baby', line: 'special', icon: '🧸', desc: '泥土捏的小人，会变形', farm: '施肥范围+1', skills: [dmg('泥沼', '伤害并减速敌人', 1.3)] },
  { id: 'jingkuangshou', element: 'earth', name: '晶矿兽', rarity: 'rare', stage: 'baby', line: 'special', icon: '💠', desc: '背负水晶矿簇的兽', farm: '采矿+20%', skills: [dmg('晶刺', '伤害并降低敌人防御', 1.6)] },
  { id: 'qilin', element: 'earth', name: '麒麟', rarity: 'legend', stage: 'baby', line: 'limited', icon: '🦌', desc: '四象麒麟，脚踏祥云', farm: '全队防御+15%', passive: '全队防御提升', skills: [heal('地脉回春', '群体治疗+解除负面', 0.6)], evolvesTo: 'ruiguang' },
  { id: 'ruiguang', element: 'earth', name: '麒麟·瑞光', rarity: 'legend', stage: 'ultimate', line: 'limited', icon: '✨', img: 'ruiguang', desc: '踏祥云而来的麒麟真身，所过之处草木回春', farm: '全队防御+15%', passive: '全队防御提升', skills: [heal('瑞光地脉', '群体治疗+解除负面', 0.85)] },

  // ==================== 光系（星光·希望·祝福）====================
  { id: 'xingchen', element: 'light', name: '星尘仔', rarity: 'common', stage: 'baby', line: 'baby', icon: '⭐', img: 'xingchen', desc: '星尘聚成的小团子，身上有星星闪烁', farm: '采集水晶+5%', skills: [], evoAttack: 'huiguangshi', evoSupport: 'zhumengling' },
  { id: 'yingguang', element: 'light', name: '萤光球', rarity: 'common', stage: 'baby', line: 'baby', icon: '🌟', img: 'yingguang', desc: '发光的萤火小球，提着小灯笼', farm: '看守+5%', skills: [], evoAttack: 'huiguangshi', evoSupport: 'zhumengling' },
  { id: 'chenxing', element: 'light', name: '晨星铃', rarity: 'fine', stage: 'baby', line: 'baby', icon: '🔔', img: 'chenxing', desc: '缀着晨星的小铃铛，声音带来好运', farm: '农场金币+8%', skills: [], evoAttack: 'huiguangshi', evoSupport: 'zhumengling' },
  { id: 'huiguangshi', element: 'light', name: '辉光使', rarity: 'rare', stage: 'adult', line: 'attack', lineName: '圣光线', icon: '✨', desc: '掌托光球的小小圣使', skills: [dmg('辉光冲击', '单体光属性伤害', 1.6)], evolvesTo: 'shenghuikishi' },
  { id: 'shenghuikishi', element: 'light', name: '圣辉骑士', rarity: 'epic', stage: 'complete', line: 'attack', lineName: '圣光线', icon: '⚔️', desc: '披着星光铠甲的骑士', skills: [dmg('圣剑审判', '高额单体光伤', 2.3)], evolvesTo: 'chenxinvshen' },
  { id: 'chenxinvshen', element: 'light', name: '晨曦女神', rarity: 'legend', stage: 'ultimate', line: 'attack', lineName: '圣光线', icon: '👼', desc: '晨曦化身，圣光普照', skills: [dmg('晨曦净化', '超高光属性爆发', 3.0)] },
  { id: 'zhumengling', element: 'light', name: '筑梦灵', rarity: 'rare', stage: 'adult', line: 'support', lineName: '星愿线', icon: '💤', desc: '编织美梦的小精灵', skills: [heal('星光治愈', '治疗自身', 0.35)], evolvesTo: 'xingguijisi' },
  { id: 'xingguijisi', element: 'light', name: '星轨祭司', rarity: 'epic', stage: 'complete', line: 'support', lineName: '星愿线', icon: '🔮', desc: '观测星轨的祭司', skills: [heal('星轨祝福', '大量治疗并提升攻击', 0.5)], evolvesTo: 'yuehuaxian' },
  { id: 'yuehuaxian', element: 'light', name: '月华仙灵', rarity: 'legend', stage: 'ultimate', line: 'support', lineName: '星愿线', icon: '🌙', desc: '沐浴月华的仙灵', skills: [heal('月华降临', '全体大量回血', 0.75)] },
  { id: 'liuxinghu', element: 'light', name: '流星狐', rarity: 'rare', stage: 'baby', line: 'special', icon: '🦊', desc: '尾巴拖着流星的小狐狸', farm: '收获+10%', skills: [dmg('流星冲刺', '先制的高速冲击', 1.7)] },
  { id: 'xuyuandeng', element: 'light', name: '许愿灯', rarity: 'rare', stage: 'baby', line: 'special', icon: '🏮', desc: '飘浮的许愿天灯，会聆听心愿', farm: '金币产出+10%', skills: [heal('愿望微光', '温暖的治愈之光', 0.4)] },
  { id: 'xinghuilong', element: 'light', name: '星辉龙', rarity: 'legend', stage: 'baby', line: 'limited', icon: '🐲', desc: '星辉凝成的幼龙，鳞片映着银河', farm: '全属性精灵经验+15%', passive: '全属性+10%', skills: [dmg('星河吐息', '全属性高额伤害', 2.9)], evolvesTo: 'yinhan' },
  { id: 'yinhan', element: 'light', name: '星辉龙·银汉', rarity: 'legend', stage: 'ultimate', line: 'limited', icon: '🐉', img: 'yinhan', desc: '星辉幼龙长成银河巨龙，鳞片里流过整条银汉', farm: '全属性精灵经验+15%', passive: '全属性+10%', skills: [dmg('银汉倾落', '全属性高额伤害', 3.3)] },
]

export const SPECIES_MAP: Record<string, SpriteSpecies> = Object.fromEntries(SPECIES.map(s => [s.id, s]))
export const babiesOf = (el: Element) => SPECIES.filter(s => s.element === el && s.line === 'baby')
export const specialsOf = (el: Element) => SPECIES.filter(s => s.element === el && s.line === 'special')
export const LIMITED_SPECIES = SPECIES.filter(s => s.line === 'limited')

// -------------------- 精灵实例 --------------------
export interface Sprite {
  id: string
  speciesId: string
  name: string       // 昵称（可改）
  element: Element
  level: number
  exp: number
  stats: Record<FeedStat, number>
  hp: number
  maxHp: number
  atk: number
  def: number
  spd: number
  job?: JobId | null // 农场工作
  stamina: number    // 体力 0-100，工作消耗
  star?: boolean     // 星辰觉醒（究极体终盘形态）
  actedAt?: number    // 上一次真正干活的时间戳（画布上据此闪一下工作图标）
}

// -------------------- 农场主装备 --------------------
export type EquipSlot = 'tool' | 'outfit' | 'charm'
export type OwnerLook = 'classic' | 'cream' | 'star' | 'rain' | 'festival' | 'winter'

export interface EquipDef {
  id: string
  name: string
  slot: EquipSlot
  icon: string
  tier: 1 | 2 | 3
  desc: string
  bonus: { grow?: number; qual?: number; crystal?: number; coin?: number }
  /** 服装决定农场主的立绘（owner_<gender>_<look>.png） */
  look?: OwnerLook
}
export const EQUIPS: EquipDef[] = [
  { id: 'hoe_wood', name: '木柄锄头', slot: 'tool', icon: '🪓', tier: 1, desc: '生长速度 +6%', bonus: { grow: 0.06 } },
  { id: 'hoe_iron', name: '精铁锄头', slot: 'tool', icon: '⛏️', tier: 2, desc: '生长速度 +12%', bonus: { grow: 0.12 } },
  { id: 'hoe_spirit', name: '灵木锄头', slot: 'tool', icon: '🌿', tier: 3, desc: '生长速度 +18%', bonus: { grow: 0.18 } },
  { id: 'apron_linen', name: '亚麻围裙', slot: 'outfit', icon: '👗', tier: 1, desc: '作物品质 +6%', bonus: { qual: 0.06 }, look: 'classic' },
  { id: 'apron_embroidery', name: '绣花围裙', slot: 'outfit', icon: '🧵', tier: 2, desc: '作物品质 +12%，外观换成奶油色', bonus: { qual: 0.12 }, look: 'cream' },
  { id: 'dress_starlight', name: '星光礼服', slot: 'outfit', icon: '✨', tier: 3, desc: '作物品质 +18%，外观带星辉', bonus: { qual: 0.18 }, look: 'star' },
  { id: 'coat_rain', name: '晴天雨衣', slot: 'outfit', icon: '🌂', tier: 2, desc: '作物品质 +10%，水晶 +4%，外观换成雨衣', bonus: { qual: 0.10, crystal: 0.04 }, look: 'rain' },
  { id: 'kimono_festival', name: '夏日祭和服', slot: 'outfit', icon: '🎐', tier: 3, desc: '作物品质 +14%，售价 +8%，外观换成祭典装', bonus: { qual: 0.14, coin: 0.08 }, look: 'festival' },
  { id: 'coat_winter', name: '暖冬毛呢', slot: 'outfit', icon: '🧣', tier: 2, desc: '生长 +8%，作物品质 +8%，外观换成冬装', bonus: { grow: 0.08, qual: 0.08 }, look: 'winter' },
  { id: 'bell_copper', name: '铜铃铛', slot: 'charm', icon: '🔔', tier: 1, desc: '水晶掉率 +4%', bonus: { crystal: 0.04 } },
  { id: 'bell_silver', name: '银铃铛', slot: 'charm', icon: '🔔', tier: 2, desc: '水晶掉率 +8%，售价 +8%', bonus: { crystal: 0.08, coin: 0.08 } },
  { id: 'bell_star', name: '星辉铃铛', slot: 'charm', icon: '🌟', tier: 3, desc: '水晶掉率 +14%，售价 +14%', bonus: { crystal: 0.14, coin: 0.14 } },
]
export const EQUIP_MAP: Record<string, EquipDef> = Object.fromEntries(EQUIPS.map(e => [e.id, e]))
export const SLOT_NAME: Record<EquipSlot, string> = { tool: '工具', outfit: '服装', charm: '饰品' }
export function equipById(id?: string): EquipDef | undefined { return id ? EQUIP_MAP[id] : undefined }
/** 农场主外观：由服装决定（没穿就是原色） */
export function ownerLook(equip: Partial<Record<EquipSlot, string>>): OwnerLook {
  return equipById(equip.outfit)?.look ?? 'classic'
}

/** 传说召唤阵：五系结晶各 10 枚（任意品级） */
export const SUMMON_COST = 10

/** 星辰觉醒：究极体 Lv60 后，用 3 颗星尘碎片 + 2 片龙鳞唤醒，全属性 +20% */
export const STAR_LEVEL = 60
export const STAR_SHARD_COST = 3
export const STAR_SCALE_COST = 2
export const STAR_MUL = 1.2

export const expForLevel = (level: number) => level * 30

const STAGE_BASE: Record<Stage, { hp: number; atk: number; def: number; spd: number }> = {
  baby: { hp: 50, atk: 8, def: 3, spd: 6 },
  adult: { hp: 95, atk: 17, def: 8, spd: 9 },
  complete: { hp: 170, atk: 30, def: 15, spd: 13 },
  ultimate: { hp: 260, atk: 48, def: 24, spd: 18 },
}
const RARITY_MUL: Record<Rarity, number> = { common: 0.9, fine: 1, rare: 1.12, epic: 1.3, legend: 1.5 }

/** 按物种+等级+喂养倾向计算属性 */
export function calcStats(species: SpriteSpecies, level: number, feed: Record<FeedStat, number>) {
  const b = STAGE_BASE[species.stage]
  const rm = RARITY_MUL[species.rarity]
  let maxHp = b.hp, atk = b.atk, def = b.def, spd = b.spd
  if (species.line === 'attack') { atk *= 1.5; spd *= 1.15 }
  if (species.line === 'support') { maxHp *= 1.35; def *= 1.5 }
  if (species.element === 'fire') atk *= 1.15
  if (species.element === 'water') maxHp *= 1.15
  if (species.element === 'earth') def *= 1.25
  if (species.element === 'wood') spd *= 1.15
  if (species.element === 'light') { atk *= 1.08; maxHp *= 1.08; def *= 1.08 }
  maxHp = maxHp * rm + (level - 1) * 8 + feed.nature * 4
  atk = atk * rm + (level - 1) * 2 + feed.vigor * 1.5
  def = def * rm + (level - 1) * 1 + feed.nature * 1.2
  spd = spd * rm + (level - 1) * 0.4
  if (feed.mana > 0) atk *= 1 + feed.mana * 0.02
  return { maxHp: Math.round(maxHp), atk: Math.round(atk), def: Math.round(def), spd: Math.round(spd) }
}

// -------------------- 敌人 --------------------
/** 野外材料（怪物掉落，可卖钱，也是后期合成/喂养的储备） */
/** 装备强化：每级 +25% 基础加成，最高 5 级；强化消耗战利品材料 */
export const EQUIP_MAX_LEVEL = 5
export const equipLevelMul = (level: number) => 1 + 0.25 * Math.max(0, Math.min(EQUIP_MAX_LEVEL, level))

/** 强化到下一级需要多少材料（tier 越高越费） */
export function enhanceCost(tier: number, nextLevel: number): { id: string; qty: number }[] {
  const t = (n: number) => n + Math.max(0, tier - 1)
  switch (nextLevel) {
    case 1: return [{ id: 'dust', qty: t(4) }, { id: 'fiber', qty: t(3) }]
    case 2: return [{ id: 'dust', qty: t(6) }, { id: 'hide', qty: t(3) }]
    case 3: return [{ id: 'fang', qty: t(4) }, { id: 'shell', qty: t(2) }]
    case 4: return [{ id: 'ember', qty: t(4) }, { id: 'scale', qty: t(1) }]
    default: return [{ id: 'scale', qty: t(3) }, { id: 'shell', qty: t(4) }]
  }
}

export const MATERIALS: { id: string; name: string; icon: string; price: number; from: string; use?: string }[] = [
  { id: 'fiber', name: '野草纤维', icon: '🌾', price: 8, from: '草丛史莱姆 / 孢子菇' },
  { id: 'hide', name: '粗兽皮', icon: '🟫', price: 22, from: '暴躁野猪 / 岩甲兽' },
  { id: 'fang', name: '尖牙', icon: '🦷', price: 34, from: '月夜魔狼 / 霜牙狼' },
  { id: 'shell', name: '龟甲片', icon: '🛡️', price: 46, from: '深渊玄龟 / 潮汐贝' },
  { id: 'ember', name: '火种', icon: '🔥', price: 60, from: '熔岩巨像 / 焚岩兽' },
  { id: 'scale', name: '龙鳞', icon: '🐲', price: 120, from: '苍穹古龙 / 星辉幼龙', use: '强化 +4/+5、星辰觉醒' },
  { id: 'dust', name: '结晶尘', icon: '✨', price: 18, from: '所有魔物' },
]

export interface LootDrop { id: string; chance: number; min: number; max: number }

export interface EnemyDef {
  id: string
  name: string
  icon: string
  element: Element
  hp: number
  atk: number
  def: number
  spd: number
  expReward: number
  coinReward: number
  crystalReward: Element[]
  unlockLevel: number
  /** 精英变体用同一张贴纸，靠色相区分 */
  tint?: string
  drops?: LootDrop[]
  /** 首次击杀必掉的专属装备（精英怪用，给玩家"刷这只怪拿这件"的目标） */
  exclusive?: string
}

export const ENEMIES: EnemyDef[] = [
  { id: 'slime', name: '草丛史莱姆', icon: '🟢', element: 'wood', hp: 100, atk: 12, def: 3, spd: 4, expReward: 40, coinReward: 20, crystalReward: ['wood'], unlockLevel: 1, drops: [{ id: 'fiber', chance: 0.9, min: 1, max: 3 }, { id: 'dust', chance: 0.3, min: 1, max: 2 }] },
  { id: 'boar', name: '暴躁野猪', icon: '🐗', element: 'earth', hp: 260, atk: 30, def: 8, spd: 6, expReward: 120, coinReward: 35, crystalReward: ['earth', 'wood'], unlockLevel: 10, drops: [{ id: 'hide', chance: 0.8, min: 1, max: 2 }, { id: 'dust', chance: 0.35, min: 1, max: 2 }] },
  { id: 'wolf', name: '月夜魔狼', icon: '🐺', element: 'fire', hp: 480, atk: 48, def: 12, spd: 12, expReward: 260, coinReward: 55, crystalReward: ['fire'], unlockLevel: 20, drops: [{ id: 'fang', chance: 0.8, min: 1, max: 2 }, { id: 'dust', chance: 0.4, min: 1, max: 3 }] },
  { id: 'turtle', name: '深渊玄龟', icon: '🐢', element: 'water', hp: 950, atk: 62, def: 45, spd: 3, expReward: 500, coinReward: 80, crystalReward: ['water', 'earth'], unlockLevel: 30, drops: [{ id: 'shell', chance: 0.85, min: 1, max: 2 }, { id: 'dust', chance: 0.45, min: 1, max: 3 }] },
  { id: 'golem', name: '熔岩巨像', icon: '🗿', element: 'fire', hp: 1600, atk: 92, def: 30, spd: 5, expReward: 900, coinReward: 130, crystalReward: ['fire', 'light'], unlockLevel: 40, drops: [{ id: 'ember', chance: 0.85, min: 1, max: 2 }, { id: 'dust', chance: 0.5, min: 2, max: 4 }] },
  { id: 'dragon', name: '苍穹古龙', icon: '🐉', element: 'light', hp: 2600, atk: 125, def: 42, spd: 15, expReward: 1600, coinReward: 260, crystalReward: ['light', 'light'], unlockLevel: 50, drops: [{ id: 'scale', chance: 0.85, min: 1, max: 2 }, { id: 'dust', chance: 0.6, min: 2, max: 6 }] },

  // 精英变体：同一张贴纸换色，数值更高、掉落更好（解锁在基础怪之后）
  { id: 'slime_elite', name: '荧光史莱姆', icon: '💚', element: 'wood', hp: 420, atk: 26, def: 8, spd: 6, expReward: 180, coinReward: 60, crystalReward: ['wood', 'wood'], unlockLevel: 8,
    tint: 'hue-rotate(70deg) saturate(1.15) brightness(1.05)', drops: [{ id: 'fiber', chance: 0.9, min: 2, max: 4 }, { id: 'dust', chance: 0.35, min: 1, max: 2 }], exclusive: 'bell_copper' },
  { id: 'boar_elite', name: '岩甲兽', icon: '🪨', element: 'earth', hp: 780, atk: 52, def: 26, spd: 7, expReward: 340, coinReward: 90, crystalReward: ['earth', 'earth'], unlockLevel: 18,
    tint: 'hue-rotate(-18deg) saturate(0.9) brightness(0.98)', drops: [{ id: 'hide', chance: 0.85, min: 1, max: 3 }, { id: 'dust', chance: 0.45, min: 1, max: 3 }], exclusive: 'hoe_iron' },
  { id: 'wolf_elite', name: '霜牙狼', icon: '❄️', element: 'water', hp: 1200, atk: 78, def: 22, spd: 18, expReward: 620, coinReward: 120, crystalReward: ['water', 'water'], unlockLevel: 26,
    tint: 'hue-rotate(160deg) saturate(1.05)', drops: [{ id: 'fang', chance: 0.85, min: 1, max: 3 }, { id: 'dust', chance: 0.5, min: 2, max: 4 }], exclusive: 'bell_silver' },
  { id: 'turtle_elite', name: '潮汐贝王', icon: '🐚', element: 'water', hp: 2100, atk: 96, def: 60, spd: 4, expReward: 980, coinReward: 170, crystalReward: ['water', 'earth'], unlockLevel: 34,
    tint: 'hue-rotate(-40deg) saturate(1.1)', drops: [{ id: 'shell', chance: 0.9, min: 1, max: 3 }, { id: 'dust', chance: 0.55, min: 2, max: 5 }], exclusive: 'coat_rain' },
  { id: 'golem_elite', name: '焚岩兽', icon: '🌋', element: 'fire', hp: 3200, atk: 138, def: 46, spd: 6, expReward: 1500, coinReward: 240, crystalReward: ['fire', 'fire'], unlockLevel: 42,
    tint: 'hue-rotate(-24deg) saturate(1.25) brightness(1.03)', drops: [{ id: 'ember', chance: 0.9, min: 1, max: 3 }, { id: 'dust', chance: 0.6, min: 2, max: 6 }], exclusive: 'coat_winter' },
  { id: 'dragon_elite', name: '星辉幼龙', icon: '⭐', element: 'light', hp: 4600, atk: 168, def: 54, spd: 20, expReward: 2400, coinReward: 360, crystalReward: ['light', 'light'], unlockLevel: 52,
    tint: 'hue-rotate(28deg) saturate(1.2) brightness(1.06)', drops: [{ id: 'scale', chance: 0.9, min: 1, max: 2 }, { id: 'dust', chance: 0.7, min: 3, max: 8 }], exclusive: 'dress_starlight' },
]

// -------------------- 品质系统 --------------------
export interface QualityDef { q: number; name: string; color: string; sellMul: number; expMul: number }
export const QUALITIES: QualityDef[] = [
  { q: 1, name: '普通', color: '#A9968A', sellMul: 1, expMul: 1 },
  { q: 2, name: '优质', color: '#7C9B64', sellMul: 1.8, expMul: 1.3 },
  { q: 3, name: '稀有', color: '#6E8FA8', sellMul: 3.5, expMul: 1.8 },
  { q: 4, name: '史诗', color: '#9A7BA8', sellMul: 8, expMul: 2.5 },
  { q: 5, name: '传说', color: '#C9922F', sellMul: 20, expMul: 4 },
]

// 收获品质基础权重（普通/优质/稀有/史诗/传说）
export const QUALITY_WEIGHTS = [65, 25, 8, 1.8, 0.2]
// 蔬菜喂精灵的经验（按品质）
export const CROP_EXP = [10, 25, 60, 150, 400]

// 水晶品质：下品/中品/上品/极品（q1-q4）
export const CRYSTAL_Q = [
  { q: 1, name: '下品', color: '#d1d5db', weight: 70, sellPrice: 30 },
  { q: 2, name: '中品', color: '#4ade80', weight: 25, sellPrice: 80 },
  { q: 3, name: '上品', color: '#60a5fa', weight: 4.5, sellPrice: 200 },
  { q: 4, name: '极品', color: '#fbbf24', weight: 0.5, sellPrice: 600 },
]
/** 随机水晶品质（landBonus 提高高阶权重） */
export function rollCrystalQuality(landBonus = 0): number {
  const ws = CRYSTAL_Q.map((c, i) => i === 0 ? c.weight : c.weight * (1 + landBonus * 3))
  const total = ws.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return i + 1 }
  return 1
}

// -------------------- 精灵农场工作 --------------------
export type JobId = 'water' | 'fertilize' | 'harvest' | 'pest' | 'feed' | 'mine' | 'guard'
export interface JobDef {
  id: JobId
  name: string
  icon: string
  best: Element[]   // 擅长属性
  desc: string
}
export const JOBS: JobDef[] = [
  { id: 'water', name: '浇水', icon: '💧', best: ['water'], desc: '全场生长+20%；每 20 秒自动浇一块地（水系精灵快 30%）' },
  { id: 'fertilize', name: '施肥', icon: '🟫', best: ['earth'], desc: '全场品质权重+10%；每 45 秒自动用背包里的普通肥料给一块地施肥' },
  { id: 'harvest', name: '收获', icon: '🧺', best: ['wood'], desc: '作物成熟后自动帮你收（木系精灵收得更勤、品质更好）' },
  { id: 'pest', name: '驱虫', icon: '🔥', best: ['fire'], desc: '地块闹虫时自动去驱虫（火系精灵处理得更快）' },
  { id: 'feed', name: '喂食', icon: '🌾', best: ['wood', 'earth'], desc: '每 30 秒自动喂一只最饿的动物（用背包里的饲料作物，木/土系喂得更多）' },
  { id: 'mine', name: '采集水晶', icon: '💎', best: ['light'], desc: '在农场里四处捡，平均每 10 分钟带回 1 颗随机水晶' },
  { id: 'guard', name: '牧场照料', icon: '🪣', best: ['earth', 'light'], desc: '每 40 秒帮你收一次动物的蛋/奶/毛；收获时 5% 概率产量+1（土/光擅长）' },
]
export const STAGE_WORK_MUL: Record<Stage, number> = { baby: 1.0, adult: 1.5, complete: 2.5, ultimate: 4.0 }
/** 单只精灵的工作效率：擅长1.2 / 普通1.0 / 其他0.5，等级每级+2%，阶段倍率 */
export function jobEff(sp: Sprite): number {
  const species = SPECIES_MAP[sp.speciesId]
  const job = JOBS.find(j => j.id === sp.job)
  if (!job || !species) return 0
  const fit = job.best.includes(sp.element) ? 1.2 : 0.5
  return fit * (1 + sp.level * 0.02) * STAGE_WORK_MUL[species.stage]
}

/** 解析物品 id 的品质：carrot_q3 → { base: 'carrot', q: 3 }；无后缀视为 q1 */
export function parseItem(id: string): { base: string; q: number } {
  const m = id.match(/^(.+)_q([1-5])$/)
  if (m) return { base: m[1], q: parseInt(m[2]) }
  return { base: id, q: 1 }
}

export function qualityOf(id: string): QualityDef {
  return QUALITIES[parseItem(id).q - 1]
}

// -------------------- 物品名称表 --------------------
export function itemName(id: string): string {
  const { base, q } = parseItem(id)
  const crop = CROPS.find(c => c.id === base)
  const prefix = q > 1 ? `${QUALITIES[q - 1].name}·` : ''
  if (crop) return prefix + crop.name
  const animal = ANIMALS.find(a => a.produceId === base)
  if (animal) return prefix + animal.produceName
  if (base.startsWith('crystal_')) {
    const el = base.replace('crystal_', '') as Element
    const cPrefix = q > 1 ? `${CRYSTAL_Q[Math.min(q, 4) - 1].name}·` : ''
    return `${cPrefix}${ELEMENTS[el]?.name ?? ''}结晶`
  }
  const fert = FERTILIZERS.find(f => f.id === base)
  if (fert) return fert.name
  if (base.startsWith('seed_')) {
    const cropId = base.replace('seed_', '')
    return `${CROPS.find(c => c.id === cropId)?.name ?? ''}种子`
  }
  if (base === 'star_shard') return '星尘碎片'
  const mat = MATERIALS.find(m => m.id === base)
  if (mat) return mat.name
  return id
}

export function itemIcon(id: string): string {
  const { base } = parseItem(id)
  const crop = CROPS.find(c => c.id === base)
  if (crop) return crop.icon
  const animal = ANIMALS.find(a => a.produceId === base)
  if (animal) return animal.produceIcon
  if (base.startsWith('crystal_')) return '💎'
  const fert = FERTILIZERS.find(f => f.id === base)
  if (fert) return fert.icon
  if (base.startsWith('seed_')) return '🌰'
  if (base === 'star_shard') return '✨'
  const mat = MATERIALS.find(m => m.id === base)
  if (mat) return mat.icon
  return '❔'
}

/** 找出背包里某基础作物的所有品质变体 */
export function cropVariants(inventory: Record<string, number>, baseId: string): { id: string; q: number; n: number }[] {
  const out: { id: string; q: number; n: number }[] = []
  Object.entries(inventory).forEach(([id, n]) => {
    const { base, q } = parseItem(id)
    if (base === baseId) out.push({ id, q, n })
  })
  return out.sort((a, b) => a.q - b.q)
}

// -------------------- 假 MMO 数据 --------------------
export const FAKE_PLAYERS = [
  '种田大户老王', '精灵大师小樱', '肝帝本帝', '摸鱼选手阿茶', '农场主李大壮',
  '结晶收藏家', '不眠的守夜人', '胡萝卜杀手', '云端牧歌', '奶牛皮卡丘',
  '一颗小灵莓', '风之旅人', '星尘召唤师', '羊毛大亨', '萌新求带',
]

export const CHAT_TEMPLATES = [
  '{p} 在世界频道喊：有没有人组队打苍穹古龙？来个森罗守卫奶妈！',
  '{p} 晒出了刚进化的 {e} 星辉法师，全频道沸腾了！',
  '{p}：今天的灵莓大丰收，卖了 500 金币嘿嘿',
  '{p} 融合出了闪光 ✨ 光系小精灵，欧皇本皇！',
  '{p}：萌新提问，绵绵羊不吃胡萝卜怎么办？在线等',
  '{p} 对苍穹古龙造成了 9999 点伤害！',
  '{p}：收光结晶，50 金币一枚，无限收！',
  '{p} 的烈焰斗士一刀秒了月夜魔狼，离谱！',
  '{p}：这游戏种田真上头，我已经种了一整夜了',
  '{p} 在世界BOSS战中拿下了最后一击！',
  '{p}：谁知道花奶牛为什么不下奶？——要先喂金玉米啊兄弟',
  '{p} 的农场被评为「今日最美农场」🌸',
]
