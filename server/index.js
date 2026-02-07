const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());


const RAPID_API_KEY = 'c4c14b3307mshb86b1f371e82ffcp1a4d29jsnf35efd4735e3'; 
const CACHE_FILE = 'search_cache.json';


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

        
        const cleanJobs = rawData.map((job, i) => ({
            id: job.job_id || `${userQuery}-${i}`,
            title: job.job_title,
            company: job.employer_name,
            city: job.job_city,
            state: job.job_state,
            lat: job.job_latitude || 40.8 + (Math.random() - 0.5),
            lng: job.job_longitude || -77.8 + (Math.random() - 0.5) * 3,
            type: job.job_employment_type,
            apply_link: job.job_apply_link,
            posted_at: job.job_posted_at_datetime_utc,
            description: job.job_description ? job.job_description.substring(0, 200) + "..." : "No description"
        }))
        .filter(job => job.state?.toLowerCase().includes("pa") || job.state?.toLowerCase().includes("pennsylvania"));

        ;

        // 4. SAVE TO CACHE & RETURN
        cache[fullQuery] = cleanJobs;
        saveCache(cache);
        
        console.log(`>>> Success! Found ${cleanJobs.length} jobs.`);
        res.json(cleanJobs);

    } catch (error) {
        console.error("API Error:", error.message);
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));