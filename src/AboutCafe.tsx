function CoffeeBeans() {
  return (
    <svg className="about-cafe__beans" viewBox="0 0 210 155" fill="none" aria-hidden="true">
      <defs>
        <pattern id="bean-hatching" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
          <path d="M0 0v3" stroke="currentColor" strokeWidth=".6" opacity=".55" />
        </pattern>
      </defs>
      {[{ x: 35, y: 85, angle: -36 }, { x: 77, y: 48, angle: 6 }, { x: 116, y: 87, angle: 49 }, { x: 161, y: 119, angle: 75 }].map(bean => (
        <g key={bean.x} transform={`translate(${bean.x} ${bean.y}) rotate(${bean.angle})`}>
          <ellipse rx="23" ry="40" fill="url(#bean-hatching)" stroke="currentColor" strokeWidth="1.1" />
          <ellipse rx="20" ry="37" stroke="currentColor" strokeWidth=".55" />
          <path d="M0-38C-9-21 9-10 0 7S-7 25 0 38M3-37C-5-20 12-10 3 9S-4 25 3 37" stroke="currentColor" strokeWidth=".85" />
        </g>
      ))}
    </svg>
  )
}

export default function AboutCafe({ arabic }: { arabic: boolean }) {
  return (
    <section className="about-cafe" aria-labelledby="about-cafe-heading" dir={arabic ? 'rtl' : 'ltr'}>
      <div className="about-cafe__photo-wrap">
        <img className="about-cafe__photo" src="/images/maison-interior.jpg" alt={arabic ? 'مساحة كافيه دافئة بإضاءة ذهبية ونباتات وطاولات رخامية' : 'A warm café interior with golden lighting, plants and marble tables'} loading="lazy" />
      </div>
      <div className="about-cafe__panel">
        <svg className="about-cafe__wave" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true"><path d="M0 67C170 115 350 0 690 15C1040 15 1130 95 1440 135V140H0Z" fill="currentColor" /></svg>
        <div className="about-cafe__copy">
          <h2 id="about-cafe-heading" data-scroll-reveal><span>{arabic ? 'عن' : 'ABOUT OUR'}</span><em>{arabic ? 'ميزون كافيه' : 'Café'}</em></h2>
          <div className="brand__divider" aria-hidden="true"><span /></div>
          <div className="about-cafe__story">
            <p data-scroll-reveal>{arabic ? 'في ميزون كافيه، نؤمن أن القهوة الرائعة تجمع الناس.' : 'At Maison Café, we believe great coffee brings people together.'}</p>
            <p data-scroll-reveal>{arabic ? 'مساحة لنتمهّل، ونتواصل، ونستمتع بالأشياء الصغيرة.' : 'It’s a space to slow down, connect, and enjoy the little things.'}</p>
            <p data-scroll-reveal>{arabic ? 'مكان يروي فيه كل فنجان حكاية.' : 'A place where every cup tells a story.'}</p>
          </div>
        </div>
        <CoffeeBeans />
        <div className="about-cafe__ribbon" aria-hidden="true"><span /><span /><span /></div>
      </div>
    </section>
  )
}
