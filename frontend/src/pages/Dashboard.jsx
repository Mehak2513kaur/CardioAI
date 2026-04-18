import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis
} from 'recharts'

const COLORS = ['#00D4FF', '#FF4B6E', '#00FF9F', '#FFD166']

const customTooltipStyle = {
  backgroundColor: 'rgba(13,21,38,0.95)',
  border: '1px solid rgba(0,212,255,0.2)',
  borderRadius: 10,
  color: '#F0F4FF',
  fontSize: '0.85rem',
}

export default function Dashboard() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    axios.get('/api/stats')
      .then(r => { setStats(r.data.stats); setLoading(false) })
      .catch(e => {
        const msg = e.response?.data?.error || e.message
        setError(msg)
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="page">
      <div className="dashboard">
        <h1>📊 Model Dashboard</h1>
        <p className="page-sub">Real-time model metrics and visualisations</p>
        <div className="loading-overlay">
          <div className="big-spinner" />
          <p>Loading model statistics…</p>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="page">
      <div className="dashboard">
        <h1>📊 Model Dashboard</h1>
        <div className="error-box">
          <h3>Could not load stats</h3>
          <p>{error}</p>
          <p style={{ marginTop: '0.8rem', fontSize: '0.85rem' }}>
            Run <code style={{ background: 'rgba(255,75,110,0.15)', padding: '2px 6px', borderRadius: 4 }}>npm run train</code> inside the <strong>backend</strong> folder first.
          </p>
        </div>
      </div>
    </div>
  )

  /* ── Prepare chart data ── */
  const accuracyData = [
    { name: 'Random Forest', accuracy: +((stats.rf_accuracy || 0) * 100).toFixed(2) },
    { name: 'SVM',           accuracy: +((stats.svm_accuracy || 0) * 100).toFixed(2) },
    { name: 'Hybrid',        accuracy: +((stats.hybrid_accuracy || 0) * 100).toFixed(2) },
  ]

  const featureData = Object.entries(stats.feature_importances).map(([name, val]) => ({
    name: name.replace('Vessel ', 'V.').replace('Homogeneity', 'Homog.').replace('Correlation', 'Correl.'),
    importance: +(val * 100).toFixed(2)
  }))

  const classData = [
    { name: 'Normal',   value: stats.class_distribution.Normal },
    { name: 'Blockage', value: stats.class_distribution.Blockage },
  ]

  const rocData = stats.roc.fpr.map((fpr, i) => ({
    fpr: +fpr.toFixed(3),
    tpr: +stats.roc.tpr[i].toFixed(3),
  }))

  const radarData = Object.entries(stats.feature_importances).map(([k, v]) => ({
    feature: k.replace('Vessel ', 'V.'),
    value: +(v * 100).toFixed(1),
  }))

  const cm = stats.confusion_matrix  // [[TN, FP], [FN, TP]]

  return (
    <div className="page">
      <div className="dashboard">
        <h1>📊 Model Dashboard</h1>
        <p className="page-sub">
          Performance metrics for the Hybrid RF + SVM coronary blockage classifier
          &nbsp;·&nbsp; <strong>{stats.split}</strong> split
          &nbsp;·&nbsp; {stats.total_samples} total samples
        </p>

        {/* ── Stat Cards ── */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="s-label">Hybrid Accuracy</div>
            <div className="s-val color-green">{(stats.hybrid_accuracy * 100).toFixed(1)}%</div>
            <div className="s-sub">RF + SVM ensemble</div>
          </div>
          <div className="stat-card">
            <div className="s-label">AUC Score</div>
            <div className="s-val color-blue">{stats.auc_score.toFixed(3)}</div>
            <div className="s-sub">ROC area under curve</div>
          </div>
          <div className="stat-card">
            <div className="s-label">RF Accuracy</div>
            <div className="s-val color-blue">{(stats.rf_accuracy * 100).toFixed(1)}%</div>
            <div className="s-sub">Random Forest (500 trees)</div>
          </div>
          <div className="stat-card">
            <div className="s-label">SVM Accuracy</div>
            <div className="s-val color-yellow">{(stats.svm_accuracy * 100).toFixed(1)}%</div>
            <div className="s-sub">RBF kernel, C=10</div>
          </div>
          <div className="stat-card">
            <div className="s-label">Train Samples</div>
            <div className="s-val color-green">{stats.train_samples}</div>
            <div className="s-sub">80% of dataset</div>
          </div>
          <div className="stat-card">
            <div className="s-label">Test Samples</div>
            <div className="s-val color-red">{stats.test_samples}</div>
            <div className="s-sub">20% held-out</div>
          </div>
        </div>

        {/* ── Charts ── */}
        <div className="charts-grid">

          {/* Model Accuracy Comparison */}
          <div className="chart-card">
            <h3>🏆 Model Accuracy Comparison (%)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={accuracyData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#7A8BA6', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#7A8BA6', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} formatter={v => [`${v}%`, 'Accuracy']} />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                  {accuracyData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Class Distribution */}
          <div className="chart-card">
            <h3>🫀 Class Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={classData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  label={false}
                >
                  {classData.map((_, i) => <Cell key={i} fill={i === 0 ? 'var(--blue)' : 'var(--red)'} />)}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(v, entry) => (
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
                      {v}: {entry.payload.value}
                    </span>
                  )} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* ROC Curve */}
          <div className="chart-card full">
            <h3>📈 ROC Curve &nbsp;
              <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--blue)' }}>
                AUC = {stats.auc_score.toFixed(3)}
              </span>
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={rocData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="fpr" label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fill: '#7A8BA6', fontSize: 12 }}
                  tick={{ fill: '#7A8BA6', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: '#7A8BA6', fontSize: 12 }}
                  tick={{ fill: '#7A8BA6', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} formatter={(v, n) => [v.toFixed(3), n]} />
                <Legend formatter={(v) => <span style={{ color: '#F0F4FF', fontSize: '0.85rem' }}>{v}</span>} />
                {/* Diagonal baseline */}
                <Line type="linear" dataKey="fpr" stroke="rgba(255,255,255,0.2)" dot={false} strokeDasharray="4 4" name="Random" />
                <Line type="monotone" dataKey="tpr" stroke="#00D4FF" strokeWidth={2.5} dot={false} name="Hybrid Model" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Feature Importance */}
          <div className="chart-card">
            <h3>🔬 Feature Importance (RF)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={featureData} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#7A8BA6', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fill: '#7A8BA6', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={customTooltipStyle} formatter={v => [`${v}%`, 'Importance']} />
                <Bar dataKey="importance" radius={[0, 6, 6, 0]} fill="#00D4FF">
                  {featureData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar feature chart */}
          <div className="chart-card">
            <h3>🕸️ Feature Radar</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="feature" tick={{ fill: '#7A8BA6', fontSize: 10 }} />
                <Radar name="Importance" dataKey="value" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.18} />
                <Tooltip contentStyle={customTooltipStyle} formatter={v => [`${v}%`, 'Importance']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Confusion Matrix */}
          <div className="chart-card full">
            <h3>🧮 Confusion Matrix</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="cm-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Predicted Normal</th>
                    <th>Predicted Blockage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Actual Normal</td>
                    <td className="cm-cell-tn">
                      <div>{cm[0][0]}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>True Negative</div>
                    </td>
                    <td className="cm-cell-fp">
                      <div>{cm[0][1]}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>False Positive</div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Actual Blockage</td>
                    <td className="cm-cell-fn">
                      <div>{cm[1][0]}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>False Negative</div>
                    </td>
                    <td className="cm-cell-tp">
                      <div>{cm[1][1]}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>True Positive</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Classification Report summary */}
            {stats.classification_report && (
              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '0.8rem' }}>
                {['0', '1'].map(cls => {
                  const r = stats.classification_report[cls]
                  if (!r) return null
                  return (
                    <div key={cls} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        {cls === '0' ? '🔵 Normal' : '🔴 Blockage'}
                      </div>
                      {[['Precision', r.precision], ['Recall', r.recall], ['F1-Score', r['f1-score']]].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.2rem 0' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                          <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{(v * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
