'use client';

import './strength.css';
import { useCallback, useEffect, useState } from 'react';

// ===================================================
// 类型
// ===================================================
type Category = 'Strength' | 'Cardio';

type WSet = {
  id: string;
  weight: number; // lbs
  reps: number;
  rpe?: number | null; // 1-10
  completed: boolean;
};

type Cardio = {
  minutes: number;
  distance?: string;
  intensity?: string;
  completed?: boolean;
};

type Exercise = {
  id: string;
  name: string;
  category: Category;
  targetMuscle?: string;
  sets: WSet[];
  note?: string;
  cardio?: Cardio;
};

type Plan = { id: string; name: string; exercises: Exercise[] };

type WorkoutLog = {
  id: string;
  date: string;
  plan_id: string | null;
  exercises: Exercise[];
  duration: number | null;
  note: string | null;
};

type Draft = {
  title: string;
  planId: string | null;
  logId: string | null;
  date: string; // ISO
  duration: string;
  note: string;
  exercises: Exercise[];
};

const API = '/api/v2/health/strength';
const DRAFT_KEY = 'hz-strength-draft-v1';
const UNIT = 'lbs';

// 选择器里的预设项目
const PRESETS: { name: string; category: Category; target: string; sets: number; reps: number; weight: number }[] = [
  { name: 'Leg Press', category: 'Strength', target: '腿/臀', sets: 3, reps: 12, weight: 70 },
  { name: 'Hip Abductor', category: 'Strength', target: '臀中肌', sets: 3, reps: 15, weight: 40 },
  { name: 'Hip Adductor', category: 'Strength', target: '大腿内侧', sets: 2, reps: 15, weight: 40 },
  { name: 'Lying Leg Curl', category: 'Strength', target: '腘绳肌', sets: 3, reps: 12, weight: 25 },
  { name: 'Leg Extension', category: 'Strength', target: '股四头肌', sets: 2, reps: 12, weight: 20 },
  { name: 'Lat Pulldown', category: 'Strength', target: '背', sets: 3, reps: 12, weight: 30 },
  { name: 'Seated Row', category: 'Strength', target: '背', sets: 3, reps: 12, weight: 30 },
  { name: 'Chest Press', category: 'Strength', target: '胸', sets: 3, reps: 10, weight: 20 },
  { name: 'Dual Pectoral Fly', category: 'Strength', target: '胸', sets: 3, reps: 12, weight: 25 },
  { name: 'Tricep Press', category: 'Strength', target: '肱三头肌', sets: 2, reps: 12, weight: 20 },
  { name: 'Dual Pulley Pushdown', category: 'Strength', target: '肱三头肌', sets: 2, reps: 12, weight: 15 },
  { name: 'Bicep Curl', category: 'Strength', target: '肱二头肌', sets: 2, reps: 12, weight: 15 },
  { name: 'Treadmill', category: 'Cardio', target: '', sets: 0, reps: 0, weight: 0 },
  { name: 'Stair Climber', category: 'Cardio', target: '', sets: 0, reps: 0, weight: 0 },
  { name: 'Elliptical', category: 'Cardio', target: '', sets: 0, reps: 0, weight: 0 },
  { name: 'Bike', category: 'Cardio', target: '', sets: 0, reps: 0, weight: 0 },
];

// ===================================================
// 工具
// ===================================================
function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeSets(count: number, weight: number, reps: number): WSet[] {
  return Array.from({ length: Math.max(1, count) }, () => ({
    id: uid(), weight, reps, rpe: null, completed: false,
  }));
}

/** 从模板/旧记录复制一份全新的、未完成状态的项目列表 */
function freshCopy(exercises: Exercise[]): Exercise[] {
  return (exercises || []).map((ex) => ({
    ...ex,
    id: uid(),
    sets: (ex.sets || []).map((s) => ({ ...s, id: uid(), rpe: null, completed: false })),
    cardio: ex.cardio ? { ...ex.cardio, completed: false } : undefined,
  }));
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function niceDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' });
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} ${time}`;
}

function logStats(exercises: Exercise[]) {
  let total = 0, done = 0, volume = 0;
  for (const ex of exercises || []) {
    if (ex.category === 'Cardio') {
      total += 1;
      if (ex.cardio?.completed) done += 1;
      continue;
    }
    for (const s of ex.sets || []) {
      total += 1;
      if (s.completed) {
        done += 1;
        volume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
      }
    }
  }
  return { total, done, volume };
}

function planSummary(ex: Exercise): string {
  if (ex.category === 'Cardio') return `${ex.cardio?.minutes ?? 0} min`;
  const s = ex.sets || [];
  if (s.length === 0) return '—';
  const same = s.every((x) => x.reps === s[0].reps && x.weight === s[0].weight);
  return same ? `${s.length}×${s[0].reps} · ${s[0].weight} ${UNIT}` : `${s.length} 组`;
}

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return d && Array.isArray(d.exercises) ? d : null;
  } catch {
    return null;
  }
}

function writeDraft(d: Draft | null) {
  try {
    if (d) localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* 存不进去就算了，不影响使用 */
  }
}

// ===================================================
// 主视图：列表页 ↔ 编辑页
// ===================================================
export default function StrengthView() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [savedDraft, setSavedDraft] = useState<Draft | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(API, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setPlans(data.plans || []);
      setLogs(data.logs || []);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '载入失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    setSavedDraft(readDraft());
  }, [load]);

  const openPlan = (plan: Plan) => {
    setShowNew(false);
    setDraft({
      title: plan.name, planId: plan.id, logId: null,
      date: new Date().toISOString(), duration: '', note: '',
      exercises: freshCopy(plan.exercises),
    });
  };

  const openBlank = () => {
    setShowNew(false);
    setDraft({
      title: '自由训练', planId: null, logId: null,
      date: new Date().toISOString(), duration: '', note: '', exercises: [],
    });
  };

  const openLog = (log: WorkoutLog) => {
    const plan = plans.find((p) => p.id === log.plan_id);
    setDraft({
      title: plan?.name || '自由训练', planId: log.plan_id, logId: log.id,
      date: log.date, duration: log.duration != null ? String(log.duration) : '',
      note: log.note || '',
      exercises: JSON.parse(JSON.stringify(log.exercises || [])),
    });
  };

  const closeEditor = (opts?: { clearDraft?: boolean; reload?: boolean }) => {
    if (opts?.clearDraft) writeDraft(null);
    setDraft(null);
    setSavedDraft(readDraft());
    if (opts?.reload) load();
  };

  if (draft) {
    return (
      <Editor
        key={draft.logId || draft.planId || 'blank'}
        initial={draft}
        onClose={closeEditor}
        onPlanUpdated={(p) => setPlans((prev) => prev.map((x) => (x.id === p.id ? p : x)))}
      />
    );
  }

  return (
    <div className="health-body st-body">
      <div className="st-topbar">
        <div className="health-section-title st-topbar-title">力量训练</div>
        <button className="st-plus" onClick={() => setShowNew(true)} aria-label="新建一次训练记录">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="health-loading">载入中……</div>
      ) : loadError ? (
        <div className="health-empty">
          <p>载入失败：{loadError}</p>
          <p className="st-hint">如果提示找不到表，先在 Supabase 跑一次 scripts/sql/health-strength.sql</p>
          <button className="health-add-cta" onClick={() => { setLoading(true); load(); }}>重试</button>
        </div>
      ) : (
        <>
          {savedDraft && (
            <div className="st-resume">
              <button className="st-resume-main" onClick={() => setDraft(savedDraft)}>
                <span className="st-resume-label">继续未保存的训练</span>
                <span className="st-resume-name">{savedDraft.title}</span>
              </button>
              <button
                className="st-link"
                onClick={() => {
                  if (!confirm('丢掉这份未保存的训练？')) return;
                  writeDraft(null);
                  setSavedDraft(null);
                }}
              >
                丢弃
              </button>
            </div>
          )}

          <div className="st-plans">
            {plans.map((plan) => (
              <button key={plan.id} className="st-plan" onClick={() => openPlan(plan)}>
                <div className="st-plan-name">{plan.name}</div>
                <div className="st-plan-list">
                  {(plan.exercises || []).map((ex) => (
                    <div key={ex.id} className="st-plan-row">
                      <span>{ex.name}</span>
                      <span className="st-plan-row-meta">{planSummary(ex)}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <div className="health-section-title st-history-title">训练记录</div>
          {logs.length === 0 ? (
            <div className="health-empty"><p>还没有训练记录</p></div>
          ) : (
            <div className="st-logs">
              {logs.map((log) => {
                const st = logStats(log.exercises);
                const plan = plans.find((p) => p.id === log.plan_id);
                return (
                  <button key={log.id} className="st-log" onClick={() => openLog(log)}>
                    <div className="st-log-date">{niceDate(log.date)}</div>
                    <div className="st-log-name">{plan?.name || '自由训练'}</div>
                    <div className="st-log-meta">
                      {(log.exercises || []).length} 项 · 完成 {st.done}/{st.total}
                      {st.volume > 0 && ` · ${Math.round(st.volume).toLocaleString()} ${UNIT}`}
                      {log.duration != null && ` · ${log.duration} 分钟`}
                    </div>
                    {log.note && <div className="st-log-note">{log.note}</div>}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {showNew && (
        <>
          <div className="modal-backdrop" onClick={() => setShowNew(false)} />
          <div className="modal-panel">
            <div className="modal-title">新建训练记录</div>
            <div className="st-choices">
              {plans.map((plan) => (
                <button key={plan.id} className="st-choice" onClick={() => openPlan(plan)}>
                  <span>{plan.name}</span>
                  <span className="st-plan-row-meta">{(plan.exercises || []).length} 项</span>
                </button>
              ))}
              <button className="st-choice st-choice-blank" onClick={openBlank}>空白新建</button>
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-ghost" onClick={() => setShowNew(false)}>算了</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ===================================================
// 编辑页：Plan 详情 / 训练记录编辑 共用
// ===================================================
function Editor({
  initial,
  onClose,
  onPlanUpdated,
}: {
  initial: Draft;
  onClose: (opts?: { clearDraft?: boolean; reload?: boolean }) => void;
  onPlanUpdated: (plan: Plan) => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<{ exercise?: Exercise } | null>(null);

  const isLog = !!d.logId;

  // 改动实时落到本地草稿，训练到一半切走也不丢
  useEffect(() => {
    if (dirty) writeDraft(d);
  }, [d, dirty]);

  const patch = (p: Partial<Draft>) => {
    setD((prev) => ({ ...prev, ...p }));
    setDirty(true);
  };

  const patchExercise = (id: string, fn: (ex: Exercise) => Exercise) =>
    patch({ exercises: d.exercises.map((ex) => (ex.id === id ? fn(ex) : ex)) });

  const patchSet = (exId: string, setId: string, p: Partial<WSet>) =>
    patchExercise(exId, (ex) => ({
      ...ex,
      sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...p } : s)),
    }));

  const addSet = (exId: string) =>
    patchExercise(exId, (ex) => {
      const last = ex.sets[ex.sets.length - 1];
      const next: WSet = last
        ? { ...last, id: uid(), completed: false }
        : { id: uid(), weight: 0, reps: 10, rpe: null, completed: false };
      return { ...ex, sets: [...ex.sets, next] };
    });

  const removeSet = (exId: string, setId: string) =>
    patchExercise(exId, (ex) => ({ ...ex, sets: ex.sets.filter((s) => s.id !== setId) }));

  const removeExercise = (ex: Exercise) => {
    if (!confirm(`删掉「${ex.name}」？`)) return;
    patch({ exercises: d.exercises.filter((x) => x.id !== ex.id) });
  };

  const saveExercise = (ex: Exercise) => {
    const exists = d.exercises.some((x) => x.id === ex.id);
    patch({ exercises: exists ? d.exercises.map((x) => (x.id === ex.id ? ex : x)) : [...d.exercises, ex] });
    setModal(null);
  };

  const back = () => onClose();

  const saveLog = async () => {
    if (d.exercises.length === 0) {
      alert('还没有任何项目');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        date: d.date,
        plan_id: d.planId,
        exercises: d.exercises,
        duration: d.duration.trim() === '' ? null : Number(d.duration),
        note: d.note.trim() || null,
      };
      const res = await fetch(API, {
        method: isLog ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLog ? { kind: 'log', id: d.logId, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      onClose({ clearDraft: true, reload: true });
    } catch (e) {
      alert('保存失败：' + (e instanceof Error ? e.message : ''));
      setBusy(false);
    }
  };

  const savePlan = async () => {
    if (!d.planId) return;
    if (!confirm(`把现在的项目和重量存回「${d.title}」模板？`)) return;
    setBusy(true);
    try {
      const res = await fetch(API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'plan', id: d.planId, exercises: freshCopy(d.exercises) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      onPlanUpdated(data.plan);
    } catch (e) {
      alert('更新模板失败：' + (e instanceof Error ? e.message : ''));
    } finally {
      setBusy(false);
    }
  };

  const deleteLog = async () => {
    if (!d.logId || !confirm('删掉这条训练记录？')) return;
    setBusy(true);
    try {
      const res = await fetch(API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: d.logId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      onClose({ clearDraft: true, reload: true });
    } catch (e) {
      alert('删除失败：' + (e instanceof Error ? e.message : ''));
      setBusy(false);
    }
  };

  const stats = logStats(d.exercises);

  return (
    <div className="health-body st-body">
      <div className="st-editor-bar">
        <button className="st-link" onClick={back}>← 返回</button>
        <button className="st-save" onClick={saveLog} disabled={busy}>
          {isLog ? '保存修改' : '保存为训练记录'}
        </button>
      </div>

      <div className="st-editor-head">
        <div className="st-editor-title">{d.title}</div>
        <div className="st-editor-sub">
          {isLog ? niceDate(d.date) : '模板载入 · 可当场改'} · 完成 {stats.done}/{stats.total}
        </div>
      </div>

      {d.exercises.length === 0 && (
        <div className="health-empty"><p>还没有项目，点下面加一个</p></div>
      )}

      {d.exercises.map((ex) => {
        const isOpen = open[ex.id] !== false; // 默认展开
        const isCardio = ex.category === 'Cardio';
        return (
          <div key={ex.id} className="st-ex">
            <div className="st-ex-head">
              <button
                className="st-ex-toggle"
                onClick={() => setOpen((o) => ({ ...o, [ex.id]: !isOpen }))}
                aria-expanded={isOpen}
              >
                <span className={`st-caret ${isOpen ? 'st-caret-open' : ''}`}>›</span>
                <span className="st-ex-name">{ex.name}</span>
                <span className="st-ex-meta">
                  {ex.targetMuscle ? `${ex.targetMuscle} · ` : ''}{planSummary(ex)}
                </span>
              </button>
              <button className="st-icon" onClick={() => setModal({ exercise: ex })} aria-label={`编辑 ${ex.name}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" />
                </svg>
              </button>
              <button className="st-icon st-icon-del" onClick={() => removeExercise(ex)} aria-label={`删除 ${ex.name}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                </svg>
              </button>
            </div>

            {isOpen && (
              <div className="st-ex-body">
                {ex.note && <div className="st-ex-note">{ex.note}</div>}

                {isCardio ? (
                  <label className="st-set st-set-cardio">
                    <input
                      type="checkbox"
                      className="st-check"
                      checked={!!ex.cardio?.completed}
                      onChange={(e) =>
                        patchExercise(ex.id, (x) => ({
                          ...x,
                          cardio: { minutes: 0, ...x.cardio, completed: e.target.checked },
                        }))
                      }
                    />
                    <span className="st-cardio-text">
                      {ex.cardio?.minutes ?? 0} 分钟
                      {ex.cardio?.distance ? ` · ${ex.cardio.distance}` : ''}
                      {ex.cardio?.intensity ? ` · 强度 ${ex.cardio.intensity}` : ''}
                    </span>
                  </label>
                ) : (
                  <>
                    {ex.sets.map((s, i) => (
                      <div key={s.id} className={`st-set ${s.completed ? 'st-set-done' : ''}`}>
                        <input
                          type="checkbox"
                          className="st-check"
                          checked={s.completed}
                          onChange={(e) => patchSet(ex.id, s.id, { completed: e.target.checked })}
                          aria-label={`第 ${i + 1} 组完成`}
                        />
                        <span className="st-set-idx">{i + 1}</span>
                        <NumField
                          value={s.weight}
                          label={`第 ${i + 1} 组重量`}
                          onChange={(n) => patchSet(ex.id, s.id, { weight: n ?? 0 })}
                        />
                        <span className="st-unit">{UNIT} ×</span>
                        <NumField
                          value={s.reps}
                          label={`第 ${i + 1} 组次数`}
                          integer
                          onChange={(n) => patchSet(ex.id, s.id, { reps: n ?? 0 })}
                        />
                        <span className="st-unit">次</span>
                        <span className="st-rpe">
                          <span className="st-unit">RPE</span>
                          <NumField
                            value={s.rpe ?? null}
                            label={`第 ${i + 1} 组 RPE`}
                            optional
                            max={10}
                            onChange={(n) => patchSet(ex.id, s.id, { rpe: n })}
                          />
                        </span>
                        <button
                          className="st-set-del"
                          onClick={() => removeSet(ex.id, s.id)}
                          aria-label={`删除第 ${i + 1} 组`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button className="st-add-set" onClick={() => addSet(ex.id)}>+ 加一组</button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      <button className="st-add-ex" onClick={() => setModal({})}>+ 新增项目</button>

      <div className="st-meta">
        <div className="st-meta-row">
          <label htmlFor="st-date">时间</label>
          <input
            id="st-date"
            type="datetime-local"
            value={toLocalInput(d.date)}
            onChange={(e) => {
              const t = new Date(e.target.value);
              if (!isNaN(t.getTime())) patch({ date: t.toISOString() });
            }}
          />
        </div>
        <div className="st-meta-row">
          <label htmlFor="st-duration">时长（分钟）</label>
          <input
            id="st-duration"
            type="text"
            inputMode="numeric"
            placeholder="可选"
            value={d.duration}
            onChange={(e) => patch({ duration: e.target.value.replace(/[^\d]/g, '') })}
          />
        </div>
        <textarea
          className="st-meta-note"
          placeholder="备注（可选）"
          rows={2}
          value={d.note}
          onChange={(e) => patch({ note: e.target.value })}
        />
      </div>

      <div className="st-foot">
        {d.planId && !isLog && (
          <button className="st-link" onClick={savePlan} disabled={busy}>把当前内容存回模板</button>
        )}
        {isLog && (
          <button className="view-delete" onClick={deleteLog} disabled={busy}>删掉这条训练记录</button>
        )}
      </div>

      {modal && (
        <ExerciseModal
          exercise={modal.exercise}
          onClose={() => setModal(null)}
          onSave={saveExercise}
        />
      )}
    </div>
  );
}

// ===================================================
// 行内数字：点一下直接改
// ===================================================
function NumField({
  value,
  onChange,
  label,
  integer,
  optional,
  max,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
  label: string;
  integer?: boolean;
  optional?: boolean;
  max?: number;
}) {
  const [text, setText] = useState(value == null ? '' : String(value));

  return (
    <input
      className="st-num"
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      aria-label={label}
      placeholder={optional ? '–' : '0'}
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const raw = e.target.value.replace(integer ? /[^\d]/g : /[^\d.]/g, '');
        setText(raw);
        if (raw === '') {
          onChange(optional ? null : 0);
          return;
        }
        let n = integer ? parseInt(raw, 10) : parseFloat(raw);
        if (isNaN(n)) return;
        if (max != null && n > max) n = max;
        onChange(n);
      }}
      onBlur={() => setText(value == null ? '' : String(value))}
    />
  );
}

// ===================================================
// 新增 / 编辑项目弹窗（含预设选择器）
// ===================================================
function ExerciseModal({
  exercise,
  onClose,
  onSave,
}: {
  exercise?: Exercise;
  onClose: () => void;
  onSave: (ex: Exercise) => void;
}) {
  const first = exercise?.sets?.[0];
  const [name, setName] = useState(exercise?.name || '');
  const [category, setCategory] = useState<Category>(exercise?.category || 'Strength');
  const [target, setTarget] = useState(exercise?.targetMuscle || '');
  const [setCount, setSetCount] = useState(String(exercise?.sets?.length || 3));
  const [reps, setReps] = useState(String(first?.reps ?? 12));
  const [weight, setWeight] = useState(String(first?.weight ?? 20));
  const [note, setNote] = useState(exercise?.note || '');
  const [minutes, setMinutes] = useState(String(exercise?.cardio?.minutes ?? 20));
  const [distance, setDistance] = useState(exercise?.cardio?.distance || '');
  const [intensity, setIntensity] = useState(exercise?.cardio?.intensity || '');

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setName(p.name);
    setCategory(p.category);
    setTarget(p.target);
    if (p.category === 'Strength') {
      setSetCount(String(p.sets));
      setReps(String(p.reps));
      setWeight(String(p.weight));
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('名称不能空');
      return;
    }
    const base = {
      id: exercise?.id || uid(),
      name: name.trim(),
      category,
      targetMuscle: target.trim() || undefined,
      note: note.trim() || undefined,
    };

    if (category === 'Cardio') {
      onSave({
        ...base,
        sets: [],
        cardio: {
          minutes: Number(minutes) || 0,
          distance: distance.trim() || undefined,
          intensity: intensity.trim() || undefined,
          completed: exercise?.cardio?.completed || false,
        },
      });
      return;
    }

    const count = Math.min(20, Math.max(1, parseInt(setCount, 10) || 1));
    const r = parseInt(reps, 10) || 0;
    const w = parseFloat(weight) || 0;
    const old = exercise?.category === 'Strength' ? exercise.sets : [];

    let sets: WSet[];
    if (old.length === 0) {
      sets = makeSets(count, w, r);
    } else {
      // 保留已有各组（含完成状态），只在默认值被改动时才覆盖
      const repsChanged = r !== old[0].reps;
      const weightChanged = w !== old[0].weight;
      sets = old.slice(0, count).map((s) => ({
        ...s,
        reps: repsChanged ? r : s.reps,
        weight: weightChanged ? w : s.weight,
      }));
      while (sets.length < count) {
        sets.push({ id: uid(), weight: w, reps: r, rpe: null, completed: false });
      }
    }
    onSave({ ...base, sets, cardio: undefined });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel modal-panel-tall">
        <div className="modal-title">{exercise ? '编辑项目' : '新增项目'}</div>

        {!exercise && (
          <>
            <div className="modal-field-label">从预设选，或直接在下面自己填</div>
            <div className="st-presets">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  className={`st-preset ${name === p.name ? 'st-preset-active' : ''}`}
                  onClick={() => applyPreset(p)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="modal-field-label">名称</div>
        <input
          type="text"
          className="modal-input"
          placeholder="例：Leg Press"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="modal-field-label">分类</div>
        <div className="type-switcher">
          {(['Strength', 'Cardio'] as Category[]).map((c) => (
            <button
              key={c}
              className={`type-btn ${category === c ? 'type-btn-active st-type-active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {category === 'Strength' ? (
          <>
            <div className="modal-field-label">目标肌群（可选）</div>
            <input type="text" className="modal-input" placeholder="例：腿/臀" value={target} onChange={(e) => setTarget(e.target.value)} />
            <div className="st-grid3">
              <div>
                <div className="modal-field-label">默认组数</div>
                <input type="text" inputMode="numeric" className="modal-input" value={setCount} onChange={(e) => setSetCount(e.target.value.replace(/[^\d]/g, ''))} />
              </div>
              <div>
                <div className="modal-field-label">默认次数</div>
                <input type="text" inputMode="numeric" className="modal-input" value={reps} onChange={(e) => setReps(e.target.value.replace(/[^\d]/g, ''))} />
              </div>
              <div>
                <div className="modal-field-label">默认重量 ({UNIT})</div>
                <input type="text" inputMode="decimal" className="modal-input" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, ''))} />
              </div>
            </div>
          </>
        ) : (
          <div className="st-grid3">
            <div>
              <div className="modal-field-label">时长（分钟）</div>
              <input type="text" inputMode="numeric" className="modal-input" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/[^\d]/g, ''))} />
            </div>
            <div>
              <div className="modal-field-label">距离（可选）</div>
              <input type="text" className="modal-input" placeholder="例：2 mi" value={distance} onChange={(e) => setDistance(e.target.value)} />
            </div>
            <div>
              <div className="modal-field-label">强度/档位（可选）</div>
              <input type="text" className="modal-input" placeholder="例：6" value={intensity} onChange={(e) => setIntensity(e.target.value)} />
            </div>
          </div>
        )}

        <div className="modal-field-label">备注（可选）</div>
        <textarea className="modal-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />

        <div className="modal-actions">
          <button className="modal-btn modal-btn-ghost" onClick={onClose}>算了</button>
          <button className="modal-btn modal-btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </>
  );
}
