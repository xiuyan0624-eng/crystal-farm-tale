/**
 * 全站唯一的一套图标：24 网格、1.75 描边、圆头圆角、currentColor。
 *
 * 界面导航和操作只用这里的 SVG；emoji 只当内容贴纸（作物、动物、元素），
 * 放进 .sticker-tile / .chip 里，这样「字符」和「图标」不再混着当按钮用。
 */
import type { CSSProperties, ReactNode } from 'react'

export type IconName =
  | 'farm' | 'crucible' | 'bottle' | 'book' | 'swords'
  | 'drop' | 'basket' | 'shovel' | 'tractor' | 'arrowUp'
  | 'coin' | 'gem' | 'users' | 'chat' | 'send'
  | 'close' | 'minus' | 'plus' | 'sparkle' | 'egg' | 'clock' | 'leaf' | 'refresh' | 'edit'
  | 'shield' | 'paw' | 'lock' | 'volume' | 'mute'
  | 'fert' | 'bug' | 'pail' | 'feed'
  | 'fiber' | 'hide' | 'dust' | 'fang' | 'scale'

type IconProps = {
  name: IconName
  size?: number
  className?: string
  style?: CSSProperties
}

/** 一套图形共用的描边参数。 */
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const paths: Record<IconName, ReactNode> = {
  farm: (
    <>
      <path d="M4 20V11l8-6 8 6v9" {...stroke} />
      <path d="M4 20h16" {...stroke} />
      <path d="M9.5 20v-5.5h5V20" {...stroke} />
    </>
  ),
  crucible: (
    <>
      <path d="M5.2 10.5h13.6l-1.2 6.2a4.2 4.2 0 0 1-4.1 3.3h-3a4.2 4.2 0 0 1-4.1-3.3L5.2 10.5Z" {...stroke} />
      <path d="M3.8 10.5h16.4" {...stroke} />
      <path d="M10 7.2c0-1 1-1.4 1-2.4M14 7.2c0-1 .8-1.3.8-2.2" {...stroke} />
    </>
  ),
  bottle: (
    <>
      <path d="M10 3.5h4v2.2l1.6 2.1V19a1.8 1.8 0 0 1-1.8 1.8h-4a1.8 1.8 0 0 1-1.8-1.8V7.8L10 5.7V3.5Z" {...stroke} />
      <path d="M9 12h6M9 15.2h6" {...stroke} />
    </>
  ),
  book: (
    <>
      <path d="M12 6.2C10 4.8 7.4 4.2 4.6 4.2v12.4c2.8 0 5.4.6 7.4 2 2-1.4 4.6-2 7.4-2V4.2c-2.8 0-5.4.6-7.4 2Z" {...stroke} />
      <path d="M12 6.2v12.4" {...stroke} />
    </>
  ),
  swords: (
    <>
      <path d="M14.6 8.4 20 3.5l.6 5.8-3.3 3.3" {...stroke} />
      <path d="M14.6 8.4 5.2 18.4a1.6 1.6 0 0 1-2.3 0l-.5-.5a1.6 1.6 0 0 1 0-2.3l9.4-9.4" {...stroke} />
      <path d="M7.6 12.6l3.9 3.9M3.4 16.6l4 4" {...stroke} />
      <path d="M9.4 15.6 20.5 15.6" {...stroke} opacity={0} />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6v5.4c0 4.1-2.9 7.3-7 8.6-4.1-1.3-7-4.5-7-8.6V6l7-2.5Z" {...stroke} />
      <path d="M12 8v7" {...stroke} />
    </>
  ),
  paw: (
    <>
      <path d="M8.4 12.2c1.9.4 3.4 1.9 3.6 3.6.2 1.9-1.5 3.3-3.4 3.1-2.2-.2-4.2-1.8-4.5-3.8-.3-1.7 1.1-3.2 2.7-3l1.6.1Z" {...stroke} />
      <circle cx="7" cy="8" r="1.7" {...stroke} />
      <circle cx="11.6" cy="6.6" r="1.6" {...stroke} />
      <circle cx="16" cy="8.4" r="1.6" {...stroke} />
      <path d="M15.2 14.6c1.3-.8 3-.3 3.6 1 .6 1.3-.2 2.8-1.6 3.2-1.3.4-2.7-.4-3.1-1.7" {...stroke} />
    </>
  ),
  volume: (
    <>
      <path d="M4.5 9.5h3l4-3.2v11.4l-4-3.2h-3Z" {...stroke} />
      <path d="M15 9a4.2 4.2 0 0 1 0 6" {...stroke} />
      <path d="M17.6 6.6a7.6 7.6 0 0 1 0 10.8" {...stroke} />
    </>
  ),
  mute: (
    <>
      <path d="M4.5 9.5h3l4-3.2v11.4l-4-3.2h-3Z" {...stroke} />
      <path d="M15.2 9.6l4.6 4.8" {...stroke} />
      <path d="M19.8 9.6l-4.6 4.8" {...stroke} />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" {...stroke} />
      <path d="M8.6 10.5V8a3.4 3.4 0 0 1 6.8 0v2.5" {...stroke} />
      <path d="M12 14.2v2.2" {...stroke} />
    </>
  ),
  drop: <path d="M12 3.5c3.4 3.9 5.8 6.9 5.8 9.8a5.8 5.8 0 0 1-11.6 0c0-2.9 2.4-5.9 5.8-9.8Z" {...stroke} />,
  basket: (
    <>
      <path d="M8.6 9.2c0-1.9 1.5-3.4 3.4-3.4s3.4 1.5 3.4 3.4" {...stroke} />
      <path d="M5 9.2h14l-2 8.6a1.8 1.8 0 0 1-1.8 1.4H8.8a1.8 1.8 0 0 1-1.8-1.4L5 9.2Z" {...stroke} />
      <path d="M6.2 13.4h11.6" {...stroke} />
    </>
  ),
  shovel: (
    <>
      <path d="M12 3.5v8.2" {...stroke} />
      <path d="M15.6 4.6 12 3.5 8.4 4.6" {...stroke} />
      <path d="M7.4 15.2c0-1.9 2.1-3.4 4.6-3.4s4.6 1.5 4.6 3.4V20H7.4v-4.8Z" {...stroke} />
    </>
  ),
  tractor: (
    <>
      <path d="M4 17.5V9.2h5.2l2.2 3.4h5.2" {...stroke} />
      <circle cx="7.4" cy="17.6" r="2.6" {...stroke} />
      <circle cx="17" cy="17.6" r="2.6" {...stroke} />
      <path d="M16.6 12.6v2.4" {...stroke} />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19.5V5.2" {...stroke} />
      <path d="M6.4 10.8 12 5.2l5.6 5.6" {...stroke} />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="7.8" {...stroke} />
      <path d="M12 8.3v7.4M9.6 10.2h4.1a1.7 1.7 0 0 1 0 3.4H9.6" {...stroke} />
    </>
  ),
  fiber: (
    <>
      <path d="M9 20c0-4 0-8 0-12M12 20c0-4.4 0-8.8 0-13M15 20c0-4 0-8 0-12" {...stroke} />
      <path d="M8.4 8.6c.7-1.1 1.6-1.7 2.6-1.9M11.4 7.4c.7-1.2 1.7-1.9 2.7-2.1M14.4 8.4c.7-1.1 1.6-1.7 2.6-1.9" {...stroke} />
      <path d="M8 15.4h8" {...stroke} />
    </>
  ),
  hide: (
    <>
      <path d="M7 8.4c0-1.3 2.2-2.4 5-2.4s5 1.1 5 2.4c0 1.2-.9 2-1.5 2.9-.5.8-.7 1.7-.7 2.5 0 .9-.4 1.4-1 1.7-1.2.6-2.4.6-3.6 0-.6-.3-1-.8-1-1.7 0-.8-.2-1.7-.7-2.5C7.9 10.4 7 9.6 7 8.4Z" {...stroke} />
      <path d="M9.4 6.9c-.5.3-.8.7-.8 1.1M14.6 6.9c.5.3.8.7.8 1.1" {...stroke} />
    </>
  ),
  dust: (
    <>
      <path d="M12 4.6l1.5 3.3 3.3 1.5-3.3 1.5L12 14.2l-1.5-3.3L7.2 9.4l3.3-1.5L12 4.6Z" {...stroke} />
      <path d="M17.6 14.6l.5 1.6 1.6.5-1.6.5-.5 1.6-.5-1.6-1.6-.5 1.6-.5.5-1.6Z" {...stroke} />
      <path d="M6.2 15.2l.4 1.2 1.2.4-1.2.4-.4 1.2-.4-1.2-1.2-.4 1.2-.4.4-1.2Z" {...stroke} />
    </>
  ),
  fang: (
    <>
      <path d="M7.6 5.2h8.8l-3 5.4c-.5.9-1.1 1.7-1.4 2.4-.3-.7-.9-1.5-1.4-2.4l-3-5.4Z" {...stroke} />
      <path d="M11 12.9v3.6c0 1 .4 1.7 1 2.1.6-.4 1-1.1 1-2.1v-3.6" {...stroke} />
    </>
  ),
  scale: (
    <>
      <path d="M4.8 12.4h14.4" {...stroke} />
      <path d="M12 4.8a10 10 0 0 1 7.2 7.6H4.8A10 10 0 0 1 12 4.8Z" {...stroke} />
      <path d="M12 8.2a6 6 0 0 1 4 4.2H8a6 6 0 0 1 4-4.2Z" {...stroke} />
    </>
  ),
  fert: (
    <>
      <path d="M8.6 8.2h6.8l1.2 10.3a2 2 0 0 1-2 2.3H9.4a2 2 0 0 1-2-2.3L8.6 8.2Z" {...stroke} />
      <path d="M9.6 8.2c0-1.6 1.1-2.7 2.4-2.7s2.4 1.1 2.4 2.7" {...stroke} />
      <path d="M9 11.6h6" {...stroke} />
    </>
  ),
  bug: (
    <>
      <ellipse cx="12" cy="13.4" rx="4.2" ry="5" {...stroke} />
      <path d="M9.6 5.8 10.8 7.6M14.4 5.8 13.2 7.6" {...stroke} />
      <path d="M7.9 10.6 5.4 9.6M16.1 10.6l2.5-1M7.6 14.2H5M16.4 14.2H19M8 17.6l-2.2 1.1M16 17.6l2.2 1.1" {...stroke} />
      <circle cx="10.4" cy="12.4" r="0.95" fill="currentColor" stroke="none" />
      <circle cx="13.6" cy="15" r="0.95" fill="currentColor" stroke="none" />
    </>
  ),
  feed: (
    <>
      {/* 喂食：一只食槽 + 槽里的颗粒 */}
      <path d="M4 12.2h16" {...stroke} />
      <path d="M5.4 12.2c0 4.1 3 7.2 6.6 7.2s6.6-3.1 6.6-7.2" {...stroke} />
      <circle cx="9.2" cy="15.4" r="0.95" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16.4" r="0.95" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="15.4" r="0.95" fill="currentColor" stroke="none" />
    </>
  ),
  pail: (
    <>
      <path d="M8.2 8.6h7.6l-1 10.6a2 2 0 0 1-2 1.8h-1.6a2 2 0 0 1-2-1.8L8.2 8.6Z" {...stroke} />
      <path d="M9 8.6c0-1.9 1.3-3.2 3-3.2s3 1.3 3 3.2" {...stroke} />
      <path d="M8.7 12.4h6.6" {...stroke} />
      <path d="M10 16.6h4" {...stroke} />
    </>
  ),
  gem: (
    <>
      <path d="M12 3.5 17 8l-1.7 10.2L12 20.5l-3.3-2.3L7 8l5-4.5Z" {...stroke} />
      <path d="M7 8h10M12 3.5v17" {...stroke} />
    </>
  ),
  users: (
    <>
      <circle cx="9.2" cy="8.6" r="2.9" {...stroke} />
      <path d="M3.8 19.4c.3-3 2.7-4.8 5.4-4.8s5.1 1.8 5.4 4.8" {...stroke} />
      <path d="M15.6 6.2a2.7 2.7 0 0 1 0 5.2M16.6 14.9c2 .5 3.4 2.2 3.6 4.5" {...stroke} />
    </>
  ),
  chat: (
    <>
      <path d="M4.2 6.6h15.6v9.6H11l-4.4 3.4v-3.4H4.2V6.6Z" {...stroke} />
      <path d="M8.4 10.4h.1M12 10.4h.1M15.6 10.4h.1" {...stroke} strokeWidth={2.4} />
    </>
  ),
  send: <path d="M3.8 12 20 4.5l-4.2 15L12 14l-8.2-2Z M12 14l3.8-5.2" {...stroke} />,
  close: <path d="m6.4 6.4 11.2 11.2M17.6 6.4 6.4 17.6" {...stroke} />,
  minus: <path d="M6 12h12" {...stroke} />,
  plus: <path d="M12 6v12M6 12h12" {...stroke} />,
  sparkle: (
    <>
      <path d="M12 4.2 13.6 10l5.8 1.6-5.8 1.6L12 19l-1.6-5.8L4.6 11.6 10.4 10 12 4.2Z" {...stroke} />
      <path d="M18.4 4.6v2.6M17.1 5.9h2.6" {...stroke} />
    </>
  ),
  egg: (
    <>
      <path d="M12 3.8c3.2 0 5.6 4.5 5.6 8.6 0 3.7-2.4 6.3-5.6 6.3s-5.6-2.6-5.6-6.3c0-4.1 2.4-8.6 5.6-8.6Z" {...stroke} />
      <circle cx="10.1" cy="12.2" r="0.7" {...stroke} strokeWidth={1.2} />
      <circle cx="13.9" cy="15.1" r="0.7" {...stroke} strokeWidth={1.2} />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="7.8" {...stroke} />
      <path d="M12 7.8V12l2.8 1.8" {...stroke} />
    </>
  ),
  leaf: (
    <>
      <path d="M5.2 18.8c-1.2-6 3-12.6 13.6-13.6 1 10.6-5.6 14.8-11.6 13.6" {...stroke} />
      <path d="M5.2 18.8 12.4 11.6" {...stroke} />
    </>
  ),
  edit: (
    <>
      <path d="M4.8 19.2v-3.4L15.2 5.4a1.8 1.8 0 0 1 2.5 0l0.9 0.9a1.8 1.8 0 0 1 0 2.5L8.2 19.2H4.8Z" {...stroke} />
      <path d="M14.2 6.4 17.6 9.8" {...stroke} />
    </>
  ),
  refresh: (
    <>
      <path d="M19.2 12a7.2 7.2 0 1 1-2.1-5.1" {...stroke} />
      <path d="M19.6 4.6v4.2h-4.2" {...stroke} />
    </>
  ),
}

/** 渲染一个图标。 */
export default function Icon({ name, size = 18, className, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flex: 'none', ...style }}
    >
      {paths[name]}
    </svg>
  )
}
