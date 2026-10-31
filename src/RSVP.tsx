import { useRef, useState } from 'react'
import type { FormEvent } from 'react'

type Attendance = 'accept' | 'decline'

export default function RSVP({ arabic }: { arabic: boolean }) {
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [reply, setReply] = useState<{ name: string; attendance: Attendance } | null>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const confirmation = useRef<HTMLDivElement>(null)
  const section = useRef<HTMLElement>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) {
      nameInput.current?.setCustomValidity(arabic ? 'يرجى إدخال اسمك.' : 'Please enter your name.')
      nameInput.current?.reportValidity()
      return
    }
    if (!attendance) return
    setReply({ name: name.trim(), attendance })
    // This invitation is a demo: do not transmit or persist guest information.
    requestAnimationFrame(() => {
      confirmation.current?.focus({ preventScroll: true })
      section.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    })
  }

  return (
    <section className={`rsvp-section${reply ? ' rsvp-section--submitted' : ''}`} ref={section} aria-labelledby="rsvp-heading" dir={arabic ? 'rtl' : 'ltr'}>
      <div className="rsvp-section__backdrop" aria-hidden="true" />
      <div className="rsvp-card">
        <header className="rsvp-card__heading">
          <h2 id="rsvp-heading" data-scroll-reveal>{arabic ? 'تأكيد الحضور' : 'RSVP'}</h2>
          <div className="brand__divider" aria-hidden="true"><span /></div>
          <p data-scroll-reveal>{arabic ? 'يسعدنا أن نحتفل معكم.' : 'We’d love to celebrate with you.'}</p>
        </header>

        {reply ? (
          <div className="rsvp-confirmation" role="status" tabIndex={-1} ref={confirmation}>
            <span className="rsvp-confirmation__check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m6 12 4 4 8-9" /></svg></span>
            <h3>{arabic ? 'شكراً لك' : 'Thank you'}</h3>
            <p>{arabic
              ? (reply.attendance === 'accept' ? 'تم استلام ردّك. نتطلّع للترحيب بك!' : 'تم استلام ردّك. شكراً لإعلامنا، ونأمل أن نراك قريباً.')
              : (reply.attendance === 'accept' ? 'Your reply has been received. We can’t wait to welcome you!' : 'Your reply has been received. Thank you for letting us know. We hope to see you soon.')}</p>
          </div>
        ) : (
        <form className="rsvp-form" onSubmit={submit}>
          <fieldset className="rsvp-choices">
            <legend className="visually-hidden">{arabic ? 'هل ستنضم إلينا؟' : 'Will you join us?'}</legend>
            <label className="rsvp-choice">
              <input type="radio" name="attendance" value="accept" checked={attendance === 'accept'} onChange={() => { setAttendance('accept'); setReply(null) }} required />
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-9" /></svg>
              <span>{arabic ? 'أقبل بكل سرور' : 'Joyfully Accept'}</span>
            </label>
            <label className="rsvp-choice">
              <input type="radio" name="attendance" value="decline" checked={attendance === 'decline'} onChange={() => { setAttendance('decline'); setReply(null) }} required />
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
              <span>{arabic ? 'أعتذر عن الحضور' : <>Regretfully<br />Decline</>}</span>
            </label>
          </fieldset>

          <div className="rsvp-field">
            <label htmlFor="guest-name">{arabic ? 'اسمك' : 'YOUR NAME'}</label>
            <input id="guest-name" ref={nameInput} name="fullName" type="text" autoComplete="name" placeholder={arabic ? 'الاسم الكامل' : 'Full name'} required maxLength={100} value={name} onChange={event => { event.currentTarget.setCustomValidity(''); setName(event.target.value); setReply(null) }} />
          </div>
          <div className="rsvp-field rsvp-field--note">
            <label htmlFor="guest-note">{arabic ? 'رسالة لنا (اختياري)' : 'A NOTE FOR US (OPTIONAL)'}</label>
            <textarea id="guest-note" name="note" rows={3} maxLength={1000} placeholder={arabic ? 'أمنياتك…' : 'Your wishes…'} value={note} onChange={event => { setNote(event.target.value); setReply(null) }} />
          </div>
          <button className="rsvp-submit" type="submit"><span>{arabic ? 'إرسال الرد' : 'SUBMIT RSVP'}</span><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg></button>
          <p className="rsvp-demo-note">{arabic ? 'دعوة تجريبية — لا يتم حفظ الردود.' : 'Demo invitation — replies are not saved.'}</p>
        </form>
        )}
      </div>
    </section>
  )
}
