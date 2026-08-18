# 🚀 TechPlay.gg Production Deployment Guide

This guide describes how to deploy the TechPlay application (Laravel Backend + Next.js Frontend) to a production VPS (Ubuntu 24.04).

## 📋 Prerequisites

1.  **VPS**: Ubuntu 24.04 server (Hetzner CAX31 recommended).
2.  **Domains**:
    *   `beta.techplay.gg` pointing to Server IP.
    *   `api-beta.techplay.gg` pointing to Server IP.
3.  **Git Repo**: Access to the project repository.

---

## 🛠️ Step 1: Initial Server Setup

1.  **SSH into your server**:
    ```bash
    ssh root@<your-server-ip>
    ```

2.  **Download the Provision Script**:
    (You can copy-paste the content of `deployment/provision.sh` or scp it).
    ```bash
    # Example: Create the file
    nano provision.sh
    # Paste content from deployment/provision.sh
    # Save (Ctrl+O, Enter) and Exit (Ctrl+X)
    ```

3.  **Run Provisioning**:
    ```bash
    chmod +x provision.sh
    ./provision.sh
    ```
    *This will install PHP 8.3, Nginx, Node.js 20, Postgres, Redis, and Certbot.*

---

## 📂 Step 2: Code Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/techplay.git /var/www/techplay
    ```
    *(Make sure to use an auth token or SSH key if the repo is private)*

2.  **Environment Variables**:
    Create the production `.env` files.

    **Backend**:
    ```bash
    cp /var/www/techplay/backend/.env.example /var/www/techplay/backend/.env
    nano /var/www/techplay/backend/.env
    ```
    *   Set `APP_ENV=production`
    *   Set `APP_DEBUG=false`
    *   Set `DB_PASSWORD` (as defined in provision.sh)
    *   Set `PULSE_ENABLED=true`
    *   Set `APP_URL=https://api-beta.techplay.gg`
    *   Set `FRONTEND_URL=https://beta.techplay.gg`

    **Frontend**:
    ```bash
    cp /var/www/techplay/frontend/.env.example /var/www/techplay/frontend/.env
    nano /var/www/techplay/frontend/.env
    ```
    *   Set `NEXT_PUBLIC_API_URL=https://api-beta.techplay.gg/api/v1`
    *   Set `NEXT_PUBLIC_STORAGE_URL=https://api-beta.techplay.gg/storage`

---

## 🔄 Automated Deployment (Windows)

Use the provided PowerShell script to maximally automate the process:
1.  **Export Database**: Dumps your local Postgres DB.
2.  **Git Push**: Commits and pushes changes.
3.  **Upload**: Uploads the DB dump to the server.
4.  **Deploy**: Triggers the server-side deployment script.

### Setup
1.  Open `deployment/push_and_deploy.ps1` and set `$SERVER_IP`.
2.  Ensure you have SSH access (`ssh-copy-id` or key configured).

### Usage
Run this from the project root:
```powershell
./deployment/push_and_deploy.ps1
```

---

## 🛠️ Step 1: Initial Server Setup

1.  **SSH into your server**:
    ```bash
    ssh root@<your-server-ip>
    ```

2.  **Download the Provision Script**:
    (You can copy-paste the content of `deployment/provision.sh` or scp it).
    ```bash
    # Example: Create the file
    nano provision.sh
    # Paste content from deployment/provision.sh
    # Save (Ctrl+O, Enter) and Exit (Ctrl+X)
    ```

3.  **Run Provisioning**:
    ```bash
    chmod +x provision.sh
    ./provision.sh
    ```
    *This will install PHP 8.3, Nginx, Node.js 20, Postgres, Redis, and Certbot.*

---

## 📂 Step 2: Code Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/techplay.git /var/www/techplay
    ```
    *(Make sure to use an auth token or SSH key if the repo is private)*

2.  **Environment Variables**:
    Create the production `.env` files.

    **Backend**:
    ```bash
    cp /var/www/techplay/backend/.env.example /var/www/techplay/backend/.env
    nano /var/www/techplay/backend/.env
    ```
    *   Set `APP_ENV=production`
    *   Set `APP_DEBUG=false`
    *   Set `DB_PASSWORD` (as defined in provision.sh)
    *   Set `PULSE_ENABLED=true`
    *   Set `APP_URL=https://api-beta.techplay.gg`
    *   Set `FRONTEND_URL=https://beta.techplay.gg`

    **Frontend**:
    ```bash
    cp /var/www/techplay/frontend/.env.example /var/www/techplay/frontend/.env
    nano /var/www/techplay/frontend/.env
    ```
    *   Set `NEXT_PUBLIC_API_URL=https://api-beta.techplay.gg/api/v1`
    *   Set `NEXT_PUBLIC_STORAGE_URL=https://api-beta.techplay.gg/storage`

---

## 💾 Database Migration

If you have a local database dump you want to import:
1.  Upload the dump to `/var/www/techplay/deployment/database_backup.sql`.
2.  Run the import script:
    ```bash
    bash /var/www/techplay/deployment/server_import_db.sh
    ```
    *(Note: This creates a fresh DB named `techplay`)*

---

## 🌐 Step 4: Nginx & SSL Configuration

1.  **Configure Nginx**:
    Copy the generated config to sites-available.
    ```bash
    cp /var/www/techplay/deployment/nginx.conf /etc/nginx/sites-available/techplay
    ln -s /etc/nginx/sites-available/techplay /etc/nginx/sites-enabled/
    rm /etc/nginx/sites-enabled/default
    nginx -t
    service nginx restart
    ```

2.  **Obtain SSL Certificates**:
    ```bash
    certbot --nginx -d beta.techplay.gg -d api-beta.techplay.gg
    ```

3.  **Reverb (WebSocket)**:
    The socket runs behind nginx on 443, not on its own public port —
    Cloudflare serves 8080 as plaintext HTTP, so `wss://host:8080` can never
    complete a handshake. The `location ~ ^/(app|apps)(/|$)` block in
    `nginx.conf` carries it; Reverb itself binds to localhost.
    ```bash
    cp /var/www/techplay/deployment/supervisor-reverb.conf /etc/supervisor/conf.d/techplay-reverb.conf
    supervisorctl reread && supervisorctl update
    supervisorctl start techplay-reverb:*

    # The frontend must agree — in frontend/.env:
    #   NEXT_PUBLIC_REVERB_HOST=api-beta.techplay.gg
    #   NEXT_PUBLIC_REVERB_PORT=443
    #   NEXT_PUBLIC_REVERB_SCHEME=https
    ```
    Check it end to end (a 101 is the upgrade; anything else means it is not
    reaching Reverb):
    ```bash
    curl -sI -o /dev/null -w '%{http_code}\n' \
      -H 'Connection: Upgrade' -H 'Upgrade: websocket' \
      -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
      'https://api-beta.techplay.gg/app/techplay-reverb-key?protocol=7&client=js&version=8.4.0'
    ```

## `nginx-site-techplay.conf`

Kopija zivog `/etc/nginx/sites-available/techplay`, u repou od 18.08.2026 —
jer se do tada nalazila samo na serveru, a u njoj je popravka bez koje sajt
pada:

**Jedna spora putanja ne smije oboriti sve ostale.** `/_next/image` dovlaci
naslovnice s tudjih CDN-ova (MobyGames, Steam) i optimizuje ih. Kad je taj CDN
spor, zahtjev drzi konekciju do `proxy_read_timeout`, nginx to broji kao pad
upstreama, i poslije `max_fails` proglasi server mrtvim — za **sve** lokacije,
ne samo za sporu. Tako je usporen tudji CDN oborio cijeli techplay.gg na 502
dok je Next odgovarao na `/news` za 160 ms.

`max_fails=0` kaze: nikad ne zakljucuj da je ovaj server mrtav. Backend je
jedan; proglasavanje mrtvim ne moze zaobici nista, moze samo spor zahtjev
pretvoriti u ispad cijelog sajta.

Izmjereno poslije: **0 `no live upstreams` i 0 novih 502 u 90 sekundi.**
