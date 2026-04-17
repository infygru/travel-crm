"use client";

import { useState } from "react";
import { updateDealStage } from "@/lib/actions/deals";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, ExternalLink } from "lucide-react";
import { PRIORITY_COLORS } from "@/lib/constants";
import Link from "next/link";

interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  priority: string;
  expectedClose: Date | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    avatarUrl: string | null;
  } | null;
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  _count: { tasks: number };
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  probability: number;
  deals: Deal[];
}

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

export function KanbanBoard({ pipeline }: { pipeline: Pipeline }) {
  const [stages, setStages] = useState(pipeline.stages);
  const [movingDealId, setMovingDealId] = useState<string | null>(null);

  const handleMoveStage = async (dealId: string, newStageId: string, currentStageId: string) => {
    if (newStageId === currentStageId) return;
    setMovingDealId(dealId);

    // Optimistic update
    const prevStages = stages;
    setStages((prev) => {
      const deal = prev.flatMap((s) => s.deals).find((d) => d.id === dealId);
      if (!deal) return prev;

      return prev.map((stage) => {
        if (stage.id === currentStageId) {
          return { ...stage, deals: stage.deals.filter((d) => d.id !== dealId) };
        }
        if (stage.id === newStageId) {
          return { ...stage, deals: [deal, ...stage.deals] };
        }
        return stage;
      });
    });

    try {
      await updateDealStage(dealId, newStageId);
      toast.success("Deal moved successfully");
    } catch {
      setStages(prevStages);
      toast.error("Failed to move deal");
    } finally {
      setMovingDealId(null);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageValue = stage.deals.reduce((sum, d) => sum + d.value, 0);

        return (
          <div key={stage.id} className="flex-shrink-0 w-72">
            {/* Stage Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <h3 className="text-sm font-semibold text-gray-900">{stage.name}</h3>
                <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {stage.deals.length}
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                ₹{stageValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>

            {/* Deal Cards */}
            <div className="space-y-3">
              {stage.deals.map((deal) => (
                <div
                  key={deal.id}
                  className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all ${
                    movingDealId === deal.id ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  {/* Deal Title */}
                  <div className="flex items-start justify-between mb-2">
                    <Link href={`/deals/${deal.id}`} className="text-sm font-semibold text-gray-900 flex-1 pr-2 leading-snug hover:text-indigo-600 transition-colors">
                      {deal.title}
                    </Link>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[deal.priority]}`}>
                        {deal.priority}
                      </span>
                      <Link href={`/deals/${deal.id}`} className="p-1 text-gray-300 hover:text-indigo-500 transition-colors">
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="flex items-center gap-1 text-indigo-600 mb-3">
                    <span className="text-sm font-bold">
                      ₹{deal.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  {/* Contact */}
                  {deal.contact && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                        {deal.contact.firstName[0]}{deal.contact.lastName[0]}
                      </div>
                      <span className="text-xs text-gray-600">
                        {deal.contact.firstName} {deal.contact.lastName}
                      </span>
                    </div>
                  )}

                  {/* Due Date */}
                  {deal.expectedClose && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(deal.expectedClose), "MMM d, yyyy")}
                    </div>
                  )}

                  {/* Move Stage */}
                  <div className="border-t border-gray-100 pt-3 mt-2">
                    <p className="text-xs text-gray-400 mb-1.5">Move to:</p>
                    <div className="flex flex-wrap gap-1">
                      {pipeline.stages
                        .filter((s) => s.id !== stage.id)
                        .map((targetStage) => (
                          <button
                            key={targetStage.id}
                            onClick={() => handleMoveStage(deal.id, targetStage.id, stage.id)}
                            className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          >
                            {targetStage.name}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              ))}

              {stage.deals.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                  <p className="text-xs text-gray-400">No deals in this stage</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
