# 部署步驟

## 前置需求
安裝 Node.js（https://nodejs.org），然後安裝 Wrangler：

```bash
npm install -g wrangler
wrangler login
```

## 1. 建立 D1 資料庫（如果還沒建立）
```bash
wrangler d1 create my-database
```
記下輸出的 `database_id`。

## 2. 建立資料表
```bash
wrangler d1 execute my-database --remote --file=schema.sql
```

> 若你是「既有」資料庫升級（之前已經執行過舊版 schema.sql），還需要額外執行：
> ```bash
> wrangler d1 execute my-database --remote --file=schema_update_admin.sql
> wrangler d1 execute my-database --remote --file=schema_update_share.sql
> wrangler d1 execute my-database --remote --file=schema_update_quota.sql
> ```
> 全新安裝的話，新版 schema.sql 已經包含所有欄位，不需要再執行這些檔案。
>
> ⚠️ **這次改版有新增欄位**（容量上限、保留天數、檔案大小），
> 從舊版升級**一定要**執行 `schema_update_quota.sql`，否則上傳與清單會出錯。
> 這支腳本也會自動用 base64 長度回推舊檔案的大小，不用手動補。

## 3. 部署 Pages 專案
在 my-project 資料夾內：
```bash
wrangler pages deploy . --project-name=my-project
```
第一次執行會問你要不要建立新專案，選是即可。部署成功後會拿到一個 `https://my-project.pages.dev` 網址。

## 4. 綁定 D1 到 Pages 專案
到 Cloudflare Dashboard → Workers 和 Pages → 你的專案 → Settings → Functions →
D1 database bindings → 新增：
- Variable name: `DB`
- D1 database: 選你剛建立的資料庫

## 5. 設定 Session 密鑰（很重要）
這是用來簽署登入 session 的密鑰，務必設定成一組隨機長字串：
```bash
wrangler pages secret put SESSION_SECRET --project-name=my-project
```
系統會提示你輸入密鑰內容，貼上一串隨機字元即可（例如用密碼產生器產生 32 碼以上的亂數字串）。

## 6. 綁定/密鑰設定完成後，重新部署一次讓設定生效
```bash
wrangler pages deploy . --project-name=my-project
```

## 7. 開始使用

### 7-1. 建立第一組管理員（只有第一次要做）
打開 `https://my-project.pages.dev/admin.html`。
資料庫裡一個帳號都沒有的時候，畫面會顯示「初次安裝 — 建立第一組管理員」表單，
填入帳號密碼按下建立即可。建立完成之後這個表單就會永久關閉，
之後再呼叫 `/api/setup` 一律回 403。

> 如果你是從舊版升級、資料庫裡已經有帳號了，這個表單不會出現，
> 直接用原本的管理員帳號登入即可。

### 7-2. 建立一般使用者
用管理員帳號登入後台 → 切到「使用者」分頁 → 「新增一般使用者」，
填入帳號和一組起始密碼即可。把帳號密碼交給對方。

### 7-3. 使用者登入
使用者打開首頁 `https://my-project.pages.dev`，用管理員給的帳密登入，
即可上傳、下載、分享、刪除自己的檔案，並在「變更密碼」區塊自行改密碼。

## 之後要更新程式碼
改完檔案後，在資料夾內重新執行：
```bash
wrangler pages deploy .
```
即可完成更新，不需要重新設定綁定或密鑰。

## 注意事項
- 檔案內容是以 base64 存進 D1，適合小檔案（建議在幾 MB 以內）。若要存放大型檔案，建議改用 Cloudflare R2。
- **已經沒有公開註冊功能**，`/api/register` 端點已移除。所有帳號一律由管理員在後台建立。
- 管理員「重置密碼」產生的隨機密碼只會顯示一次，請當場複製轉交。使用者拿到後可以自己改成好記的密碼。

---

# 本次改版內容

## 1. 拿掉未登入的「鎖住檔案清單」
後台未登入時只剩登入卡片，不再顯示那排遮蔽檔名的假清單。

## 2. 管理員可以瀏覽、下載、分享任何檔案
- 新增 `functions/api/admin/download.js`：管理員能下載任何人的檔案。
- 新增 `functions/api/admin/share.js`：管理員能替任何檔案產生 24 小時公開連結。
- 後台檔案清單每一列都有「下載 / 分享 / 刪除」，分享連結一樣會跳出可複製的視窗。
- 一般使用者的 `/api/download`、`/api/share` 維持原樣，仍然只能動自己的檔案。

## 3. 每位使用者可個別設定容量上限與自動刪除天數
- `users` 資料表新增 `quota_bytes`（容量上限，0 = 不限制）與
  `retention_days`（保留天數，0 = 永久保留）。
- 後台「使用者」分頁每個帳號旁邊多了「設定」按鈕，可隨時調整這兩個值；
  新增使用者時也能直接填。
- 使用者上傳時若會超過容量上限，會被擋下來並顯示已用／上限／這個檔案多大。
- 超過保留天數的檔案會自動刪除。Cloudflare Pages Functions 沒有排程功能，
  所以改成**每次有人瀏覽檔案清單或上傳檔案時順手清一次**
  （見 `functions/_lib/storage.js` 的 `purgeExpiredFiles`）。

## 4. 檔案大小顯示
- `files` 資料表新增 `size_bytes`，上傳時由 base64 內容換算後寫入。
- 後台檔案清單每個檔名下方顯示大小（例如 `100.0 MB`），
  卡片標題顯示「N 個，共 X MB」。
- 後台帳號清單顯示每人的「已用空間 / 上限」與檔案數量。
- 前台「我的檔案」每列顯示大小與上傳時間，上方多一條容量使用進度條
  （超過 80% 轉黃、95% 轉紅），旁邊標示幾天後自動刪除。

---

# 前幾版的改版內容

## 移除註冊功能
- 刪除 `functions/api/register.js`，帳號一律由管理員建立。
- 全新資料庫由 `functions/api/setup.js` 建立第一組管理員（只有 users 表為空時才放行）。

## 使用者可自行變更密碼
- `functions/api/change-password.js`，需先通過目前密碼驗證，新密碼至少 6 碼。

## 管理員可新增一般使用者
- `functions/api/admin/create-user.js`，建立 `is_admin = 0` 的帳號。

## 閒置 300 秒自動登出
- 前台與後台都有，倒數秒數即時顯示，剩 60 秒轉黃色提醒。

## 其他
- `functions/api/me.js`：首頁顯示真正的帳號名稱。
- session 過期會明確提示並退回登入畫面。

# 沿用的既有功能
1. **公開分享連結**：連結僅 24 小時內有效。
2. **使用者自行刪除檔案**。
3. **管理員可重置使用者密碼**（產生隨機密碼並顯示一次）。
4. **管理員可新增管理員**。
