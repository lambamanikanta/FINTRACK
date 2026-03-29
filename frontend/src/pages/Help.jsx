export default function Help() {
  return (
    <div className="help-page">
      <h1 className="page-title">Help Center</h1>
      <p className="muted section-lead">Contact the developer for support or feedback.</p>

      <section className="help-card panel">
        <h2 className="settings-card-title">Developer contact</h2>
        <dl className="help-dl">
          <div>
            <dt>Name</dt>
            <dd>Lamba Manikanta</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href="mailto:manikantayadav@gmail.com">manikantayadav@gmail.com</a>
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              <a href="tel:+919704900624">9704900624</a>
            </dd>
          </div>
        </dl>
        <p className="muted small help-note">
          For product questions, use the email above. Mention <strong>Fintrack</strong> in the subject line.
        </p>
      </section>
    </div>
  )
}
