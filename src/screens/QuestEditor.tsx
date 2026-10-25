import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { holdById } from '../game/holds'
import { GOLD, SIDE_XP, uid } from '../game/logic'
import { SKILL_MEANING } from '../game/spells'
import type { HoldId, Objective, Quest, QuestKind, QuestSize, SkillKey } from '../game/types'
import { SKILL_KEYS } from '../game/types'
import { play } from '../lib/sfx'
import { useGame } from '../store'

export type Draft = Omit<Quest, 'id' | 'createdAt'>

const KINDS: { id: QuestKind; label: string; sub: string }[] = [
  { id: 'side', label: 'Side Quest', sub: 'One task' },
  { id: 'misc', label: 'Misc', sub: 'A daily' },
  { id: 'main', label: 'Main Quest', sub: 'A project with a dragon' },
]
const SIZES: QuestSize[] = ['small', 'medium', 'large']

export function QuestEditor({ initial, onSave, onDelete, onClose }: { initial?: Quest; onSave: (d: Draft) => void; onDelete?: () => void; onClose: () => void }) {
  const file = useGame((s) => s.file)!
  const [kind, setKind] = useState<QuestKind>(initial?.kind ?? 'side')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [skill, setSkill] = useState<SkillKey>(initial?.skill ?? 'RESTORATION')
  const [hold, setHold] = useState<HoldId>(initial?.hold ?? file.hold)
  const [size, setSize] = useState<QuestSize>(initial?.size ?? 'medium')
  const [due, setDue] = useState(initial?.due ?? '')
  const [objectives, setObjectives] = useState<Objective[]>(initial?.objectives ?? [{ id: uid(), title: '', done: false }])
  const [dragon, setDragon] = useState(initial?.dragon ?? '')
  const [confirm, setConfirm] = useState(false)
  const editing = !!initial

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const clean = title.trim().slice(0, 80)
    if (!clean) return play('close')
    const objs = objectives.filter((o) => o.title.trim()).map((o) => ({ ...o, title: o.title.trim().slice(0, 80) }))
    if (kind === 'main' && (objs.length === 0 || !dragon.trim())) return play('close')
    play('accept')
    onSave({
      kind, title: clean, skill, hold, size: kind === 'side' ? size : 'small',
      due: kind === 'misc' ? undefined : due || undefined,
      ...(kind === 'main' ? { objectives: objs, dragon: dragon.trim().slice(0, 80) } : {}),
      ...(initial?.lastDone ? { lastDone: initial.lastDone } : {}),
      ...(initial?.lore ? { lore: initial.lore } : {}),
    })
  }

  return (
    <>
      <motion.div className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.form className="sheet" onSubmit={submit} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}>
        <h2 className="skyrim-font">{editing ? 'QUEST' : 'NEW QUEST'}</h2>
        {!editing && (
          <div className="switch">
            {KINDS.map((k) => <button type="button" key={k.id} aria-pressed={kind === k.id} onClick={() => { play('click'); setKind(k.id) }}><span className="skyrim-font">{k.label}</span><span className="sub serif">{k.sub}</span></button>)}
          </div>
        )}
        <label className="skyrim-font field" htmlFor="q-title">{kind === 'main' ? 'MAIN QUEST' : 'OBJECTIVE'}</label>
        <input id="q-title" className="input" autoFocus={!editing} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === 'main' ? 'e.g. Launch the website' : kind === 'misc' ? 'e.g. Stretch for ten minutes' : 'e.g. Return the library books'} />

        <label className="skyrim-font field">SKILL <span className="meaning">what this trains in real life</span></label>
        <div className="chips">
          {SKILL_KEYS.map((s) => <button type="button" key={s} className={`chip ${skill === s ? 'on' : ''}`} onClick={() => { play('click'); setSkill(s) }}><span className="skyrim-font">{s}</span><span className="meaning">{SKILL_MEANING[s]}</span></button>)}
        </div>

        {kind === 'side' && (
          <>
            <label className="skyrim-font field">SIZE</label>
            <div className="switch">
              {SIZES.map((s) => <button type="button" key={s} aria-pressed={size === s} onClick={() => { play('click'); setSize(s) }}><span className="skyrim-font">{s}</span><span className="sub serif">{GOLD[s]} gold · {SIDE_XP[s]} XP</span></button>)}
            </div>
          </>
        )}

        {kind === 'main' && (
          <>
            <label className="skyrim-font field">OBJECTIVES</label>
            {objectives.map((o, i) => (
              <div className="obj-row" key={o.id}>
                <input className="input" value={o.title} disabled={o.done} maxLength={80} placeholder={`Objective ${i + 1}`} onChange={(e) => setObjectives(objectives.map((x) => (x.id === o.id ? { ...x, title: e.target.value } : x)))} />
                {!o.done && objectives.length > 1 && <button type="button" className="icon-btn" aria-label="Remove" onClick={() => setObjectives(objectives.filter((x) => x.id !== o.id))}>×</button>}
              </div>
            ))}
            <button type="button" className="btn small wide skyrim-font" onClick={() => { play('click'); setObjectives([...objectives, { id: uid(), title: '', done: false }]) }}>+ OBJECTIVE</button>
            <label className="skyrim-font field" htmlFor="q-dragon">THE DRAGON <span className="meaning">the final step</span></label>
            <input id="q-dragon" className="input" value={dragon} maxLength={80} onChange={(e) => setDragon(e.target.value)} placeholder="e.g. Press publish" />
          </>
        )}

        <label className="skyrim-font field">HOLD</label>
        <div className="chips">
          {file.holds.filter((h) => h !== 'stones').map((h) => <button type="button" key={h} className={`chip ${hold === h ? 'on' : ''}`} onClick={() => { play('click'); setHold(h) }}><span className="skyrim-font">{holdById(h).name}</span><span className="meaning">{holdById(h).hint}</span></button>)}
        </div>

        {kind !== 'misc' && (
          <>
            <label className="skyrim-font field" htmlFor="q-due">DUE <span className="meaning">optional; overdue quests cost health</span></label>
            <input id="q-due" className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </>
        )}

        <div className="row">
          <button type="button" className="btn skyrim-font" onClick={() => { play('close'); onClose() }}>CANCEL</button>
          <button className="btn gold skyrim-font">{editing ? 'SAVE' : 'ACCEPT'}</button>
        </div>
        {onDelete && (confirm
          ? <div className="row" style={{ marginTop: 10 }}><button type="button" className="btn danger small skyrim-font" onClick={() => { play('damage'); onDelete() }}>ABANDON IT</button><button type="button" className="btn small skyrim-font" onClick={() => setConfirm(false)}>KEEP IT</button></div>
          : <button type="button" className="btn danger small wide skyrim-font" style={{ marginTop: 10 }} onClick={() => { play('click'); setConfirm(true) }}>ABANDON QUEST</button>)}
      </motion.form>
    </>
  )
}
