# Switch Management Portal

> ⚠️ **Disclaimer:** This is a **school project** and **not intended for serious production use**.  

Suitchi is A web app for managing your network switches.


## About Suitchi

“Suitchi” stands for:

| Letter | Meaning        |
|--------|----------------|
| S      | Switch         |
| U      | User           |
| I      | Interface      |
| T      | Traffic        |
| C      | Configuration  |
| H      | Health         |
| I      | Information    |

*No, it doesn’t *


## Features
- TFTP config backups (standalone TFTP server required)
- ACL Rule viewer (imported from the backup file)
- Basic SNMP Data
- SSH portal
## Docker Compose

```yaml
services:
  suitchi:
    image: ghcr.io/pucas01/suitchi:latest
    container_name: suitchi
    ports:
      - 80:3000
      - 4000:4000
    volumes:
      - ./suitchi/downloads:/app/backend/downloads
      - ./suitchi/config:/app/app/config
    environment:
      - NODE_ENV=production
    restart: unless-stopped
