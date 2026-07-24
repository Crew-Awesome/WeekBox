const fs = require('fs');

const uiJsPath = 'C:/Users/leive/Proyectos/Weekbox/app/src/ui/js/index.js';
let jsContent = fs.readFileSync(uiJsPath, 'utf8');

const tplLogic = `
function __renderTemplate(id, data = {}) {
    const tpl = document.getElementById(id);
    if (!tpl) return '';
    let html = tpl.innerHTML;
    for (const key in data) {
        html = html.replace(new RegExp('{{' + key + '}}', 'g'), data[key]);
    }
    return html;
}

const __modManagerTemplates = {
    mainModal: () => __renderTemplate('tpl-mainModal'),
    unassignedBadge: () => __renderTemplate('tpl-unassignedBadge'),
    executableBadge: () => __renderTemplate('tpl-executableBadge'),
    engineBadge: (name, icon) => __renderTemplate('tpl-engineBadge', {name, icon}),
    engineCompatibilityPicker: (modId, engineId, engineVersion, selectedEngineIcon, selectedEngineName, engineOptionsHtml, selectedVersion, versionOptionsHtml) => 
        __renderTemplate('tpl-engineCompatibilityPicker', {modId, engineId, engineVersion, selectedEngineIconHtml: selectedEngineIcon ? \`<img src="assets/icons/\${selectedEngineIcon}" alt=""/>\` : \`<i class="fa-solid fa-question-circle" aria-hidden="true"></i>\`, selectedEngineName, unassignedSelectedClass: !engineId ? 'selected' : '', engineOptionsHtml, selectedVersion, versionOptionsHtml}),
    engineOption: (id, name, icon, isSelected) => __renderTemplate('tpl-engineOption', {id, name, icon, selectedClass: isSelected ? 'selected' : ''}),
    versionOption: (version, isSelected) => __renderTemplate('tpl-versionOption', {versionValue: version === "Any version" ? "" : version, version, selectedClass: isSelected ? 'selected' : ''}),
    cardContent: (launchKind, modId, engineId, engineVersion, launchLabel, modName, isHidden, isUnassigned, eyeIcon, engineBadgeHtml) => __renderTemplate('tpl-cardContent', {launchKind, modId, engineId, engineVersion, launchLabel, modName, eyeIcon, engineBadgeHtml, disabledAttr: isHidden || isUnassigned ? 'disabled' : ''}),
    launchButtonRunning: () => __renderTemplate('tpl-launchButtonRunning'),
    launchButtonSwitch: () => __renderTemplate('tpl-launchButtonSwitch'),
    launchButtonDefault: (launchLabel) => __renderTemplate('tpl-launchButtonDefault', {launchLabel}),
    emptyState: (message) => __renderTemplate('tpl-emptyState', {message}),
    addLocalModCard: () => __renderTemplate('tpl-addLocalModCard'),
    deleteSpinner: () => __renderTemplate('tpl-deleteSpinner'),
    deleteIcon: () => __renderTemplate('tpl-deleteIcon'),
    unassignedQuestionIcon: () => __renderTemplate('tpl-unassignedQuestionIcon'),
    openDirectoryIcon: () => __renderTemplate('tpl-openDirectoryIcon')
};
`;

jsContent = tplLogic + '\n' + jsContent;

// Replace all imports of modManagerTemplates
jsContent = jsContent.replace(/import\s*{\s*modManagerTemplates(?:\s+as\s+([a-zA-Z0-9_]+))?\s*}\s*from\s*['"][^'"]+mod-manager\.js['"];/g, (match, alias) => {
    return alias ? `const ${alias} = __modManagerTemplates;` : `const modManagerTemplates = __modManagerTemplates;`;
});

fs.writeFileSync(uiJsPath, jsContent, 'utf8');

// Now update router.js
const routerPath = 'C:/Users/leive/Proyectos/Weekbox/app/src/backend/core/router.js';
let routerContent = fs.readFileSync(routerPath, 'utf8');

routerContent = routerContent.replace(/async loadComponent\(container, path\)\s*{[\s\S]*?}/, `async loadComponent(container, path) {
    // Obsolete: html is now loaded all at once in init()
}`);

routerContent = routerContent.replace(/async init\(\)\s*{[\s\S]*?}/, `async init() {
    this.mainContent = document.getElementById("main-content");
    this.sidebarContainer = document.getElementById("sidebar-container");
    
    try {
        const response = await fetch("src/ui/html/index.html");
        const html = await response.text();
        const temp = document.createElement("div");
        temp.innerHTML = html;
        
        const templates = temp.querySelectorAll("template");
        templates.forEach(t => document.body.appendChild(t));

        const sidebarTpl = document.getElementById("tpl-sidebar");
        if (sidebarTpl) this.sidebarContainer.innerHTML = sidebarTpl.innerHTML;
    } catch(e) {
        console.error("Failed to load templates", e);
    }
    
    await sidebar.init();
    await this.navigate("home");
  }`);

routerContent = routerContent.replace(/async navigate\(viewId\)\s*{[\s\S]*?}/, `async navigate(viewId) {
    try {
      const tpl = document.getElementById('tpl-' + viewId);
      if (tpl) {
        this.mainContent.innerHTML = tpl.innerHTML;
        this.currentViewId = viewId;
        emitViewChange(viewId);
      } else {
        throw new Error('View template not found: tpl-' + viewId);
      }
    } catch (error) {
      this.mainContent.innerHTML = '<p style="padding: 24px; color: #ff4a4a;">Failed to load view: ' + viewId + '</p>';
    }
  }`);

fs.writeFileSync(routerPath, routerContent, 'utf8');
console.log('Successfully updated router.js and ui/js/index.js');
