# Switch-managment-portal
 a webapp for managing your network switches

Docker Compose yaml:
```
services: 
  suitchi: 
    image: ghcr.io/pucas01/suitchi:latest 
    container_name: suitchi 
    ports: 
      - 80:3000 
      - 4000:4000 
    volumes: 
      - ./backend/downloads:/app/backend/downloads 
      - ./app/switches.json:/app/app/switches.json 
      - ./app/config.json:/app/app/config.json 
    environment: 
      - NODE_ENV=production 
    restart: unless-stopped 
```
THIS IS A SCHOOL PROJECT AND NOT MEANT AS A SERIOUS PROGRAM TO BE USED BY EVERYONE
