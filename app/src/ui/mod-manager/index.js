import { FS } from "../../utils/filesystem.js";

export const modManagerModal = {
  async init() {
    if (!document.getElementById("mod-manager-modal")) {
      const response = await fetch("src/html/mod-manager.html");
      if (!response.ok) return;
      const html = await response.text();
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;
      document.body.appendChild(wrapper.firstElementChild);

      document.getElementById("mod-manager-close-btn").addEventListener("click", () => this.close());
      document.getElementById("mod-manager-modal").addEventListener("click", (e) => {
        if (e.target.id === "mod-manager-modal") this.close();
      });
    }
  },

  async open() {
    await this.init();
    if (!FS.isInitialized) await FS.init();
    const modal = document.getElementById("mod-manager-modal");
    if (!modal) return;
    modal.style.display = "flex";
    requestAnimationFrame(() => modal.classList.add("show"));
    await this.loadInstalledMods();
  },

  close() {
    const modal = document.getElementById("mod-manager-modal");
    if (!modal) return;
    modal.classList.remove("show");
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  },

  async loadInstalledMods() {
    const mods = await FS.getInstalledMods();
    this.render(mods);
  },

  render(mods) {
    const container = document.getElementById("mod-manager-modal-body");
    if (!container) return;
    
    container.innerHTML = "";

    if (mods.length === 0) {
      container.innerHTML = `<div class="empty-mods-state">No mods installed yet.</div>`;
      return;
    }

    const gridContainer = document.createElement("div");
    gridContainer.className = "mod-manager-grid";

    mods.forEach(mod => {
      const card = document.createElement("div");
      card.className = "mod-manager-card";
      card.innerHTML = `
        <div class="mod-manager-info">
          <h3>${mod.name}</h3>
          <p>Engine: ${mod.engineId || "Unassigned"}</p>
        </div>
        <button class="mod-manager-delete-btn" data-id="${mod.id}">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;

      const deleteBtn = card.querySelector(".mod-manager-delete-btn");
      deleteBtn.addEventListener("click", async () => {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
        await FS.removeInstalledMod(mod.id);
        await this.loadInstalledMods();
      });

      gridContainer.appendChild(card);
    });
    
    container.appendChild(gridContainer);
  }
};