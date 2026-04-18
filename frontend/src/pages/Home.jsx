import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

const features = [
  {
    icon: '⚡',
    title: 'Instant Inference',
    desc: 'Powered by an optimized scikit-learn pipeline to deliver predictions in under 150ms.'
  },
  {
    icon: '🔬',
    title: 'Deep Texture Maps',
    desc: 'Extracting GLCM & LBP features mimicking how expert cardiologists perceive vessel occlusion.'
  },
  {
    icon: '🎯',
    title: 'Ensemble Voting',
    desc: 'Random Forest and RBF SVM models combine their decision boundaries for high precision.'
  },
  {
    icon: '💡',
    title: 'Deterministic State',
    desc: 'Our latest architecture ensures identical results for matching inputs. No flaky AI behavior.'
  }
]

export default function Home() {
  const [offsetY, setOffsetY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="page">
      {/* ── Crazy Hero ── */}
      <section className="hero">
        <div className="hero-bg-shapes">
          <div className="shape shape-1" style={{ transform: `translateY(${offsetY * 0.2}px)` }}></div>
          <div className="shape shape-2" style={{ transform: `translateY(${offsetY * -0.15}px)` }}></div>
          <div className="shape shape-3" style={{ transform: `translate(${-50}%, ${-50 + offsetY * 0.05}%)` }}></div>
        </div>

        <div className="hero-content">
          <div className="crazy-badge">
            <span className="emoji">✨</span> Advanced Cardiac Intelligence &middot; Now Live
          </div>

          <h1 className="hero-animated-title">
            Cardiac Care<br />
            <span className="gradient-text">Engineered</span> For <span className="scale-pulse">Scale.</span>
          </h1>

          <p className="hero-sub">
            The most advanced browser-based angiogram analysis. Harnessing Bilateral Filtering, Frangi vesselness, and ensemble machine learning to detect blockages with clinical precision.
          </p>

          <div className="hero-actions">
            <Link to="/predict" className="btn-crazy">
              Start Free Scan <span style={{ fontSize: '1.2rem' }}>→</span>
            </Link>
            <Link to="/dashboard" className="btn-secondary">
              Explore Metrics
            </Link>
          </div>

          <div className="hero-stats-banner">
            <div className="stat-item">
              <div className="stat-val">70.4%</div>
              <div className="stat-label">Model Accuracy</div>
            </div>
            <div className="stat-item">
              <div className="stat-val">RF+SVM</div>
              <div className="stat-label">Hybrid Ensemble</div>
            </div>
            <div className="stat-item">
              <div className="stat-val">{"< 150ms"}</div>
              <div className="stat-label">Analysis Speed</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ── */}
      <div className="crazy-marquee">
        <div className="marquee-content">
          <span className="dot">•</span> <span>Random Forest</span> <span className="highlight">Support Vector Machine</span> <span className="dot">•</span> <span>Bilateral Filter</span> <span className="highlight">Frangi Vesselness</span> <span className="dot">•</span> <span>GLCM Textures</span> <span className="highlight">Local Binary Patterns</span> <span className="dot">•</span> <span>Random Forest</span> <span className="highlight">Support Vector Machine</span> <span className="dot">•</span> <span>Bilateral Filter</span> <span className="highlight">Frangi Vesselness</span>
        </div>
      </div>

      {/* ── Features ── */}
      <section className="features">
        <div className="section-header">
          <h2 className="section-title">Built For Precision</h2>
          <p className="section-sub">
            Every layer of the CoronaryAI stack has been rebuilt to ensure maximal confidence in our diagnostic toolset.
          </p>
        </div>

        <div className="feature-cards">
          {features.map((f, i) => (
            <div className="card-3d" key={i}>
              <div className="card-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
