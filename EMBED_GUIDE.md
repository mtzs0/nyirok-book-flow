
# Reservation System Embedding Guide

## Setup Instructions

### 1. Configure GitHub Secrets

In your GitHub repository, go to Settings > Secrets and variables > Actions, and add these secrets:

- `VITE_SUPABASE_URL`: `https://aispzwadwdikqmtpmqii.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpc3B6d2Fkd2Rpa3FtdHBtcWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjUwODYsImV4cCI6MjA2OTIwMTA4Nn0.OAziuXL-MAV60ZvrbD_77SmIttcbE113zKjwYsZ-0yE`

### 2. Enable GitHub Pages

1. Go to your repository Settings > Pages
2. Set Source to "Deploy from a branch"
3. Select branch: `gh-pages`
4. Select folder: `/ (root)`
5. Click Save

### 3. WordPress/Elementor Integration

After your first deployment (which happens automatically when you push to main/master), your reservation system will be available at:

```
https://[your-username].github.io/[your-repo-name]/reservation-embed.html
```

#### Method 1: Direct Iframe Embed

Add this HTML to your WordPress page or Elementor HTML widget:

```html
<iframe 
  src="https://[your-username].github.io/[your-repo-name]/reservation-embed.html"
  width="100%" 
  height="800" 
  frameborder="0"
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
  title="Reservation System">
</iframe>
```

#### Method 2: Responsive Iframe with JavaScript

```html
<div id="reservation-container">
  <iframe 
    id="reservation-iframe"
    src="https://[your-username].github.io/[your-repo-name]/reservation-embed.html"
    width="100%" 
    height="800" 
    frameborder="0"
    style="border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
    title="Reservation System">
  </iframe>
</div>

<script>
// Auto-resize iframe based on content
window.addEventListener('message', function(event) {
  if (event.data.type === 'resize') {
    const iframe = document.getElementById('reservation-iframe');
    if (iframe) {
      iframe.style.height = event.data.height + 'px';
    }
  }
});
</script>
```

#### Method 3: Elementor Integration

1. In Elementor, add an "HTML" widget
2. Paste the iframe code from Method 1 or 2
3. Adjust the height as needed (recommended: 800px minimum)
4. Save and publish

### 4. Automatic Updates

Every time you push changes to your main/master branch:
1. GitHub Actions automatically builds the project
2. The embed version is updated on GitHub Pages
3. Your WordPress site shows the latest version immediately

### 5. Customization

To modify styling or functionality:
1. Edit the files in your repository
2. Push to main/master branch
3. Wait for GitHub Actions to complete (~2-3 minutes)
4. Your embedded version will be updated automatically

### 6. Troubleshooting

- **Blank iframe**: Check if GitHub Pages is enabled and deployment was successful
- **Styling issues**: The embed version includes style isolation to prevent WordPress theme conflicts
- **Loading errors**: Check browser console for CORS or network issues
- **Data not loading**: Verify Supabase secrets are correctly set in GitHub

### 7. Environment Variables

The system automatically uses these Supabase settings:
- Project URL: `https://aispzwadwdikqmtpmqii.supabase.co`
- Anon Key: (configured in GitHub secrets)

No additional configuration needed on the WordPress side.
