const axios = require('axios');

async function fetchGitHubData(username) {
    const token = process.env.GITHUB_TOKEN;
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
        // 1. Fetch user data (REST)
        const userRes = await axios.get(`https://api.github.com/users/${username}`, { headers });
        const user = userRes.data;

        // 2. Fetch repo data (REST) for languages and top repos
        let repos = [];
        let page = 1;
        while (true) {
            const reposRes = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`, { headers });
            repos = repos.concat(reposRes.data);
            if (reposRes.data.length < 100) break;
            page++;
        }

        // 3. Extended Stats (GraphQL if token available)
        let totalCommits = 0;
        let totalPRs = 0;
        let totalPRsMerged = 0;
        let totalIssues = 0;
        let contributedTo = 0;

        if (token) {
            try {
                const query = `
                query userInfo($login: String!) {
                    user(login: $login) {
                        contributionsCollection {
                            totalCommitContributions
                            totalPullRequestContributions
                            totalIssueContributions
                            totalRepositoriesWithContributedCommits
                        }
                        pullRequests(first: 100) {
                            totalCount
                            nodes {
                                state
                            }
                        }
                    }
                }`;
                const graphRes = await axios.post('https://api.github.com/graphql', {
                    query,
                    variables: { login: username }
                }, { headers });

                const data = graphRes.data.data.user;
                if (data) {
                    const col = data.contributionsCollection;
                    totalCommits = col.totalCommitContributions || 0;
                    totalPRs = col.totalPullRequestContributions || 0;
                    totalIssues = col.totalIssueContributions || 0;
                    contributedTo = col.totalRepositoriesWithContributedCommits || 0;
                    
                    // Simple estimation for merged PRs from the first 100
                    const prs = data.pullRequests.nodes || [];
                    totalPRsMerged = prs.filter(pr => pr.state === 'MERGED').length;
                    
                    // Update exact count if search PRs works better, but GraphQL is more reliable.
                }
            } catch (err) {
                console.error("GraphQL error (likely invalid token or permissions):", err.message);
            }
        } else {
            // Fallback to Search API (might hit rate limits)
            try {
                const [commitsRes, prsRes, prsMergedRes, issuesRes] = await Promise.all([
                    axios.get(`https://api.github.com/search/commits?q=author:${username}`, { headers }).catch(() => ({ data: { total_count: 0 }})),
                    axios.get(`https://api.github.com/search/issues?q=author:${username}+type:pr`, { headers }).catch(() => ({ data: { total_count: 0 }})),
                    axios.get(`https://api.github.com/search/issues?q=author:${username}+type:pr+is:merged`, { headers }).catch(() => ({ data: { total_count: 0 }})),
                    axios.get(`https://api.github.com/search/issues?q=author:${username}+type:issue`, { headers }).catch(() => ({ data: { total_count: 0 }}))
                ]);
                totalCommits = commitsRes.data.total_count;
                totalPRs = prsRes.data.total_count;
                totalPRsMerged = prsMergedRes.data.total_count;
                totalIssues = issuesRes.data.total_count;
            } catch (err) {
                console.error("Search API rate limit hit.");
            }
        }

        // Calculate totals from repos
        const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

        // Calculate Languages
        const langBytes = {};
        repos.forEach(repo => {
            if (repo.language) {
                langBytes[repo.language] = (langBytes[repo.language] || 0) + (repo.size || 1);
            }
        });

        // 4. Events for streak (estimation based on recent events)
        let streakData = { totalContributions: 0, currentStreak: 0, longestStreak: 0 };
        try {
            const eventsRes = await axios.get(`https://api.github.com/users/${username}/events/public?per_page=100`, { headers });
            const events = eventsRes.data;
            streakData = calculateStreak(events);
        } catch (err) {
            console.error("Error fetching events for streak.");
        }

        // Return unified data object
        return {
            user: {
                name: user.name || user.login,
                login: user.login,
                bio: user.bio || 'Doing what I like and what I want to be.',
                avatar_url: user.avatar_url,
                blog: user.blog,
                followers: user.followers,
                following: user.following,
                created_at: user.created_at,
                public_repos: user.public_repos,
                public_gists: user.public_gists
            },
            stats: {
                totalStars,
                totalForks,
                totalCommits,
                totalPRs,
                totalPRsMerged,
                totalIssues,
                contributedTo
            },
            streak: streakData,
            languages: langBytes
        };
    } catch (error) {
        console.error("Error fetching GitHub data:", error.response?.data || error.message);
        throw new Error('Could not fetch user data');
    }
}

function calculateStreak(events) {
    const pushEvents = events.filter(e => 
        ['PushEvent', 'CreateEvent', 'PullRequestEvent', 'IssuesEvent', 'PullRequestReviewEvent'].includes(e.type)
    );
    
    // Get unique contribution dates
    const dates = [...new Set(pushEvents.map(e => {
        const d = new Date(e.created_at);
        return d.toISOString().split('T')[0];
    }))].sort().reverse();
    
    if (dates.length === 0) return { totalContributions: 0, currentStreak: 0, longestStreak: 0 };
    
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const firstDate = new Date(dates[0]);
    firstDate.setHours(0, 0, 0, 0);
    
    if (firstDate >= yesterday) {
        currentStreak = 1;
        for (let i = 1; i < dates.length; i++) {
            const curr = new Date(dates[i - 1]);
            const prev = new Date(dates[i]);
            const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
            if (diffDays <= 1) {
                currentStreak++;
            } else {
                break;
            }
        }
    }
    
    let longestStreak = 1;
    let tempStreak = 1;
    const sortedDates = [...dates].sort();
    
    for (let i = 1; i < sortedDates.length; i++) {
        const curr = new Date(sortedDates[i]);
        const prev = new Date(sortedDates[i - 1]);
        const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
        
        if (diffDays <= 1) {
            tempStreak++;
            if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
            tempStreak = 1;
        }
    }
    
    return {
        totalContributions: pushEvents.length,
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak)
    };
}

module.exports = { fetchGitHubData };
