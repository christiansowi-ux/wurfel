# Medientrupp Lead Generator

This project is a lead generation and auditing tool for identifying businesses that need website improvements.

## Components

- **Discovery Service**: Uses Overpass API to find businesses in OpenStreetMap (shops, restaurants) that lack website tags.
- **Audit Service**: Uses Puppeteer to audit existing websites for mobile responsiveness, SSL, and CMS tech stack.
- **Backend API**: A Node.js/Express server that stores and serves lead data using SQLite.
- **Lead Dashboard**: A frontend interface for viewing, filtering, and exporting leads (CSV).
- **Lead Capture Widget**: An embeddable script for capturing new leads directly from client websites.

## Setup & Usage

### Backend
1. Go to `lead-generator/backend`.
2. Install dependencies: `npm install`.
3. Start the server: `node index.js`.

### Dashboard
- Open `lead-generator/frontend/dashboard.html` in a browser.
- Ensure the `API_URL` in the script section points to your backend.

### Discovery Service
1. Go to `lead-generator/discovery`.
2. Run `node discover.js` to find new leads in a specific area.

### Audit Service
1. Go to `lead-generator/audit`.
2. Run `node audit.js` to perform technical audits on discovered websites.

## Deployment

- Frontend is hosted on Surge: [medientrupp-preview.surge.sh](https://medientrupp-preview.surge.sh)
- Backend should be hosted on a stable Node.js environment.

