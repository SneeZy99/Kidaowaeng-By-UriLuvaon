# The Vault — ระบบคลังเงิน/ไอเทมสำหรับแก๊ง FiveM

Next.js (App Router) + Tailwind CSS + Firebase (Auth + Firestore realtime) + Discord OAuth2

รองรับ 25–30 ผู้ใช้ พร้อมระบบ **อนุมัติก่อนตัดยอดจริง** (deposit/withdraw ต้องผ่านหัวหน้าแก๊งก่อนยอดในคลังจะเปลี่ยน)

> **อัปเดตล่าสุด:** เพิ่มหน้า "สมาชิก" (ดูรายชื่อ, แอดมินแก้ role/ลบสมาชิกได้) และบังคับตั้งชื่อ-นามสกุล IC
> ก่อนใช้งานครั้งแรก — ไม่ต้องเพิ่มตัวแปร `.env` ใหม่ และไม่ต้อง deploy `firestore.rules` ใหม่ (ไม่มีการแก้กฎ)

---

## 1. โครงสร้างโปรเจกต์

```
app/
  login/page.tsx              หน้าล็อกอิน Discord
  login/complete/page.tsx     รับ custom token แล้ว sign-in Firebase
  dashboard/page.tsx          ยอดเงิน + คลังไอเทม + ประวัติ (ทุกคนเข้าได้)
  admin/page.tsx              อนุมัติ/ปฏิเสธคำขอ (เฉพาะ role=admin)
  members/page.tsx            รายชื่อสมาชิกทั้งหมด + แอดมินแก้ role/ลบสมาชิกได้
  onboarding/page.tsx         บังคับตั้งชื่อ-นามสกุล IC ก่อนใช้งานครั้งแรก
  api/auth/discord/route.ts            → redirect ไป Discord OAuth
  api/auth/callback/discord/route.ts   → แลก code, สร้าง/อัปเดต user, mint custom token
  api/transactions/[id]/approve/route.ts  → อนุมัติ (แก้ยอดแบบ atomic)
  api/transactions/[id]/reject/route.ts   → ปฏิเสธ
  api/users/me/ic-name/route.ts        → สมาชิกตั้งชื่อ IC ของตัวเอง
  api/users/[id]/role/route.ts         → แอดมินเปลี่ยน role สมาชิก
  api/users/[id]/remove/route.ts       → แอดมินลบ (ปิดสิทธิ์) สมาชิก
  api/users/[id]/restore/route.ts      → แอดมินกู้คืนสมาชิกที่เคยลบ
components/        UI components (Navbar, TreasuryPanel, InventoryPanel, ...)
lib/                firebase.ts (client), firebaseAdmin.ts (server), hooks.ts, types.ts
firestore.rules     กฎความปลอดภัยของ Firestore
```

**หลักการสำคัญ:** สมาชิกทั่วไปสร้างได้แค่เอกสาร `transactions` สถานะ `pending` เท่านั้น
ยอดใน `treasury`/`inventory` จะถูกแก้ไขก็ต่อเมื่อ API route ฝั่งเซิร์ฟเวอร์ (ใช้ Firebase Admin SDK
รัน Firestore transaction แบบ atomic) เท่านั้น — ป้องกันสมาชิกแก้ยอดเองผ่าน DevTools

---

## 2. เตรียม Firebase

1. ไปที่ [Firebase Console](https://console.firebase.google.com) → **Add project** → ตั้งชื่อโปรเจกต์
2. เปิดใช้งาน **Firestore Database**: เมนู Build → Firestore Database → Create database
   (เลือก mode "Production", เลือก region ใกล้ผู้ใช้ เช่น `asia-southeast1`)
3. เปิดใช้งาน **Authentication**: เมนู Build → Authentication → Get started
   → ไปที่แท็บ **Sign-in method** → เปิด **"Custom sign-in provider"** (ไม่ต้องเปิด Discord
   ที่นี่ เพราะ Firebase ไม่มี Discord provider ในตัว — โปรเจกต์นี้ใช้ **Custom Token** แทน
   โดยแลก OAuth code จาก Discord เองในฝั่งเซิร์ฟเวอร์แล้ว mint token ให้ Firebase)
4. สร้างเว็บแอป: Project settings (ไอคอนเฟือง) → General → "Your apps" → Add app → Web (`</>`)
   → คัดลอกค่าใน `firebaseConfig` มาใส่ตัวแปร `NEXT_PUBLIC_FIREBASE_*` ใน `.env`
5. สร้าง Service Account สำหรับฝั่งเซิร์ฟเวอร์: Project settings → **Service accounts**
   → **Generate new private key** → จะได้ไฟล์ JSON
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (คัดลอกทั้งหมดรวม `\n`, ใส่ในเครื่องหมายคำพูด)
6. Deploy กฎความปลอดภัยจากไฟล์ `firestore.rules` ที่แนบมาให้:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore   # เลือกโปรเจกต์ที่สร้างไว้, ใช้ไฟล์ firestore.rules ที่มีอยู่แล้ว
   firebase deploy --only firestore:rules
   ```
7. (ไม่บังคับ) สร้างเอกสารเริ่มต้น `treasury/main` ด้วยมือใน Firestore Console
   ให้มีฟิลด์ `cash: 0, redMoney: 0, bank: 0` — ถ้าไม่สร้างไว้ ระบบจะถือว่าเริ่มที่ 0
   และจะสร้างเอกสารนี้อัตโนมัติเมื่อมีการอนุมัติรายการครั้งแรก

---

## 3. เตรียม Discord OAuth2 App

1. ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**
   → ตั้งชื่อ (เช่น ชื่อแก๊ง)
2. เมนูซ้าย **OAuth2** → **General**:
   - คัดลอก **Client ID** → `DISCORD_CLIENT_ID`
   - กด **Reset Secret** เพื่อดู **Client Secret** → `DISCORD_CLIENT_SECRET` (เก็บเป็นความลับ ห้าม commit)
   - ที่ **Redirects** กด **Add Redirect** ใส่:
     - ตอน dev: `http://localhost:3000/api/auth/callback/discord`
     - ตอน production: `https://ชื่อโดเมนของคุณ/api/auth/callback/discord`
   - ใส่ค่าเดียวกันนี้ในตัวแปร `DISCORD_REDIRECT_URI`
3. หาว่าใครเป็นหัวหน้าแก๊ง (admin): เปิด Discord → Settings → Advanced → เปิด **Developer Mode**
   → คลิกขวาที่ชื่อสมาชิกที่ต้องการให้เป็น admin → **Copy User ID**
   → ใส่ ID เหล่านั้น (คั่นด้วยจุลภาค) ใน `ADMIN_DISCORD_IDS`
   (ระบบจะเช็ค role นี้ตอนล็อกอินทุกครั้ง — เพิ่ม/ลบ admin ได้โดยแก้ env แล้ว deploy ใหม่)

---

## 4. ติดตั้งและรัน

```bash
npm install
cp .env.example .env      # แล้วกรอกค่าตามขั้นตอนข้างบน
npm run dev
```

เปิด `http://localhost:3000` → ระบบจะพาไปหน้า `/login` → กด "เข้าสู่ระบบด้วย Discord"

**Deploy จริง:** แนะนำ [Vercel](https://vercel.com) — import repo แล้วใส่ environment variables
ชุดเดียวกับ `.env` ในหน้า Project Settings → Environment Variables (อย่าลืมอัปเดต
`DISCORD_REDIRECT_URI` และ redirect ใน Discord Developer Portal ให้เป็นโดเมนจริง)

---

## 5. การใช้งาน

- **สมาชิก**: หน้า Dashboard เห็นยอดเงิน/ไอเทม กดปุ่ม "ฝาก" หรือ "เบิก" → กรอกจำนวน → ส่งคำขอ
  (ยอดยังไม่เปลี่ยนจนกว่าแอดมินจะอนุมัติ)
- **หัวหน้าแก๊ง (admin)**: เห็นเมนู "อนุมัติรายการ" เพิ่มขึ้นมา → กดอนุมัติ/ปฏิเสธคำขอแต่ละรายการ
  ระบบจะตัด/เติมยอดให้อัตโนมัติแบบ atomic (ป้องกันยอดติดลบ/แข่งกันกดพร้อมกัน)
- แอดมินยังเพิ่ม **ไอเทมชนิดใหม่** เข้าคลังได้จากปุ่ม "+ เพิ่มไอเทมใหม่เข้าคลัง" ในหน้า Dashboard
- **ล็อกอินครั้งแรก**: ทุกคน (รวมแอดมิน) ต้องตั้ง **ชื่อ-นามสกุล IC** ก่อน ถึงจะเข้าหน้า Dashboard/Members/Admin ได้
  ชื่อนี้จะถูกใช้แสดงแทนชื่อ Discord ในทุกที่ (ประวัติรายการ, รายชื่อสมาชิก, มุมขวาบน)
- **หน้า "สมาชิก"**: ทุกคนดูรายชื่อสมาชิกทั้งหมดได้ (ชื่อ IC, Discord username, วันที่เข้าร่วม, role)
  แอดมินมีสิทธิ์เพิ่มเติม:
  - เปลี่ยน role สมาชิก ↔ หัวหน้าแก๊ง ได้จาก dropdown (สั่งได้ทันที ระบบจะบังคับให้เซสชันเดิมของคนนั้นหมดอายุ
    เพื่อให้สิทธิ์ใหม่มีผลจริง)
  - **ลบสมาชิกออกจากเว็บ**: เป็นการ "ปิดสิทธิ์" ไม่ใช่ลบข้อมูลถาวร — ชื่อยังคงอยู่ในประวัติรายการเก่า
    แต่บัญชี Discord นั้นจะล็อกอินกลับเข้ามาไม่ได้อีกจนกว่าจะกด "กู้คืน"
  - แอดมินเปลี่ยน role หรือลบตัวเองไม่ได้ (กันบัญชีตัวเองถูกล็อก)

---

## 6. Deploy ทับของเดิมด้วย Git + Vercel

ถ้ามี repo และเชื่อม Vercel ไว้แล้ว (auto-deploy เมื่อ push เข้า branch หลัก) ให้ก็อปไฟล์ที่แก้/เพิ่ม
ทับของเดิมในเครื่อง แล้วรันตามนี้:

```bash
git add -A
git commit -m "feat: members page, role/remove management, force IC name onboarding"
git push origin main   # หรือชื่อ branch ที่ Vercel ตั้ง auto-deploy ไว้
```

Vercel จะ build/deploy ให้อัตโนมัติหลัง push (ดูสถานะได้ที่แท็บ Deployments ใน Vercel dashboard)
ไม่ต้องตั้งค่า environment variable เพิ่มเติม เพราะฟีเจอร์ใหม่ใช้ค่าที่มีอยู่แล้วทั้งหมด

---

## 7. หมายเหตุด้านความปลอดภัย

- ค่าที่ขึ้นต้นด้วย `NEXT_PUBLIC_` เท่านั้นที่ปลอดภัยจะฝังในโค้ดฝั่งเบราว์เซอร์
- `FIREBASE_PRIVATE_KEY`, `DISCORD_CLIENT_SECRET`, `ADMIN_DISCORD_IDS` **ต้องอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น**
  ห้าม commit ไฟล์ `.env` ขึ้น git (มี `.gitignore` กันไว้ให้แล้ว)
- role "admin" ถูกฝังเป็น custom claim ใน Firebase ID token ตอนล็อกอิน และ Firestore
  Security Rules (`firestore.rules`) จะเช็ค claim นี้อีกชั้นสำหรับการเขียนข้อมูลที่ละเอียดอ่อน
