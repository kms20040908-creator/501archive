# 501.archive

React + Vite storefront prototype.

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. The store admin is available at `/admin` (for example, `http://localhost:5173/admin`). On first access, create an admin password of at least 8 characters.

## Included in this version

- Left-side navigation drawer with MAIN, ALL ITEMS, TOP, BOTTOM, SHOES, ACCESSORIES, CONTACT.
- NEW ARRIVALS shows the four newest products.
- Product editor supports multiple photos, photo preview, ordering, and removing photos.
- Product detail view has photo navigation.
- Products can be switched between AVAILABLE and SOLD. SOLD products show `SOLD` in the price position and sort below available products.
- Responsive storefront and admin layout.

## Important before public launch

This is a front-end prototype. Product data, uploaded photos, and the admin password are stored in the current browser's local storage. Changes will not sync to other devices or visitors, and the password screen is not production-grade authentication. For a live store, connect a server database, cloud image storage, and server-side admin authentication (for example, Supabase) before publishing.
