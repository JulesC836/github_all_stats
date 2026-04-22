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
    const user = data.user;
    const stats = data.stats;
    const streak = data.streak;
    const langs = data.languages;

    const mainBg = "#11161d";
    const cardBg = "#181f2a";
    const borderColor = "#262f3e";
    const textPri = "#e6edf3";
    const textSec = "#8b949e";

    const avatarDataUrl = await getBase64Image(user.avatar_url);

    const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    const css = `
        text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
        .pri { fill: ${textPri}; }
        .sec { fill: ${textSec}; }
        .bold { font-weight: 600; }
        .extrabold { font-weight: 800; }
        .text-xs { font-size: 11px; }
        .text-sm { font-size: 13px; }
        .text-md { font-size: 15px; }
        .text-lg { font-size: 18px; }
        .text-xl { font-size: 24px; }
        .text-2xl { font-size: 32px; }
        .center { text-anchor: middle; }
    `;

    // ── 1. Profile ─────────────────────────────────────────────────────────
    const profileHTML = `
        <g transform="translate(30, 30)">
            <rect width="890" height="130" rx="12" fill="${cardBg}" stroke="${borderColor}" stroke-width="1"/>
            <defs>
                <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#39d353" />
                    <stop offset="100%" stop-color="#58a6ff" />
                </linearGradient>
            </defs>
            <circle cx="85" cy="65" r="48" fill="url(#avatarGradient)" />
            <circle cx="85" cy="65" r="44" fill="${cardBg}" />
            <clipPath id="avatarClip">
                <circle cx="85" cy="65" r="40" />
            </clipPath>
            <image href="${avatarDataUrl}" x="45" y="25" width="80" height="80" clip-path="url(#avatarClip)" />
            <circle cx="115" cy="95" r="9" fill="${cardBg}" />
            <circle cx="115" cy="95" r="6" fill="#39d353" />
            <text x="160" y="55" class="pri extrabold" font-size="22">${escapeXML(user.name)}</text>
            <text x="160" y="75" class="sec text-sm" fill="#58a6ff">@${escapeXML(user.login)}</text>
            <text x="160" y="98" class="sec text-sm">${escapeXML((user.bio || '').substring(0, 80))}</text>
            <text x="160" y="118" class="sec text-xs">
                🔗 ${escapeXML(user.blog || 'No website')}   
                👥 <tspan class="pri bold">${user.followers}</tspan> followers · <tspan class="pri bold">${user.following}</tspan> following   
                📅 Joined ${joinDate}
            </text>
        </g>
    `;

    // ── 2. Top 4 cards ─────────────────────────────────────────────────────
    const iconRepos = `<path fill="#58a6ff" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1h-8a1 1 0 00-1 1v6.708A2.486 2.486 0 014.5 9h8V1.5zm-8 11h8v1.5h-8a1 1 0 110-1.5z"/>`;
    const iconStars = `<path fill="#e3b341" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>`;
    const iconForks = `<path fill="#8b5cf6" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>`;
    const iconGists = `<path fill="#39d353" d="M1.5 1.75a.75.75 0 00-1.5 0v12.5c0 .414.336.75.75.75h14.5a.75.75 0 000-1.5H1.5V1.75z"/><path fill="#39d353" d="M3.75 8.75l2.5-2.5 2.5 2.5 4-4v2.5a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.44l-3.19 3.19-2.5-2.5a.75.75 0 00-1.06 0l-3 3a.75.75 0 001.06 1.06z"/>`;

    const renderCard = (x, val, label, icon) => `
        <g transform="translate(${x}, 180)">
            <rect width="210" height="80" rx="10" fill="${cardBg}" stroke="${borderColor}" stroke-width="1"/>
            <rect x="15" y="20" width="40" height="40" rx="8" fill="${mainBg}" />
            <g transform="translate(27, 32) scale(1.1)">${icon}</g>
            <text x="70" y="42" class="pri extrabold text-2xl">${val}</text>
            <text x="70" y="60" class="sec text-xs bold" letter-spacing="0.5">PUBLIC ${label}</text>
        </g>
    `;

    const topCardsHTML = `
        ${renderCard(30,  user.public_repos,  'REPOS', iconRepos)}
        ${renderCard(257, stats.totalStars,   'STARS', iconStars)}
        ${renderCard(484, stats.totalForks,   'FORKS', iconForks)}
        ${renderCard(710, user.public_gists,  'GISTS', iconGists)}
    `;

    // ── 3. Streak ──────────────────────────────────────────────────────────
    // ✅ Fix: calcul dynamique du ring basé sur le vrai streak (max 365 jours)
    const RING_CIRCUMFERENCE = 345;
    const streakPercent = Math.min((streak.currentStreak || 0) / 365, 1);
    const dashOffset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * streakPercent);

    const streakSvg = `
        <g transform="translate(30, 280)">
            <rect width="890" height="180" rx="12" fill="${cardBg}" stroke="${borderColor}" stroke-width="1"/>

            <text x="220" y="85"  class="pri extrabold center" font-size="36">${streak.totalContributions || 0}</text>
            <text x="220" y="115" class="sec text-xs bold center" letter-spacing="1">TOTAL CONTRIBUTIONS</text>
            <text x="220" y="135" class="sec text-xs center">Overall Commits &amp; PRs</text>

            <text x="670" y="85"  class="pri extrabold center" font-size="36">${streak.longestStreak || 0}</text>
            <text x="670" y="115" class="sec text-xs bold center" letter-spacing="1">LONGEST STREAK</text>
            <text x="670" y="135" class="sec text-xs center">Max days contributing</text>

            <g transform="translate(445, 80)">
                <defs>
                    <linearGradient id="streakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#f78166" />
                        <stop offset="100%" stop-color="#f0c000" />
                    </linearGradient>
                </defs>
                <circle cx="0" cy="0" r="55" fill="none" stroke="${mainBg}" stroke-width="6" />
                <circle cx="0" cy="0" r="55" fill="none"
                    stroke="url(#streakGradient)"
                    stroke-width="6"
                    stroke-dasharray="${RING_CIRCUMFERENCE}"
                    stroke-dashoffset="${dashOffset.toFixed(2)}"
                    stroke-linecap="round"
                    transform="rotate(-90)" />
                <path fill="#f78166" transform="translate(-10, -25) scale(1.2)"
                    d="M7.998 14.5c2.832 0 5-1.98 5-4.5 0-1.463-.68-2.19-1.879-3.383l-.036-.037c-1.013-1.008-2.3-2.29-2.834-4.434-.322.256-.63.579-.864.953-.432.696-.621 1.58-.046 2.73.473.947.67 2.284-.278 3.232-.61.61-1.545.84-2.403.525a2.167 2.167 0 01-1.216-1.084c-.706 1.153-.843 2.634-.137 3.974.597 1.135 1.694 2.024 4.693 2.024z"/>
                <text x="0" y="15" class="extrabold center" font-size="28" fill="#f0c000">${streak.currentStreak || 0}</text>
            </g>
            <text x="445" y="160" class="sec text-xs bold center" letter-spacing="1">CURRENT STREAK</text>
        </g>
    `;

    // ── 4. Languages ───────────────────────────────────────────────────────
    const totalLangBytes = Object.values(langs).reduce((a, b) => a + b, 0);
    const sortedLangs = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 5);

    let chartHTML = '';
    let langListHTML = '';
    let currentX = 0;

    sortedLangs.forEach(([lang, bytes], i) => {
        const percent = (bytes / totalLangBytes) * 100;
        const color = LANG_COLORS[lang] || '#8b949e';
        const width = Math.max((percent / 100) * 380, 4); // min 4px pour visibilité

        chartHTML += `<rect x="${currentX.toFixed(2)}" y="20" width="${width.toFixed(2)}" height="12" fill="${color}" rx="3"/>`;
        currentX += width;

        const row = Math.floor(i / 2);
        const col = i % 2;
        const lx = col * 200;
        const ly = 60 + (row * 35);

        langListHTML += `
            <g transform="translate(${lx}, ${ly})">
                <circle cx="5" cy="0" r="5" fill="${color}" />
                <text x="20" y="4" class="sec text-sm" font-weight="500">${escapeXML(lang)}</text>
                <text x="170" y="4" class="sec text-sm" font-family="monospace">${percent.toFixed(1)}%</text>
            </g>
        `;
    });

    const langHTML = `
        <g transform="translate(30, 480)">
            <rect width="430" height="200" rx="12" fill="${cardBg}" stroke="${borderColor}" stroke-width="1"/>
            <text x="25" y="35" class="pri extrabold text-lg">Top Languages</text>
            <g transform="translate(25, 30)">${chartHTML}</g>
            <g transform="translate(25, 40)">${langListHTML}</g>
        </g>
    `;

    // ── 5. Detailed Stats ──────────────────────────────────────────────────
    // ✅ Fix: text-anchor="end" en attribut SVG natif (pas une classe CSS)
    const detailRow = (y, leftLbl, leftVal, rightLbl, rightVal) => `
        <g transform="translate(25, ${y})">
            <text x="0"   y="0" class="sec text-sm">${escapeXML(leftLbl)}</text>
            <text x="195" y="0" class="pri extrabold text-md" text-anchor="end">${escapeXML(String(leftVal))}</text>
            <text x="215" y="0" class="sec text-sm">${escapeXML(rightLbl)}</text>
            <text x="405" y="0" class="pri extrabold text-md" text-anchor="end">${escapeXML(String(rightVal))}</text>
        </g>
    `;

    const detailHTML = `
        <g transform="translate(490, 480)">
            <rect width="430" height="200" rx="12" fill="${cardBg}" stroke="${borderColor}" stroke-width="1"/>
            <text x="25" y="35" class="pri extrabold text-lg">Detailed Stats</text>
            ${detailRow(75,  'Total Repositories', user.public_repos,   "Stars",       stats.totalStars)}
            ${detailRow(110, 'Total Forks',        stats.totalForks,    "Total Commits", stats.totalCommits)}
            ${detailRow(145, 'Total PRs',          stats.totalPRs,      "PRs Merged",  stats.totalPRsMerged)}
            ${detailRow(180, 'Total Issues',       stats.totalIssues,   "Contributed To", stats.contributedTo)}
        </g>
    `;

    return `<svg width="950" height="710" viewBox="0 0 950 710" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>${css}</style>
        <rect width="950" height="710" rx="15" fill="${mainBg}" />
        ${profileHTML}
        ${topCardsHTML}
        ${streakSvg}
        ${langHTML}
        ${detailHTML}
    </svg>`;
}

module.exports = { generateSVG };
