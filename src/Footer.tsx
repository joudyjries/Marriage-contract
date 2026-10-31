export default function Footer({ arabic }: { arabic: boolean }) {
  return (
    <footer className="site-footer" aria-label={arabic ? 'ميزون كافيه — تذييل الصفحة' : 'Maison Café footer'}>
      <div className="site-footer__brand" dir="ltr">
        <span className="site-footer__line" aria-hidden="true" />
        <svg className="site-footer__mark" viewBox="0 0 32 36" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M16 3c-7 7-5 12 0 16 5-5 7-10 0-16ZM5 13c-3 8 3 15 10 17-1-9-5-14-10-17ZM27 13c3 8-3 15-10 17 1-9 5-14 10-17ZM16 19v15" /></svg>
        <span>MAISON CAFÉ</span>
        <span className="site-footer__line" aria-hidden="true" />
      </div>
      <p className="site-footer__tagline" dir={arabic ? 'rtl' : 'ltr'}>{arabic ? 'قهوة طيّبة. أيام أجمل.' : 'Good Coffee. Brighter Days.'}</p>
      <div className="site-footer__credit" dir="ltr">
        <span className="site-footer__divider" aria-hidden="true" />
        <p>{arabic ? 'تصميم وتنفيذ' : 'Powered by'}</p>
        <div className="site-footer__studio"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 17S3 12.5 3 7.5C3 3 8.5 2 10 6c1.5-4 7-3 7 1.5C17 12.5 10 17 10 17Z" /></svg><span>INVITE STUDIO</span></div>
        <span className="site-footer__signature">by Sarah</span>
      </div>
    </footer>
  )
}
