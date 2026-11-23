# Old site inventory – wmart.co.in

What the current WordPress/WooCommerce site does, page by page, checked on 18 Nov 2026.
Goal: **same features, new design, same colours.** Use this as the checklist for the rebuild.

## Brand colours and font

| Token | Value | Used for on the old site |
|---|---|---|
| Brand orange | `#F97234` | Logo "Mart", hero "Buy Now" button, sale prices, links on hover |
| Action blue | `#1C61E7` | "Add To Cart" and other main buttons |
| Accent yellow | `#FBBC34` | Star ratings, highlights |
| Title text | `#242424` / `#333333` | Headings, product titles |
| Body text | `#767676` | Paragraphs, secondary text |
| Light grey | `#F7F7F7` / `#F4F4F4` | Section and footer backgrounds, default buttons |
| Sale badge | `#242424` with white text | "-50%" badge on product images |
| Success / warning | `#459647` / `#E0B252` | Notices ("Added to cart", warnings) |
| Font | **Albert Sans** 400 / 600 / 700 | Everything |
| Button shape | Fully rounded (35px radius) | All buttons |

These are set in `src/app/globals.css`.

## Pages and features

### 1. Header (every page)
- Logo: "W" in black, "Mart" in orange.
- Desktop layout: grey top bar "FREE SHIPPING FOR ALL ORDERS" (left) with Shipment Tracking and Contact Us (right); below it the logo, a dark rounded **Categories** button, a wide rounded search box with an orange search button, an orange-outline **Discounts** button, the account icon, and a dark round cart button with an orange item-count bubble.
- Search box with **live results while typing** (AJAX product search).
- Top links: Shipment Tracking (opens delhivery.com/tracking), Contact Us.
- **Categories mega-menu**: Batteries (Apple, Acer, Asus, HP, Dell, Lenovo), Adapters (Apple, Acer, Asus, HP, Dell, Lenovo, Samsung, Sony), Power Cable (Laptop, Desktop).
- Account icon, cart icon with item count, and a **mini-cart** side panel.
- Mobile: hamburger menu with "Menu" and "Categories" tabs, plus a **sticky bottom bar**: Cart, My account, Menu, Shop.
- Floating **WhatsApp "Need Help? Chat with us"** button (+91 78292 25000).

### 2. Home page
- Hero slider ("Shop great deals on Battery, Adapter and more – Save up to 50%").
- Hot Deals block with countdown timer.
- Product tabs: **Featured / Sale / New** products.
- "Popular in…" product carousels and a "Limited Offers" countdown block.
- Category and brand shortcuts.
- *Old demo leftovers to drop:* "CUSTOM TEXT", Audioengine speaker, Bosch washer, Mi screwdriver, "Appliances" / "Gaming" headings.

### 3. Shop (all products), category pages, brand pages
Same layout for all three (`/shop`, `?product_cat=dell-batteries`, `?product_brand=dell`):
- Breadcrumbs (Home / Laptop / Laptop Accessories / Laptop Batteries / Dell Batteries).
- Page title.
- **Sidebar filters**: Categories (accordion tree), Filter by price (slider), Brand, Color. On mobile they open from a "Show column" / filter button.
- **Sorting**: Default, Popularity, Average rating, Latest, Price low→high, Price high→low.
- **Products per page**: 9 / 12 / 18 / 24.
- **Grid columns switch**: 3 or 4 per row.
- Numbered pagination (about 319 pages × 12 ≈ 3,800 products; Dell brand ≈ 95 pages).
- Product card: image, **discount badge** (-50%), **HOT** badge for featured items, title, star rating + review count, MRP struck through, sale price, "18% GST Included", **Add To Cart** button (adds without leaving the page), **Quick view** popup.

### 4. Search results (`?s=hs04&post_type=product`)
- Same grid as the shop page. Matches titles and part numbers.

### 5. Product page
- Breadcrumbs, previous/next product arrows, "Back to products".
- **Image gallery** with click-to-enlarge / zoom and discount badge.
- Title, **promo box** ("Get 10% discount on online payment – code ONLINE10").
- Stock status ("100 in stock"), SKU.
- MRP, sale price, "18% GST Included".
- **Quantity selector** (− / +), **Add To Cart**, **Buy Now** (straight to checkout).
- Trust list: Pan India delivery · 100% tested · Secure payments · 1 Lakh+ orders delivered · 10 days easy returns · Easy replacement within warranty · 10-day money-back guarantee.
  - **New site:** the team confirmed a **10-day** return window, as on wmart.co.in and the wmartstore.in FAQ (only the wmartstore.in refund-policy page said 7). It is set once in `business.returnWindowDays` in `src/lib/site.ts`.
- **Specification table**: HSN code, brand, GTIN, product name/part, warranty.
- **Description**: compatible part numbers and compatible laptop models (long lists).
- **Reviews**: list + "write a review" form (login required).
- "You may also like" related products carousel.
- **Sticky add-to-cart bar** when scrolling down.

### 6. Cart (`?page_id=3134`)
- Line items with quantity change and remove, coupon code, totals, "Proceed to checkout".
- Empty state: "Your cart is currently empty" + "Return To Shop".

### 7. Checkout
- Billing/shipping address, order notes, coupon, place order.
- **Payment methods** (confirmed by the team):
  - **PayU** – the only online payment gateway. Customer is sent to PayU and returned to the order page. (ONLINE10 gives 10% off online payments.)
  - **Cash on Delivery (COD)** – order is placed straight away, paid to the Delhivery courier.
- **No GST number field** – customers cannot enter a GSTIN (confirmed).
- *(Exact checkout fields not yet seen – needs items in the cart.)*

### 8. My account (`?page_id=10`)
- **Login** (username or email + password, remember me, lost password).
- **Register** form.
- After login, breadcrumbs (Home / My account / Addresses), page title, and a **left sidebar menu** in a light-grey rounded panel, active item highlighted:
  - **Dashboard**
  - **Orders** – order list and order details
  - **Downloads** – standard WooCommerce section. No downloadable products today, so the new site keeps the menu item with a basic page: a list of the customer's files when there are any, otherwise "No downloads available yet" + "Browse products".
  - **Coupons** – the customer's available coupons
  - **Addresses** – separate **Billing address** and **Shipping address**, each with "Add / Edit"; empty state "You have not set up this type of address yet." Used by default at checkout.
  - **Account details** – name, email, change password
  - **Logout**

### 8a. Shipping
- **Delhivery is the only courier** (confirmed). "Shipment Tracking" links to delhivery.com/tracking.

### 9. Content pages
About Us, Contact Us, Terms and Condition, Shipping Policy, Privacy Policy, Refund & Exchange (order return policy).

### 10. Footer
- Address: F-517, 4th floor, F-Block, Sobo Center, South Bopal, Ahmedabad-380058 (Google Maps link).
- Phone 7829225000, support@wmart.co.in, WhatsApp chat link.
- Useful links (About, My account, policies) and popular categories.

## Problems on the old site (do not copy)
- **Pretty URLs are broken**: `/product-category/...`, `/contact-us/`, `/about-us/`, policy pages and `/my-account/` all show the home page instead. Only `?page_id=`, `?product_cat=` and `?product=` links work. (This is why the Apple Adapters link opens the home page.)
- "Asus Adapters" in the menu links to Acer adapters.
- "laptop accessories" in the menu links to Apple adapters.
- Leftover theme demo content on the home page.

The new site should 301-redirect all of these old URLs (both the broken pretty ones and the `?product_cat=` / `?product=` ones) to the new pages.

## Old → new URL map

| Old | New |
|---|---|
| `/` | `/` |
| `/shop/`, `?page_id=10886098`, `?post_type=product` | `/shop` |
| `?product_cat=<slug>`, `/product-category/.../<slug>/` | `/c/<slug>` |
| `?product_brand=<slug>` | `/brand/<slug>` |
| `?product=<slug>`, `/product/<slug>/` | `/p/<slug>` |
| `?s=<query>&post_type=product` | `/search?q=<query>` |
| `?page_id=3134` (cart) | `/cart` |
| `?page_id=10`, `/my-account/` | `/account` (and `/login`) |
| `/about-us/` | `/about` |
| `/contact-us/` | `/contact` |
| `/terms-and-condition/` | `/pages/terms` |
| `/shipping-policy/` | `/pages/shipping-policy` |
| `/privacy-policy/` | `/pages/privacy-policy` |
| `/order-return-policy/` | `/pages/refund-policy` |
