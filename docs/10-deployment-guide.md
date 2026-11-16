# 10 - Deploying Custom Order Manager on a New Server

A copy of the Claude Doc "Deploying Custom Order Manager on a New Server" (16 Nov 2026). Plain English, step by step. No real passwords or addresses are in it: use your own where it says `<...>` or `yourdomain.com`.

> The https step (Step 6) has been checked only for syntax and logic. It has not yet been run on the client's real Ubuntu machine. The first real run is the real test.

## What you need before you start
One Ubuntu server, one domain name and about an hour. This guide takes a new server from nothing to a working app that masters can open from WhatsApp.

- **A server running Ubuntu 22.04 or 24.04.** A computer in the office or a rented server (VPS). At least 2 GB of memory and 10 GB of free disk. The app is small, but the build step needs the memory.
- **A way to reach it from outside.** An office computer needs a fixed local address and one router setting (Step 5). A rented server already has a public address.
- **A domain name you can edit**, for example `orders.yourdomain.com`. You will add two DNS records (Step 6). Any DNS provider works.
- **Login to the server** with SSH, and a user that can use `sudo`.
- **The code address** (the repository) and permission to download it.
- **A strong admin password** you choose now. Keep it somewhere safe.
- **Moving from an old server?** Take a fresh backup there first (see Moving the data).

## How it fits together
```
Phone / office computer
        |  https://orders.yourdomain.com:3002
        v
   Caddy (front door, port 3002, https)
        |  127.0.0.1:3003
        v
   The app (service "order-manager")
        |
        v
   data/  (database app.db + pictures uploads)
        ^
   Nightly backup at 2 AM copies this folder.   acme.sh renews the certificate by itself.
```
Phones and office computers open the https address. Caddy passes each request to the app on the same server. The app keeps everything in one data folder: the database and the pictures. The nightly backup copies that folder, and acme.sh renews the certificate by itself.

## Step 1 - Get the server ready
Install four things: the latest updates, git, build tools and Node.js. The app needs **Node.js 22 or newer**.

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y git curl build-essential python3
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

The last line must show `v22` or higher. If it shows an older number, run the two Node.js lines again.

If the server's firewall (`ufw`) is switched on, make sure you can still log in before you go on: `sudo ufw allow OpenSSH`. The setup scripts open the app's own port by themselves.

## Step 2 - Get the app
Download the code into your home folder and install what it needs. Use the repository address your developer gave you in place of `<repository address>`.

```bash
cd ~
git clone <repository address> Order-Tracker
cd Order-Tracker
npm install
```

`npm install` takes a few minutes. When it ends without red errors, this step is done. Every command from here on is run inside the `Order-Tracker` folder.

## Step 3 - Write the settings file
The app reads its settings from a file called `.env.local`. Make it from the example and open it:

```bash
cp .env.example .env.local
nano .env.local
```

Fill in these lines. Save with Ctrl+O, Enter, then leave with Ctrl+X.

| Setting | What to put |
| --- | --- |
| `ADMIN_PASSWORD` | The password Anas types to sign in to the admin pages. Make it long. |
| `SESSION_SECRET` | Random text of 32 or more characters. Make one with `openssl rand -hex 32` and paste it. Changing it later signs everyone out. |
| `APP_URL` | The exact address people will type, with no slash at the end. For now use `http://<public address>:3002`. Step 6 changes it to the https address for you. |
| `GOOGLE_TRANSLATE_API_KEY` | Optional. A Google Cloud Translation key. With it, the master's Urdu, Bengali and Hindi buttons also translate the text the office typed (field names, notes, step names). Without it, the fixed words are still in Urdu, Bengali and Hindi and the typed text stays English. |
| `BACKUP_DIR_2` | Optional. A second place for the nightly backup, for example a USB drive: `/mnt/usb/OrderManagerBackups`. |

Leave the other lines as they are. The file stays on this server only and is never sent to git, so write the passwords down somewhere safe.

## Step 4 - Start the app as a service
One script makes the app run by itself, all the time. It asks for your `sudo` password when it needs it.

```bash
bash deploy/linux/setup-service.sh
```

The app uses port 3002 and the Pakistan time zone. To change them, put them in front of the command: `PORT=3002 TIMEZONE=Asia/Karachi bash deploy/linux/setup-service.sh`.

The script does five things:

1. Prepares the database.
2. Builds the app. This takes a minute or two.
3. Makes a service called `order-manager`. It starts when the server starts, and starts again if it stops.
4. Opens the port in the firewall, if the firewall is on.
5. Sets up the nightly backup at 2 AM.

When it ends it prints `Done. The app answers on this machine`. To check by hand: `sudo systemctl status order-manager`. If it did not answer, look at the log: `sudo journalctl -u order-manager -n 50 --no-pager`.

## Step 5 - Open the port to the internet
The app answers on the server now, but people outside cannot reach it yet. Only port **3002** needs to be open.

**A computer in the office, behind a router**

1. In the router, give the server a fixed local address, so it never changes. Find its current address with `hostname -I`.
2. In the router, add a port forward: TCP port 3002 from the outside to that local address, port 3002.
3. Find the office's public address (open `https://api.ipify.org` on any office computer). Make sure it does not change; ask the internet provider for a fixed one if it does.

**A rented server (VPS)**

In the provider's firewall settings, allow TCP port 3002 from anywhere. The server already has a public address.

**Check it from outside.** On a phone using mobile data (not the office Wi-Fi), open `http://<public address>:3002/admin/login`. The sign-in page must appear. If it does not, check the forward or firewall rule, and that the server's address did not change.

The office usually cannot test this from inside its own network, because many routers do not loop the public address back in. Always test from mobile data.

## Step 6 - Turn on https so the WhatsApp links open
Without this step the link in WhatsApp turns blue, but tapping it fails: phones try a secure address and the app only speaks plain http. This step gives the app a real certificate on the **same port 3002**, so the router does not change.

**Before you run it**

1. Add a DNS record for the name: type **A**, host `orders`, value the public address. Wait a few minutes, then check with `nslookup orders.yourdomain.com` on the server.
2. Make sure you can add one more record in your DNS provider (it is a CNAME, shown by the script).

**Run it**

```bash
HOST=orders.yourdomain.com bash deploy/linux/setup-https.sh
```

The script installs what it needs and then **stops and waits**. It prints one DNS record to add, like this:

| Type | Host | Data |
| --- | --- | --- |
| CNAME | `_acme-challenge.orders` | `<some-id>.auth.acme-dns.io` |

Add exactly that record in your DNS provider, wait a few minutes, then press **Enter**. The script checks that the record is visible, gets a free certificate, and then switches over. When it finishes it prints `DONE`.

**What it changed**

- The app now listens on `127.0.0.1:3003`. Only the server itself can reach it.
- Caddy now listens on port 3002 and speaks https.
- `APP_URL` in `.env.local` is now `https://orders.yourdomain.com:3002`, so every WhatsApp link is https.
- The certificate renews by itself about every 60 days.

**What changes for people**

- Everyone, the office too, opens `https://orders.yourdomain.com:3002`. The old `http://` address stops working.
- Links sent to masters before must be sent again: Masters page, **Send link on WhatsApp**.
- Test with a phone on mobile data first.

**If the name does not open inside the office** (it works on mobile data): the office router cannot loop its own public address. Fix it by adding a local DNS record in the router: `orders.yourdomain.com` to the server's local address. Or, on one computer, add the line `<local address> orders.yourdomain.com` to its hosts file. Do not use `https://<local address>:3002`, because the browser warns about the certificate.

**To undo it:** `bash deploy/linux/rollback-https.sh`. The app goes back to plain http on port 3002 and Caddy is switched off.

If you ever run `setup-service.sh` again, run `setup-https.sh` again afterwards, because the first one puts the app back on port 3002.

## Step 7 - First login and first setup
Open `https://orders.yourdomain.com:3002/admin` (or the `http://` address if you skipped Step 6) and sign in with the `ADMIN_PASSWORD` from Step 3. If you moved your data from an old server, Masters, Items and Steps are already there and you can skip to the test at the end.

On a new, empty server, do these in order:

1. **Masters** (left menu). Press **Add master**. Give his name, a PIN code (numbers and letters, for example `1234A`) and his WhatsApp number with the country code and no plus sign, for example `923001234567`.
2. **Your WhatsApp number**, at the top of the Masters page. It is where masters' questions used to go; the master screens no longer have a question button, so you can leave it empty.
3. **Items** (left menu). Add a group (for example Men), then the items in it (Sherwani, Kurta). Build each item's form and choose its steps. Use the **Steps** page for steps that many items share.
4. **Design Category** (left menu), if you use it. Add your design numbers with their pictures.

**Test the whole path before real work**

1. Customers, then **New customer**. Fill the name, design number, a master and the two dates, and tick one item.
2. Press **Save and send to master**, then the **Send on WhatsApp** button.
3. On a phone using mobile data, tap the link in WhatsApp. It must open the master's page and ask for the PIN.
4. Enter the PIN and check the order is there.

## Moving the data from the old server
Move the data once, when you switch over. Everything the app knows (customers, masters, items, steps, pictures) is the database file `data/app.db` and the pictures folder `data/uploads`. Do Steps 1 to 4 on the new server first, so it works with an empty database.

**On the old server**

```bash
cd ~/Order-Tracker
node deploy/windows/backup.cjs
```

This makes a folder named with today's date inside `backups`, for example `backups/2026-11-16`, holding `app.db` and `uploads`. Copy it to the new server:

```bash
scp -r backups/2026-11-16 youruser@newserver:~/
```

**On the new server**

```bash
sudo systemctl stop order-manager
cd ~/Order-Tracker
rm -f data/app.db data/app.db-wal data/app.db-shm
cp ~/2026-11-16/app.db data/app.db
rm -rf data/uploads
cp -r ~/2026-11-16/uploads data/uploads
npm run db:migrate
sudo systemctl start order-manager
```

If the old backup has no `uploads` folder, skip the last two copy lines. If you set `DATABASE_URL` or `UPLOAD_DIR` in `.env.local`, use those places instead of `data/`.

**After the move**

- Use the **same `ADMIN_PASSWORD` or a new one**, as you like. Masters keep their PINs.
- Master links keep their code but get a new address. Send each master his link again: Masters page, **Send link on WhatsApp**.
- Switch the old server off when the new one works, so nobody works in two places. Keep the backup folder for a few weeks.

The same steps restore a backup on the same server.

## Backups
A backup runs by itself every night at 2 AM, from Step 4. It saves the database and all the pictures into a folder named with the date, and keeps the last 14 days.

- **Where:** the `backups` folder inside `Order-Tracker`, unless you set `BACKUP_DIR` in `.env.local`. If you set `BACKUP_DIR_2` too, a second copy goes there.
- **Run one by hand:** `node deploy/windows/backup.cjs`
- **See the log:** `tail -n 20 ~/Order-Tracker/backups.log`
- **Restore one:** follow the steps in Moving the data from the old server, using the folder you want.

A backup on the same disk does not help if the disk breaks. Keep a second copy somewhere else: a USB drive or a network folder (`BACKUP_DIR_2`), or copy the newest folder to another computer every week with `scp`.

## Updating the app later
When a new version is ready, run one command inside `Order-Tracker`:

```bash
bash deploy/linux/update.sh
```

It stops the app, makes a backup, downloads the new version, installs, updates the database, builds, and starts the app again. It takes a few minutes, and the app is off while it runs, so do it when the masters are not busy. The https setup is not touched, so nothing else is needed. When it ends it prints `active`.

## If something goes wrong

| Problem | What to do |
| --- | --- |
| The app does not answer on the server | Run `sudo systemctl status order-manager` and `sudo journalctl -u order-manager -n 50 --no-pager`. The usual causes are a missing `.env.local`, a failed build, or another program using the port. |
| It works on the server but not from outside | Check the router forward (or the provider firewall) for TCP 3002, that the server's local address did not change, and that `APP_URL` is the address people type. Test on mobile data. |
| The link is blue in WhatsApp but does nothing when tapped | https is missing. Do Step 6. Pasting the link in a browser can work while tapping fails. |
| The name does not open inside the office, but works on mobile data | Add the local DNS record or hosts line from Step 6. |
| The certificate step failed | The DNS record is missing, wrong or not published yet. Check it, wait a few minutes, and run `setup-https.sh` again. It is safe to run again. |
| The admin password is forgotten | Change `ADMIN_PASSWORD` in `.env.local` (`nano .env.local`), then `sudo systemctl restart order-manager`. |
| A master forgot his PIN, or lost his link | Masters page: **Set PIN**, or **New link** and then send it again. |
| Dates and times are wrong by some hours | Open `sudo nano /etc/systemd/system/order-manager.service`, change the `TZ=` line (for example `Asia/Karachi`), then `sudo systemctl daemon-reload` and `sudo systemctl restart order-manager`. |
| You want to go back to plain http | `bash deploy/linux/rollback-https.sh` |

## Commands to keep
Run the `bash` commands inside the `Order-Tracker` folder.

| What | Command |
| --- | --- |
| Is the app running? | `sudo systemctl status order-manager` |
| Restart the app | `sudo systemctl restart order-manager` |
| Read the app's log | `sudo journalctl -u order-manager -n 50 --no-pager` |
| Read https's log | `sudo journalctl -u caddy -n 50 --no-pager` |
| Change the settings | `nano .env.local`, then restart the app |
| Update to the new version | `bash deploy/linux/update.sh` |
| Back up now | `node deploy/windows/backup.cjs` |
| First setup of the service | `bash deploy/linux/setup-service.sh` |
| Turn on https | `HOST=orders.yourdomain.com bash deploy/linux/setup-https.sh` |
| Turn https off again | `bash deploy/linux/rollback-https.sh` |
