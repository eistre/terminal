# Linux Terminal Exercise environment

### Bachelor's thesis

This project is a continuation of Joonas Halapuu's [Bachelor's thesis project](https://gitlab.com/JoonasHalapuu/ubuntuterminal).

This project creates isolated Ubuntu Kubernetes pods that allow users to practice command line tasks. Admin users have the ability to modify, create, and delete tasks.

## To start the project on a fresh Ubuntu install
1. Run the following command:
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/eistre/terminal/master/local/setup.sh)
```

## Alternatively
1. Make sure that you have kubernetes installed (The script will install MicroK8s).

2. Make sure that you have Node installed (preferably Node 21).

3. Make sure you have a MySQL database instance running.
A Docker Compose example has been added to the root of this repository.
This example will use the `DATABASE_URL` of `mysql://root:root@localhost:3306/terminal`
To run this, use:
```bash
# Add -d to the end to detach instance from terminal
docker compose up
```

4. Run the following commands:
```bash
# Install packages
npm install

# Generate prisma client
npx prisma generate

# Create .env if not present
touch .env

# Build the application
npm run build
```

5. Fill out `.env` according to `.env.example`.

6. Push the schema to the database:
```bash
# Pushes the database schema to MySQL database
npx prisma db push
```

6. To run the application, use:
```bash
# Runs the application with .env values
npm run preview
```

7. Alternatively, run in development mode:
```bash
# Runs the application in dev mode
npm run dev
```
