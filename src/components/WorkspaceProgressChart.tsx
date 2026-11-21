import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  buildSubjectChartData,
  computeOverallProgress,
  type SubjectChartDatum,
} from '../utils/scheduleEngine';

type ChartMetric = 'units' | 'blocks' | 'chapters' | 'hours';

interface WorkspaceProgressChartProps {
  completedBlockIds: ReadonlySet<string>;
  completedChapterIds: ReadonlySet<string>;
}

interface MetricConfig {
  id: ChartMetric;
  label: string;
  unitLabel: string;
  completedKey: keyof Pick<
    SubjectChartDatum,
    'completedUnits' | 'completedBlocks' | 'completedChapters' | 'completedHours'
  >;
  pendingKey: keyof Pick<
    SubjectChartDatum,
    'pendingUnits' | 'pendingBlocks' | 'pendingChapters' | 'pendingHours'
  >;
  totalKey: keyof Pick<
    SubjectChartDatum,
    'totalUnits' | 'totalBlocks' | 'totalChapters' | 'totalHours'
  >;
}

const METRIC_CONFIGS: readonly MetricConfig[] = [
  {
    id: 'units',
    label: 'All Units',
    unitLabel: 'units',
    completedKey: 'completedUnits',
    pendingKey: 'pendingUnits',
    totalKey: 'totalUnits',
  },
  {
    id: 'blocks',
    label: 'Sessions',
    unitLabel: 'sessions',
    completedKey: 'completedBlocks',
    pendingKey: 'pendingBlocks',
    totalKey: 'totalBlocks',
  },
  {
    id: 'chapters',
    label: 'Chapters',
    unitLabel: 'chapters',
    completedKey: 'completedChapters',
    pendingKey: 'pendingChapters',
    totalKey: 'totalChapters',
  },
  {
    id: 'hours',
    label: 'Study Hours',
    unitLabel: 'hrs',
    completedKey: 'completedHours',
    pendingKey: 'pendingHours',
    totalKey: 'totalHours',
  },
];

interface ChartTooltipPayloadItem {
  payload?: SubjectChartDatum;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  metricConfig: MetricConfig;
}

function SubjectProgressTooltip({ active, payload, metricConfig }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }

  const d = payload[0].payload;
  const doneVal = d[metricConfig.completedKey];
  const pendingVal = d[metricConfig.pendingKey];
  const totalVal = d[metricConfig.totalKey];
  const pct = totalVal === 0 ? 0 : Math.round((doneVal / totalVal) * 100);

  return (
    <div className="bg-white/95 border border-[#E8D7E4] rounded-xl px-3.5 py-2.5 shadow-md text-xs text-[#221329] min-w-[200px]">
      <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-[#E8D7E4]">
        <span className="font-semibold text-[#221329] flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: d.accentHex }}
          />
          {d.name}
        </span>
        <span className="font-mono font-semibold tabular-nums text-[#6D28D9]">{pct}%</span>
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#614B69]">Completed</span>
          <span className="font-mono font-medium tabular-nums text-[#047857]">
            {doneVal} {metricConfig.unitLabel}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#614B69]">Remaining</span>
          <span className="font-mono font-medium tabular-nums text-[#614B69]">
            {pendingVal} {metricConfig.unitLabel}
          </span>
        </div>
        <div className="pt-1 mt-1 border-t border-[#E8D7E4]/70 text-[11px] text-[#614B69] font-mono tabular-nums">
          {d.completedBlocks}/{d.totalBlocks} sessions · {d.completedChapters}/{d.totalChapters}{' '}
          chapters
        </div>
      </div>
    </div>
  );
}

function formatStatusLabel(pct: number): { text: string; className: string } {
  if (pct >= 100) {
    return { text: 'Complete', className: 'text-[#047857]' };
  }
  if (pct > 0) {
    return { text: 'In Progress', className: 'text-[#6D28D9]' };
  }
  return { text: 'Not Started', className: 'text-[#614B69]' };
}

export function WorkspaceProgressChart({
  completedBlockIds,
  completedChapterIds,
}: WorkspaceProgressChartProps) {
  const [metric, setMetric] = useState<ChartMetric>('units');

  const metricConfig = useMemo(
    () => METRIC_CONFIGS.find((m) => m.id === metric) || METRIC_CONFIGS[0],
    [metric]
  );

  const chartData = useMemo(
    () => buildSubjectChartData(completedBlockIds, completedChapterIds),
    [completedBlockIds, completedChapterIds]
  );

  const overall = useMemo(
    () => computeOverallProgress(completedBlockIds, completedChapterIds),
    [completedBlockIds, completedChapterIds]
  );

  const overallMetricTotals = useMemo(() => {
    let completed = 0;
    let total = 0;
    for (const row of chartData) {
      completed += row[metricConfig.completedKey];
      total += row[metricConfig.totalKey];
    }
    const completedRounded =
      metric === 'hours' ? Math.round(completed * 10) / 10 : completed;
    const totalRounded = metric === 'hours' ? Math.round(total * 10) / 10 : total;
    const remainingRounded = Math.max(
      0,
      metric === 'hours'
        ? Math.round((totalRounded - completedRounded) * 10) / 10
        : totalRounded - completedRounded
    );
    const percent =
      totalRounded === 0 ? 0 : Math.round((completedRounded / totalRounded) * 100);

    return {
      completed: completedRounded,
      remaining: remainingRounded,
      total: totalRounded,
      percent,
    };
  }, [chartData, metric, metricConfig]);

  const donutData = useMemo(() => {
    const remaining =
      overallMetricTotals.total === 0 ? 1 : overallMetricTotals.remaining;
    return [
      { name: 'Completed', value: overallMetricTotals.completed },
      { name: 'Remaining', value: remaining },
    ];
  }, [overallMetricTotals]);

  return (
    <section
      aria-label="Preparation progress overview by subject"
      className="enchanted-card rounded-2xl p-6 space-y-6"
    >
      {/* Header + Metric Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#E8D7E4]">
        <div>
          <p className="text-xs font-medium text-[#7E22CE]">
            Class 10th Board Readiness · All 7 Subjects
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#221329] mt-0.5">
            Preparation Progress Overview
          </h2>
          <p className="text-xs text-[#614B69] mt-1 font-mono tabular-nums">
            {overall.completedBlocks}/{overall.totalBlocks} sessions ·{' '}
            {overall.completedChapters}/{overall.totalChapters} chapters ·{' '}
            {overall.completedStudyHours}/{overall.totalStudyHours} hrs logged
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Progress chart metric"
          className="grid grid-cols-2 sm:inline-flex items-center gap-1 p-1 rounded-xl bg-[#F6ECF3] border border-[#E8D7E4] w-full sm:w-auto"
        >
          {METRIC_CONFIGS.map((m) => {
            const active = metric === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMetric(m.id)}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer text-center ${
                  active
                    ? 'bg-white text-[#221329] shadow-xs border border-[#E8D7E4]'
                    : 'text-[#614B69] hover:text-[#221329] border border-transparent'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chart + Summary Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Stacked Subject Bar Chart */}
        <div className="lg:col-span-8 space-y-3 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#614B69]">
            <span>
              Completion by Subject ({metricConfig.label} — Completed vs. Remaining)
            </span>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#6D28D9]" />
                Completed (subject hue)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#EFE3EC] border border-[#DCC7D9]" />
                Remaining
              </span>
            </div>
          </div>

          <div className="w-full h-[290px]" data-testid="workspace-subject-bar-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 12, left: -14, bottom: 4 }}
                barCategoryGap="24%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E8D7E4"
                  vertical={false}
                />
                <XAxis
                  dataKey="shortName"
                  tick={{ fill: '#614B69', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#E8D7E4' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={metric === 'hours'}
                  tick={{ fill: '#614B69', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: '#F6ECF3', fillOpacity: 0.65 }}
                  content={<SubjectProgressTooltip metricConfig={metricConfig} />}
                />
                <Bar
                  dataKey={metricConfig.completedKey}
                  stackId="subject-progress"
                  name="Completed"
                  isAnimationActive={false}
                  maxBarSize={44}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.subjectId} fill={entry.accentHex} />
                  ))}
                </Bar>
                <Bar
                  dataKey={metricConfig.pendingKey}
                  stackId="subject-progress"
                  name="Remaining"
                  fill="#EFE3EC"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Overall Donut + Per-Subject Tabular Readout */}
        <div className="lg:col-span-4 space-y-5 lg:border-l lg:border-[#E8D7E4] lg:pl-6 min-w-0">
          <div className="flex items-center gap-4">
            <div
              className="relative w-[132px] h-[132px] shrink-0"
              data-testid="workspace-overall-donut-chart"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={60}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    <Cell
                      fill={
                        overallMetricTotals.percent >= 100 ? '#047857' : '#6D28D9'
                      }
                    />
                    <Cell fill="#EFE3EC" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-xl font-semibold text-[#221329] tabular-nums">
                  {overallMetricTotals.percent}%
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#614B69]">
                  Ready
                </span>
              </div>
            </div>

            <div className="min-w-0 space-y-1">
              <div className="text-xs font-medium text-[#614B69]">
                Overall {metricConfig.label}
              </div>
              <div className="font-mono text-lg font-semibold text-[#221329] tabular-nums">
                {overallMetricTotals.completed} / {overallMetricTotals.total}{' '}
                <span className="text-xs font-normal text-[#614B69]">
                  {metricConfig.unitLabel}
                </span>
              </div>
              <div className="text-xs text-[#614B69] tabular-nums">
                {overallMetricTotals.remaining} {metricConfig.unitLabel} remaining ·{' '}
                {overall.remainingDays} sprint{' '}
                {overall.remainingDays === 1 ? 'day' : 'days'} left
              </div>
            </div>
          </div>

          {/* Per-Subject Compact Tabular List */}
          <div className="divide-y divide-[#E8D7E4]/70 border-t border-[#E8D7E4]">
            {chartData.map((row) => {
              const doneVal = row[metricConfig.completedKey];
              const totalVal = row[metricConfig.totalKey];
              const pct =
                totalVal === 0 ? 0 : Math.round((doneVal / totalVal) * 100);
              const status = formatStatusLabel(pct);

              return (
                <div
                  key={row.subjectId}
                  className="py-2 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: row.accentHex }}
                    />
                    <span className="font-medium text-[#221329] truncate">
                      {row.shortName}
                    </span>
                    <span className={`text-[11px] font-medium ${status.className}`}>
                      {status.text}
                    </span>
                  </div>
                  <div className="font-mono tabular-nums text-[#614B69] shrink-0">
                    <span className="text-[#221329] font-medium">{doneVal}</span>/
                    {totalVal}{' '}
                    <span className="text-[11px] text-[#614B69]">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
