# AL HAMD CLINICAL LABORATORY — Shuru karne ka tareeqa (Start here)

Yeh system JAMEEL CLINICAL LABORATORY wale system jaisa hai (saare features wahi hain), lekin
naam, logo, rang aur design alag hain. **Is ka database aur image storage bilkul alag hoga** —
Jameel ka koi data, password ya key is folder mein nahi hai.

## Aap ko 4 cheezein naye siray se banani hain

| # | Kya | Kahan | Note |
|---|---|---|---|
| 1 | **Firebase project** (database + login) | console.firebase.google.com | Naam maslan `al-hamd-clinical-laboratory` |
| 2 | **Cloudinary account** (logo / tasweeren) | cloudinary.com | Free plan kaafi hai |
| 3 | **GitHub repository** (code rakhne ke liye) | github.com | Private rakhein |
| 4 | **2 Vercel projects** (website + server) | vercel.com | `alhamd-lab` aur `alhamd-lab-api` |

### 1. Firebase
1. Naya project banayein.
2. **Firestore Database** → Create (location: asia-south1 ya qareeb).
3. **Authentication** → Sign-in method → **Email/Password** on karein.
4. Project settings → **Service accounts** → *Generate new private key* → JSON file download hogi.
   Yeh file **kisi ko na bhejein, GitHub par na daalein.**
5. Project settings → General → **Web app** add karein → `apiKey`, `authDomain`, `projectId`, `appId` milenge (website ke liye).
6. Firestore rules aur indexes: `firebase/` folder (`firebase deploy --only firestore`). Agar project ka naam
   `al-hamd-clinical-laboratory` nahi to `firebase/.firebaserc` mein apna project id likhein.

### 2. Cloudinary
Dashboard se **Cloud name, API key, API secret** lein (secret sirf server/Vercel mein jayega).

### 3–4. GitHub + Vercel
Poori tafseel: [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md) (server pehle, phir website).

- **Server (`backend`)** ke variables: `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`,
  `FIREBASE_SERVICE_ACCOUNT` (poori JSON file ka text), `CORS_ORIGINS`, `REPORT_VERIFY_BASE_URL`
  (`https://<website>/verify`), `CLOUDINARY_*`, `CRON_SECRET`, `LAB_TIMEZONE=Asia/Karachi`.
- **Website (`frontend`)** ke variables: `NEXT_PUBLIC_API_URL` (`https://<server>/api/v1`) aur
  `NEXT_PUBLIC_FIREBASE_*` (step 1.5 wale).
- Firebase → Authentication → Settings → **Authorized domains** mein website ka address add karein.

### 5. Pehla Super Admin
Firebase Authentication mein apna email/password user banayein, phir ek dafa:
```
cd backend
npm run bootstrap:admin -- --email aap@email.com --name "Aap ka Naam"
```
Baaqi staff ke account website ke **Staff & roles** se banayein.

### 6. Pehli dafa website kholne ke baad
- **Settings** mein lab ka address, phone, report par signatures (doctor / technologist ke naam) likhein.
- **Test catalogue** mein qeematein aur normal ranges approve karein.
- Tagline (naam ke neeche ki chhoti line) Settings se rakh ya hata sakte hain.

## Computer par chala kar dekhna (demo, bina database)
```
cd backend  && set DATA_BACKEND=memory&& set AUTH_MODE=dev&& set SEED_DEMO_DATA=true&& npm run start:dev
cd frontend && set NEXT_PUBLIC_AUTH_MODE=dev&& npm run dev
```
Phir http://localhost:3000 kholein (demo data save nahi hota).

## Kya alag hai Jameel se
- **Naam / logo**: AL HAMD CLINICAL LABORATORY, naya gol logo (sabz + sunehra, aath-kone sitara aur flask), print ke liye kaala version.
- **Rang**: emerald sabz + sunehra, safed "kaghaz" jaisa background (Jameel: neela / dark).
- **Design**: upar sabz header + menu bar (Jameel: baayein taraf dark sidebar), naye fonts, saaf solid cards, naya sign-in page.
- **Numbers**: MR number `AHL-…` se shuru.
- **Tez**: shisha-blur aur bhaari animation hata diye — purane computers par bhi tez chalta hai.
- **Hifazat**: wahi — server par har kaam ki ijazat check hoti hai, koi secret website mein nahi, QR report sirf poori payment ke baad.
