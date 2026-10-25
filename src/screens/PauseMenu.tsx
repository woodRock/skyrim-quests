import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CONSTELLATIONS } from '../game/constellations'
import { HOLDS, holdById } from '../game/holds'
import { ITEMS, itemById } from '../game/items'
import { buyItem, castSpell, chooseStone, isOverdue, miscDoneToday, perkStatus, shout, spellCost, unlockPerk, consumeItem } from '../game/logic'
import { fmtDue } from '../game/text'
import { SHOUTS, SHOUT_MINUTES, SKILL_MEANING, SPELLS, STONES } from '../game/spells'
import type { Quest, SpellId } from '../game/types'
import { isMuted, play, setMuted } from '../lib/sfx'
import { useGame } from '../store'
import { Constellation } from '../ui/Constellation'
import { energyEmoji, moodEmoji } from './ChronicleSheet'
import { SpellCast } from './SpellCast'

const PAGES = ['SKILLS', 'QUESTS', 'MAP', 'MAGIC', 'ITEMS', 'JOURNAL'] as const

function Skills() {
  const { file, commit } = useGame()
  const [conIdx, setConIdx] = useState(0)
  const [focus, setFocus] = useState<string | null>(null)
  if (!file) return null
  const con = CONSTELLATIONS[conIdx]
  const skill = file.skills[con.skillKey as keyof typeof file.skills]
  const perk = focus ? con.perks.find((p) => p.id === focus) : null
  const st = perk ? perkStatus(file, perk.id) : null
  return (
    <>
      <div className="skill-nav">
        <button className="arrow" onClick={() => { play('swish'); setFocus(null); setConIdx((conIdx + CONSTELLATIONS.length - 1) % CONSTELLATIONS.length) }} aria-label="Previous skill">‹</button>
        <div className="center">
          <div className="skyrim-font big">{con.name} <span className="gold">{skill.level}</span></div>
          <div className="meaning">{SKILL_MEANING[con.skillKey as keyof typeof SKILL_MEANING]} · {skill.xp}/{skill.xpToNext} XP</div>
        </div>
        <button className="arrow" onClick={() => { play('swish'); setFocus(null); setConIdx((conIdx + 1) % CONSTELLATIONS.length) }} aria-label="Next skill">›</button>
      </div>
      <div className="con-wrap"><Constellation con={con} file={file} focused={focus} onStar={(id) => { play('click'); setFocus(id) }} size={260} /></div>
      <div className="perk-info">
        {perk && st ? (
          <>
            <div className="skyrim-font gold">{perk.name}</div>
            <p className="serif">{perk.description}</p>
            {st.owned ? <div className="meaning">unlocked · this skill trains 5% faster per perk</div>
              : <button className="btn gold small skyrim-font" disabled={!st.available} onClick={() => { const r = unlockPerk(file, perk.id); play('skillup'); commit(r.file, r.events); setFocus(null) }}>
                  {!st.linked ? 'NEEDS THE LINKED STAR' : st.have < st.need ? `NEEDS ${con.name} ${st.need} (YOU: ${st.have})` : file.perkPoints <= 0 ? 'NO PERK POINTS' : 'UNLOCK · 1 POINT'}
                </button>}
          </>
        ) : <div className="meaning">Tap a star. Perk points: <b className="gold">{file.perkPoints}</b></div>}
      </div>
    </>
  )
}

function Map() {
  const { file, travel } = useGame()
  if (!file) return null
  return (
    <div className="holds">
      {HOLDS.map((h) => {
        const open = file.holds.includes(h.id)
        const here = file.hold === h.id
        const active = file.quests.filter((q) => q.hold === h.id && !q.doneAt).length
        return (
          <button key={h.id} className={`hold-card ${here ? 'here' : ''}`} disabled={!open || here} onClick={() => { play('open'); travel(h.id) }} style={open ? { background: `linear-gradient(${h.sky[0]}, ${h.sky[1]})` } : undefined}>
            <span className="skyrim-font">{open ? h.name : '???'}</span>
            <span className="serif sub">{open ? h.hint : h.unlock}</span>
            {open && <span className="meaning">{here ? 'you are here' : `${active} active`}</span>}
          </button>
        )
      })}
    </div>
  )
}

function Magic() {
  const { file, commit } = useGame()
  const [casting, setCasting] = useState<SpellId | null>(null)
  if (!file) return null
  const now = Date.now()
  const cast = (id: SpellId) => { const r = castSpell(file, id); if (r.file === file) return play('close'); play('spell'); commit(r.file); setCasting(id) }
  const doShout = (id: 'fus' | 'tiid' | 'feim') => { const r = shout(file, id); if (r.file === file) return play('close'); play('spell'); commit(r.file) }
  const effects = [
    file.surgeUntil > now && `🔥 Focus Surge · double XP for ${Math.ceil((file.surgeUntil - now) / 60_000)} min`,
    file.slowUntil > now && `⏳ Slow Time · messages paused ${Math.ceil((file.slowUntil - now) / 60_000)} min`,
    file.zen && '🧘 Zen · the bars are hidden',
    file.stone && `${STONES.find((s) => s.id === file.stone)!.icon} ${STONES.find((s) => s.id === file.stone)!.name}`,
    file.equipped && `${itemById(file.equipped).icon} ${itemById(file.equipped).name}`,
  ].filter(Boolean) as string[]
  return (
    <>
      <div className="section skyrim-font">SPELLS <span className="meaning">magicka {file.magicka}/{file.magickaMax}</span></div>
      {SPELLS.map((s) => (
        <button key={s.id} className="list-row" disabled={file.magicka < spellCost(file, s.id)} onClick={() => cast(s.id)}>
          <span><span className="skyrim-font">{s.name}</span><span className="serif sub">{s.effect}</span></span>
          <span className="cost skyrim-font">{spellCost(file, s.id)}</span>
        </button>
      ))}
      <div className="section skyrim-font">SHOUTS <span className="meaning">stamina {file.stamina}/{file.staminaMax}</span></div>
      {SHOUTS.map((s) => {
        const words = file.shoutWords[s.id]
        return (
          <button key={s.id} className="list-row" disabled={words < 1 || file.stamina < s.cost} onClick={() => doShout(s.id)}>
            <span><span className="skyrim-font">{s.name}</span><span className="words">{s.words.map((w, i) => <b key={w} className={i < words ? 'known' : ''}>{w}</b>)}</span><span className="serif sub">{words ? `${s.effect.split('.')[0]}${s.id === 'feim' ? '' : ` · ${SHOUT_MINUTES[words]} min`}` : 'Slay a dragon to learn a word.'}</span></span>
            <span className="cost skyrim-font">{s.cost}⚡</span>
          </button>
        )
      })}
      <div className="section skyrim-font">ACTIVE EFFECTS</div>
      {effects.length === 0 && <div className="meaning">None. Choose a sign at the Guardian Stones, wear gear, or shout.</div>}
      {effects.map((e) => <div key={e} className="effect serif">{e}</div>)}
      <AnimatePresence>{casting && <SpellCast key={casting} spell={casting} onDone={() => setCasting(null)} />}</AnimatePresence>
    </>
  )
}

function Items() {
  const { file, commit } = useGame()
  const [tab, setTab] = useState<'bag' | 'shop'>('bag')
  if (!file) return null
  return (
    <>
      <div className="switch two">
        <button aria-pressed={tab === 'bag'} onClick={() => { play('click'); setTab('bag') }}><span className="skyrim-font">INVENTORY</span></button>
        <button aria-pressed={tab === 'shop'} onClick={() => { play('click'); setTab('shop') }}><span className="skyrim-font">BELETHOR'S</span></button>
      </div>
      <div className="gold-line skyrim-font">GOLD <b className="gold">{file.gold}</b></div>
      {tab === 'bag' ? (
        <>
          {file.items.length === 0 && <div className="meaning">Nothing carried. Dragons drop items; Belethor sells them.</div>}
          {file.items.map((inst) => {
            const it = itemById(inst.id)
            const eq = file.equipped === it.id && it.kind === 'gear'
            return (
              <button key={inst.uid} className="list-row" onClick={() => { const r = consumeItem(file, inst.uid); play('item'); commit(r.file, r.events) }}>
                <span><span className="skyrim-font">{it.icon} {it.name}{eq ? ' · worn' : ''}</span><span className="serif sub">{it.text}</span></span>
                <span className="cost skyrim-font">{it.kind === 'gear' ? (eq ? 'REMOVE' : 'WEAR') : it.kind === 'book' ? 'READ' : 'DRINK'}</span>
              </button>
            )
          })}
        </>
      ) : (
        <>
          <p className="meaning">"Everything's for sale, my friend. Everything."</p>
          {ITEMS.map((it) => (
            <button key={it.id} className="list-row" disabled={file.gold < it.price} onClick={() => { const r = buyItem(file, it.id); play('item'); commit(r.file, r.events) }}>
              <span><span className="skyrim-font">{it.icon} {it.name}</span><span className="serif sub">{it.text}</span></span>
              <span className="cost skyrim-font">{it.price}g</span>
            </button>
          ))}
        </>
      )}
    </>
  )
}

const KIND = { main: 0, side: 1, misc: 2 } as const
const questOrder = (a: Quest, b: Quest) => KIND[a.kind] - KIND[b.kind] || (a.due ?? '9999').localeCompare(b.due ?? '9999') || b.createdAt - a.createdAt

/** Every open quest in Skyrim, grouped by hold. Tap one to go where it is. */
function Quests() {
  const { file, travel, setPaused } = useGame()
  if (!file) return null
  const active = file.quests.filter((q) => !q.doneAt)
  const overdue = active.filter((q) => isOverdue(q)).length
  const finished = file.quests.filter((q) => q.doneAt)
  const recent = [...finished].sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)).slice(0, 20)
  const go = (q: Quest) => { if (q.hold === file.hold) { play('close'); setPaused(false) } else { play('swish'); travel(q.hold) } }
  return (
    <>
      <div className="section skyrim-font">ALL QUESTS <span className="meaning">{active.length} open{overdue > 0 ? ` · ${overdue} overdue` : ''} · {finished.length} done</span></div>
      {active.length === 0 && <div className="meaning">No open quests. Press NEW QUEST in any hold.</div>}
      {HOLDS.filter((h) => active.some((q) => q.hold === h.id)).map((h) => (
        <div key={h.id} className="qgroup">
          <div className="section skyrim-font">{h.name} <span className="meaning">{h.id === file.hold ? 'you are here' : 'tap a quest to travel'}</span></div>
          {active.filter((q) => q.hold === h.id).sort(questOrder).map((q) => {
            const late = isOverdue(q)
            const objs = q.objectives ?? []
            return (
              <button key={q.id} className={`qrow ${late ? 'late' : ''}`} onClick={() => go(q)}>
                <span className={`diamond ${q.kind} ${q.kind === 'misc' && miscDoneToday(q) ? 'filled' : ''}`} />
                <span className="body">
                  <span className="skyrim-font">{q.title}</span>
                  <span className="serif sub">
                    {q.kind === 'main' ? `main quest · ${objs.filter((o) => o.done).length}/${objs.length} objectives` : q.kind === 'misc' ? (miscDoneToday(q) ? 'daily · done today' : 'daily') : 'side quest'}
                    {' · '}{q.skill}{q.due && <> · <span className={late ? 'late' : ''}>{fmtDue(q.due)}</span></>}
                  </span>
                </span>
                <span className="cost skyrim-font">{h.id === file.hold ? 'HERE' : 'GO'}</span>
              </button>
            )
          })}
        </div>
      ))}
      {recent.length > 0 && (
        <>
          <div className="section skyrim-font">COMPLETED <span className="meaning">most recent {recent.length}</span></div>
          {recent.map((q) => (
            <div key={q.id} className="qrow done">
              <span className={`diamond ${q.kind} filled`} />
              <span className="body">
                <span className="skyrim-font">{q.title}</span>
                <span className="serif sub">{holdById(q.hold).name} · {new Date(q.doneAt!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </span>
            </div>
          ))}
        </>
      )}
    </>
  )
}

function Journal() {
  const { file } = useGame()
  if (!file) return null
  const pages = [...file.chronicles].reverse()
  return (
    <>
      <div className="section skyrim-font">CHRONICLES <span className="meaning">{file.streak} night streak · best {file.bestStreak}</span></div>
      {pages.length === 0 && <div className="meaning">No chronicles yet. Rest at the inn tonight.</div>}
      {pages.map((c) => (
        <div key={c.day} className="page">
          <div className="skyrim-font">{new Date(c.day + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          <div className="serif sub">{moodEmoji(c.mood)} mood {c.mood} · {energyEmoji(c.energy)} energy {c.energy} · 🌙 {c.rest}h</div>
          {c.triumphs.length > 0 && <ul className="serif">{c.triumphs.map((t, i) => <li key={i}>{t}</li>)}</ul>}
        </div>
      ))}
    </>
  )
}

function Stones() {
  const { file, commit } = useGame()
  if (!file) return null
  return (
    <>
      <div className="section skyrim-font">THE GUARDIAN STONES</div>
      <p className="meaning">You stand among the stones. Choose the sign you train under; you may return to change it.</p>
      {STONES.map((s) => (
        <button key={s.id} className={`list-row ${file.stone === s.id ? 'on' : ''}`} onClick={() => { const r = chooseStone(file, s.id); if (r.file === file) return; play('spell'); commit(r.file, r.events) }}>
          <span><span className="skyrim-font">{s.icon} {s.name}</span><span className="serif sub">{s.text}</span></span>
          {file.stone === s.id && <span className="cost skyrim-font">YOURS</span>}
        </button>
      ))}
    </>
  )
}

/** Tab: Skyrim's menu as pages that rotate in. */
export function PauseMenu() {
  const { file, setPaused, quitToMenu } = useGame()
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const [sys, setSys] = useState(false)
  const [muted, setMute] = useState(isMuted())
  if (!file) return null
  const atStones = file.hold === 'stones'
  const pages = atStones ? ([...PAGES, 'STONES'] as const) : PAGES
  const page = pages[index % pages.length]

  return (
    <motion.div className="pause" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="pause-tabs">
        {pages.map((p, i) => <button key={p} className={`tab skyrim-font ${i === index % pages.length ? 'on' : ''}`} onClick={() => { setDir(i > index ? 1 : -1); setIndex(i); play('click') }}>{p}</button>)}
      </div>
      <div className="pause-stage">
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div key={page} className="subscreen" custom={dir}
            variants={{ enter: (d: number) => ({ rotateY: d * -60, x: `${d * 40}%`, opacity: 0 }), center: { rotateY: 0, x: 0, opacity: 1 }, exit: (d: number) => ({ rotateY: d * 60, x: `${d * -40}%`, opacity: 0 }) }}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeInOut' }}>
            {page === 'SKILLS' && <Skills />}
            {page === 'QUESTS' && <Quests />}
            {page === 'MAP' && <Map />}
            {page === 'MAGIC' && <Magic />}
            {page === 'ITEMS' && <Items />}
            {page === 'JOURNAL' && <Journal />}
            {page === 'STONES' && <Stones />}
          </motion.div>
        </AnimatePresence>
      </div>
      {sys ? (
        <div className="panel confirm system">
          <div className="row"><button className="btn small skyrim-font" onClick={() => { setMuted(!muted); setMute(!muted); play('click') }}>SOUND {muted ? 'OFF' : 'ON'}</button><button className="btn small skyrim-font" onClick={() => { play('close'); quitToMenu() }}>SAVE & QUIT</button></div>
          <p className="meaning">Level {file.level} · {file.souls} souls · {file.deaths} deaths · progress saves itself</p>
          <button className="btn small wide skyrim-font" onClick={() => { play('close'); setSys(false) }}>BACK</button>
        </div>
      ) : (
        <div className="pause-footer">
          <button className="btn small skyrim-font" onClick={() => { play('click'); setSys(true) }}>SYSTEM</button>
          <button className="btn gold small skyrim-font" onClick={() => { play('close'); setPaused(false) }}>RESUME</button>
        </div>
      )}
    </motion.div>
  )
}
