
# Embedding Nyirok Reservation System in Elementor

This guide shows you how to embed the reservation system into your Elementor WordPress site using an HTML widget.

## Embed URL
Your reservation system is hosted at:
```
https://mtzs0.github.io/nyirok-book-flow/reservation-embed.html
```

## Option 1: Basic Iframe (Simple)

Add an HTML widget in Elementor and paste this code:

```html
<iframe 
    src="https://mtzs0.github.io/nyirok-book-flow/reservation-embed.html"
    width="100%"
    height="600"
    frameborder="0"
    scrolling="no"
    style="border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
</iframe>
```

## Option 2: Auto-Resizing Iframe (Recommended)

For better user experience with automatic height adjustment, use this enhanced version:

```html
<div id="reservation-container" style="width: 100%; min-height: 600px;">
    <iframe 
        id="reservation-iframe"
        src="https://mtzs0.github.io/nyirok-book-flow/reservation-embed.html"
        width="100%"
        height="600"
        frameborder="0"
        scrolling="no"
        style="border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: height 0.3s ease;">
    </iframe>
</div>

<script>
(function() {
    const iframe = document.getElementById('reservation-iframe');
    
    // Listen for resize messages from the iframe
    window.addEventListener('message', function(event) {
        // Verify the origin for security (replace with your actual GitHub Pages URL)
        if (event.origin !== 'https://mtzs0.github.io') return;
        
        if (event.data && event.data.type === 'resize') {
            const newHeight = Math.max(event.data.height, 400); // Minimum height of 400px
            iframe.style.height = newHeight + 'px';
            console.log('Iframe height adjusted to:', newHeight + 'px');
        }
    }, false);
    
    // Fallback: Try to adjust height after load
    iframe.onload = function() {
        setTimeout(function() {
            try {
                // This will only work if same-origin, but worth trying
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc) {
                    const height = Math.max(iframeDoc.body.scrollHeight, 400);
                    iframe.style.height = height + 'px';
                }
            } catch (e) {
                // Cross-origin access blocked, which is expected
                console.log('Cross-origin iframe, using message-based resizing');
            }
        }, 1000);
    };
})();
</script>
```

## Key Features

✅ **Automatic Updates**: When you push changes to GitHub, the embedded form updates automatically  
✅ **No WordPress Dependencies**: Works independently of WordPress updates  
✅ **Mobile Responsive**: Optimized for all screen sizes  
✅ **Secure**: Runs in isolated iframe environment  
✅ **Fast Loading**: Optimized build with CDN delivery  
✅ **Dynamic Resizing**: Automatically adjusts height based on content  

## Testing Your Embed

1. **Preview in Elementor**: Use Elementor's preview mode to see how it looks
2. **Test on Mobile**: Check responsiveness on different devices
3. **Test Functionality**: Go through the entire reservation flow
4. **Check Console**: Open browser dev tools to see any error messages

## Troubleshooting

**Issue: Iframe shows scrollbars**
- Use Option 2 (auto-resizing) instead of Option 1
- The iframe will automatically adjust its height

**Issue: Content appears cut off**
- The auto-resizing version should fix this
- Make sure you're using the script provided in Option 2

**Issue: Iframe not loading**
- Check that the URL is accessible: https://mtzs0.github.io/nyirok-book-flow/reservation-embed.html
- Ensure your site allows iframe embeds
- Check browser console for error messages

**Issue: Styling conflicts**
- The embed uses its own isolated styles
- If needed, add custom CSS to the Elementor HTML widget

## Updates and Maintenance

The GitHub integration will automatically deploy updates when you push changes to the repository. No manual intervention required on the WordPress side.

The system will continue working indefinitely until you either:
- Delete the GitHub repository
- Disable GitHub Pages
- Change the repository visibility to private
