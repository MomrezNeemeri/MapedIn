import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMapEvents } from 'react-leaflet'
import axios from 'axios'
import './App.css'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet';
import { colleges } from './colleges'; 
import { US_STATES } from './states';

// ICONS 
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
const BigIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [38, 62], iconAnchor: [19, 62] });


function MapEvents({ setBounds }) {
  useMapEvents({
    moveend: (e) => setBounds(e.target.getBounds()),
    zoomend: (e) => setBounds(e.target.getBounds()),
  });
  return null;
}

function MapController({ targetState }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (targetState) {
      map.flyTo([targetState.lat, targetState.lng], targetState.zoom, { duration: 2.0 });
    }
  }, [targetState]); 
  return null;
}

// --- HOME PAGE ---
function Home() {
  const [jobs, setJobs] = useState([]);
  const [query, setQuery] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [bounds, setBounds] = useState(null);
  const [hoveredJobId, setHoveredJobId] = useState(null);

  // Default : Pennsylvania
  const [selectedState, setSelectedState] = useState(US_STATES[0]); 

  // Filters
  const [datePosted, setDatePosted] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);

  const fetchJobs = async () => {
    if (!query.trim()) {
        alert("Please enter a job title (e.g., 'Analyst')");
        return;
    }

    setLoading(true);
    setJobs([]); // Clear old pins

    try {
      const res = await axios.get('http://localhost:5001/api/search', { 
        params: { 
          q: query,
          location: selectedState.name, 
          date_posted: datePosted,
          employment_types: jobType,
          remote_jobs_only: remoteOnly
        } 
      });
      setJobs(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };


  const visibleJobs = jobs.filter(job => {
    if (!bounds) return true;
    return (
      job.lat <= bounds.getNorth() &&
      job.lat >= bounds.getSouth() &&
      job.lng <= bounds.getEast() &&
      job.lng >= bounds.getWest()
    );
  });

  const handleJobClick = (job) => {
    localStorage.setItem('current_job', JSON.stringify(job));
    window.open('/details', '_blank');
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="search-area">
          <h2 className='title'>MapedIn</h2>
          
          {}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            
            {}
            <input 
              type="text" 
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
              placeholder="Job title..." 
              style={{ flex: 2, minWidth: '0' }} 
            />

            {/* State */}
            <select 
              value={selectedState.name}
              onChange={(e) => {
                const st = US_STATES.find(s => s.name === e.target.value);
                setSelectedState(st);
              }}
              style={{ 
                flex: 1, minWidth: '0', padding: '0 8px', borderRadius: '4px', 
                border: '1px solid #ccc', background: 'white', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              {US_STATES.map(s => (
                <option key={s.code} value={s.name}>{s.code}</option> 
              ))}
            </select>

            {}
            <button onClick={fetchJobs} style={{ background: '#003594', color: 'white', border: 'none', borderRadius: '4px', padding: '0 20px', fontWeight: 'bold', cursor: 'pointer' }}>Go</button>
          </div>

          {}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={datePosted} onChange={(e) => setDatePosted(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem', flex: 1 }}>
              <option value="all">Any Date</option>
              <option value="today">Today</option>
              <option value="3days">3 Days</option>
              <option value="week">Week</option>
            </select>
            <select value={jobType} onChange={(e) => setJobType(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem', flex: 1 }}>
              <option value="all">Any Type</option>
              <option value="FULLTIME">Full Time</option>
              <option value="INTERN">Intern</option>
            </select>
            <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: remoteOnly ? '#e0e7ff' : '#f5f5f5', padding: '6px 10px', borderRadius: '4px', border: remoteOnly ? '1px solid #003594' : '1px solid #ccc' }}>
              <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} style={{ cursor: 'pointer' }} />
              Remote
            </label>
          </div>
        </div>

        <div className="results-list">
          {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Searching in {selectedState.name}...</div>}
          
          {!loading && jobs.length === 0 && (
             <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
               Search for jobs in <b>{selectedState.name}</b>!
             </div>
          )}

          {!loading && jobs.length > 0 && visibleJobs.length === 0 && (
             <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No jobs in this view. <br/> Zoom out or pan map.</div>
          )}

          {visibleJobs.map(job => (
            <div 
              key={job.id} 
              className="job-card"
              onMouseEnter={() => setHoveredJobId(job.id)}
              onMouseLeave={() => setHoveredJobId(null)}
              onClick={() => handleJobClick(job)}
            >
              <h4 style={{ margin: '0 0 5px 0', color: '#003594' }}>{job.title}</h4>
              <div style={{ fontSize: '0.9rem' }}>{job.company}</div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                📍 {job.city || selectedState.name} 
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="map-wrapper">
        <MapContainer center={[selectedState.lat, selectedState.lng]} zoom={selectedState.zoom} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap' />
          <ZoomControl position="bottomright" />
          
          <MapEvents setBounds={setBounds} />
          {/* THIS WILL NOW ONLY RUN WHEN selectedState CHANGES */}
          <MapController targetState={selectedState} />

          {visibleJobs.map(job => (
            <Marker key={job.id} position={[job.lat, job.lng]} icon={hoveredJobId === job.id ? BigIcon : DefaultIcon}>
              <Popup>
                <div style={{ textAlign: 'center', minWidth: '150px' }}>
                  <b style={{ color: '#003594', fontSize: '1rem' }}>{job.title}</b>
                  <div style={{ fontSize: '0.9rem', color: '#555' }}>{job.company}</div>
                  <button onClick={() => handleJobClick(job)} style={{ background: '#003594', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', marginTop: '8px', cursor: 'pointer', width: '100%' }}>
                    View Details 🔗
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
          
        </MapContainer>
      </div>
    </div>
  );
}

// --- JOB DETAILS PAGE ---
function JobDetails() {
  const [job, setJob] = useState(() => {
    try {
      const saved = localStorage.getItem('current_job');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });
  
  const [college, setCollege] = useState(null); 
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // DERIVED STATE
  let alumniUrl = "";
  if (job && college) {
      let cleanCompany = job.company || "";
      cleanCompany = cleanCompany.replace(/,?\s?(Inc\.?|LLC|Corp\.?|Corporation|Ltd\.?|Co\.?)$/i, "").trim();
      let safeId = "3461"; 
      if (college.id && /^\d+$/.test(college.id)) safeId = college.id;
      const encodedCompany = encodeURIComponent(cleanCompany);
      alumniUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodedCompany}&origin=FACETED_SEARCH&schoolFilter=%5B%22${safeId}%22%5D`;
  }

  const handleInput = (e) => {
    const val = e.target.value;
    setInput(val);
    if (val.length > 0) {
      const filtered = colleges.filter(c => c.name.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(filtered);
      setShowDropdown(true);
    } else { setShowDropdown(false); }
  };

  const selectCollege = (c) => {
    setCollege(c);
    setInput(c.name);
    setShowDropdown(false);
  };

  if (!job) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ background: '#f4f6f8', height: '100vh', overflowY: 'auto', padding: '20px', boxSizing: 'border-box' }}>
      <div className="details-container">
        <div className="details-header">
          <h1 style={{ color: '#003594', margin: '0 0 10px 0', fontSize: '2.2rem' }}>{job.title}</h1>
          <h3 style={{ color: '#555', margin: 0, fontWeight: 'normal' }}>
             {job.company}  •  <span style={{ color: '#888' }}>{job.city}</span>
          </h3>
        </div>
            <a href={job.apply_link} target="_blank" style={{ display: 'inline-block', padding: '14px 28px', background: '#003594', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
              Apply on Company Site ↗
            </a>

        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          
          <div style={{ flex: 2, minWidth: '300px' }}>
            <h4 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>About the Role</h4>
            <p style={{ lineHeight: '1.8', color: '#333', fontSize: '1rem', whiteSpace: 'pre-line' }}>
              {job.description || "No description provided."}
            </p>
            <br/>
          </div>

          <div style={{ flex: 1, minWidth: '280px' }}>
            <div className="alumni-box">
              <h4 style={{ marginTop: 0, color: '#d48806', marginBottom: '10px' }}>🎓 Alumni Network</h4>
              
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <input 
                  type="text" 
                  value={input}
                  onChange={handleInput}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Select your university..."
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                {showDropdown && suggestions.length > 0 && (
                  <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', margin: 0, padding: 0, listStyle: 'none', zIndex: 1000, maxHeight: '150px', overflowY: 'auto' }}>
                    {suggestions.map(c => (
                      <li key={c.id} onMouseDown={() => selectCollege(c)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                        {c.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {college ? (
                <>
                    <p style={{ fontSize: '0.9rem', color: '#333' }}>
                        Find <b>{college.name}</b> alumni at {job.company}:
                    </p>
                    <a href={alumniUrl} target="_blank" style={{ display: 'block', textAlign: 'center', marginTop: '10px', padding: '12px', border: '2px solid #0077b5', color: '#0077b5', background: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
                        View on LinkedIn
                    </a>
                </>
              ) : (
                <p style={{ fontSize: '0.9rem', color: '#777', fontStyle: 'italic' }}>
                    Please select a university to see connections.
                </p>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/details" element={<JobDetails />} />
    </Routes>
  );
}

export default App