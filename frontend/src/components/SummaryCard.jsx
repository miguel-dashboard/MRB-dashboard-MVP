function SummaryCard({ title, value, tone = 'default' }) {
  return (
    <article className={`summary-card summary-card-${tone}`}>
      <div className="summary-card-top">
        <span className="summary-card-label">{title}</span>
        <span className="summary-card-dot" />
      </div>

      <strong className="summary-card-value">{value}</strong>
    </article>
  )
}

export default SummaryCard