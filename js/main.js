import { initLang, getLang, setLang, onLangChange } from "./i18n.js";
import { renderRoute } from "./router.js";

initLang();

function render() {
  const app = document.getElementById("app");
  renderRoute(app);
  const sel = document.getElementById("lang-select");
  if (sel) sel.value = getLang();
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  const sel = document.getElementById("lang-select");
  if (sel) sel.addEventListener("change", e => { setLang(e.target.value); render(); });
  render();
});
onLangChange(() => render());
