/** The attack surface rendered from REAL discovered assets (subdomains). */
export function LiveSurfaceMap({ center, assets }: { center: string; assets: string[] }) {
  const CX = 500;
  const CY = 280;
  const shown = assets.slice(0, 28);
  const n = Math.max(shown.length, 1);

  const nodes = shown.map((name, i) => {
    const ring = i % 2 === 0 ? 1 : 1.55;
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = CX + Math.cos(angle) * 165 * ring * 1.55;
    const y = CY + Math.sin(angle) * 150 * ring;
    return { name, x: Math.max(60, Math.min(940, x)), y: Math.max(40, Math.min(520, y)) };
  });

  return (
    <svg viewBox="0 0 1000 560" className="h-full w-full" role="img" aria-label={`Attack surface of ${center}: ${assets.length} assets`}>
      {nodes.map((nd, i) => (
        <path key={`c-${i}`} d={`M${CX} ${CY} Q ${(CX + nd.x) / 2} ${(CY + nd.y) / 2 - 30} ${nd.x} ${nd.y}`}
          fill="none" stroke="var(--c-accent)" strokeOpacity={0.13} strokeWidth={1} />
      ))}

      {/* core */}
      <circle cx={CX} cy={CY} r={48} fill="var(--c-accent)" opacity={0.06} />
      <circle cx={CX} cy={CY} r={30} fill="var(--c-accent)" opacity={0.11} />
      <circle cx={CX} cy={CY} r={8} fill="var(--c-accent)" />
      <text x={CX} y={CY + 66} textAnchor="middle" fontSize="14" fill="var(--c-text)" fontWeight="500">{center}</text>

      {nodes.map((nd, i) => (
        <g key={i} className="c-float" style={{ animationDelay: `${(i % 6) * 0.4}s` }}>
          <circle cx={nd.x} cy={nd.y} r={20} fill="var(--c-accent-2)" opacity={0.08} />
          <circle cx={nd.x} cy={nd.y} r={6} fill="var(--c-accent-2)" />
          <circle cx={nd.x} cy={nd.y} r={6} fill="none" stroke="var(--c-accent-2)" strokeOpacity={0.5} />
          {i < 16 && (
            <text x={nd.x} y={nd.y + 18} textAnchor="middle" fontSize="10.5" fill="var(--c-muted)">
              {nd.name.length > 26 ? nd.name.slice(0, 24) + "…" : nd.name}
            </text>
          )}
        </g>
      ))}

      {assets.length > 28 && (
        <text x={CX} y={544} textAnchor="middle" fontSize="11" fill="var(--c-faint)">
          +{assets.length - 28} more assets
        </text>
      )}
    </svg>
  );
}
