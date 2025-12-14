# Dokumentácia – Loom Chat (VPWA)

## 1\. Zadanie

Cieľom semestrálneho projektu je vytvoriť progresívnu webovú aplikáciu (štýl IRC/Slack) pre textovú komunikáciu so skupinami (kanálmi), príkazmi v „command line“ vstupe, real-time komunikáciou, notifikáciami a správou stavov používateľov.

Aplikácia implementuje prípady použitia zo zadania: registrácia/prihlásenie, kanály (private/public), pozvánky, kick/ban (3 hlasy), /quit, /cancel, zmienky cez @nickname, history + infinite scroll, notifikácie iba keď app nie je „visible“, statusy online/DND/offline, typing indikátor a live draft preview.

## 2\. Použité technológie

### 2.1 Frontend

* Quasar Framework (Vue 3 + Vite)
* TypeScript
* Pinia (state management)
* Axios (HTTP)
* WebSocket (native browser WebSocket)

### 2.2 Backend

* AdonisJS 6 (TypeScript)
* @adonisjs/auth – **access tokens** (bearer token), nie JWT
* @adonisjs/lucid + better-sqlite3 (SQLite)
* ws (WebSocket server)
* adonisjs-scheduler (plánované úlohy)
* luxon (čas/dátumy)

## 3\. Spustenie aplikácie

### 3.1 Predpoklady

* Node.js 20+
* npm

### 3.2 Inštalácia

V root adresári:
npm install
npm run --prefix apps/api install
npm run --prefix apps/web install

### 3.3 Migrácie DB

V apps/api:
node ace migration:run

### 3.4 Development režim

Z root adresára:
npm run dev

* Frontend dev server: http://localhost:9000
* Backend HTTP API: http://localhost:3333
* WebSocket server: ws://localhost:3334

### 3.5 Produkčný build

Backend:
cd apps/api
npm run build
npm start



Frontend:
cd apps/web
npm run build

## 4\. Implementované prípady použitia

### 4.1 Autentifikácia

* **Registrácia**: POST /api/auth/register (backend AuthController.register)
* **Login**: POST /api/auth/login (backend AuthController.login)
* **Logout**: POST /api/auth/logout (backend AuthController.logout)
* **Aktuálny používateľ**: GET /api/auth/me

Token je typu bearer a je implementovaný cez Adonis access tokens (auth\_access\_tokens).

### 4.2 Kanály a členstvo

* **Zoznam kanálov používateľa**: GET /api/channels (vracia aj memberIds, unread, isInvited)
* **Verejné kanály**: GET /api/channels/public
* **/join channelName \[private]**:

  * Frontend parsuje príkaz v MessageComposer.vue
  * Backend: POST /api/channels/join
  * Ak kanál neexistuje, vytvorí sa a používateľ sa stane owner.
  * Ak existuje a je public, používateľ sa pridá.
  * Ak existuje a je private, join bez pozvánky je zamietnutý.

* **Pozvánky**:

  * POST /api/channels/:id/invite (public: člen môže invite; private: iba owner)
  * Stav pozvánky je uložený v channel\_members.invitation\_status = pending.
  * POST /api/channels/:id/accept / POST /api/channels/:id/reject
  * V UI sa pozvané kanály topujú (channel-store.ts sort podľa isInvited).

* **/cancel** (opustenie kanála):

  * Frontend: MessageComposer.vue → POST /api/channels/:id/cancel
  * Backend je alias na leave.
  * Ak owner odíde, kanál sa zmaže (podľa zadania).

* **/quit** (zrušenie kanála):

  * POST /api/channels/:id/quit iba owner.

### 4.3 Kick systém a permanent ban

* **/kick nickName**:

  * Private channel: iba owner.
  * Public channel: každý člen môže dať hlas (záznam do channel\_kicks), po 3 unikátnych hlasoch vznikne permanent ban (channel\_bans) a členstvo sa odstráni.
  * Owner môže dať permanent ban okamžite.
  * Owner nie je možné kicknúť.

* **Unban cez invite**:

  * Owner vie používateľa „obnoviť“ pozvánkou (/invite), čo odstráni ban a zmaže kick záznamy pre daný channel/user.

### 4.4 Správy, história, infinite scroll

* **Odoslanie správy**: POST /api/channels/:id/messages.
* **História správ**: GET /api/channels/:id/messages?cursor=<id>\&limit=<n>.
* **Infinite scroll**:

  * Frontend MessageList.vue používa q-infinite-scroll a message-store.fetchOlder().
  * Backend používa cursor pagináciu podľa messages.id (DESC), následne frontend otočí poradie na chronologické.

### 4.5 Zmienky cez @nickname

* Backend pri ukladaní správy deteguje prvú zmienku @nick a nastaví mention\_user\_id.
* Frontend zvýrazňuje správy určené používateľovi (isMentionForMe).

### 4.6 Notifikácie (App Visibility)

* Notifikácie sa vyhodnocujú vo WebSocket handleri (apps/web/src/boot/ws.ts).
* Notifikácia sa zobrazuje iba ak:

  * aplikácia je skrytá (document.hidden / visibilityState === 'hidden') alebo používateľ nie je v aktívnom kanáli správy,
  * a používateľ nemá status DND/offline,
  * a nastavenie notifikácií povoľuje všetko alebo len zmienky.

### 4.7 Statusy online / DND / offline

* Status je uložený v users.status.
* Zmena statusu: PUT /api/users/me/status.
* Backend broadcastuje user:status:changed cez WebSocket.
* Offline režim (podľa zadania):

  * keď je používateľ „offline“, UI **nezobrazuje správy** (MessageList.vue vracia prázdny zoznam),
  * správy sa v klientovi queue-ujú a zobrazia až po prechode z offline na online/DND (ws.ts).

### 4.8 /list – zoznam členov kanála

* Príkaz /list je spracovaný vo MessageComposer.vue a otvorí popup ChannelMembers.vue.

### 4.9 Typing indikátor + live draft preview

* Typing event: POST /api/channels/:id/typing → backend TypingController.notify → WebSocket event typing.
* Draft updates: POST /api/channels/:id/draft → backend DraftController.update → WebSocket event draft:update.
* UI:

  * IndexPage zobrazuje „X is typing…“ a po kliknutí otvorí TypingPreviewPopup.vue,
  * popup zobrazuje živý text z draft-store (ak je dostupný), inak len typing používateľov.

## 5\. Návrhové rozhodnutia

* **WebSocket server mimo HTTP servera**: oddelené porty (3333 API, 3334 WS) zjednodušujú real-time broadcast a subscription model.
* **AdonisJS access tokens**: jednoduchý bearer token systém priamo v Adonis ekosystéme.
* **SQLite**: jednoduchý setup (bez externého DB servera), vhodné pre projektové odovzdanie.
* **Cursor paginácia**: efektívna pre infinite scroll bez OFFSET penalizácie.

## 6\. Screenshoty aplikácie

### 6.1 Prihlasovacia obrazovka

(súbor: screenshots/Login\_Page.png)

Prihlasovacia obrazovka slúži na autentifikáciu používateľa do aplikácie Loom Chat. Používateľ zadáva svoju emailovú adresu a heslo. Z tejto obrazovky je možné prejsť aj na registráciu nového používateľa.

### 6.2 Registračná obrazovka

(súbor: screenshots/Register\_Page.png)

Registračná obrazovka umožňuje vytvorenie nového používateľského účtu. Používateľ zadáva meno, priezvisko, prezývku (nickName), email a heslo. Prezývka a email musia byť unikátne. Po úspešnej registrácii je používateľ presmerovaný na prihlásenie.

### 6.3 Úvodná obrazovka

(súbor: screenshots/Home\_Page.png)

Úvodná obrazovka sa zobrazí po úspešnom prihlásení používateľa. Slúži ako východiskový bod aplikácie a informuje používateľa, že si môže vybrať existujúci kanál zo sidebaru alebo vytvoriť nový kanál/ pridať sa do existujúceho public.

### 6.4 Vytvorenie nového kanála

(súbor: screenshots/Create\_new\_group.png)

Obrazovka pre vytvorenie nového komunikačného kanála. Používateľ môže zadať názov kanála, zvoliť typ kanála (verejný alebo súkromný) a vybrať členov, ktorých chce do kanála pozvať. Vytvorenie kanála je možné až po splnení všetkých povinných podmienok.

### 6.5 Chat v kanáli

(súbor: screenshots/Group\_chat.png)

Hlavné chatovacie rozhranie aplikácie. Na ľavej strane sa nachádza zoznam kanálov, v ktorých je používateľ členom. V hlavnej časti obrazovky je zobrazená história správ z aktuálneho kanála. Používateľ môže odosielať správy, používať príkazy a vidí indikátor písania ostatných používateľov v reálnom čase.

