const axios = require('axios');

async function fetchGitHubData(username) {
    const token = process.env.GITHUB_TOKEN;
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    if (!token) {
        throw new Error('GITHUB_TOKEN environment variable is missing. It is strictly required for 100% accurate streak and language stats.');
    }

    try {
        const query = `
        query userInfo($login: String!) {
            user(login: $login) {
                name
                login
                bio
                avatarUrl
                websiteUrl
                followers { totalCount }
                following { totalCount }
                createdAt
                repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: STARGAZERS, direction: DESC}) {
                    totalCount
                    nodes {
                        stargazerCount
                        forkCount
                        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                            edges {
                                size
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
                gists { totalCount }
                contributionsCollection {
                    totalCommitContributions
                    totalPullRequestContributions
                    totalIssueContributions
                    totalRepositoriesWithContributedCommits
                    contributionCalendar {
                        totalContributions
                        weeks {
                            contributionDays {
                                contributionCount
                                date
                            }
                        }
                    }
                }
                pullRequests(first: 100, states: MERGED) {
                    totalCount
                }
            }
        }`;

        const graphRes = await axios.post('https://api.github.com/graphql', {
            query,
            variables: { login: username }
        }, { headers });

        if (graphRes.data.errors) {
            throw new Error(graphRes.data.errors[0].message);
        }

        const data = graphRes.data.data.user;
        if (!data) throw new Error("User not found via GraphQL");

        // Compute Stats
        const repos = data.repositories.nodes || [];
        let totalStars = 0;
        let totalForks = 0;
        const langBytes = {};

        repos.forEach(repo => {
            totalStars += repo.stargazerCount;
            totalForks += repo.forkCount;
            if (repo.languages && repo.languages.edges) {
                repo.languages.edges.forEach(edge => {
                    const langName = edge.node.name;
                    langBytes[langName] = (langBytes[langName] || 0) + edge.size;
                });
            }
        });

        const col = data.contributionsCollection;
        const totalCommits = col.totalCommitContributions;
        const totalPRs = col.totalPullRequestContributions;
        const totalIssues = col.totalIssueContributions;
        const contributedTo = col.totalRepositoriesWithContributedCommits;
        const totalPRsMerged = data.pullRequests.totalCount;

        // Calculate Streak from actual Git Contributions Calendar (Perfect Accuracy for the year)
        const weeks = col.contributionCalendar.weeks;
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        // Flatten days
        const allDays = [];
        weeks.forEach(week => {
            week.contributionDays.forEach(day => {
                allDays.push(day);
            });
        });

        // Traverse days historically
        allDays.forEach(day => {
            if (day.contributionCount > 0) {
                tempStreak++;
                if (tempStreak > longestStreak) {
                    longestStreak = tempStreak;
                }
            } else {
                tempStreak = 0;
            }
        });

        // Calculate current streak (counting backward from today or yesterday)
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        let foundToday = false;
        tempStreak = 0;
        
        for (let i = allDays.length - 1; i >= 0; i--) {
            const day = allDays[i];
            
            // Skip future days if timezone overlap
            if (new Date(day.date) > today) continue;

            if (day.contributionCount > 0) {
                tempStreak++;
            } else {
                // If it's today and 0 contributions, we don't break yet because they might have a streak up to yesterday
                if (!foundToday && day.date === todayString) {
                    foundToday = true;
                    continue; // Skip today, check yesterday
                }
                break; // Break on any other day with 0 contributions
            }
        }
        currentStreak = tempStreak;

        return {
            user: {
                name: data.name || data.login,
                login: data.login,
                bio: data.bio || 'One step every dy',
                avatar_url: data.avatarUrl,
                blog: data.websiteUrl || '',
                followers: data.followers.totalCount,
                following: data.following.totalCount,
                created_at: data.createdAt,
                public_repos: data.repositories.totalCount,
                public_gists: data.gists.totalCount
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
            streak: {
                totalContributions: col.contributionCalendar.totalContributions,
                currentStreak,
                longestStreak
            },
            languages: langBytes
        };
    } catch (error) {
        console.error("Error fetching exact GitHub data:", error.response?.data || error.message);
        throw new Error('Could not fetch accurate user data. Is your GITHUB_TOKEN set inside Vercel Environment Variables?');
    }
}

module.exports = { fetchGitHubData };
