type Stat = {
  label: string;
  value: number;
};

type StatGridProps = {
  stats: Stat[];
};

export function StatGrid({ stats }: StatGridProps) {
  return (
    <div className="status-grid">
      {stats.map((stat) => (
        <div key={stat.label}>
          <strong>{stat.value.toLocaleString()}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
