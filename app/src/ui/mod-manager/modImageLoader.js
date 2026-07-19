export function loadModCardImage({
  mod,
  card,
  fetchDetails,
  getBase64FromUrl,
  applyDominantColor,
}) {
  const imageUrl = mod.imageBase64 || mod.image;
  const source = imageUrl
    ? Promise.resolve(imageUrl)
    : fetchDetails(mod.id).then((details) => details?.images?.[0] || null);

  source
    .then((url) => (url && !mod.imageBase64 ? getBase64FromUrl(url) : null))
    .then((base64) => {
      if (!base64) return;
      mod.imageBase64 = base64;
      const image = card.querySelector(".mod-manager-cover");
      if (!image) return;
      image.src = base64;
      applyDominantColor(image, card);
    })
    .catch(() => {});
}
