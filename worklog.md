---
Task ID: seo-aeo-geo-conversion
Agent: Main Agent
Task: Add SEO, AEO, GEO, and Conversion Optimization to Keevan Store

Work Log:
- Created dynamic sitemap.ts at /src/app/sitemap.ts that auto-generates from Supabase (real) or mock data
- Updated robots.txt with proper allow/disallow rules and sitemap reference
- Created About/How It Works page at /src/app/about/page.tsx with FAQ schema, Organization schema, pricing section, creator journey, buyer journey
- Refactored /store/[username]/page.tsx from client component to server component with generateMetadata + JSON-LD (ProfilePage + FAQPage schemas)
- Created /store/[username]/store-page-client.tsx as the interactive client component
- Refactored /store/[username]/[slug]/page.tsx from client component to server component with generateMetadata + JSON-LD (Product + Event schemas)
- Created /store/[username]/[slug]/product-page-client.tsx as the interactive client component
- Enhanced root layout.tsx with Organization schema, template-based titles, enhanced OG/Twitter metadata, canonical URLs, robots directives
- Updated homepage with FAQ section (FAQPage schema), GEO-optimized statements, About link in nav
- Added metadata to auth pages via (auth)/layout.tsx (robots: noindex)
- Added metadata to payment pages via payment/layout.tsx (robots: noindex)
- Enhanced payment success page with next-action CTAs (visit store, browse more, become a creator)
- Enhanced payment cancel page with clearer guidance and support link
- Enhanced dashboard with dynamic next-action card based on creator state (no products → add product, no views → share link, no sales → get first sale, has balance → withdraw)
- Added share store link card to dashboard
- Fixed R2 module naming conflict (getSignedUrl → getPresignedUrl import alias)
- Added semantic HTML (nav, section, aria-labels, main, footer) across pages
- Added canonical URLs to all public pages
- Added conversational headings and FAQ sections on store pages for AEO
- Added "What you get" checklists on product pages for scannable info

Stage Summary:
- Build passes with 0 errors
- All 34 routes compile successfully
- sitemap.xml auto-generates with static + dynamic pages
- robots.txt properly restricts private routes, allows public routes
- JSON-LD schemas: Organization (root), FAQPage (homepage + about + store), ProfilePage (store), Product (product pages), Event (event product pages)
- OG/Twitter metadata on all public pages with canonical URLs
- Both user journeys mapped with clear next-action CTAs and no dead ends
- Empty states guide action (add product, share link, withdraw earnings)
