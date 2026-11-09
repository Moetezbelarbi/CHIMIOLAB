import { t } from "./i18n.js";
import { APP_NAME, AUTHOR } from "./config.js";
export function buildReport(data) {
  const w = window.open("", "_blank");
  if (!w) return;
  const doc = w.document;
  doc.open();
  doc.write("<!doctype html><html><head><meta charset='utf-8'><title>" + t("report.title") + "</title>");
  doc.write("<style>body{font-family:system-ui,sans-serif;margin:2em;color:#222}h1{color:#1565C0}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#E3F2FD}</style>");
  doc.write("</head><body>");
  doc.write("<h1>" + t("report.title") + " — " + APP_NAME + "</h1>");
  doc.write("<p><strong>" + t("report.activity") + " :</strong> " + (data.activityTitle || "") + "</p>");
  doc.write("<p><strong>" + t("app.author") + " :</strong> " + AUTHOR + "</p>");
  doc.write("<p><strong>" + t("report.date") + " :</strong> " + new Date().toLocaleString() + "</p>");
  if (data.inputs && data.inputs.length) {
    doc.write("<h2>" + t("report.inputs") + "</h2><table><tr><th>Grandeur</th><th>Valeur</th></tr>");
    data.inputs.forEach(i => { doc.write("<tr><td>" + i.label + "</td><td>" + i.value + "</td></tr>"); });
    doc.write("</table>");
  }
  if (data.answer !== undefined) doc.write("<h2>" + t("report.answer") + "</h2><p>" + data.answer + "</p>");
  if (data.correction !== undefined) doc.write("<h2>" + t("report.correction") + "</h2><p>" + data.correction + "</p>");
  doc.write("</body></html>");
  doc.close();
  w.print();
}