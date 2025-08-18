
#!/bin/bash

echo "Building embed version..."
npm run build:embed

echo "Embed build complete! Files are in ./embed-dist/"
echo ""
echo "To test locally:"
echo "1. cd embed-dist"
echo "2. python -m http.server 8000"
echo "3. Open http://localhost:8000/reservation-embed.html"
echo ""
echo "To deploy to GitHub Pages:"
echo "1. Push your changes to main/master branch"
echo "2. GitHub Actions will automatically build and deploy"
echo "3. Your embed will be available at: https://[username].github.io/[repo-name]/reservation-embed.html"
