const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdir(dir, function(err, list) {
        if (err) return callback(err);
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file) return callback(null);
            file = path.join(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        next();
                    });
                } else {
                    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                        processFile(file);
                    }
                    next();
                }
            });
        })();
    });
}

function processFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Remove specific glow tailwind classes
    // Regex for things like: shadow-[0_0_30px_rgba(168,85,247,0.2)]
    content = content.replace(/shadow-\[[^\]]+\]/g, 'shadow-none');
    
    // Drop shadow
    content = content.replace(/drop-shadow-\[[^\]]+\]/g, 'drop-shadow-none');
    
    // Blur classes (e.g. blur-[120px], blur-3xl, etc.)
    content = content.replace(/blur-\[[^\]]+\]/g, '');
    content = content.replace(/\bblur-(sm|md|lg|xl|2xl|3xl)\b/g, '');
    
    // Mix blend modes often used for glows
    content = content.replace(/\bmix-blend-screen\b/g, '');
    
    // Inline explicit glows (e.g., custom classes or arbitrary values)
    content = content.replace(/shadow-\w+/g, (match) => {
      // Don't remove basic structural shadows like shadow-sm, shadow-md unless they are neon glows, but it's safer to just replace them with shadow-none if they are part of the glow request. The user asked to remove "glow" from everywhere.
      if (match === 'shadow-inner' || match === 'shadow-sm' || match === 'shadow-md' || match === 'shadow-lg' || match === 'shadow-xl' || match === 'shadow-2xl' || match === 'shadow-none') return 'shadow-none';
      return match;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Processed: ${file}`);
    }
}

walk(path.join(__dirname, 'frontend/src'), function(err) {
    if (err) throw err;
    console.log('Finished stripping glows.');
});
