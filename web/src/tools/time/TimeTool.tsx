import { useEffect, useMemo, useState } from 'react'
import { Field } from '../../components/Field.tsx'
import { LocalNote } from '../../components/LocalNote.tsx'
import { useCopy } from '../../components/useCopy.ts'
import {
  defaultZones,
  formatZoneParts,
  isTimeZone,
  parseInstant,
  relativeTime,
  type InstantKind,
} from './convert.ts'

const zoneStorageKey = 'toolbox-zones'

function loadZones(): string[] {
  try {
    const raw = localStorage.getItem(zoneStorageKey)
    if (!raw) return [...defaultZones]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [...defaultZones]
    const zones = parsed.filter((item): item is string => typeof item === 'string' && isTimeZone(item))
    return zones.length > 0 ? zones : [...defaultZones]
  } catch {
    return [...defaultZones]
  }
}

function localZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

export default function TimeTool() {
  const [now, setNow] = useState(() => new Date())
  const [kind, setKind] = useState<InstantKind>('unix-s')
  const [value, setValue] = useState(() => String(Math.floor(Date.now() / 1000)))
  const [sourceZone, setSourceZone] = useState('Asia/Kuala_Lumpur')
  const [zones, setZones] = useState<string[]>(loadZones)
  const [draft, setDraft] = useState('')
  const [zoneError, setZoneError] = useState('')
  const { copied, copy } = useCopy()
  const here = localZone()

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(zoneStorageKey, JSON.stringify(zones))
    } catch {
      // The list still works for this visit.
    }
  }, [zones])

  const activeSource = zones.includes(sourceZone) ? sourceZone : (zones[0] ?? 'UTC')

  const zoneChoices = useMemo(() => {
    try {
      return Intl.supportedValuesOf('timeZone')
    } catch {
      return defaultZones
    }
  }, [])

  const matches = draft.trim()
    ? zoneChoices.filter((zone) => zone.toLowerCase().includes(draft.trim().toLowerCase())).slice(0, 30)
    : []

  const instant = parseInstant(
    kind === 'wall' ? { kind, value, timeZone: activeSource } : { kind, value },
  )

  function switchKind(next: InstantKind) {
    const current = parseInstant(kind === 'wall' ? { kind, value, timeZone: activeSource } : { kind, value })
    setKind(next)
    if (!current) {
      setValue('')
      return
    }
    if (next === 'unix-s') setValue(String(Math.floor(current.getTime() / 1000)))
    else if (next === 'unix-ms') setValue(String(current.getTime()))
    else if (next === 'iso') setValue(current.toISOString())
    else setValue(formatZoneParts(current, activeSource).iso.replace(' ', 'T'))
  }

  function useCurrent() {
    const current = new Date()
    if (kind === 'unix-s') setValue(String(Math.floor(current.getTime() / 1000)))
    else if (kind === 'unix-ms') setValue(String(current.getTime()))
    else if (kind === 'iso') setValue(current.toISOString())
    else setValue(formatZoneParts(current, activeSource).iso.replace(' ', 'T'))
  }

  function addZone(event: { preventDefault: () => void }) {
    event.preventDefault()
    const zone = draft.trim()
    if (!isTimeZone(zone)) {
      setZoneError('That time zone is not recognized.')
      return
    }
    setZones((current) => (current.includes(zone) ? current : [...current, zone]))
    setDraft('')
    setZoneError('')
  }

  const clock = formatZoneParts(now, here)

  return (
    <section className="card tool-stack">
      <h1>Timestamp & time zones</h1>
      <p className="lede">Unix time, ISO 8601, and the same moment in other time zones.</p>
      <LocalNote />
      <p className="clock">{clock.iso}</p>
      <p className="clock-sub">
        Current time · {here} · {clock.offset} · {now.toISOString()}
      </p>
      <div className="view-toggle" role="group" aria-label="Time input">
        {(
          [
            ['unix-s', 'Unix seconds'],
            ['unix-ms', 'Unix milliseconds'],
            ['iso', 'ISO 8601'],
            ['wall', 'Date and time'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={kind === id} onClick={() => switchKind(id)}>
            {label}
          </button>
        ))}
      </div>
      {kind === 'wall' ? (
        <Field label="Source time zone" htmlFor="time-source" hint="The date and time below is read in this zone.">
          <select id="time-source" className="control" value={activeSource} onChange={(event) => setSourceZone(event.target.value)}>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <Field label={kind === 'wall' ? 'Date and time' : 'Value'} htmlFor="time-value">
        {kind === 'wall' ? (
          <input
            id="time-value"
            className="control"
            type="datetime-local"
            step={1}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        ) : (
          <input
            id="time-value"
            className="control"
            value={value}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => setValue(event.target.value)}
          />
        )}
      </Field>
      <div className="actions">
        <button type="button" className="button" onClick={useCurrent}>
          Use current time
        </button>
      </div>
      {!value.trim() ? <p className="field-hint">Enter a time, or use the current time.</p> : null}
      {value.trim() && !instant ? (
        <p className="error" role="status">
          That time is not valid.
        </p>
      ) : null}
      {instant ? (
        <ul className="kv">
          <ResultRow label="Unix seconds" text={String(Math.floor(instant.getTime() / 1000))} copied={copied} onCopy={copy} id="seconds" />
          <ResultRow label="Unix milliseconds" text={String(instant.getTime())} copied={copied} onCopy={copy} id="millis" />
          <ResultRow label="ISO 8601" text={instant.toISOString()} copied={copied} onCopy={copy} id="iso" />
          <li>
            <span>Relative</span>
            <code>{relativeTime(instant, now)}</code>
          </li>
        </ul>
      ) : null}
      <h2 className="section-title">Time zones</h2>
      <ul className="zone-list">
        {zones.map((zone) => {
          const parts = instant ? formatZoneParts(instant, zone) : null
          return (
            <li key={zone}>
              <div>
                <p className="zone-name">{zone}</p>
                <p className="zone-time">{parts ? parts.iso : 'Set a valid time above.'}</p>
                <p className="zone-offset">{parts ? parts.offset : ''}</p>
              </div>
              <button
                type="button"
                className="button button--ghost button--small"
                disabled={zones.length === 1}
                aria-label={`Remove ${zone}`}
                onClick={() => setZones((current) => current.filter((item) => item !== zone))}
              >
                Remove
              </button>
            </li>
          )
        })}
      </ul>
      <form onSubmit={addZone}>
        <Field label="Add a time zone" htmlFor="zone-add" hint="Start typing, for example Australia/Sydney.">
          <div className="inline-form">
            <input
              id="zone-add"
              className="control"
              list="zone-options"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
                setZoneError('')
              }}
            />
            <button className="button" type="submit">
              Add
            </button>
          </div>
        </Field>
        <datalist id="zone-options">
          {matches.map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
      </form>
      {zoneError ? <p className="error">{zoneError}</p> : null}
      <p className="sr-only" role="status">
        {copied ? 'Copied' : ''}
      </p>
    </section>
  )
}

function ResultRow({
  label,
  text,
  copied,
  onCopy,
  id,
}: {
  label: string
  text: string
  copied: string | null
  onCopy: (text: string, id: string) => Promise<boolean>
  id: string
}) {
  return (
    <li>
      <span>{label}</span>
      <code>{text}</code>
      <button type="button" className="button button--ghost button--small" onClick={() => void onCopy(text, id)}>
        {copied === id ? 'Copied' : 'Copy'}
      </button>
    </li>
  )
}
