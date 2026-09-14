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
