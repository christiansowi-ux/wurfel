const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = '/home/team/shared/lead-generator/backend/leads.db';

async function detectCMS(page) {
    const html = await page.content();
    
    const detections = [
        { name: 'WordPress', pattern: /wp-content|wp-includes/i, versionPattern: /meta name="generator" content="WordPress ([\d.]+)"/i },
        { name: 'Joomla', pattern: /Joomla!/i, versionPattern: /meta name="generator" content="Joomla! ([\d.]+)"/i },
        { name: 'Drupal', pattern: /Drupal/i, versionPattern: /meta name="Generator" content="Drupal ([\d.]+)"/i },
        { name: 'Wix', pattern: /wix\.com/i },
        { name: 'Squarespace', pattern: /squarespace\.com/i },
        { name: 'Shopify', pattern: /shopify\.com/i }
    ];

    for (const cms of detections) {
        if (cms.pattern.test(html)) {
            let version = null;
            if (cms.versionPattern) {
                const match = html.match(cms.versionPattern);
                if (match) version = match[1];
            }
            return { name: cms.name, version };
        }
    }

    return { name: null, version: null };
}

async function auditWebsite(browser, url) {
    const results = {
        has_ssl: url.startsWith('https'),
        is_responsive: false,
        cms_name: null,
        cms_version: null,
        score: 0,
        error: null
    };

    if (!results.has_ssl) results.score += 15;

    let page;
    try {
        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Ensure URL has protocol
        let targetUrl = url;
        if (!targetUrl.startsWith('http')) targetUrl = 'http://' + targetUrl;

        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 20000 });

        // 1. Check Responsiveness
        const viewportMeta = await page.$('meta[name="viewport"]');
        if (viewportMeta) {
            results.is_responsive = true;
        } else {
            results.score += 25;
        }

        // 2. CMS Detection
        const cms = await detectCMS(page);
        results.cms_name = cms.name;
        results.cms_version = cms.version;
        if (results.cms_name) {
            // Add points if version is detected (often means it's exposed/old)
            if (results.cms_version) results.score += 10;
        }

    } catch (err) {
        results.error = err.message;
        console.error(`Error auditing ${url}:`, err.message);
    } finally {
        if (page) await page.close();
    }

    return results;
}

async function runAudit() {
    console.log('Starting Website Audit Service (Manual Detection Mode)...');
    const db = new sqlite3.Database(DB_PATH);

    // Get leads that have a website but haven't been audited
    // Using a small limit for demonstration
    const leads = await new Promise((resolve, reject) => {
        db.all(`SELECT id, website_url FROM leads WHERE website_url IS NOT NULL AND last_audited_at IS NULL LIMIT 5`, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    if (leads.length === 0) {
        console.log('No leads to audit.');
        db.close();
        return;
    }

    console.log(`Auditing ${leads.length} websites...`);
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const lead of leads) {
        console.log(`Auditing lead ${lead.id}: ${lead.website_url}`);
        const auditResult = await auditWebsite(browser, lead.website_url);
        
        if (auditResult.error && auditResult.error.includes('net::ERR')) {
            console.log(`Skipping ${lead.website_url} due to network error.`);
            continue;
        }

        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE leads SET 
                    has_ssl = ?,
                    is_responsive = ?,
                    cms_name = ?,
                    cms_version = ?,
                    audit_score = audit_score + ?,
                    last_audited_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [
                auditResult.has_ssl,
                auditResult.is_responsive,
                auditResult.cms_name,
                auditResult.cms_version,
                auditResult.score,
                lead.id
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log(`Lead ${lead.id} updated. Added Score: ${auditResult.score}`);
    }

    await browser.close();
    db.close();
    console.log('Audit completed.');
}

runAudit();
