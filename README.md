# Group Tau DV Project
## Data sources
 - [ACLED Asia-Pacific aggegated dataset](https://acleddata.com/aggregated/aggregated-data-asia-pacific).
 - [World Bank Myanmar data export](https://databank.worldbank.org/reports.aspx?source=2&country=MMR#).
 - [Uppsala Conflict Data Program (UCDP)](https://ucdp.uu.se/country/775) for extra conflict information.
 - [Open Street Map](https://www.openstreetmap.org/) for the tiles and GeoJSON.
## Data & Preprocessing
All the data is stored in the data folder.
In data/geo there are the map tiles together with the GeoJSON information.
In data/chart there are 5 subfolders from 1 to 5, each related with a chart in the same order as they are shown in the website.
In each of those folder there is the preprocessing python notebook together with the preprocessed data.
## How to host
The project does not require any external dependency. For long term availability it would be advisable to avoid CDNs for Tailwind, Google Fonts and D3.js and to provide them directly.
## Extra notes
Each chart lives in a specific html page that is dynamically loaded when the previous chart has finished loading.
