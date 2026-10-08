# Contact form setup (works on GitHub Pages, no server needed)

GitHub Pages only hosts static files, so a page can't write a file by itself. Use ONE of the two free options below.
Open `contact.html`, find the two lines near the bottom and paste your value:

```js
var WEB3FORMS_KEY = '';   // option A
var SHEETS_URL   = '';    // option B
```

(If both stay empty, the form opens the visitor's email app, so nothing is lost.)

---

## Option A: Web3Forms (easiest, 2 minutes)

1. Go to https://web3forms.com and enter your email (senthilbalan.smi@gmail.com). They email you an **Access Key**.
2. Paste it into `WEB3FORMS_KEY`.
3. Every enquiry now arrives in your inbox, and you can view/export them (CSV/JSON) in the Web3Forms dashboard. Free plan: 250 submissions a month.

## Option B: Google Sheet (every enquiry becomes a row you own, exportable as JSON)

1. Create a new Google Sheet. In row 1 type these headings: `Received | Name | Phone | Email | Message | Page`
2. Menu **Extensions > Apps Script**. Delete the sample code and paste:

```js
var SECRET = 'change-this-secret';              // used only to read the data back as JSON

function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var clean = function (v, n) { return String(v || '').slice(0, n); };
  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().appendRow([
    new Date(), clean(d.name, 120), clean(d.phone, 40), clean(d.email, 160), clean(d.message, 3000), clean(d.page, 200)
  ]);
  // email alert for every new enquiry (remove these 5 lines if you do not want it)
  MailApp.sendEmail({
    to: 'senthilbalan.smi@gmail.com',
    subject: 'New website enquiry from ' + clean(d.name, 60),
    body: 'Name: ' + clean(d.name, 120) + '\nPhone: ' + clean(d.phone, 40) + '\nEmail: ' + clean(d.email, 160) + '\n\n' + clean(d.message, 3000)
  });
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

// Optional: open  YOUR_WEB_APP_URL?key=change-this-secret  to get every enquiry as JSON
function doGet(e) {
  if (!e.parameter || e.parameter.key !== SECRET) return ContentService.createTextOutput('Unauthorized');
  var rows = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getDataRange().getValues();
  var head = rows.shift().map(function (h) { return String(h).toLowerCase(); });
  var list = rows.map(function (r) { var o = {}; head.forEach(function (h, i) { o[h] = r[i]; }); return o; });
  return ContentService.createTextOutput(JSON.stringify(list, null, 2)).setMimeType(ContentService.MimeType.JSON);
}
```

3. Click **Deploy > New deployment > type: Web app**. Set *Execute as*: **Me**, *Who has access*: **Anyone**. Deploy and allow the permissions.
4. Copy the **Web app URL** (ends with `/exec`) into `SHEETS_URL`.
5. The script above also emails you each enquiry. The first time you deploy, Google asks you to allow it to send mail: click *Advanced > Go to project > Allow*.

Note: change `SECRET` before deploying, and keep the URL+secret private if you use `doGet`.

---

## Enquiry dashboard (replaces the plain JSON link)

`apps-script/Code.gs` is the full script: it saves each enquiry, emails you, and serves a dashboard (totals, search, status filters, Call / WhatsApp / Email buttons, CSV export).

1. In Apps Script, delete everything and paste the whole of `apps-script/Code.gs`. Set your own `SECRET` at the top.
2. **Deploy > Manage deployments > pencil (Edit) > Version: New version > Deploy.** The web app URL stays the same.
3. Open `YOUR_WEB_APP_URL?key=YOUR_SECRET` to see the dashboard. Bookmark it. Add `&format=json` for raw JSON.
4. The Status column (G) is created automatically. Old rows count as "New".

---

## Publishing on GitHub Pages

1. Put the contents of the `Sri Maruthi Industries` folder in a GitHub repository (the folder with `index.html` should be the repo root).
2. Repo **Settings > Pages > Deploy from a branch > main / (root)**.
3. Your site appears at `https://<your-username>.github.io/<repo>/`. All links in the site are relative, so they work from that address.
