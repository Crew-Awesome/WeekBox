import { FS } from "../../utils/filesystem.js";

export function loadModCardImage({
  mod,
  card,
  fetchDetails,
  applyDominantColor,
}) {
  const image = card.querySelector(".mod-manager-cover");
  const finishLoading = (hasCover) => {
    if (!card.isConnected) return;
    card.classList.remove("is-cover-loading");
    card.classList.toggle("has-cover", hasCover);
    card.classList.toggle("has-no-cover", !hasCover);
  };
  Promise.resolve()
    .then(async () => {
      const localCover = await FS.ensureModCover(mod.id, async () => {
        const details = await fetchDetails(mod.id, {
          includeRequirements: false,
        });
        const imageUrl = details?.images?.[0];
        return imageUrl === "assets/icons/launcher-icon.png" ? null : imageUrl;
      });
      return localCover;
    })
    .then((localCover) => {
      if (!localCover || !image) {
        finishLoading(false);
        return;
      }
      const preload = new Image();
      preload.addEventListener("load", () => {
        if (!card.isConnected) return;
        image.src = localCover;
        image.hidden = false;
        applyDominantColor(image, card);
        requestAnimationFrame(() => finishLoading(true));
      });
      preload.addEventListener("error", () => finishLoading(false));
      preload.src = localCover;
    })
    .catch(() => finishLoading(false));
}
