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
打開 `https://my-project.pages.dev`：
1. 先點「註冊」建立一個帳號
2. 用該帳號登入
3. 登入後即可上傳/下載檔案

## 之後要更新程式碼
改完檔案後，在資料夾內重新執行：
```bash
wrangler pages deploy .
```
即可完成更新，不需要重新設定綁定或密鑰。

## 注意事項
- 檔案內容是以 base64 存進 D1，適合小檔案（建議在幾 MB 以內）。若要存放大型檔案，建議改用 Cloudflare R2。
- `functions/api/register.js` 目前任何人都能自行註冊，正式使用時建議加上邀請碼機制，或部署後直接刪除該端點改由你手動用 D1 指令新增帳號。

## 本次新增功能
1. **公開分享連結**：在「我的檔案」清單點「分享」，會產生一個不需登入即可下載的連結，連結**僅 24 小時內有效**，過期後自動失效（每次點分享都會重新產生新連結、重設 24 小時效期）。
2. **使用者自行刪除檔案**：在「我的檔案」清單點「刪除」即可刪除自己上傳的檔案。
3. **管理員可重置使用者密碼**：管理員後台每個帳號旁多了「重置密碼」按鈕，系統會自動產生一組新密碼並顯示一次，請自行複製轉交給使用者。
4. **管理員可新增管理員**：管理員後台新增一個表單，可直接建立新的管理員帳號。
5. **管理員後台閒置 300 秒自動登出**：管理員登入後，若 5 分鐘（300 秒）內沒有任何滑鼠、鍵盤或觸控操作，會自動登出並回到登入畫面。
