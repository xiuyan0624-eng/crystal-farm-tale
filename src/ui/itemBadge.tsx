/**
 * 物品图标的统一形态：圆形底盘 + 内容。
 * 作物/牧场产出用贴纸，水晶用元素宝石，材料与装备用「色标底 + 白线图标」。
 * 背包、农场主、战斗战利品都用这一套，避免同一种东西在三个页面三种画法。
 */
import Icon, { type IconName } from './Icon'

export const MATERIAL_TINT: Record<string, string> = {
  fiber: '#9DBE7C', hide: '#C68C5A', dust: '#C9A227', fang: '#C9744F', scale: '#D37A96',
  ember: '#E0803C', fert: '#8C7A62', fert_rare: '#7C9B64',
  egg: '#E7B453', milk: '#C9D6DC', wool: '#E5D6C3',
}
export const EQUIP_TINT: Record<string, string> = { tool: '#B08356', outfit: '#C98BA0', charm: '#C9A227' }

export function materialIconName(id: string): IconName {
  const base = id.replace(/_q\d+$/, '')
  if (base.startsWith('crystal_')) return 'gem'
  switch (base) {
    case 'fiber': return 'fiber'
    case 'hide': return 'hide'
    case 'dust': return 'dust'
    case 'fang': return 'fang'
    case 'scale': return 'scale'
    case 'ember': return 'sparkle'
    case 'egg': return 'egg'
    case 'milk': return 'bottle'
    case 'wool': return 'paw'
    case 'fert': case 'fert_rare': return 'fert'
    default: return 'leaf'
  }
}

export function equipIconName(id: string): IconName {
  if (id.startsWith('hoe')) return 'shovel'
  if (id.startsWith('bell')) return 'sparkle'
  if (/^(apron|dress|coat|kimono)/.test(id)) return 'shirt'
  return 'gem'
}

type Props = { id: string; size?: number; tint?: string; kind?: 'material' | 'equip' }

/** 一个 24px 的圆形徽章：贴纸 / 元素宝石 / 色标线描三选一 */
export default function ItemBadge({ id, size = 24, tint, kind = 'material' }: Props) {
  const inner = size <= 20 ? 11 : 13
  const bg = kind === 'equip' ? (tint ?? '#B08356') : (MATERIAL_TINT[id.replace(/_q\d+$/, '')] ?? '#B9AE9A')
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, background: bg }}
    >
      <Icon name={kind === 'equip' ? equipIconName(id) : materialIconName(id)} size={inner} className="text-[color:#FFFDF8]" />
    </span>
  )
}
