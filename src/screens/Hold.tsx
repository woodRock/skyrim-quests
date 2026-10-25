import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { holdById } from '../game/holds'
import { addQuest, completeSide, isOverdue, markMisc, markTip, miscDoneToday, removeQuest, today, updateQuest } from '../game/logic'
import { LYDIA_TIPS, SKILL_MEANING } from '../game/spells'
import type { Quest } from '../game/types'
import { questLore } from '../lib/lore'
import { play } from '../lib/sfx'
import { useGame } from '../store'
import { Bars, Compass } from '../ui/Hud'
import { TextBox } from '../ui/TextBox'
import { ChronicleSheet } from './ChronicleSheet'
import { LevelUp } from './LevelUp'
import { MainQuestView } from './MainQuestView'
import { PauseMenu } from './PauseMenu'
import { QuestEditor, type Draft } from './QuestEditor'

type Sheet = { type: 'new' } | { type: 'edit'; id: string } | { type: 'main'; id: string } | { type: 'chronicle' } | null

const fmtDue = (due: string) => {
  const diff = Math.round((Date.parse(due + 'T00:00:00') - Date.parse(today() + 'T00:00:00')) / 86_400_000)
  if (diff === 0) return 'due today'
  if (diff === 1) return 'due tomorrow'
  if (diff < 0) return `${-diff} day${diff === -1 ? '' : 's'} overdue`
  return `due ${new Date(due + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}

function Row({ q, onOpen, onAct }: { q: Quest; onOpen: () => void; onAct: () => void }) {
  const overdue = isOverdue(q)
  const done = !!q.doneAt || miscDoneToday(q)
  const objs = q.objectives ?? []
  const cleared = objs.filter((o) => o.done).length
  const [burst, setBurst] = useState(0)
  const act = () => { if (!done && q.kind !== 'main') setBurst(Date.now()); onAct() }
  return (
    <div className={`quest ${overdue ? 'overdue' : ''} ${done ? 'done' : ''} ${burst ? 'celebrate' : ''}`} key={burst}>
      <button className="q-act" onClick={act} disabled={done} aria-label={q.kind === 'main' ? 'Open main quest' : q.kind === 'misc' ? 'Mark done today' : 'Complete quest'}>
        <span className={`diamond ${q.kind} ${done ? 'filled' : ''}`} />
      </button>
      <button className="q-main" onClick={onOpen}>
        <span className="q-title skyrim-font">{q.title}</span>
        <span className="q-meta serif">
          {q.skill} <i className="meaning">· {SKILL_MEANING[q.skill]}</i>
          {q.kind === 'main' && <span> · {cleared}/{objs.length} objectives</span>}
          {q.kind === 'misc' && <span> · {done ? 'done today' : 'today'}</span>}
          {q.due && !q.doneAt && <span className={overdue ? 'late' : ''}> · {fmtDue(q.due)}</span>}
        </span>
        {q.kind === 'main' && objs.length > 0 && <span className="progress"><span style={{ width: `${(cleared / objs.length) * 100}%` }} /></span>}
      </button>
      {burst > 0 && <span className="xp-float skyrim-font">+{q.kind === 'misc' ? 15 : { small: 20, medium: 40, large: 80 }[q.size]} {q.skill}</span>}
    </div>
  )
}

/** The one game screen: the hold you stand in, its quests, your bars, three buttons. */
export function Hold() {
  const { file, commit, events, paused, setPaused, loading, died } = useGame()
  const [sheet, setSheet] = useState<Sheet>(null)
  const [tip, setTip] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)
  const hold = file ? holdById(file.hold) : null

  const quests = useMemo(() => (file?.quests ?? []).filter((q) => q.hold === file?.hold), [file?.quests, file?.hold])
  const busy = !!loading || events.length > 0 || paused || !!sheet || !!tip || died || (file?.pendingLevels ?? 0) > 0

  // Lydia speaks once per tip, when nothing else is on screen.
  useEffect(() => {
    if (!file || busy) return
    const want = !file.tips.includes('welcome') ? 'welcome'
      : !file.tips.includes('overdue') && file.quests.some((q) => isOverdue(q)) ? 'overdue'
      : !file.tips.includes('misc') && file.quests.some((q) => q.kind === 'misc') ? 'misc'
      : !file.tips.includes('chronicle') && file.quests.some((q) => q.kind === 'side' && q.doneAt) && file.chronicles.length === 0 ? 'chronicle'
      : !file.tips.includes('main') && file.quests.filter((q) => q.kind === 'main').length > 1 ? 'main'
      : null
    if (want) { const t = setTimeout(() => setTip(want), 600); return () => clearTimeout(t) }
  }, [file, busy])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'Tab' && !sheet && !tip) { e.preventDefault(); play(paused ? 'close' : 'open'); setPaused(!paused) }
      if (e.key === 'Escape') { if (sheet) setSheet(null); else if (paused) setPaused(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paused, sheet, tip, setPaused])

  if (!file || !hold) return null

  const mains = quests.filter((q) => q.kind === 'main' && !q.doneAt)
  const sides = quests.filter((q) => q.kind === 'side' && !q.doneAt).sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
  const miscs = quests.filter((q) => q.kind === 'misc')
  const done = quests.filter((q) => q.doneAt).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)).slice(0, 30)
  const editing = sheet?.type === 'edit' ? file.quests.find((q) => q.id === sheet.id) : undefined
  const main = sheet?.type === 'main' ? file.quests.find((q) => q.id === sheet.id) : undefined
  const loggedToday = file.chronicles.some((c) => c.day === today())

  const act = (q: Quest) => {
    if (q.kind === 'main') { play('open'); return setSheet({ type: 'main', id: q.id }) }
    const r = q.kind === 'misc' ? markMisc(file, q.id) : completeSide(file, q.id)
    if (r.file === file) return
    play('quest')
    commit(r.file, r.events)
  }
  const open = (q: Quest) => { play('click'); setSheet(q.kind === 'main' ? { type: 'main', id: q.id } : { type: 'edit', id: q.id }) }
  const save = (d: Draft) => {
    if (sheet?.type === 'edit') { commit(updateQuest(file, sheet.id, d)); setSheet(null); return }
    const r = addQuest(file, d)
    commit(r.file, r.events)
    setSheet(null)
    // The scribe writes the lore in the background; the quest is usable at once.
    const id = r.file.quests[0].id
    void questLore(d.title, d.kind).then((lore) => { const cur = useGame.getState().file; if (cur && cur.quests.some((q) => q.id === id)) useGame.getState().commit(updateQuest(cur, id, { lore })) })
  }

  const empty = mains.length + sides.length + miscs.length === 0

  return (
    <div className="screen world">
      <div className="sky" style={{ background: `linear-gradient(${hold.sky[0]}, ${hold.sky[1]} 75%)` }} />
      <svg className="land" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 50 40 30 90 48 140 20 200 45 250 15 300 40 350 25 400 45V120H0Z" fill={hold.ground} opacity=".55" />
        <path d="M0 80c90-25 170-10 250-18s110 6 150 0V120H0Z" fill={hold.ground} />
      </svg>
      <Compass file={file} />
      <div className="hold-title">
        <span className="skyrim-font">{hold.name}</span>
        <small className="serif">{hold.hint}</small>
      </div>

      <div className="log">
        {showDone ? (
          <>
            <div className="section skyrim-font">COMPLETED</div>
            {done.length === 0 && <div className="empty serif">Nothing finished here yet.</div>}
            {done.map((q) => <Row key={q.id} q={q} onOpen={() => open(q)} onAct={() => undefined} />)}
          </>
        ) : empty ? (
          <div className="empty serif">No quests in {hold.name}.<br />Press <span className="hl">NEW QUEST</span> to take one on.</div>
        ) : (
          <>
            {mains.length > 0 && <div className="section skyrim-font">MAIN QUESTS</div>}
            {mains.map((q) => <Row key={q.id} q={q} onOpen={() => open(q)} onAct={() => act(q)} />)}
            {sides.length > 0 && <div className="section skyrim-font">SIDE QUESTS</div>}
            {sides.map((q) => <Row key={q.id} q={q} onOpen={() => open(q)} onAct={() => act(q)} />)}
            {miscs.length > 0 && <div className="section skyrim-font">MISCELLANEOUS</div>}
            {miscs.map((q) => <Row key={q.id} q={q} onOpen={() => open(q)} onAct={() => act(q)} />)}
          </>
        )}
      </div>

      <div className="hud-bottom">
        <Bars file={file} />
        <div className="buttons">
          <button className="hb skyrim-font" onClick={() => { play('open'); setSheet({ type: 'new' }) }}>NEW QUEST</button>
          <button className={`hb skyrim-font ${loggedToday ? 'dim' : 'glow'}`} onClick={() => { play('open'); if (loggedToday) setShowDone(!showDone); else setSheet({ type: 'chronicle' }) }}>{loggedToday ? (showDone ? 'ACTIVE' : 'DONE') : 'CHRONICLE'}</button>
          <button className="hb skyrim-font" onClick={() => { play('open'); setPaused(true) }}>TAB</button>
        </div>
      </div>

      <AnimatePresence>
        {(sheet?.type === 'new' || editing) && <QuestEditor key="editor" initial={editing} onSave={save} onDelete={editing ? () => { commit(removeQuest(file, editing.id)); setSheet(null) } : undefined} onClose={() => setSheet(null)} />}
        {main && <MainQuestView key="main" quest={main} onClose={() => setSheet(null)} onEdit={() => setSheet({ type: 'edit', id: main.id })} />}
        {sheet?.type === 'chronicle' && <ChronicleSheet key="chronicle" onClose={() => setSheet(null)} />}
        {paused && <PauseMenu key="pause" />}
        {file.pendingLevels > 0 && events.length === 0 && !loading && !sheet && !paused && <LevelUp key="levelup" />}
      </AnimatePresence>

      {tip && <TextBox speaker="Lydia" pages={LYDIA_TIPS[tip]} onDone={() => { commit(markTip(file, tip)); setTip(null) }} />}
    </div>
  )
}
