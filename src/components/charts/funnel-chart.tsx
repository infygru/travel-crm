"use client";

interface FunnelData {
  name: string;
  count: number;
  value: number;
  color: string;
}

export function FunnelChart({ data }: { data: FunnelData[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No pipeline data yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((stage) => (
        <div key={stage.name}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{stage.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{stage.count} deals</span>
              <span className="text-xs font-semibold text-gray-600">
                ₹{stage.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.max((stage.count / maxCount) * 100, 4)}%`,
                backgroundColor: stage.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
