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
> ```
> 全新安裝的話，新版 schema.sql 已經包含所有欄位，不需要再執行這兩個檔案。
>
> 這次改版**沒有**新增任何欄位，從舊版升級不需要動資料庫。

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

## 1. 移除註冊功能
- 刪除 `functions/api/register.js`。
- 首頁拿掉「註冊」表單與切換按鈕，只剩登入。
- 帳號改為全部由管理員建立。

## 2. 使用者可自行變更密碼
- 新增 `functions/api/change-password.js`（`POST /api/change-password`）。
- 必須先通過**目前密碼**驗證才能寫入新密碼，新密碼至少 6 碼、且不可與舊密碼相同。
- 首頁登入後最下方新增「變更密碼」區塊，需輸入兩次新密碼避免打錯。

## 3. 管理員可新增一般使用者
- 新增 `functions/api/admin/create-user.js`（`POST /api/admin/create-user`），建立 `is_admin = 0` 的帳號。
- 後台「使用者」分頁有「新增一般使用者」表單，密碼由管理員自行指定。
- 原本的「新增管理員」功能保留。

## 4. 管理員後台改成 HFS（rejetto）復古檔案伺服器風格
- 深色配色 + 凹凸邊視窗外框 + 等寬字的表格化目錄列表。
- 頂端有標題列、位置（路徑）列，底部有狀態列，右下角有 `hfs ~ http file server` 字樣。
- **未登入時顯示「鎖住」的檔案清單**：表格會列出一排帶 🔒 的項目，
  檔名以方塊字元遮蔽、權限欄寫「拒絕存取」，登入表單就放在清單下方。
  這些是**純佔位資料**，寫死在前端，不會向伺服器索取，也不會洩漏任何真實檔名；
  真正的清單要登入成功後才會透過 `/api/admin/files` 取得。
- 登入後分成「檔案」與「使用者」兩個分頁。
- 原本的 300 秒閒置自動登出保留，倒數移到底部狀態列顯示。

## 5. 其他小改進
- 新增 `functions/api/me.js`：首頁登入後會顯示**真正的帳號名稱**，
  不再是舊版的「（登入中）」。
- 新增 `functions/api/setup.js`：註冊功能移除後，全新資料庫需要一個建立第一組管理員的方式。
  只有在 `users` 資料表為空時才會放行，建立過一次之後就永久失效。
- 檔案清單、帳號清單為空時會顯示提示文字，不再是一片空白。
- session 過期時會明確提示「登入已過期，請重新登入」並退回登入畫面。

# 沿用的既有功能
1. **公開分享連結**：在「我的檔案」清單點「分享」，會產生一個不需登入即可下載的連結，連結僅 24 小時內有效。
2. **使用者自行刪除檔案**。
3. **管理員可重置使用者密碼**（產生隨機密碼並顯示一次）。
4. **管理員可新增管理員**。
5. **管理員後台閒置 300 秒自動登出**。
