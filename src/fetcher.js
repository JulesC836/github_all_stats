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
                organizations(first: 10) {
                    nodes { login avatarUrl }
                }
                repositories(
                    first: 100,
                    ownerAffiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR],
                    isFork: false,
                    orderBy: {field: STARGAZERS, direction: DESC}
                ) {
                    totalCount
                    nodes {
                        stargazerCount
                        forkCount
                        owner { login }
                        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                            edges {
                                size
                                node { name }
                            }
                        }
                    }
                }
                gists { totalCount }
                contributionsCollection {
                    totalCommitContributions
                    restrictedContributionsCount
                    totalPullRequestContributions
                    totalIssueContributions
                    totalRepositoriesWithContributedCommits
                    commitContributionsByRepository(maxRepositories: 100) {
                        contributions { totalCount }
                        repository {
                            nameWithOwner
                            owner { login }
                            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                                edges {
                                    size
                                    node { name }
                                }
                            }
                        }
                    }
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

        // ── Langages ──────────────────────────────────────────────────────────
        const langBytes = {};

        // 1. Repos personnels + orgs (ownerAffiliations élargi)
        const repos = data.repositories.nodes || [];
        let totalStars = 0;
        let totalForks = 0;

        repos.forEach(repo => {
            totalStars += repo.stargazerCount;
            totalForks += repo.forkCount;
            if (repo.languages?.edges) {
                repo.languages.edges.forEach(edge => {
                    const langName = edge.node.name;
                    langBytes[langName] = (langBytes[langName] || 0) + edge.size;
                });
            }
        });

        // 2. Langages depuis les contributions par repo (couvre les repos privés d'orgs)
        const repoContribs = data.contributionsCollection.commitContributionsByRepository || [];
        repoContribs.forEach(({ repository }) => {
            if (repository.languages?.edges) {
                repository.languages.edges.forEach(edge => {
                    const langName = edge.node.name;
                    // Éviter le double comptage des repos déjà inclus ci-dessus
                    const alreadyCounted = repos.some(r => r.owner?.login + '/' === repository.nameWithOwner.split('/')[0] + '/');
                    if (!alreadyCounted) {
                        langBytes[langName] = (langBytes[langName] || 0) + edge.size;
                    }
                });
            }
        });

        // ── Contributions ─────────────────────────────────────────────────────
        const col = data.contributionsCollection;
        const totalCommits = col.totalCommitContributions + col.restrictedContributionsCount;
        const totalPRs = col.totalPullRequestContributions;
        const totalIssues = col.totalIssueContributions;
        const contributedTo = col.totalRepositoriesWithContributedCommits;
        const totalPRsMerged = data.pullRequests.totalCount;

        // ── Streak ────────────────────────────────────────────────────────────
        const weeks = col.contributionCalendar.weeks;
        let longestStreak = 0;
        let tempStreak = 0;

        const allDays = [];
        weeks.forEach(week => {
            week.contributionDays.forEach(day => allDays.push(day));
        });

        // Longest streak
        allDays.forEach(day => {
            if (day.contributionCount > 0) {
                tempStreak++;
                if (tempStreak > longestStreak) longestStreak = tempStreak;
            } else {
                tempStreak = 0;
            }
        });

        // Current streak (en remontant depuis aujourd'hui)
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        let currentStreak = 0;
        let foundToday = false;
        tempStreak = 0;

        for (let i = allDays.length - 1; i >= 0; i--) {
            const day = allDays[i];

            if (new Date(day.date) > today) continue;

            if (day.contributionCount > 0) {
                tempStreak++;
            } else {
                if (!foundToday && day.date === todayString) {
                    foundToday = true;
                    continue;
                }
                break;
            }
        }
        currentStreak = tempStreak;

        // ── Résultat ──────────────────────────────────────────────────────────
        return {
            user: {
                name: data.name || data.login,
                login: data.login,
                bio: data.bio || '',
                avatar_url: data.avatarUrl,
                blog: data.websiteUrl || '',
                followers: data.followers.totalCount,
                following: data.following.totalCount,
                created_at: data.createdAt,
                public_repos: data.repositories.totalCount,
                public_gists: data.gists.totalCount,
                organizations: data.organizations.nodes.map(org => ({
                    login: org.login,
                    avatar_url: org.avatarUrl
                }))
            },
            stats: {
                totalStars,
                totalForks,
                totalCommits,        // inclut les commits privés d'orgs
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
        console.error("Error fetching GitHub data:", error.response?.data || error.message);
        throw new Error('Could not fetch accurate user data. Is your GITHUB_TOKEN set inside your environment variables?');
    }
}

module.exports = { fetchGitHubData };