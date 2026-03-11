'use client'

import { useRef, useCallback } from 'react'
import {
  BUDGET_TOTAL_LKR,
  BUDGET_ITEMS,
  HOURLY_RATE_LKR,
  WBS_ACTIVITIES,
  BCWS_BY_WEEK,
  ACWP_BY_WEEK,
  BCWP_BY_WEEK,
  CURRENT_WEEK,
  LABEL_WEEKS,
  WEEK_LABELS,
} from '@/lib/evm-data'

function downloadSvgAsPng(svg: SVGElement, filename: string) {
  const serializer = new XMLSerializer()
  const str = serializer.serializeToString(svg)
  const svgBlob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = svg.clientWidth * scale
    canvas.height = svg.clientHeight * scale
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(scale, scale)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      const pngUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = filename
      a.click()
    }
    URL.revokeObjectURL(url)
  }
  img.src = url
}

function EvmChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const n = BCWS_BY_WEEK.length
  const maxVal = Math.max(...BCWS_BY_WEEK, ...ACWP_BY_WEEK, ...BCWP_BY_WEEK)
  const width = 900
  const height = 380
  const padding = { top: 28, right: 24, bottom: 56, left: 64 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const toX = (i: number) => padding.left + (i / Math.max(1, n - 1)) * chartWidth
  const toY = (v: number) => padding.top + chartHeight - (v / maxVal) * chartHeight

  const path = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ')

  const handleDownload = useCallback(() => {
    if (svgRef.current) downloadSvgAsPng(svgRef.current, 'evm-chart.png')
  }, [])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">EVM – Cumulative curves (9 weeks from 18 Jan 2026)</h3>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Download chart as PNG
        </button>
      </div>
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" style={{ background: '#fff' }}>
        {/* Horizontal grid */}
        {[0.25, 0.5, 0.75, 1].map((q) => (
          <line
            key={q}
            x1={padding.left}
            y1={toY(q * maxVal)}
            x2={width - padding.right}
            y2={toY(q * maxVal)}
            stroke="#e2e8f0"
            strokeDasharray="4 2"
          />
        ))}
        {/* X-axis: week + date labels */}
        {WEEK_LABELS.map((w, i) => (
          <g key={w.week}>
            <text x={toX(i)} y={height - 28} textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
              W{w.week}
            </text>
            <text x={toX(i)} y={height - 12} textAnchor="middle" fill="#64748b" fontSize="10">
              {w.shortDate}
            </text>
          </g>
        ))}
        {/* Y-axis label */}
        <text x={14} y={padding.top + chartHeight / 2} textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600" transform={`rotate(-90 14 ${padding.top + chartHeight / 2})`}>
          LKR (cumulative)
        </text>
        {/* All three lines – distinct colors and stroke width for visibility */}
        <path d={path(BCWS_BY_WEEK)} fill="none" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path(ACWP_BY_WEEK)} fill="none" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path(BCWP_BY_WEEK)} fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points for each line so all 3 are clearly visible */}
        {BCWS_BY_WEEK.map((v, i) => (
          <circle key={`bcws-${i}`} cx={toX(i)} cy={toY(v)} r="4" fill="#1e40af" stroke="#fff" strokeWidth="1.5" />
        ))}
        {ACWP_BY_WEEK.map((v, i) => (
          <circle key={`acwp-${i}`} cx={toX(i)} cy={toY(v)} r="4" fill="#b91c1c" stroke="#fff" strokeWidth="1.5" />
        ))}
        {BCWP_BY_WEEK.map((v, i) => (
          <circle key={`bcwp-${i}`} cx={toX(i)} cy={toY(v)} r="4" fill="#15803d" stroke="#fff" strokeWidth="1.5" />
        ))}
        {/* Now line */}
        <line x1={toX(CURRENT_WEEK - 1)} y1={padding.top} x2={toX(CURRENT_WEEK - 1)} y2={height - padding.bottom} stroke="#64748b" strokeDasharray="6 4" strokeWidth="2" />
        <text x={toX(CURRENT_WEEK - 1)} y={padding.top - 8} textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
          Now
        </text>
      </svg>
      <div className="mt-3 flex flex-wrap gap-6 border-t border-slate-100 pt-3 text-sm">
        <span className="flex items-center gap-2"><span className="h-1 w-6 rounded bg-blue-700" /> BCWS (planned)</span>
        <span className="flex items-center gap-2"><span className="h-1 w-6 rounded bg-red-700" /> ACWP (actual)</span>
        <span className="flex items-center gap-2"><span className="h-1 w-6 rounded bg-green-700" /> BCWP (earned)</span>
      </div>
    </div>
  )
}

export default function EvmPage() {
  const bcwsNow = BCWS_BY_WEEK[CURRENT_WEEK - 1]
  const acwpNow = ACWP_BY_WEEK[CURRENT_WEEK - 1]
  const bcwpNow = BCWP_BY_WEEK[CURRENT_WEEK - 1]
  const cpi = acwpNow > 0 ? bcwpNow / acwpNow : 0
  const spi = bcwsNow > 0 ? bcwpNow / bcwsNow : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">EVM – Earned Value Management</h1>
        <p className="mb-4 text-slate-600">
          Plus Arch Upcycle · 9 weeks from 18 Jan 2026 · Budget LKR {BUDGET_TOTAL_LKR.toLocaleString()} · Status: development complete, starting testing (Week {CURRENT_WEEK})
        </p>
        <p className="mb-8">
          <a
            href="/evm-report.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            View / print full report (chart + all tables as single page) →
          </a>
        </p>

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Estimate budget for 1st year</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="pb-2 pr-4">Item</th>
                <th className="pb-2 text-right">LKR</th>
              </tr>
            </thead>
            <tbody>
              {BUDGET_ITEMS.map((item) => (
                <tr key={item.label} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{item.label}</td>
                  <td className="py-2 text-right font-medium">{item.lkr.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="font-semibold text-slate-800">
                <td className="py-3 pr-4">Total</td>
                <td className="py-3 text-right">{BUDGET_TOTAL_LKR.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4 text-slate-600">
            <strong>Development hourly rate:</strong> LKR {HOURLY_RATE_LKR.toLocaleString()} per hour (Development Fee ÷ 200 hrs).
          </p>
        </div>

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">WBS – Work breakdown & schedule (Gantt)</h2>
          <p className="mb-4 text-sm text-slate-600">Planned vs actual time (dates/days). All activities on schedule.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="pb-2 pr-4">No.</th>
                  <th className="pb-2 pr-4">WBS Activities</th>
                  <th className="pb-2 text-right">Planning Time (Dates)</th>
                  <th className="pb-2 text-right">Actual Time (Dates)</th>
                </tr>
              </thead>
              <tbody>
                {WBS_ACTIVITIES.map((row) => (
                  <tr
                    key={row.no}
                    className={`border-b border-slate-100 ${row.plannedDays === 0 ? 'bg-slate-50 font-semibold text-slate-800' : ''}`}
                  >
                    <td className="py-1.5 pr-4">{row.no}</td>
                    <td className="py-1.5 pr-4">{row.activity}</td>
                    <td className="py-1.5 text-right">{row.plannedDays === 0 ? '—' : `${row.plannedDays} days`}</td>
                    <td className="py-1.5 text-right">{row.actualDays === 0 ? '—' : `${row.actualDays} days`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">EVM at current date (end of Week {CURRENT_WEEK})</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-xs font-medium uppercase text-blue-700">BCWS</p>
              <p className="text-xl font-bold text-blue-900">LKR {bcwsNow.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-600">Budgeted cost of work scheduled</p>
            </div>
            <div className="rounded-lg border border-green-100 bg-green-50/50 p-4">
              <p className="text-xs font-medium uppercase text-green-700">ACWP</p>
              <p className="text-xl font-bold text-green-900">LKR {acwpNow.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-600">Actual cost of work performed</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4">
              <p className="text-xs font-medium uppercase text-amber-700">BCWP</p>
              <p className="text-xl font-bold text-amber-900">LKR {bcwpNow.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-600">Budgeted cost of work performed (earned)</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-6 border-t border-slate-100 pt-4">
            <div>
              <span className="text-slate-600">CPI: </span>
              <span className="font-semibold">{cpi.toFixed(2)}</span>
              {cpi >= 1 ? <span className="text-green-600"> On/under budget</span> : <span className="text-red-600"> Over budget</span>}
            </div>
            <div>
              <span className="text-slate-600">SPI: </span>
              <span className="font-semibold">{spi.toFixed(2)}</span>
              {spi >= 1 ? <span className="text-green-600"> On/ahead of schedule</span> : <span className="text-red-600"> Behind schedule</span>}
            </div>
          </div>
        </div>

        <EvmChart />

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Cumulative by week (LKR)</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="pb-2 pr-4">Week</th>
                  <th className="pb-2 text-right">BCWS</th>
                  <th className="pb-2 text-right">ACWP</th>
                  <th className="pb-2 text-right">BCWP</th>
                </tr>
              </thead>
              <tbody>
                {LABEL_WEEKS.map((label, i) => (
                  <tr key={label} className={`border-b border-slate-100 ${i === CURRENT_WEEK - 1 ? 'bg-slate-50' : ''}`}>
                    <td className="py-2 pr-4 font-medium">{label} {i === CURRENT_WEEK - 1 && '(now)'}</td>
                    <td className="py-2 text-right">{BCWS_BY_WEEK[i].toLocaleString()}</td>
                    <td className="py-2 text-right">{ACWP_BY_WEEK[i].toLocaleString()}</td>
                    <td className="py-2 text-right">{BCWP_BY_WEEK[i].toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
