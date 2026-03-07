const express = require('express');
const fs = require('fs');
const path = require('path');
const hbs = require('hbs');
const MySQL = require('./utilsMySQL');

const app = express();
const port = 3000;

const isProxmox = !!process.env.PM2_HOME;

const db = new MySQL();
if (!isProxmox) {
  db.init({
    host: '127.0.0.1',
    port: 3307,
    user: 'super',
    password: '1234',
    database: 'sakila'
  });
} else {
  db.init({
    host: '127.0.0.1',
    port: 3306,
    user: 'super',
    password: '1234',
    database: 'sakila'
  });
}

app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

hbs.registerHelper('eq', (a, b) => a == b);
hbs.registerHelper('gt', (a, b) => a > b);

hbs.registerPartials(path.join(__dirname, 'views', 'partials'));


// ---------------------------------------------------------
// RUTA PRINCIPAL /
// ---------------------------------------------------------
app.get('/', async (req, res) => {
  try {
    const moviesRows = await db.query(`
      SELECT film_id, title, release_year
      FROM film
      ORDER BY film_id
      LIMIT 5;
    `);

    const categoriesRows = await db.query(`
      SELECT category_id, name
      FROM category
      ORDER BY category_id
      LIMIT 5;
    `);

    const moviesJson = db.table_to_json(moviesRows, {
      film_id: 'number',
      title: 'string',
      release_year: 'number'
    });

    // ➤ Añadir actores a cada película
    for (const movie of moviesJson) {
      const actorsRows = await db.query(`
        SELECT a.first_name, a.last_name
        FROM actor a
        JOIN film_actor fa ON a.actor_id = fa.actor_id
        WHERE fa.film_id = ?
        LIMIT 5;
      `, [movie.film_id]);

      movie.actors = db.table_to_json(actorsRows, {
        first_name: 'string',
        last_name: 'string'
      });
    }

    const categoriesJson = db.table_to_json(categoriesRows, {
      category_id: 'number',
      name: 'string'
    });

    const commonData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'common.json'), 'utf8')
    );

    const data = {
      movies: moviesJson,
      categories: categoriesJson,
      common: commonData
    };

    res.render('index', data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error consultant la base de dades');
  }
});


// ---------------------------------------------------------
// RUTA /movies
// ---------------------------------------------------------
app.get('/movies', async (req, res) => {
  try {
    const moviesRows = await db.query(`
      SELECT film_id, title, description, release_year, length
      FROM film
      ORDER BY film_id
      LIMIT 15;
    `);

    const moviesJson = db.table_to_json(moviesRows, {
      film_id: 'number',
      title: 'string',
      description: 'string',
      release_year: 'number',
      length: 'number'
    });

    // ➤ Añadir actores a cada película
    for (const movie of moviesJson) {
      const actorsRows = await db.query(`
        SELECT a.first_name, a.last_name
        FROM actor a
        JOIN film_actor fa ON a.actor_id = fa.actor_id
        WHERE fa.film_id = ?;
      `, [movie.film_id]);

      movie.actors = db.table_to_json(actorsRows, {
        first_name: 'string',
        last_name: 'string'
      });
    }

    const commonData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'common.json'), 'utf8')
    );

    const data = {
      movies: moviesJson,
      common: commonData
    };

    res.render('movies', data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error consultant la base de dades');
  }
});


// ---------------------------------------------------------
// RUTA /customers
// ---------------------------------------------------------
app.get('/customers', async (req, res) => {
  try {
    const customersRows = await db.query(`
      SELECT customer_id, first_name, last_name, email
      FROM customer
      ORDER BY customer_id
      LIMIT 25;
    `);

    const customersJson = db.table_to_json(customersRows, {
      customer_id: 'number',
      first_name: 'string',
      last_name: 'string',
      email: 'string'
    });

    // ➤ Añadir alquileres a cada cliente
    for (const customer of customersJson) {
      const rentalsRows = await db.query(`
        SELECT rental_date, inventory_id
        FROM rental
        WHERE customer_id = ?
        ORDER BY rental_date DESC
        LIMIT 5;
      `, [customer.customer_id]);

      customer.rentals = db.table_to_json(rentalsRows, {
        rental_date: 'string',
        inventory_id: 'number'
      });
    }

    const commonData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'common.json'), 'utf8')
    );

    const data = {
      customers: customersJson,
      common: commonData
    };

    res.render('customers', data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error consultant la base de dades');
  }
});


// ---------------------------------------------------------
// SERVIDOR
// ---------------------------------------------------------
const httpServer = app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  await db.end();
  httpServer.close();
  process.exit(0);
});
