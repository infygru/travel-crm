"use client";

import { useState } from "react";
import {
  createPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
  reorderPipelineStages,
  createPipeline,
} from "@/lib/actions/settings";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Check, X, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

type Stage = {
  id: string;
  name: string;
  color: string;
  probability: number;
  order: number;
};

type Pipeline = {
  id: string;
  name: string;
  isDefault: boolean;
  stages: Stage[];
};

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#ef4444", "#3b82f6", "#14b8a6",
];

const inputCls = "px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500";

function StageRow({
  stage,
  pipelineId,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdated,
}: {
  stage: Stage;
  pipelineId: string;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: (id: string) => void;
  onUpdated: (id: string, data: Partial<Stage>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stage.name);
  const [color, setColor] = useState(stage.color);
  const [probability, setProbability] = useState(String(stage.probability));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (!name.trim()) { toast.error("Stage name required"); return; }
    setSaving(true);
    try {
      await updatePipelineStage(stage.id, { name: name.trim(), color, probability: Number(probability) });
      onUpdated(stage.id, { name: name.trim(), color, probability: Number(probability) });
      setEditing(false);
      toast.success("Stage updated");
    } catch {
      toast.error("Failed to update stage");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setName(stage.name);
    setColor(stage.color);
    setProbability(String(stage.probability));
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete stage "${stage.name}"? Deals in this stage must be moved first.`)) return;
    setDeleting(true);
    try {
      await deletePipelineStage(stage.id);
      onDelete(stage.id);
      toast.success("Stage deleted");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete stage");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />

      {editing ? (
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className={`${inputCls} w-40`}
            autoFocus
          />
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${color === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              value={probability}
              onChange={e => setProbability(e.target.value)}
              className={`${inputCls} w-16`}
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
          <div className="flex gap-1">
            <button onClick={handleSave} disabled={saving} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button onClick={handleCancel} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-1">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
          <span className="text-sm font-medium text-gray-800 flex-1">{stage.name}</span>
          <span className="text-xs text-gray-400 w-10 text-right">{stage.probability}%</span>
          <div className="flex gap-1">
            <button onClick={onMoveUp} disabled={isFirst} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20">
              <ChevronUp className="w-4 h-4" />
            </button>
            <button onClick={onMoveDown} disabled={isLast} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20">
              <ChevronDown className="w-4 h-4" />
            </button>
            <button onClick={() => setEditing(true)} className="px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50">
              Edit
            </button>
            <button onClick={handleDelete} disabled={deleting} className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddStageRow({ pipelineId, maxOrder, onAdded }: { pipelineId: string; maxOrder: number; onAdded: (stage: Stage) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [probability, setProbability] = useState("50");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim()) { toast.error("Stage name required"); return; }
    setSaving(true);
    try {
      const stage = await createPipelineStage(pipelineId, {
        name: name.trim(),
        color,
        probability: Number(probability),
        order: maxOrder + 1,
      });
      onAdded(stage);
      setName(""); setColor("#6366f1"); setProbability("50");
      setOpen(false);
      toast.success("Stage added");
    } catch {
      toast.error("Failed to add stage");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors mt-2">
        <Plus className="w-4 h-4" /> Add Stage
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-3 flex-wrap border-t border-gray-100 pt-3">
      <input value={name} onChange={e => setName(e.target.value)} className={`${inputCls} w-40`} placeholder="Stage name" autoFocus />
      <div className="flex items-center gap-1">
        {PRESET_COLORS.map(c => (
          <button key={c} type="button" onClick={() => setColor(c)} className={`w-5 h-5 rounded-full border-2 transition-all ${color === c ? "border-gray-800 scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="flex items-center gap-1">
        <input type="number" min={0} max={100} value={probability} onChange={e => setProbability(e.target.value)} className={`${inputCls} w-16`} />
        <span className="text-xs text-gray-500">%</span>
      </div>
      <button onClick={handleAdd} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        Add
      </button>
      <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
    </div>
  );
}

export function PipelineEditor({ initialPipelines }: { initialPipelines: Pipeline[] }) {
  const [pipelines, setPipelines] = useState(initialPipelines);
  const [addingPipeline, setAddingPipeline] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState("");
  const [creating, setCreating] = useState(false);

  function updateStages(pipelineId: string, fn: (stages: Stage[]) => Stage[]) {
    setPipelines(ps => ps.map(p => p.id === pipelineId ? { ...p, stages: fn(p.stages) } : p));
  }

  async function handleMove(pipelineId: string, stages: Stage[], idx: number, dir: -1 | 1) {
    const newStages = [...stages];
    const swapIdx = idx + dir;
    [newStages[idx], newStages[swapIdx]] = [newStages[swapIdx], newStages[idx]];
    const reordered = newStages.map((s, i) => ({ ...s, order: i + 1 }));
    updateStages(pipelineId, () => reordered);
    try {
      await reorderPipelineStages(reordered.map(s => s.id));
    } catch {
      toast.error("Failed to reorder");
      updateStages(pipelineId, () => stages);
    }
  }

  async function handleAddPipeline() {
    if (!newPipelineName.trim()) { toast.error("Pipeline name required"); return; }
    setCreating(true);
    try {
      const pipeline = await createPipeline(newPipelineName.trim());
      // Reload to get stages
      window.location.reload();
    } catch {
      toast.error("Failed to create pipeline");
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      {pipelines.map(pipeline => (
        <div key={pipeline.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-gray-900">{pipeline.name}</span>
              {pipeline.isDefault && (
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Default</span>
              )}
            </div>
            <span className="text-xs text-gray-400">{pipeline.stages.length} stages</span>
          </div>
          <div className="px-5 py-2">
            {pipeline.stages.map((stage, idx) => (
              <StageRow
                key={stage.id}
                stage={stage}
                pipelineId={pipeline.id}
                isFirst={idx === 0}
                isLast={idx === pipeline.stages.length - 1}
                onMoveUp={() => handleMove(pipeline.id, pipeline.stages, idx, -1)}
                onMoveDown={() => handleMove(pipeline.id, pipeline.stages, idx, 1)}
                onDelete={id => updateStages(pipeline.id, stages => stages.filter(s => s.id !== id))}
                onUpdated={(id, data) => updateStages(pipeline.id, stages => stages.map(s => s.id === id ? { ...s, ...data } : s))}
              />
            ))}
            <AddStageRow
              pipelineId={pipeline.id}
              maxOrder={pipeline.stages.length}
              onAdded={stage => updateStages(pipeline.id, stages => [...stages, stage])}
            />
          </div>
        </div>
      ))}

      {/* Add Pipeline */}
      {addingPipeline ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <input
            value={newPipelineName}
            onChange={e => setNewPipelineName(e.target.value)}
            className={`${inputCls} flex-1`}
            placeholder="Pipeline name (e.g. International Sales)"
            autoFocus
          />
          <button onClick={handleAddPipeline} disabled={creating} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create
          </button>
          <button onClick={() => { setAddingPipeline(false); setNewPipelineName(""); }} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setAddingPipeline(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 border border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-colors w-full justify-center">
          <Plus className="w-4 h-4" /> Add Pipeline
        </button>
      )}
    </div>
  );
}
