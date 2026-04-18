import { useEffect, useState } from 'react'

function GaugeBar({ label, value, type }) {
  const [width, setWidth] = useState(0)
  useEffect(() => { setTimeout(() => setWidth(value), 100) }, [value])
  return (
    <div className="confidence-gauge" style={{ gap: '0.4rem' }}>
      <div className="gauge-label">
        <span>{label}</span>
        <span>{value.toFixed(1)}%</span>
      </div>
      <div className="gauge-bar">
        <div
          className={`gauge-fill gauge-${type}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function ModelBar({ label, value }) {
  const [width, setWidth] = useState(0)
  useEffect(() => { setTimeout(() => setWidth(value), 200) }, [value])
  return (
    <div className="model-row-item">
      <div className="m-label">
        <span>{label}</span>
        <span style={{ fontWeight: 700 }}>{value.toFixed(1)}%</span>
      </div>
      <div className="model-bar-wrap">
        <div className="model-bar-fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

export default function ResultCard({ result }) {
  if (!result) return null

  const isBlockage = result.prediction === 1
  const cls        = isBlockage ? 'blockage' : 'normal'
  const icon       = isBlockage ? '⚠️' : '✅'

  const features = [
    { name: 'Vessel Area',    val: result.features.vessel_area.toLocaleString() },
    { name: 'Contrast',       val: result.features.contrast.toFixed(2) },
    { name: 'Energy',         val: result.features.energy.toFixed(4) },
    { name: 'Homogeneity',    val: result.features.homo.toFixed(4) },
  ]

  return (
    <div className="result-card">
      {/* Header */}
      <div className={`result-header ${cls}`}>
        <div className="result-icon">{icon}</div>
        <div className={`result-label ${cls}`}>
          <h2>{result.label}</h2>
          <p>Hybrid RF + SVM ensemble prediction</p>
        </div>
        <div className={`severity-tag severity-${result.severity}`}>
          {result.severity} Risk
        </div>
      </div>

      {/* Body */}
      <div className="result-body">
        {/* Confidence */}
        <div className="confidence-section">
          <h4>Prediction Confidence</h4>
          <div className="gauges-container">
            <GaugeBar label="Blockage probability" value={result.probabilities.blockage} type="blockage" />
            <GaugeBar label="Normal probability"   value={result.probabilities.normal}   type="normal" />
          </div>
          <div className={`clinical-rec-box ${cls}`}>
            {isBlockage
              ? '⚠️ Potential coronary blockage detected. Please consult a cardiologist for further evaluation.'
              : '✅ No significant blockage pattern detected. Vessels appear within normal parameters.'}
          </div>
        </div>

        {/* Features */}
        <div className="features-section">
          <h4>Extracted Features</h4>
          <div className="feature-grid-sm">
            {features.map(f => (
              <div key={f.name} className="feature-item">
                <div className="f-name">{f.name}</div>
                <div className="f-val">{f.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Individual models */}
        <div className="models-section">
          <h4>Individual Model Predictions (Blockage %)</h4>
          <div className="models-grid">
            <div className="models-row">
              <div className="model-source-tag">🌲 Random Forest</div>
              <ModelBar label="Blockage" value={result.individual_models.rf.blockage} />
              <ModelBar label="Normal"   value={result.individual_models.rf.normal} />
            </div>
            <div className="models-row">
              <div className="model-source-tag">🤖 Support Vector Machine</div>
              <ModelBar label="Blockage" value={result.individual_models.svm.blockage} />
              <ModelBar label="Normal"   value={result.individual_models.svm.normal} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
