function MetricCard({ label, value }) {
  return (
    <div className="col-12 col-sm-6 col-xl">
      <article className="stat-card h-100">
        <span>{label}</span>
        <strong>{value}</strong>
      </article>
    </div>
  );
}

function MetricsGrid({ metrics }) {
  return (
    <section className="row g-3">
      <MetricCard label="Total de tareas" value={metrics.total} />
      <MetricCard label="Urgentes" value={metrics.urgent} />
      <MetricCard label="Importantes" value={metrics.important} />
      <MetricCard label="Deseables" value={metrics.deseable} />
      <MetricCard label="Ultima actualizacion" value={metrics.updated} />
    </section>
  );
}

export default MetricsGrid;
