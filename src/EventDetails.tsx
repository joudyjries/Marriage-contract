export default function EventDetails() {
  return <section className="event-details" lang="ar" dir="rtl" aria-label="موعد ومكان حفل الزفاف">
    <div className="event-group">
      <div className="event-item event-introduction">وذلك بمشيئة الله تعالى</div>
      <div className="event-item event-row event-row--date">
        <div className="event-copy">
          <span className="event-weekday">السبت</span>
          <span className="event-date" dir="ltr">14.11.2026</span>
        </div>
        <div className="event-icon-wrap event-icon-wrap--linked">
          <img src="/images/event-calendar.png" alt="" className="event-icon" draggable="false" />
          <span className="event-link" aria-hidden="true">✧</span>
        </div>
      </div>
      <div className="event-item event-row event-row--time">
        <div className="event-copy event-time" dir="ltr">8:30 PM</div>
        <div className="event-icon-wrap event-icon-wrap--linked">
          <img src="/images/event-clock.png" alt="" className="event-icon" draggable="false" />
          <span className="event-link" aria-hidden="true">✧</span>
        </div>
      </div>
      <div className="event-item event-row event-row--venue">
        <div className="event-copy event-venue">قاعة فيرساي</div>
        <div className="event-icon-wrap">
          <img src="/images/event-location.png" alt="" className="event-icon" draggable="false" />
        </div>
      </div>
    </div>
  </section>
}
