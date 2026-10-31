import { useState } from 'react'
import type { FormEvent } from 'react'

export default function WeddingRSVP() {
  const [attendance, setAttendance] = useState('')
  const [message, setMessage] = useState('')

  const saveResponse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') ?? '').trim()
    if (!name) {
      const input = form.elements.namedItem('name') as HTMLInputElement
      input.setCustomValidity('Please enter your name.')
      input.reportValidity()
      return
    }
    const response = {
      name,
      attending: attendance === 'yes',
      guests: attendance === 'yes' ? Number(data.get('guests')) : 0,
      savedAt: new Date().toISOString(),
    }
    try {
      localStorage.setItem('cinematic-wedding:rsvp:2026-11-30', JSON.stringify(response))
      setMessage('Thank you! Your reply is saved on this device. It has not been sent to the couple yet.')
    } catch {
      setMessage('Your reply could not be saved. Please allow browser storage and try again.')
    }
  }

  return (
    <section className="wedding-rsvp" aria-labelledby="rsvp-heading">
      <h2 id="rsvp-heading">RSVP</h2>
      <div className="invitation-note__divider" aria-hidden="true">✦</div>
      <p className="wedding-rsvp__intro">Kindly reply to our invitation</p>
      <form className="rsvp-form" onSubmit={saveResponse} onChange={() => setMessage('')}>
        <label htmlFor="rsvp-name">Your name</label>
        <input id="rsvp-name" name="name" type="text" autoComplete="name" maxLength={120} required onInput={event => event.currentTarget.setCustomValidity('')} />
        <label htmlFor="rsvp-guests">Number of guests</label>
        <input id="rsvp-guests" name="guests" type="number" inputMode="numeric" min="1" step="1" required={attendance !== 'no'} disabled={attendance === 'no'} aria-describedby="rsvp-guests-hint" />
        <span id="rsvp-guests-hint" className="sr-only">Include yourself in the total number of guests.</span>
        <fieldset className="rsvp-form__attendance">
          <legend className="sr-only">Will you attend?</legend>
          <label><input type="radio" name="attendance" value="yes" checked={attendance === 'yes'} onChange={() => setAttendance('yes')} required />Yes, I’ll be there</label>
          <label><input type="radio" name="attendance" value="no" checked={attendance === 'no'} onChange={() => setAttendance('no')} required />Sadly, I can’t attend</label>
        </fieldset>
        <button className="rsvp-form__submit" type="submit">CONFIRM ATTENDANCE</button>
        <p className="rsvp-form__notice">Replies are currently saved on this device only.</p>
        <p className="rsvp-form__status" role="status">{message}</p>
      </form>
    </section>
  )
}
