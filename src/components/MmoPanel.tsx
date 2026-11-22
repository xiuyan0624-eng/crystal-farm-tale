import { useEffect, useRef, useState } from 'react'
import { FAKE_PLAYERS } from '../game/data'
import type { GameApi } from '../game/useGame'
import Icon from '../ui/Icon'

export default function MmoPanel({ game }: { game: GameApi }) {
  const { state } = game
  const chatRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [state.chat.length])

  const online = FAKE_PLAYERS.slice(0, 8 + (state.chat.length % 5))

  const send = () => {
    if (!input.trim()) return
    game.notify(`世界频道：${input.trim()}`)
    setInput('')
  }

  return (
    <div className="space-y-3">
      {/* 在线玩家 */}
      <section className="card p-3">
        <h4 className="section-title mb-2 text-caption">
          <Icon name="users" size={15} className="text-inksoft" />
          在线玩家
          <span className="ml-auto pill-soft num">{online.length + 1}</span>
        </h4>
        <ul className="space-y-1">
          <li className="flex items-center gap-2 text-caption font-semibold text-ink">
            <span className="h-2 w-2 rounded-full bg-berry" />
            你（农场主）
          </li>
          {online.map(p => (
            <li key={p} className="flex items-center gap-2 text-caption text-inksoft">
              <span className="h-2 w-2 rounded-full bg-sage/70" />
              {p}
            </li>
          ))}
        </ul>
      </section>

      {/* 世界频道 */}
      <section className="card flex flex-col p-3">
        <h4 className="section-title mb-2 text-caption">
          <Icon name="chat" size={15} className="text-inksoft" />
          世界频道
        </h4>
        <div ref={chatRef} className="h-56 space-y-1.5 overflow-y-auto pr-1">
          {state.chat.map(m => (
            <p key={m.id} className="text-caption leading-relaxed text-inksoft">
              <span className="num mr-1 text-micro text-inkfaint">{m.time}</span>
              {m.text}
            </p>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="说点什么…"
            className="field min-w-0 flex-1"
            aria-label="世界频道消息"
          />
          <button onClick={send} className={`${input.trim() ? 'btn-primary' : 'btn-soft'} btn-xs`} aria-label="发送">
            <Icon name="send" size={14} />
            发送
          </button>
        </div>
      </section>
    </div>
  )
}
