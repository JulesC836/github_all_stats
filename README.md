# GitHub All Stats 🚀

A highly accurate, dynamically generated GitHub stats API that you can embed directly in your GitHub profile `README.md`. Includes perfectly calculated contribution streaks and language statistics based on your **entire** activity history (using GitHub's exact GraphQL contribution calendar).

<div align="center">
  <img src="https://github-all-stats.vercel.app/api?username=raghu24k&v=1" alt="Preview of GitHub All Stats" />
</div>

## Features ✨

* **100% Accurate Streaks:** Built with GitHub's exact GraphQL `contributionCalendar` structure.
* **Precise Top Languages:** Accurately measures repository langauge sizes.
* **Beautiful Real-Time Design:** Glassmorphism UI, gradient avatars, animated SVG layouts. 
* **Zero Dependencies for End Users:** Anyone can simply paste an `<img>` tag and it works automatically via our Vercel API.

---

## 🚀 How to Use It on Your Profile

Are you a developer who wants to show off your GitHub stats? It's incredibly easy!
You don't need to install anything. Just copy and paste this code snippet into your GitHub profile's `README.md` file!

**Replace `YOUR_GITHUB_USERNAME` with your actual username:**

```html
<div align="center">
  <img src="https://github-all-stats.vercel.app/api?username=YOUR_GITHUB_USERNAME&v=1" alt="My GitHub Stats" />
</div>
```

**Note on Caching:**
GitHub serves all images through its `camo.githubusercontent.com` proxy, meaning GitHub aggressively caches images. To force an immediate refresh if you just made commits, you can increment the random string at the end of the URL (e.g., change `&v=1` to `&v=2` or `&refresh=123`).

## 🛠 Self-Hosting (Optional)

If you'd like to host your own version of this API on your Vercel account, follow these steps:

1. **Fork/Clone** this repository to your local machine.
2. Run `npm install` to install dependencies (`axios`, `express`, `dotenv`).
3. Set up your Vercel account, and import this project.
4. Add a **GitHub Personal Access Token (PAT)**:
   * Go to GitHub settings -> Developer settings -> Personal access tokens (classic).
   * Create a new token with just `public_repo` and `read:user` permissions.
   * Go to your Vercel project Settings > Environment Variables.
   * Add `GITHUB_TOKEN` and paste your token value. This is **strictly required** for 100% accurate GraphQL contribution fetching!
5. Deploy the project!
