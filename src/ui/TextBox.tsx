import { useEffect, useState } from 'react'
import { play } from '../lib/sfx'

/** Text where |words| between pipes are highlighted gold, like key words in game dialog. */
export function Rich({ text }: { text: string }) {
  return <>{text.split('|').map((part, i) => (i % 2 ? <span key={i} className="hl">{part}</span> : part))}</>
}

/** The dialog box: types one page at a time; tap to finish the page, tap again to advance. */
export function TextBox({ pages, onDone, speaker }: { pages: string[]; onDone: () => void; speaker?: string }) {
  const [page, setPage] = useState(0)
  const [shown, setShown] = useState(0)
  const full = pages[page] ?? ''
  const plain = full.replace(/\|/g, '').length
  const done = shown >= plain

  useEffect(() => { setShown(0) }, [page])
  useEffect(() => {
    if (done) return
    const t = setTimeout(() => setShown((s) => s + 1), 18)
    return () => clearTimeout(t)
  }, [shown, done])

  const advance = () => {
    if (!done) return setShown(plain)
    play('click')
    if (page < pages.length - 1) setPage(page + 1)
    else onDone()
  }

  const parts = full.split('|')
  const visibleParts: string[] = []
  for (let i = 0, left = shown; i < parts.length; i++) { visibleParts.push(parts[i].slice(0, Math.max(0, left))); left -= parts[i].length }
  const visible = visibleParts.join('|')

  return (
    <div className="textbox-wrap" onClick={advance} role="dialog">
      <div className="textbox">
        {speaker && <div className="speaker skyrim-font">{speaker}</div>}
        <p className="serif"><Rich text={visible} /></p>
        {done && <span className={`cue ${page < pages.length - 1 ? 'more' : 'end'}`} />}
      </div>
    </div>
  )
}
