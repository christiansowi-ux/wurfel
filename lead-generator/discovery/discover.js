const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = '/home/team/shared/lead-generator/backend/leads.db';
const QUERY_PATH = '/home/team/shared/overpass_query.txt';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

async function runDiscovery() {
    console.log('Starting lead discovery via Overpass API...');

    // 1. Read query
    let query;
    try {
        query = fs.readFileSync(QUERY_PATH, 'utf8');
    } catch (err) {
        console.error('Error reading query file:', err.message);
        return;
    }

    // 2. Fetch data from Overpass
    console.log('Querying Overpass API (this might take a few seconds)...');
    let elements = [];
    try {
        const params = new URLSearchParams();
        params.append('data', query);

        const response = await axios.post(OVERPASS_URL, params.toString(), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'LeadDiscoveryBot/1.0'
            }
        });
        elements = response.data.elements || [];
        console.log(`Found ${elements.length} potential leads.`);
    } catch (err) {
        console.error('Error querying Overpass API:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
        return;
    }

    // 3. Connect to DB
    const db = new sqlite3.Database(DB_PATH);

    // 4. Process and Insert leads
    db.serialize(() => {
        const stmt = db.prepare(`
            INSERT INTO leads (
                external_id, name, category, address, phone, has_website, audit_score, status, email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(external_id) DO UPDATE SET
                name=excluded.name,
                category=excluded.category,
                address=excluded.address,
                phone=excluded.phone,
                has_website=excluded.has_website
        `);

        let insertedCount = 0;
        elements.forEach(el => {
            const tags = el.tags || {};
            const name = tags.name || tags['name:en'] || tags['brand'] || 'Unknown Business';
            const external_id = `${el.type}/${el.id}`;
            const category = tags.shop || tags.amenity || el.type;
            const address = [
                tags['addr:street'],
                tags['addr:housenumber'],
                tags['addr:postcode'],
                tags['addr:city']
            ].filter(Boolean).join(', ') || 'Unknown Address';
            const phone = tags.phone || tags['contact:phone'] || 'Unknown Phone';
            const has_website = false; // By query definition
            const audit_score = 50; // Points for missing website
            const status = 'new';
            const email = 'Unknown Email'; // Not in OSM usually

            stmt.run(
                external_id,
                name,
                category,
                address,
                phone,
                has_website,
                audit_score,
                status,
                email
            );
            insertedCount++;
        });

        stmt.finalize();
        console.log(`Successfully processed ${insertedCount} leads into the database.`);
    });

    db.close();
}

runDiscovery();
