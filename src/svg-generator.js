const axios = require('axios');

const LANG_COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
    Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
    Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516', PHP: '#4F5D95',
    HTML: '#e34c26', CSS: '#563d7c', Jupyter: '#DA5B0B', 'Jupyter Notebook': '#DA5B0B',
    Vue: '#41b883', ASP: '#6a40fd', 'ASP.NET': '#9400ff', Dart: '#00B4AB',
    Swift: '#F05138', Kotlin: '#A97BFF', Shell: '#89e051', SCSS: '#c6538c'
};

function escapeXML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

async function getBase64Image(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        const contentType = response.headers['content-type'] || 'image/jpeg';
        return `data:${contentType};base64,${base64}`;
    } catch (e) {
        return '';
    }
}

async function generateSVG(data) {
    const user   = data.user;
    const stats  = data.stats;
    const streak = data.streak;
    const langs  = data.languages;

    // ── Palette ────────────────────────────────────────────────────────────
    const mainBg      = "#11161d";
    const cardBg      = "#181f2a";
    const borderColor = "#262f3e";
    const textPri     = "#e6edf3";
    const textSec     = "#8b949e";

    // ── Layout constants ───────────────────────────────────────────────────
    const SVG_W    = 950;
    const MARGIN   = 30;
    const INNER_W  = SVG_W - MARGIN * 2;  // 890
    const GAP      = 10;

    const PROFILE_Y  = MARGIN;                              // 30
    const PROFILE_H  = 130;
    const CARDS_Y    = PROFILE_Y + PROFILE_H + GAP;        // 170
    const CARDS_H    = 80;
    const STREAK_Y   = CARDS_Y + CARDS_H + GAP;            // 260
    const STREAK_H   = 180;
    const BOTTOM_Y   = STREAK_Y + STREAK_H + GAP;          // 450
    const BOTTOM_H   = 230;                                 // enough for 5 lang rows
    const HALF_W     = (INNER_W - GAP) / 2;                // 440
    const SVG_H      = BOTTOM_Y + BOTTOM_H + MARGIN;       // 710

    // ── Avatar & date ──────────────────────────────────────────────────────
    const avatarDataUrl = await getBase64Image(user.avatar_url);
    const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    // ── CSS ────────────────────────────────────────────────────────────────
    const css = `
        text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
        .pri   { fill: ${textPri}; }
        .sec   { fill: ${textSec}; }
        .bold  { font-weight: 600; }
        .xbold { font-weight: 800; }
        .xs    { font-size: 11px; }
        .sm    { font-size: 13px; }
        .md    { font-size: 15px; }
        .lg    { font-size: 18px; }
        .xl    { font-size: 32px; }
        .mid   { text-anchor: middle; }
    `;

    // ── 1. Profile ─────────────────────────────────────────────────────────
    const profileHTML = `
        <g transform="translate(${MARGIN}, ${PROFILE_Y})">
            <rect width="${INNER_W}" height="${PROFILE_H}" rx="12"
                  fill="${cardBg}" stroke="${borderColor}" stroke-width="1"/>
            <defs>
                <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stop-color="#39d353"/>
                    <stop offset="100%" stop-color="#58a6ff"/>
                </linearGradient>
            </defs>
            <circle cx="85" cy="65" r="48" fill="url(#avatarGrad)"/>
            <circle cx="85" cy="65" r="44" fill="${cardBg}"/>
            <clipPath id="avatarClip"><circle cx="85" cy="65" r="40"/></clipPath>
            <image href="${avatarDataUrl}" x="45" y="25" width="80" height="80"
                   clip-path="url(#avatarClip)"/>
            <circle cx="115" cy="95" r="9" fill="${cardBg}"/>
            <circle cx="115" cy="95" r="6" fill="#39d353"/>
            <text x="160" y="52"  class="pri xbold" font-size="22">${escapeXML(user.name)}</text>
            <text x="160" y="72"  class="sm" fill="#58a6ff">@${escapeXML(user.login)}</text>
            <text x="160" y="94"  class="sec sm">${escapeXML((user.bio || '').substring(0, 80))}</text>
            <text x="160" y="116" class="sec xs">
                🔗 ${escapeXML(user.blog || 'No website')}
                &nbsp;&nbsp;👥 <tspan class="pri bold">${user.followers}</tspan> followers
                · <tspan class="pri bold">${user.following}</tspan> following
                &nbsp;&nbsp;📅 Joined ${joinDate}
            </text>
        </g>`;

    // ── 2. Top 4 stat cards ────────────────────────────────────────────────
    const iconRepos = `<path fill="#58a6ff" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1h-8a1 1 0 00-1 1v6.708A2.486 2.486 0 014.5 9h8V1.5zm-8 11h8v1.5h-8a1 1 0 110-1.5z"/>`;
    const iconStars = `<path fill="#e3b341" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>`;
    const iconForks = `<path fill="#8b5cf6" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>`;
    const iconGists = `<path fill="#39d353" d="M1.5 1.75a.75.75 0 00-1.5 0v12.5c0 .414.336.75.75.75h14.5a.75.75 0 000-1.5H1.5V1.75z"/><path fill="#39d353" d="M3.75 8.75l2.5-2.5 2.5 2.5 4-4v2.5a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.44l-3.19 3.19-2.5-2.5a.75.75 0 00-1.06 0l-3 3a.75.75 0 001.06 1.06z"/>`;

    const CARD_W   = 210;
    const CARD_GAP = (INNER_W - 4 * CARD_W) / 3;

    const renderStatCard = (i, val, label, icon) => {
        const x = MARGIN + i * (CARD_W + CARD_GAP);
        return `
        <g transform="translate(${x}, ${CARDS_Y})">
            <rect width="${CARD_W}" height="${CARDS_H}" rx="10"
                  fill="${cardBg}" stroke="${borderColor}" stroke-width="1"/>
            <rect x="15" y="20" width="40" height="40" rx="8" fill="${mainBg}"/>
            <g transform="translate(27, 32) scale(1.1)">${icon}</g>
            <text x="70" y="42" class="pri xbold xl">${val}</text>
            <text x="70" y="60" class="sec xs bold" letter-spacing="0.5">PUBLIC ${label}</text>
        </g>`;
    };

    const topCardsHTML = `
        ${renderStatCard(0, user.public_repos, 'REPOS', iconRepos)}
        ${renderStatCard(1, stats.totalStars,  'STARS', iconStars)}
        ${renderStatCard(2, stats.totalForks,  'FORKS', iconForks)}
        ${renderStatCard(3, user.public_gists, 'GISTS', iconGists)}`;

    // ── 3. Streak ──────────────────────────────────────────────────────────
    const RING_R    = 55;
    const RING_CIRC = +(2 * Math.PI * RING_R).toFixed(2);
    const streakPct = Math.min((streak.currentStreak || 0) / 365, 1);
    const dashOff   = +(RING_CIRC - RING_CIRC * streakPct).toFixed(2);

    const streakSvg = `
        <g transform="translate(${MARGIN}, ${STREAK_Y})">
            <rect width="${INNER_W}" height="${STREAK_H}" rx="12"
                  fill="${cardBg}" stroke="${borderColor}" stroke-width="1"/>
            <text x="210" y="82"  class="pri xbold mid" font-size="36">${streak.totalContributions || 0}</text>
            <text x="210" y="108" class="sec xs bold mid" letter-spacing="1">TOTAL CONTRIBUTIONS</text>
            <text x="210" y="128" class="sec xs mid">Overall Commits &amp; PRs</text>
            <text x="680" y="82"  class="pri xbold mid" font-size="36">${streak.longestStreak || 0}</text>
            <text x="680" y="108" class="sec xs bold mid" letter-spacing="1">LONGEST STREAK</text>
            <text x="680" y="128" class="sec xs mid">Max days contributing</text>
            <g transform="translate(445, 82)">
                <defs>
                    <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%"   stop-color="#f78166"/>
                        <stop offset="100%" stop-color="#f0c000"/>
                    </linearGradient>
                </defs>
                <circle cx="0" cy="0" r="${RING_R}" fill="none" stroke="${mainBg}" stroke-width="6"/>
                <circle cx="0" cy="0" r="${RING_R}" fill="none"
                    stroke="url(#streakGrad)" stroke-width="6"
                    stroke-dasharray="${RING_CIRC}" stroke-dashoffset="${dashOff}"
                    stroke-linecap="round" transform="rotate(-90)"/>
                <path fill="#f78166" transform="translate(-10,-25) scale(1.2)"
                    d="M7.998 14.5c2.832 0 5-1.98 5-4.5 0-1.463-.68-2.19-1.879-3.383l-.036-.037
                       c-1.013-1.008-2.3-2.29-2.834-4.434-.322.256-.63.579-.864.953-.432.696-.621
                       1.58-.046 2.73.473.947.67 2.284-.278 3.232-.61.61-1.545.84-2.403.525a2.167
                       2.167 0 01-1.216-1.084c-.706 1.153-.843 2.634-.137 3.974.597 1.135 1.694
                       2.024 4.693 2.024z"/>
                <text x="0" y="14" class="xbold mid" font-size="28" fill="#f0c000">${streak.currentStreak || 0}</text>
            </g>
            <text x="445" y="158" class="sec xs bold mid" letter-spacing="1">CURRENT STREAK</text>
        </g>`;

    // ── 4. Languages ───────────────────────────────────────────────────────
    const totalBytes  = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
    const sortedLangs = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Bar chart dimensions (inside lang card)
    const BAR_PAD  = 20;  // left/right padding inside card
    const BAR_W    = HALF_W - BAR_PAD * 2;
    const BAR_H    = 10;
    const BAR_TOP  = 50;  // y of bar within card

    let barHTML = '';
    let bx = BAR_PAD;
    sortedLangs.forEach(([lang, bytes]) => {
        const w     = Math.max((bytes / totalBytes) * BAR_W, 4);
        const color = LANG_COLORS[lang] || '#8b949e';
        barHTML += `<rect x="${bx.toFixed(1)}" y="${BAR_TOP}" width="${w.toFixed(1)}"
                          height="${BAR_H}" fill="${color}" rx="3"/>`;
        bx += w;
    });

    // Legend: 2 columns, rows spaced 32px, starting below bar
    const LEG_TOP  = BAR_TOP + BAR_H + 20;  // 80
    const LEG_ROW  = 32;
    const COL_W    = (HALF_W - BAR_PAD * 2) / 2;  // ~200

    let legendHTML = '';
    sortedLangs.forEach(([lang, bytes], i) => {
        const pct   = (bytes / totalBytes * 100).toFixed(1);
        const color = LANG_COLORS[lang] || '#8b949e';
        const col   = i % 2;
        const row   = Math.floor(i / 2);
        const lx    = BAR_PAD + col * COL_W;
        const ly    = LEG_TOP + row * LEG_ROW;

        legendHTML += `
        <g transform="translate(${lx}, ${ly})">
            <circle cx="6" cy="0" r="5" fill="${color}"/>
            <text x="18" y="4" class="sec sm" font-weight="500">${escapeXML(lang)}</text>
            <text x="${COL_W - 6}" y="4" class="sec sm" font-family="monospace"
                  text-anchor="end">${pct}%</text>
        </g>`;
    });

    const langHTML = `
        <g transform="translate(${MARGIN}, ${BOTTOM_Y})">
            <rect width="${HALF_W}" height="${BOTTOM_H}" rx="12"
                  fill="${cardBg}" stroke="${borderColor}" stroke-width="1"/>
            <text x="${BAR_PAD}" y="32" class="pri xbold lg">Top Languages</text>
            ${barHTML}
            ${legendHTML}
        </g>`;

    // ── 5. Detailed Stats ──────────────────────────────────────────────────
    const DETAIL_X   = MARGIN + HALF_W + GAP;
    const D_PAD      = 20;
    const D_ROW      = 40;
    const D_START    = 68;
    const D_MID      = HALF_W / 2;

    const detailRow = (i, lLabel, lVal, rLabel, rVal) => {
        const y = D_START + i * D_ROW;
        return `
        <g transform="translate(0, ${y})">
            <!-- left -->
            <text x="${D_PAD}" y="0" class="sec sm">${escapeXML(lLabel)}</text>
            <text x="${D_MID - 12}" y="0" class="pri xbold md"
                  text-anchor="end">${escapeXML(String(lVal))}</text>
            <!-- divider -->
            <line x1="${D_MID - 2}" y1="-10" x2="${D_MID - 2}" y2="4"
                  stroke="${borderColor}" stroke-width="1"/>
            <!-- right -->
            <text x="${D_MID + 12}" y="0" class="sec sm">${escapeXML(rLabel)}</text>
            <text x="${HALF_W - D_PAD}" y="0" class="pri xbold md"
                  text-anchor="end">${escapeXML(String(rVal))}</text>
        </g>`;
    };

    const detailHTML = `
        <g transform="translate(${DETAIL_X}, ${BOTTOM_Y})">
            <rect width="${HALF_W}" height="${BOTTOM_H}" rx="12"
                  fill="${cardBg}" stroke="${borderColor}" stroke-width="1"/>
            <text x="${D_PAD}" y="32" class="pri xbold lg">Detailed Stats</text>
            <line x1="${D_PAD}" y1="46" x2="${HALF_W - D_PAD}" y2="46"
                  stroke="${borderColor}" stroke-width="1"/>
            ${detailRow(0, 'Repositories', user.public_repos,  'Stars',       stats.totalStars)}
            ${detailRow(1, 'Forks',        stats.totalForks,   'Commits',     stats.totalCommits)}
            ${detailRow(2, 'Total PRs',    stats.totalPRs,     'PRs Merged',  stats.totalPRsMerged)}
            ${detailRow(3, 'Issues',       stats.totalIssues,  'Contributed', stats.contributedTo)}
        </g>`;

    // ── Final SVG ──────────────────────────────────────────────────────────
    return `<svg width="${SVG_W}" height="${SVG_H}"
         viewBox="0 0 ${SVG_W} ${SVG_H}" fill="none"
         xmlns="http://www.w3.org/2000/svg">
        <style>${css}</style>
        <rect width="${SVG_W}" height="${SVG_H}" rx="15" fill="${mainBg}"/>
        ${profileHTML}
        ${topCardsHTML}
        ${streakSvg}
        ${langHTML}
        ${detailHTML}
    </svg>`;
}

module.exports = { generateSVG };