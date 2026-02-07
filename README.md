# MapedIn: Geospatial Job Search Platform

**MapedIn** is a full-stack web application designed to transform the traditional job search experience. By visualizing job opportunities on an interactive map, users can make informed decisions based on location, commute, and regional density, rather than sifting through static text lists.

##  Key Features

* **Geospatial Visualization:** Jobs are plotted as interactive markers on a map, allowing users to identify clusters of opportunities in specific neighborhoods or cities.
* **Dynamic State Navigation:** Users can seamlessly search across different U.S. states with smooth "fly-to" map animations.
* **Smart Filtering:** Real-time filtering capabilities for:
    * **Date Posted:** (Today, Past 3 Days, Past Week)
    * **Employment Type:** (Full-time, Contract, Internship)
    * **Remote Status:** Toggle to view only remote opportunities.
* **Alumni Network Integration:** A unique feature that automatically generates targeted LinkedIn search URLs, connecting users with alumni from their university who currently work at the target company.
* **Geocoding Fallback:** Built-in integration with OpenStreetMap (Nominatim) to resolve coordinates for job listings that lack location data.

##  Tech Stack

### Frontend
* **React (Vite):** High-performance component-based UI.
* **React-Leaflet:** For rendering interactive maps and markers.
* **CSS Modules:** For modular and scoped styling.

### Backend
* **Node.js & Express:** Lightweight REST API to handle search requests.
* **Axios:** For handling external API requests.
* **Dotenv:** For secure environment variable management.

### APIs & Data
* **JSearch API (RapidAPI):** Aggregates real-time job listings from across the web.
* **OpenStreetMap (Nominatim):** Provides geocoding services for mapping job locations.

---

##  Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the Repository
```bash
git clone [https://github.com/MomrezNeemeri/MapedIn.git](https://github.com/MomrezNeemeri/MapedIn.git)
cd MapedIn
