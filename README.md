# Svensson.design

Personligt CV och portfolio för [www.svensson.design](https://www.svensson.design/). Sidan publiceras med GitHub Pages.

Sidan är statisk och har inga externa bygg- eller UI-beroenden. Datumintervall, mobilnavigation, kontaktformulär och valfri analys-samtyckeshantering ligger i lokal JavaScript.

## Lokal kontroll

    npm run build
    npm test
    npm run serve

Öppna sedan http://127.0.0.1:8000/.

## Publicering

GitHub Pages publicerar från roten på master. Kontrollera alltid desktop, mobil, formulärvalidering och att statistik inte laddas före samtycke innan en ändring pushas.

## Verktyg och produktsidor

Sex Gumroad-produkter har statiska svenska sidor under `/verktyg/` och engelska under `/tools/`. Redigera det publika innehållet i `data/tools.json` och kör `npm run build`. Bygget uppdaterar guider, kataloger, produktsidor och den gemensamma sitemapen. Startsidan länkar till alla svenska produktsidor.

Priser och produktlöften kommer från de publicerade Gumroad-sidorna (verifierade 7 september 2026). Priser, licens och 30 dagars återbetalningspolicy ska kontrolleras på nytt om erbjudandet ändras. Köp sker hos Voxlessa på Gumroad. UTM-parametrarna skiljer sida, språk och placering; Gumroads särskilda länkanalys kräver även skapade länkar i Analytics → Links.

ShotLattices offentliga demo är den befintliga begränsade utvärderingsversionen: en bild, ett språk och ett porträttformat. Den är märkt noindex och dess CSP blockerar nätverksanrop. Fullproduktens START.html, källprojekt och kund-ZIP publiceras inte här. Exempelpaketet innehåller bara tre faktiska PNG-exporter från ett fiktivt projekt och en kort README. Genomgången är en 40 sekunder lång stegvis video med verkliga demobilder och svenska/engelska undertexter.

Sidorna har självrefererande canonical, ömsesidiga hreflang, HTML-länkar och SoftwareApplication-data med rätt pris. Inga recensioner eller betyg hittas på. Teknisk indexerbarhet är separat från faktisk indexering, som behöver följas i Google Search Console.

## Guider och fria resurser

[Guidebiblioteket](https://www.svensson.design/guides/) innehåller praktiska arbetsflöden och nedladdningar som kan användas fristående:

- [App Store-skärmbilder på Mac](https://www.svensson.design/guides/app-store-screenshots-mac/)
- [Språkversioner av skärmbilder med CSV](https://www.svensson.design/guides/localize-app-store-screenshots-csv/)
- [Checklista för kundöverlämning](https://www.svensson.design/guides/website-handover-checklist/)
- [Ifyllt exempel på webbplatsöverlämning](https://www.svensson.design/guides/website-handover-example/)

De fyra guiderna är på engelska och har inga påhittade svenska språkvarianter. Innehållet finns i `data/guides-*.json`; HTML byggs av `scripts/build-guides.mjs`. Publicerings- och uppdateringsdatum ska motsvara faktiska innehållsändringar. Nedladdningar under `guides/assets/` innehåller bara fria mallar och tydligt fiktiva exempel, aldrig den betalda applikationen eller kunddata.

## Sitemap och separata projekt

`scripts/build-sitemap.mjs` äger hela sitemapen. `data/external-pages.json` listar de åtta PkgLift-adresser som publiceras av det separata PkgLift-projektet på samma domän. Samtliga kontrollerades 7 september 2026: HTTP 200, självrefererande canonical, ingen noindex. Kontrollera dem igen när projektets sidstruktur ändras. Ändra PkgLifts innehåll i rätt projekt, inte i denna webbplats.

Sitemapen har 28 adresser och inkluderar inga demos, resursfiler eller lokala QA-sidor. Det valfria `lastmod` utelämnas för att ett nytt bygge inte ska påstå att oförändrat innehåll har uppdaterats.
