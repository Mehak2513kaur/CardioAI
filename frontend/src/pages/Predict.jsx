import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import ResultCard from '../components/ResultCard'
import ChatAssistant from '../components/ChatAssistant'

const ACCEPTED = { 'image/*': ['.pgm', '.png', '.jpg', '.jpeg', '.bmp', '.tif', '.tiff'] }

/**
 * Converts a PGM file (binary P5 or ASCII P2) to a PNG data-URL
 * so browsers can display it.
 */
async function pgmToDataURL(file) {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)

  // Parse PGM header
  const text = new TextDecoder('ascii').decode(bytes.slice(0, 200))
  const lines = text.split(/\s+/).filter(Boolean)
  let idx = 0
  const magic = lines[idx++] // P5 or P2
  if (magic !== 'P5' && magic !== 'P2') return null // not a PGM

  // Skip comments
  const rawLines = text.split('\n')
  let byteOffset = 0
  let headerLines = []
  for (const line of rawLines) {
    byteOffset += line.length + 1
    if (!line.startsWith('#')) {
      headerLines.push(line.trim())
      if (headerLines.join(' ').split(/\s+/).filter(Boolean).length >= 4) break
    }
  }
  const parts = headerLines.join(' ').split(/\s+/).filter(Boolean)
  const width  = parseInt(parts[1])
  const height = parseInt(parts[2])
  const maxVal = parseInt(parts[3])

  // Find where actual pixel data starts (after header)
  let headerEnd = 0
  let newlines = 0
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 10) { // '\n'
      newlines++
      if (newlines >= 3) { headerEnd = i + 1; break }
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width  = width
  canvas.height = height
  const ctx  = canvas.getContext('2d')
  const imgData = ctx.createImageData(width, height)

  if (magic === 'P5') {
    // Binary PGM
    const pixels = bytes.slice(headerEnd)
    for (let i = 0; i < width * height; i++) {
      const v = maxVal > 255 ? Math.round((pixels[i*2]*256 + pixels[i*2+1]) * 255 / maxVal)
                             : Math.round(pixels[i] * 255 / maxVal)
      imgData.data[i*4]   = v
      imgData.data[i*4+1] = v
      imgData.data[i*4+2] = v
      imgData.data[i*4+3] = 255
    }
  } else {
    // ASCII PGM
    const pixelText = new TextDecoder().decode(bytes.slice(headerEnd))
    const vals = pixelText.trim().split(/\s+/)
    for (let i = 0; i < width * height; i++) {
      const v = Math.round(parseInt(vals[i]) * 255 / maxVal)
      imgData.data[i*4]   = v
      imgData.data[i*4+1] = v
      imgData.data[i*4+2] = v
      imgData.data[i*4+3] = 255
    }
  }
  ctx.putImageData(imgData, 0, 0)
  return canvas.toDataURL('image/png')
}

export default function Predict() {
  const [file,       setFile]       = useState(null)
  const [preview,    setPreview]    = useState(null)   // data-URL for display
  const [isPgm,      setIsPgm]      = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState(null)
  const [error,      setError]      = useState(null)

  const onDrop = useCallback(async accepted => {
    if (!accepted.length) return
    const f = accepted[0]
    setFile(f)
    setResult(null)
    setError(null)

    const ext = f.name.split('.').pop().toLowerCase()
    if (ext === 'pgm') {
      setIsPgm(true)
      const dataURL = await pgmToDataURL(f)
      setPreview(dataURL || URL.createObjectURL(f))
    } else {
      setIsPgm(false)
      // Use FileReader instead of createObjectURL for html2canvas compatibility
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(f)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
  })

  const handlePredict = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await axios.post('/api/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data.success) {
        setResult(res.data.result)
      } else {
        setError(res.data.error || 'Unknown error')
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setIsPgm(false)
  }

  const handleDownloadPDF = async () => {
    const reportElement = document.getElementById('clinical-pdf-template')
    if (!reportElement) {
      alert("Report template not found.")
      return
    }

    try {
      // Ensure the hidden report is temporarily visible for capture
      reportElement.style.display = 'block'
      
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      const pdf = new jsPDF('p', 'mm', 'a4', true)
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = (canvas.height * pageWidth) / canvas.width
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, '', 'FAST')
      pdf.save(`CardioAI_Clinical_Report_${new Date().getTime()}.pdf`)
      
      reportElement.style.display = 'none'
    } catch (err) {
      console.error("PDF generation failed:", err)
      alert("Failed to generate clinical report. " + err.message)
      reportElement.style.display = 'none'
    }
  }

  const dropClass = [
    'upload-zone',
    isDragActive ? 'drag-active' : '',
    file ? 'has-file' : ''
  ].filter(Boolean).join(' ')

  const isBlockage = result?.prediction === 1

  return (
    <div className="page">
      <div className={result ? "predict-page full-width" : "predict-page"}>
        
        {/* Header Section */}
        {!result && (
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1>🔍 Coronary Blockage Detection</h1>
            <p className="page-sub" style={{ margin: '0 auto', maxWidth: '600px' }}>
              Upload a coronary angiogram image (.pgm / .png / .jpg) to receive an AI-powered blockage assessment and speak with our clinical assistant.
            </p>
          </div>
        )}

        {/* Top Content: Upload / Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* If no result yet, show big upload zone or preview */}
          {!result && (
            <div {...getRootProps()} className={dropClass} id="upload-dropzone">
              <input {...getInputProps()} id="file-input" />
              {file ? (
                <>
                  <div className="upload-icon">✅</div>
                  <h3>{file.name}</h3>
                  <p>{(file.size / 1024).toFixed(1)} KB — ready to analyse</p>
                  <span className="hint">Drop another file to replace</span>
                </>
              ) : isDragActive ? (
                <>
                  <div className="upload-icon">📂</div>
                  <h3>Drop your angiogram here</h3>
                  <p>Release to load the image</p>
                </>
              ) : (
                <>
                  <div className="upload-icon">🫀</div>
                  <h3>Drag &amp; Drop your angiogram</h3>
                  <p>or click to browse files</p>
                  <span className="hint">Supports: .pgm  .png  .jpg  .jpeg  .bmp  .tif</span>
                </>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-box" style={{ margin: 0 }}>
              <h3>Error Occurred</h3>
              <p style={{ fontSize: '0.95rem' }}>{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="predict-actions">
            <button
              id="predict-btn"
              className="predict-btn"
              onClick={handlePredict}
              disabled={!file || loading}
            >
              {loading
                ? <><span className="spinner" />&nbsp; Analysing Imagery…</>
                : '🔬 Run High-Precision Scan'}
            </button>

            {(file || result) && (
              <button
                id="reset-btn"
                onClick={handleReset}
                className="btn-secondary btn-reset"
              >
                ↺ Reset
              </button>
            )}
          </div>

          {/* If Result exists -> Huge visual showcase + chat */}
          {result && preview && (
            <div style={{ marginTop: '0', animation: 'fadeInUp 0.6s both' }}>
              
              {/* Killer Dashboard Layout */}
              <div className="result-dashboard-layout">
                
                {/* LEFT COLUMN: Main Feed (Image + Stats) */}
                <div className="rd-main rd-main-container" id="clinical-report-content">
                  
                  {/* Action Bar for PDF Download */}
                  <div className="pdf-download-bar">
                    <button 
                      onClick={handleDownloadPDF} 
                      className="btn-secondary btn-download" 
                    >
                      📄 Download Clinical PDF
                    </button>
                  </div>

                  {/* The Image Showcase */}
                  <div className="image-showcase-card">
                    <div className="showcase-header">
                      <h4 className="showcase-title">
                        {isPgm ? '🔭 PGM Angiogram Source' : '📷 Angiogram Source'}
                      </h4>
                      <div className={`showcase-badge ${isBlockage ? 'blockage' : 'normal'}`}>
                        {isBlockage ? '⚠️ BLOCKAGE DETECTED OVERLAY' : '✅ NORMAL VESSEL STRUCTURE'}
                      </div>
                    </div>

                    <div className="scan-viewport">
                      <img
                        src={preview}
                        alt="Original Angiogram"
                        className="scan-image"
                      />
                      {result?.overlay_png && isBlockage && (
                        <img
                          src={`data:image/png;base64,${result.overlay_png}`}
                          alt="Blockage Heatmap"
                          className="scan-heatmap"
                        />
                      )}
                      
                      {/* Banner */}
                      <div className="showcase-banner" style={{
                        background: isBlockage ? 'rgba(225, 29, 72, 0.9)' : 'rgba(5, 150, 105, 0.9)',
                      }}>
                        <div className="banner-main-info">
                          {isBlockage ? '⚠️' : '✅'}
                          {result.label} — {result.confidence}%
                        </div>
                        <div className="banner-severity">
                           <span className="severity-label">Severity:</span>
                           <span className="severity-val" style={{ color: isBlockage ? 'var(--red)' : 'var(--green)' }}>
                             {result.severity}
                           </span>
                        </div>
                      </div>
                    </div>

                    {/* HIDDEN CLINICAL PDF TEMPLATE */}
                    <div id="clinical-pdf-template" style={{
                      display: 'none', width: '800px', padding: '40px', background: 'white', color: '#1e293b', 
                      fontFamily: 'serif', position: 'absolute', top: 0, left: '-9999px'
                    }}>
                      <div className="pdf-header" style={{ borderBottom: '2px solid #0f172a', paddingBottom: '15px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <h1 style={{ margin: 0, color: '#0f172a' }}>CardioAI Clinical Reports</h1>
                          <p style={{ margin: 0, opacity: 0.7 }}>Advanced Coronary Diagnostics Facility</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0 }}><strong>Report ID:</strong> #{Math.floor(Math.random()*100000)}</p>
                          <p style={{ margin: 0 }}><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', color: '#475569', marginBottom: '10px' }}>Diagnostic Summary</h2>
                        <div style={{ padding: '15px', background: isBlockage ? '#fff1f2' : '#f0fdf4', border: '1px solid currentColor', borderRadius: '8px' }}>
                          <h3 style={{ margin: 0, color: isBlockage ? '#be123c' : '#15803d' }}>{result.label}</h3>
                          <p style={{ margin: '5px 0' }}>Confidence Score: <strong>{result.confidence}%</strong> | Severity Grade: <strong>{result.severity}</strong></p>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', marginBottom: '25px' }}>
                        <div>
                          <h2 style={{ fontSize: '1rem', textTransform: 'uppercase', color: '#475569', marginBottom: '10px' }}>Angiogram Analysis</h2>
                          <div style={{ background: '#f8fafc', padding: '5px', borderRadius: '8px', border: '1px solid #e2e8f0', position: 'relative' }}>
                            <img src={preview} style={{ width: '100%', borderRadius: '4px', display: 'block' }} alt="Angiogram" />
                            {result?.overlay_png && isBlockage && (
                              <img 
                                src={`data:image/png;base64,${result.overlay_png}`} 
                                style={{ position: 'absolute', top: '5px', left: '5px', width: 'calc(100% - 10px)', height: 'calc(100% - 10px)', objectFit: 'contain', pointerEvents: 'none' }}
                                alt="Overlay"
                              />
                            )}
                          </div>
                        </div>
                        <div>
                          <h2 style={{ fontSize: '1rem', textTransform: 'uppercase', color: '#475569', marginBottom: '10px' }}>Ensemble Statistics</h2>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                              <span>Random Forest:</span> <strong>{result.individual_models.rf.blockage}% Blockage</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                              <span>SVM Confidence:</span> <strong>{result.individual_models.svm.blockage}% Blockage</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                              <span>Total Vessel Area:</span> <strong>{result.features.vessel_area} px²</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '20px', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '1rem', margin: '0 0 10px 0' }}>Clinical Interpretation</h3>
                        <p style={{ margin: 0, lineHeight: 1.6, color: '#334155' }}>
                          Analysis of the digital coronary angiogram reveals {isBlockage ? 'significant atherosclerotic plaque formation' : 'clear vascular paths'} with a hybrid confidence rating of {result.confidence}%. 
                          {isBlockage 
                            ? " The blue markers on the scan pinpoint the regions of maximal diagnostic deviation. Immediate cardiology consultation is recommended for interventional assessment."
                            : " No major luminal narrowing detected. Routine monitoring advised."}
                        </p>
                      </div>

                      <div style={{ marginTop: '40px', fontSize: '0.8rem', opacity: 0.6, textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                        This report was generated by the CardioAI Automated Diagnostic System. <br/>
                        Digital Verification Hash: {btoa(result.label + Date.now()).substring(0, 16)}
                      </div>
                    </div>
                  </div>

                  {/* Result Metrics */}
                  <div className="result-metrics-wrap">
                     <ResultCard result={result} />
                  </div>
                  
                </div>

                {/* RIGHT COLUMN: Chat Sidebar */}
                <div className="rd-sidebar">
                  <ChatAssistant contextDiagnosis={result} />
                </div>
                
              </div>

            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p style={{ marginTop: '4rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'center', maxWidth: '800px', margin: '4rem auto 0' }}>
          ⚠️ <strong>Disclaimer:</strong> This tool is for research and educational purposes only. It is not a substitute for professional medical diagnosis. Always consult a qualified cardiologist for clinical decisions.
        </p>
      </div>
    </div>
  )
}
