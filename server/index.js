const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

// --- 1. CONFIG ---
const RAPID_API_KEY = 'c4c14b3307mshb86b1f371e82ffcp1a4d29jsnf35efd4735e3'; 
const CACHE_FILE = 'search_cache.json';

// --- 2. HELPERS ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Geocoding: Turns "Scranton, PA" into lat/lng
const getGeoForCity = async (city, state) => {
    if (!city) return null;
    try {
        const query = `${city}, ${state || "Pennsylvania"}`;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
        
        // Nominatim requires a User-Agent header
        const res = await axios.get(url, { headers: { 'User-Agent': 'JobMapHackathon/1.0' } });
        
        if (res.data && res.data.length > 0) {
            return { 
                lat: parseFloat(res.data[0].lat), 
                lng: parseFloat(res.data[0].lon) 
            };
        }
    } catch (err) {
        console.error(`Geocoding failed for ${city}:`, err.message);
    }
    return null;
};

// Caching: Loads/Saves to file so we don't burn API credits
const loadCache = () => {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            return JSON.parse(fs.readFileSync(CACHE_FILE));
        }
    } catch (e) { console.error("Cache read error", e); }
    return {};
};

const saveCache = (cache) => {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
};

// --- 3. THE ROUTE ---
app.get('/api/search', async (req, res) => {
  const { q, date_posted, remote_jobs_only, employment_types } = req.query;

  // Create a unique key for this specific search combination
  const cacheKey = `${q}-${date_posted}-${remote_jobs_only}-${employment_types}`;
  const cache = loadCache();

  // A. CHECK CACHE FIRST
  if (cache[cacheKey]) {
      console.log("Serving from Cache:", cacheKey);
      return res.json(cache[cacheKey]);
  }

  // B. PREPARE API CALL
  const options = {
    method: 'GET',
    url: 'https://jsearch.p.rapidapi.com/search',
    params: {
      query: q ? `${q} in Pennsylvania` : 'Software Engineer in Pennsylvania',
      page: '1',
      num_pages: '1',
      // Apply filters only if selected
      date_posted: date_posted !== 'all' ? date_posted : undefined,
      remote_jobs_only: remote_jobs_only === 'true' ? 'true' : undefined,
      employment_types: employment_types !== 'all' ? employment_types : undefined,
    },
    headers: {
      'X-RapidAPI-Key': RAPID_API_KEY, // Use the constant defined at top
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
    }
  };

  try {
    console.log("Fetching from API...");
    const response = await axios.request(options);
    const rawJobs = response.data.data;

    // C. PROCESS & GEOCODE JOBS
    // We can't just filter; we must fix missing coordinates
    const processedJobs = [];

    for (const job of rawJobs) {
        let lat = job.job_latitude;
        let lng = job.job_longitude;

        // If coordinates are missing, fetch them!
        if (!lat || !lng) {
            console.log(`Geocoding ${job.job_city}...`);
            const coords = await getGeoForCity(job.job_city, job.job_state);
            if (coords) {
                lat = coords.lat;
                lng = coords.lng;
                await sleep(1000); // Be nice to the free API
            }
        }

        // Only add if we have valid coordinates now
        if (lat && lng) {
            processedJobs.push({
                id: job.job_id,
                title: job.job_title,
                company: job.employer_name,
                city: job.job_city,
                state: job.job_state,
                lat: lat,
                lng: lng,
                apply_link: job.job_apply_link,
                description: job.job_description,
                posted_at: job.job_posted_at_datetime_utc,
                is_remote: job.job_is_remote
            });
        }
    }

    // D. SAVE TO CACHE
    cache[cacheKey] = processedJobs;
    saveCache(cache);

    res.json(processedJobs);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));