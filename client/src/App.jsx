import { useState } from 'react'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet' // Un-commented!
import './App.css'
import 'leaflet/dist/leaflet.css' 

function App() {
  
  const [jobs, setJobs] = useState([]);

  return (
    <div className="app-container">
      
      {/* left */}
      <div className="sidebar">
        <div className="search-area">
          <h2>Job Search PA</h2>
          <input 
            type="text" 
            placeholder="Search jobs..." 
            className="search-input" 
            style={{ width: '90%', padding: '10px', marginTop: '10px' }}
          />
        </div>

        <div className="results-list">
          <div style={{ padding: '20px', color: '#666' }}>
             Map is ready. Search connection coming next...
          </div>
        </div>
      </div>

      {/*Map*/}
      <div className="map-wrapper">
        <MapContainer 
          center={[40.9699, -77.7278]} // Center of PA
          zoom={8}                     
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}          
        >
          {}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />
          <ZoomControl position="bottomright" />
        </MapContainer>
      </div>

    </div>
  )
}

export default App