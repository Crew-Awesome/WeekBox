export async function fetchAndRenderReleaseNotes(versionData, targetLink) {
    const notesContainer = document.getElementById('engine-release-notes');
    if (!notesContainer) return;
    
    notesContainer.innerHTML = '<p style="color: var(--text-muted);">Fetching release notes...</p>';
    
    const link = targetLink || versionData.win || versionData.lin || versionData.mac || "";
    const match = link.match(/github\.com\/([^\/]+)\/([^\/]+)\/releases\/download\/([^\/]+)\//);
    
    if (!match) {
        notesContainer.innerHTML = '<p><em>No release notes available.</em></p>';
        return;
    }
    
    try {
        const res = await fetch(`https://api.github.com/repos/${match[1]}/${match[2]}/releases/tags/${match[3]}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        let text = data.body || "No description.";
        
        // Keep release-note markup but strip scripts.
        text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
        
        // Extract code before formatting Markdown.
        let codeBlocks = [];
        text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
            codeBlocks.push(code);
            return `%%%CODE_BLOCK_${codeBlocks.length - 1}%%%`;
        });

        // Keep inline code intact while formatting.
        let inlineCodes = [];
        text = text.replace(/`([^`]+)`/g, (match, code) => {
            inlineCodes.push(code);
            return `%%%INLINE_CODE_${inlineCodes.length - 1}%%%`;
        });

        // Format the supported Markdown syntax.
        let html = text
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" style="max-width: 100%; border-radius: 8px; margin: 8px 0;">')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
            .replace(/\r\n|\n/g, '<br>');

        // Restore escaped inline code.
        html = html.replace(/%%%INLINE_CODE_(\d+)%%%/g, (match, index) => {
            const escapedCode = inlineCodes[index].replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return `<code>${escapedCode}</code>`;
        });

        // Restore escaped code blocks.
        html = html.replace(/%%%CODE_BLOCK_(\d+)%%%/g, (match, index) => {
            const escapedCode = codeBlocks[index].replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return `<pre style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; overflow-x: auto; margin: 8px 0;"><code>${escapedCode}</code></pre>`;
        });
            
        notesContainer.innerHTML = html;
    } catch (error) {
        notesContainer.innerHTML = '<p><em>Failed to fetch release notes.</em></p>';
    }
}
