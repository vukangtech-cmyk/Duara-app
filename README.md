# THE CIRCLE (Duara)

THE CIRCLE ni MVP ya mtandao wa kijamii kwa Kiswahili. Ina frontend ya React/Vite na backend ya PHP/MySQL. Toleo hili lina login, registration, feed ya posts, na kutuma post mpya.

## Muundo

- `frontend/` — React + Vite UI, responsive kwa desktop na simu.
- `backend/duara/` — PHP JSON API.
- `backend/duara/schema.sql` — database schema ya MySQL.
- `.env.example` — variables za frontend na backend.

## Kuanzisha database

1. Tengeneza database na tables kwa ku-run `backend/duara/schema.sql` kwenye MySQL/MariaDB.
2. Tengeneza database user maalum mwenye permissions za database ya `duara_db`; usitumie `root` bila password production.
3. Weka environment variables za PHP kwenye Apache/PHP host kulingana na `.env.example`.
4. Weka folder ya `backend/duara` kwenye document root, kwa mfano `htdocs/duara`.

## Kuanzisha frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local
npm run dev
```

Kwa production:

```bash
npm run build
```

Tumia `VITE_API_URL` kuonyesha URL ya backend, kwa mfano `https://example.com/api/duara`.

## API endpoints

| Method | Endpoint | Kazi |
|---|---|---|
| POST | `register.php` | Jisajili kwa jina, simu na PIN |
| POST | `login.php` | Ingia kwa simu na PIN |
| GET | `feed.php` | Soma posts 50 za mwisho |
| POST | `posts.php` | Tuma post mpya |

## Hatua inayofuata

MVP hii haina bado sessions/JWT, comments, likes zinazo-save, follow graph, notifications, media uploads, moderation, au password/PIN recovery. Hizo zitaongezwa kama awamu inayofuata; kwa production ni muhimu kuanza na token/session authentication kabla ya kuongeza endpoints nyingi.
