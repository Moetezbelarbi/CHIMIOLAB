import { t } from "./i18n.js";
import { APP_NAME, AUTHOR } from "./config.js";

function escapeHtml(str) {
  if (typeof str !== "string") return String(str ?? "");
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

export function buildReport(data) {
  // Supprime un ancien conteneur de rapport s'il existe
  const old = document.getElementById("chimiolab-print-container");
  if (old) old.remove();

  const container = document.createElement("div");
  container.id = "chimiolab-print-container";
  container.className = "print-only-report";

  let html = `
    <div class="report-header">
      <h1>${escapeHtml(t("report.title"))} — ${escapeHtml(APP_NAME)}</h1>
      <div class="report-meta">
        <p><strong>${escapeHtml(t("report.activity"))} :</strong> ${escapeHtml(data.activityTitle || "")}</p>
        <p><strong>${escapeHtml(t("report.date"))} :</strong> ${escapeHtml(new Date().toLocaleDateString())} à ${escapeHtml(new Date().toLocaleTimeString())}</p>
        <p><strong>${escapeHtml(t("app.author"))} :</strong> ${escapeHtml(AUTHOR)}</p>
      </div>
    </div>
  `;

  if (data.inputs && data.inputs.length) {
    html += `<h2>Paramètres expérimentaux</h2><table class="report-table"><thead><tr><th>Paramètre</th><th>Valeur</th></tr></thead><tbody>`;
    data.inputs.forEach(i => {
      html += `<tr><td>${escapeHtml(i.label)}</td><td><strong>${escapeHtml(i.value)}</strong></td></tr>`;
    });
    html += `</tbody></table>`;
  }

  if (data.graphImg) {
    html += `<h2>${escapeHtml(t("report.graph"))}</h2>
      <div class="report-graph-wrap"><img src="${data.graphImg}" alt="Graphique expérimental" style="max-width:100%; border:1px solid #cbd5e1; border-radius:8px;"></div>`;
  }

  if (data.table && data.table.headers && data.table.rows) {
    html += `<h2>${escapeHtml(t("report.measures"))}</h2><table class="report-table"><thead><tr>`;
    data.table.headers.forEach(h => { html += `<th>${escapeHtml(h)}</th>`; });
    html += `</tr></thead><tbody>`;
    data.table.rows.forEach(row => {
      html += `<tr>`;
      row.forEach(cell => { html += `<td>${escapeHtml(cell)}</td>`; });
      html += `</tr>`;
    });
    html += `</tbody></table>`;
  }

  if (data.conclusion) {
    html += `<h2>${escapeHtml(t("report.conclusion"))}</h2><div class="report-conclusion">${data.conclusion}</div>`;
  }

  container.innerHTML = html;
  document.body.appendChild(container);

  // Déclenche l'impression native sans blocage popup
  window.print();
}
