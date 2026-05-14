const fs = require('fs');
const path = require('path');

const filesToFix = [
    "src/pages/ReintegrationPlans.tsx",
    "src/pages/ManageUsers.tsx",
    "src/pages/Index.tsx",
    "src/pages/Finance.tsx",
    "src/pages/Empowerment.tsx",
    "src/pages/HouseKeeping.tsx",
    "src/pages/Education.tsx",
    "src/pages/Clients.tsx",
    "src/pages/ClientReintegrationPlans.tsx",
    "src/pages/ClientDetails.tsx",
    "src/pages/CasePlans.tsx",
    "src/pages/Alumni.tsx",
    "src/pages/CasePlanDetails.tsx",
    "src/pages/Agriculture.tsx",
    "src/pages/AddReintegrationPlan.tsx",
    "src/pages/Aftercare.tsx",
    "src/pages/AddCasePlan.tsx",
    "src/pages/AddAftercareRecord.tsx",
    "src/pages/StreetVisits.tsx"
];

const basePath = "d:/CMSNLMRC";

filesToFix.forEach(file => {
    const fullPath = path.resolve(basePath, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let original = content;

        // 1. Remove overflow-x-hidden from lines containing min-h-screen
        // We replace 'overflow-x-hidden' with an empty string if it appears in the same class string as 'min-h-screen'
        // Regex looks for: class string opening, content, min-h-screen, content, overflow-x-hidden, content, closing
        // Simplified: just remove universal overflow-x-hidden from these page wrappers
        if (content.match(/min-h-screen.*overflow-x-hidden/)) {
            content = content.replace(/(className="[^"]*min-h-screen[^"]*)overflow-x-hidden/g, '$1');
        }

        // 2. Make headers sticky
        // Looks for relative followed by bg-gradient...
        // Using a broader regex to capture 'relative' anywhere if 'bg-gradient' is present
        // But keeping it safe: The pattern observed is consistent.

        const headerPattern = /(className=")([^"]*?)(\brelative\b)([^"]*?bg-gradient-[a-zA-Z0-9-]+)/g;

        content = content.replace(headerPattern, (match, startQuote, before, rel, after) => {
            // Replace 'relative' with 'sticky top-14 z-10'
            // Check if shadow is present in before or after
            let shadow = "";
            if (!before.includes("shadow") && !after.includes("shadow")) {
                shadow = " shadow-md";
            }
            return `${startQuote}${before}sticky top-14 z-10${shadow}${after}`;
        });

        // Clean up double spaces
        content = content.replace(/className=" +/g, 'className="').replace(/ +"/g, '"').replace(/  +/g, ' ');

        if (content !== original) {
            fs.writeFileSync(fullPath, content);
            console.log(`Updated ${file}`);
        } else {
            console.log(`No changes needed for ${file}`);
        }
    } else {
        console.log(`File not found: ${file}`);
    }
});
