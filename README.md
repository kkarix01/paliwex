# Paliwex – strona firmowa

Statyczna strona (HTML + CSS + czysty JavaScript) przygotowana do hostingu na **Cloudflare Pages**. Bez CMS, bez bazy danych, bez kroku budowania.

## Struktura

```text
├── index.html                 strona główna (wszystkie sekcje: #start, #oferta, #o-nas, #kontakt)
├── oferta/index.html          podstrona /oferta/   (sekcja #oferta)
├── o-nas/index.html           podstrona /o-nas/    (sekcja #o-nas + wyróżnienia)
├── kontakt/index.html         podstrona /kontakt/  (sekcja #kontakt + formularz #zapytanie)
├── polityka-prywatnosci/      szkic polityki prywatności (noindex – do uzupełnienia)
├── 404.html                   strona błędu (Cloudflare Pages użyje jej automatycznie)
├── css/style.css              wszystkie style; zmienne (kolory, odstępy, promienie) na górze pliku
├── js/main.js                 menu, karuzela, film, mapa, formularz; KONFIGURACJA na górze pliku
├── assets/images/             zoptymalizowane zdjęcia (WebP) i logotypy
├── assets/videos/             film promocyjny
├── assets/icons/              favicon, ikony (sprite.svg)
├── assets/fonts/              fonty Barlow / Barlow Condensed (lokalnie, bez Google Fonts)
├── apps-script/Code.gs        kod odbiornika formularza (Google Apps Script)
├── _headers                   nagłówki bezpieczeństwa i cache dla Cloudflare Pages
├── robots.txt, sitemap.xml
└── README.md
```

**Gdzie co zmieniać**

| Co | Gdzie |
|---|---|
| Adres formularza (Apps Script), adres mapy | `js/main.js` → obiekt `CONFIG` |
| Kolory, szerokość kontenera, odstępy | `css/style.css` → sekcja „2. Zmienne” |
| Teksty, telefony, e-maile | pliki `index.html` + odpowiednia podstrona |
| Domena (canonical, Open Graph, sitemap) | wyszukaj `https://www.paliwex.pl` we wszystkich plikach |

> Nagłówek, stopka i sekcje są powtórzone w plikach HTML (to celowe – każda strona działa samodzielnie, bez JavaScriptu i bez budowania). Zmieniając np. numer telefonu, użyj w VS Code **Edit → Replace in Files** (`Ctrl+Shift+H`), aby zmienić go wszędzie naraz.

---

## 1. Uruchomienie lokalne

Strona używa ścieżek od katalogu głównego (`/css/style.css`), więc trzeba ją otworzyć przez lokalny serwer, a nie dwuklikiem w plik.

Dowolna z opcji (w katalogu projektu):

```bash
python -m http.server 8000
# lub
npx serve .
```

Następnie otwórz <http://localhost:8000>. Możesz też użyć rozszerzenia VS Code **Live Server**.

## 2. Zdjęcia i filmy

Na stronie używane są pliki z `assets/`. Oryginały leżą w katalogu głównym i są pominięte w Git (`.gitignore`), żeby nie trafiły na hosting.

| Plik na stronie | Źródło | Gdzie |
|---|---|---|
| `paliwex-hero.webp`, `paliwex-hero-mobile.webp` | paliwex-hero.jpg | hero (desktop / telefon), galeria |
| `stacja-paliwex.webp` | stacja-paliwex.png | O nas |
| `paliwex-foto1.webp`, `paliwex-foto2.webp` | paliwex-foto1/2.jpg | galeria |
| `oferta-*.webp` | olej-b7, olej-b0, olej-opalowy, benzyna, zbiorniki (.png) | karty oferty |
| `award-*.png / .webp` | logotypy wyróżnień | pasek „Firma godna zaufania” |
| `og-image.jpg` | kadr z paliwex-hero.jpg (1200×630) | podgląd przy udostępnianiu linku |
| `videos/paliwex-promo.mp4` | Paliwex-Promo-Final.mp4 | kafelek z filmem |

**Wymiana zdjęcia:** zapisz nowy plik w `assets/images/` (najlepiej WebP, szerokość 900–1400 px, do ~150 KB) i podmień nazwę w HTML. Zachowaj atrybuty `width`/`height` zgodne z proporcjami pliku. Zdjęcie hero ustawione jest w `css/style.css` (sekcja „6. Hero”), kadrowanie zmienisz przez `background-position`.

**Film:** ok. 8 MB, 1280×720. Ładuje się dopiero, gdy użytkownik przewinie do niego stronę. Jeśli będziesz go wymieniać, wyeksportuj go z opcją „fast start” (`ffmpeg -i wejscie.mp4 -movflags +faststart -crf 26 wyjscie.mp4`).

**Uwaga:** zamiast `najlepsioferteo.svg` w folderze był plik `najlepsi-2023-kutno-300x300.webp` – użyto go jako logo „Najlepsi 2023 – Oferteo”. Jeśli masz wersję SVG, podmień `assets/images/award-najlepsi-oferteo.webp`.

## 3. Formularz (Google Apps Script + Arkusz Google)

Strona jest statyczna, więc formularz wysyła dane do zewnętrznego odbiornika: aplikacji Google Apps Script, która zapisuje zapytanie w Arkuszu Google i wysyła e-mail.

**Stan obecny:** `CONFIG.formEndpoint` w `js/main.js` jest pusty. Formularz sprawdza pola, ale **niczego nie wysyła** – po kliknięciu „Wyślij” pokazuje informację, że formularz jest w konfiguracji, oraz numer telefonu. Nie wyświetla fałszywego potwierdzenia.

### Uruchomienie

1. Utwórz nowy **Arkusz Google** (np. „Paliwex – zapytania”) na koncie firmowym.
2. W arkuszu: **Rozszerzenia → Apps Script**. Usuń przykładowy kod i wklej zawartość `apps-script/Code.gs`. Zapisz.
3. **Ustawienia projektu** (ikona koła zębatego) → **Właściwości skryptu** → dodaj:
   `NOTIFY_EMAIL` = adres, na który mają przychodzić zapytania (kilka adresów rozdziel przecinkiem).
4. **Wdróż → Nowe wdrożenie** → typ **Aplikacja internetowa**:
   - Wykonaj jako: **Ja** (konto właściciela arkusza),
   - Kto ma dostęp: **Każdy**.
   Zatwierdź uprawnienia (Google poprosi o dostęp do arkusza i wysyłania e-maili).
5. Skopiuj **adres aplikacji internetowej** (kończy się na `/exec`) i wpisz go w `js/main.js`:
   ```js
   formEndpoint: 'https://script.google.com/macros/s/XXXXXXXX/exec',
   ```
6. Wyślij zmiany do GitHuba (patrz punkt 8) – Cloudflare opublikuje je automatycznie.

### Test

1. Otwórz adres `/exec` w przeglądarce – powinien pokazać `{"ok":true,"status":"ready"}`.
2. Na stronie wypełnij formularz i wyślij. Sukces pojawi się **tylko**, gdy Apps Script odpowie `{"ok":true}`.
3. Sprawdź nowy wiersz w zakładce „Zapytania” i e-mail z powiadomieniem.
4. Błędy po stronie skryptu: Apps Script → **Wykonania**.

> Po każdej zmianie kodu w Apps Script trzeba utworzyć **nową wersję wdrożenia** (Wdróż → Zarządzaj wdrożeniami → Edytuj → Nowa wersja). Adres `/exec` się nie zmienia.

### Zabezpieczenia i ograniczenia

Już zastosowane:
- pole-pułapka (honeypot) i minimalny czas wypełnienia (3 s) – w przeglądarce i w Apps Script,
- walidacja i limity długości pól po stronie serwera,
- limit: 30 zapytań na 10 min łącznie i 3 na 10 min z jednego adresu e-mail,
- ochrona arkusza przed wstrzykiwaniem formuł,
- brak haseł i kluczy w kodzie strony – adres `/exec` jest publiczny z natury i nie jest sekretem.

Ograniczenia:
- Gmail na koncie Google ma dzienny limit wysyłanych e-maili (ok. 100/dzień na koncie prywatnym, więcej w Google Workspace),
- Apps Script odpowiada w 1–3 s, co jest normalne,
- honeypot zatrzymuje proste boty, ale nie zdeterminowany spam.

Zalecane w produkcji, jeśli pojawi się spam: **Cloudflare Turnstile** (darmowa, niewidoczna weryfikacja). Wymaga dodania widżetu do formularza i weryfikacji tokenu w Apps Script (`UrlFetchApp` do `https://challenges.cloudflare.com/turnstile/v0/siteverify`, klucz tajny w Właściwościach skryptu – nigdy w kodzie strony). Po dodaniu Turnstile dopisz `https://challenges.cloudflare.com` do `script-src` i `frame-src` w `_headers`.

## 4. Repozytorium GitHub

```bash
git init
git add .
git commit -m "Strona Paliwex"
git branch -M main
git remote add origin https://github.com/TWOJE-KONTO/paliwex.git
git push -u origin main
```

Repozytorium utwórz wcześniej na <https://github.com/new> (może być prywatne). `.gitignore` pomija oryginalne pliki graficzne z katalogu głównego oraz instalator Gita (65 MB – Cloudflare Pages nie przyjmuje plików powyżej 25 MB).

## 5. Połączenie z Cloudflare Pages

1. Panel Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**.
2. Wybierz repozytorium `paliwex`.
3. Ustawienia budowania:
   - Framework preset: **None**
   - Build command: **(puste)**
   - Build output directory: **/** (katalog główny repozytorium)
4. **Save and Deploy**. Strona będzie dostępna pod adresem `https://paliwex.pages.dev` (lub podobnym).

## 6. Automatyczne publikowanie

Po połączeniu z GitHubem każdy `git push` do gałęzi `main` publikuje nową wersję produkcyjną. Push do innej gałęzi tworzy wersję podglądową pod osobnym adresem – wygodne do sprawdzenia zmian przed publikacją. Historia wdrożeń i przycisk przywrócenia poprzedniej wersji (Rollback) są w zakładce **Deployments**.

## 7. Własna domena

1. Projekt w Cloudflare Pages → **Custom domains → Set up a custom domain** → wpisz `www.paliwex.pl`, potem dodaj też `paliwex.pl`.
2. Jeśli domena jest już w Cloudflare (DNS), rekordy zostaną dodane automatycznie. Jeśli nie, dodaj u obecnego dostawcy DNS rekord **CNAME** `www` → `paliwex.pages.dev` (dokładną wartość pokaże Cloudflare).
3. Przekierowanie `paliwex.pl` → `www.paliwex.pl`: Cloudflare → domena → **Rules → Redirect Rules** (lub odwrotnie, jeśli wolisz adres bez www – wtedy zmień `https://www.paliwex.pl` w plikach na wersję bez www).
4. Certyfikat HTTPS wystawi się automatycznie (do kilkunastu minut).
5. Dodaj stronę do **Google Search Console** i zgłoś `https://www.paliwex.pl/sitemap.xml`.

## 8. Aktualizacja strony

1. Wprowadź zmiany w VS Code i sprawdź je lokalnie (punkt 1).
2. Opublikuj:
   ```bash
   git add .
   git commit -m "Opis zmiany"
   git push
   ```
3. Po 1–2 minutach zmiana będzie na stronie. Pliki CSS/JS mają cache 1 h. Jeśli zmiana jest pilna, w Cloudflare: **Caching → Purge Everything**.

Zmieniając podstronę, zmień w `sitemap.xml` datę `<lastmod>`.

---

## Bezpieczeństwo

- `_headers` ustawia m.in. Content-Security-Policy, HSTS i blokadę osadzania strony w ramkach.
- CSP zezwala na mapę Google (`frame-src`) i wysyłkę do Apps Script (`connect-src`). Dodając nowe usługi zewnętrzne (np. analitykę), dopisz je w `_headers`.
- Jedyny skrypt w `<head>` (`document.documentElement.classList.add('js')`) jest dopuszczony przez hash w CSP. Jeśli go zmienisz, przelicz hash:
  `node -e "console.log(require('crypto').createHash('sha256').update(TREŚĆ).digest('base64'))"`.
- Plik `apps-script/Code.gs` jest publicznie dostępny pod adresem strony (Cloudflare publikuje całe repozytorium). Nie zawiera sekretów, więc to bezpieczne.

## Do uzupełnienia / zatwierdzenia przez firmę

- [ ] Opisy produktów w sekcji Oferta – neutralne, bez cen i parametrów; wymagają akceptacji.
- [ ] „Rok założenia 1991” w sekcji O nas – na podstawie napisu na cysternie; potwierdź.
- [ ] Polityka prywatności – szkic (`/polityka-prywatnosci/`, ustawiony jako noindex); uzupełnij pełną nazwę firmy, e-mail do spraw RODO i okres przechowywania danych, potem usuń `noindex`.
- [ ] Adres formularza (`CONFIG.formEndpoint`) – punkt 3.
- [ ] Domena w `canonical`, Open Graph i `sitemap.xml` – założono `https://www.paliwex.pl`.
- [ ] Mapa: domyślnie adres wyszukiwania Google Maps (`CONFIG.mapEmbedUrl`). Możesz go zastąpić oficjalnym kodem: Mapy Google → wyszukaj firmę → **Udostępnij → Umieść mapę** → skopiuj tylko wartość `src="…"`.
