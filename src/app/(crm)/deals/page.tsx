import { getDealsByPipeline, getPipelines } from "@/lib/actions/deals";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { KanbanBoard } from "@/components/deals/kanban-board";
import { NewDealDialog } from "@/components/deals/new-deal-dialog";

interface DealsPageProps {
  searchParams: Promise<{ pipelineId?: string }>;
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const params = await searchParams;
  const [pipeline, pipelines] = await Promise.all([
    getDealsByPipeline(params.pipelineId),
    getPipelines(),
  ]);

  const totalValue = pipeline?.stages.reduce((sum, stage) => {
    return sum + stage.deals.reduce((s, d) => s + d.value, 0);
  }, 0) ?? 0;

  const totalDeals = pipeline?.stages.reduce((sum, stage) => sum + stage.deals.length, 0) ?? 0;

  const pipelinesForDialog = pipelines.map((p) => ({
    id: p.id,
    name: p.name,
    isDefault: p.isDefault,
    stages: p.stages.map((s) => ({ id: s.id, name: s.name })),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deal Pipeline</h1>
          <p className="text-gray-500 mt-1">
            {totalDeals} open deals · ₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })} total value
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pipelines.length > 1 && (
            <div className="flex items-center gap-2">
              {pipelines.map((p) => (
                <Link
                  key={p.id}
                  href={`/deals?pipelineId=${p.id}`}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    (params.pipelineId === p.id) || (!params.pipelineId && p.isDefault)
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {p.name}
                </Link>
              ))}
            </div>
          )}
          <NewDealDialog pipelines={pipelinesForDialog} />
        </div>
      </div>

      {/* Kanban Board */}
      {pipeline ? (
        <KanbanBoard pipeline={pipeline} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No pipeline configured</h3>
          <p className="text-gray-500 mt-1">Run the seed script to set up your default pipeline</p>
        </div>
      )}
    </div>
  );
}
