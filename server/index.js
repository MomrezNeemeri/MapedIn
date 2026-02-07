const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());


const RAPID_API_KEY = 'c4c14b3307mshb86b1f371e82ffcp1a4d29jsnf35efd4735e3'; 
const CACHE_FILE = 'search_cache.json';

// lat lng helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

app.get('/api/search', async (req, res) => {
    const userQuery = req.query.q; 
    const location = "Pennsylvania"; 
    
    if (!userQuery) {
        return res.status(400).json({ error: "Query is required" });
    }

    const fullQuery = `${userQuery} in ${location}`;
    console.log(`\nUser searching for: "${fullQuery}"`);

    //Saving API Credits with Caching
    let cache = loadCache();
    if (cache[fullQuery]) {
        console.log(">>> Serving from CACHE (0 credits used)");
        return res.json(cache[fullQuery]);
    }

   
    console.log(">>> Fetching from JSearch API...");
    
    const options = {
        method: 'GET',
        url: 'https://jsearch.p.rapidapi.com/search',
        params: {
            query: fullQuery,
            num_pages: '1', 
            radius: '200' 
        },
        headers: {
            'X-RapidAPI-Key': RAPID_API_KEY,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        const rawData = response.data.data;
        let cleanJobs = [];

        console.log(`>>> JSearch returned ${rawData.length} jobs. Processing geocodes...`);

        for (let i = 0; i < rawData.length; i++) {
            const job = rawData[i];
            
            // Only PA jobs
            const jobState = (job.job_state || "").toLowerCase();
            if (!jobState.includes("pa") && !jobState.includes("pennsylvania")) continue;

            let finalLat = job.job_latitude;
            let finalLng = job.job_longitude;

            if (!finalLat || !finalLng) {
                const jitter = (Math.random() - 0.5) * 0.02; 
                
                const geo = await getGeoForCity(job.job_city, job.job_state);
                
                if (geo) {
                    finalLat = geo.lat + jitter;
                    finalLng = geo.lng + jitter;
                } else {
                    finalLat = 40.8 + (Math.random() - 0.5);
                    finalLng = -77.8 + (Math.random() - 0.5) * 3;
                }
                
                await sleep(500); 
            }

            cleanJobs.push({
                id: job.job_id || `${userQuery}-${i}`,
                title: job.job_title,
                company: job.employer_name,
                city: job.job_city,
                state: job.job_state,
                lat: finalLat,
                lng: finalLng,
                type: job.job_employment_type,
                apply_link: job.job_apply_link,
                posted_at: job.job_posted_at_datetime_utc,
                description: job.job_description ? job.job_description.substring(0, 200) + "..." : "No description"
            });
        }

        
        cache[fullQuery] = cleanJobs;
        saveCache(cache);
        
        console.log(`>>> Success! Returning ${cleanJobs.length} geocoded jobs.`);
        res.json(cleanJobs);

    } catch (error) {
        console.error("API Error:", error.message);
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));