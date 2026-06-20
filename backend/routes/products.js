const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/products — list all products with BoM components
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        (
          SELECT COALESCE(json_agg(json_build_object(
            'component_id', bc.component_id,
            'component_name', cp.name,
            'quantity', bc.quantity
          )), '[]'::json)
          FROM bom b
          JOIN bom_components bc ON bc.bom_id = b.id
          JOIN products cp ON cp.id = bc.component_id
          WHERE b.product_id = p.id
        ) AS bom_components
      FROM products p
      ORDER BY p.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id — single product with BoM
router.get('/:id', async (req, res) => {
  try {
    const product = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (product.rows.length === 0) return res.status(404).json({ error: 'Product not found' });

    const bom = await pool.query('SELECT * FROM bom WHERE product_id = $1', [req.params.id]);
    let bomData = null;
    if (bom.rows.length > 0) {
      const bomId = bom.rows[0].id;
      const components = await pool.query(
        `SELECT bc.id, bc.quantity, p.id as component_id, p.name as component_name
         FROM bom_components bc JOIN products p ON p.id = bc.component_id
         WHERE bc.bom_id = $1`, [bomId]
      );
      const operations = await pool.query('SELECT * FROM bom_operations WHERE bom_id = $1', [bomId]);
      bomData = { ...bom.rows[0], components: components.rows, operations: operations.rows };
    }

    res.json({ ...product.rows[0], bom: bomData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — create product
router.post('/', async (req, res) => {
  const { name, description, sales_price, cost_price, procurement_type, procurement_strategy, bom_components } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO products (name, description, sales_price, cost_price, procurement_type, procurement_strategy)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, sales_price || 0, cost_price || 0,
       procurement_type || 'PURCHASE', procurement_strategy || 'MTS']
    );
    const product = result.rows[0];

    // If manufacturing type and has bom components, save them
    if (procurement_type === 'MANUFACTURING' && Array.isArray(bom_components) && bom_components.length > 0) {
      const bomResult = await client.query(
        'INSERT INTO bom (product_id) VALUES ($1) RETURNING id',
        [product.id]
      );
      const bomId = bomResult.rows[0].id;
      for (const comp of bom_components) {
        await client.query(
          'INSERT INTO bom_components (bom_id, component_id, quantity) VALUES ($1, $2, $3)',
          [bomId, comp.product_id, comp.quantity]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(400).json({ error: 'Product name already exists' });
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/products/:id — update product
router.put('/:id', async (req, res) => {
  const { name, description, sales_price, cost_price, procurement_type, procurement_strategy, bom_components } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE products SET name=$1, description=$2, sales_price=$3, cost_price=$4,
       procurement_type=$5, procurement_strategy=$6 WHERE id=$7 RETURNING *`,
      [name, description, sales_price, cost_price, procurement_type, procurement_strategy, req.params.id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = result.rows[0];

    // Always delete existing BoM first to replace it
    await client.query('DELETE FROM bom WHERE product_id = $1', [req.params.id]);

    // If manufacturing type and has bom components, save them
    if (procurement_type === 'MANUFACTURING' && Array.isArray(bom_components) && bom_components.length > 0) {
      const bomResult = await client.query(
        'INSERT INTO bom (product_id) VALUES ($1) RETURNING id',
        [product.id]
      );
      const bomId = bomResult.rows[0].id;
      for (const comp of bom_components) {
        await client.query(
          'INSERT INTO bom_components (bom_id, component_id, quantity) VALUES ($1, $2, $3)',
          [bomId, comp.product_id, comp.quantity]
        );
      }
    }
    await client.query('COMMIT');
    res.json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/:id/bom — create/replace BoM for a product
router.post('/:id/bom', async (req, res) => {
  const { components, operations } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete existing BoM (cascades to components & operations)
    await client.query('DELETE FROM bom WHERE product_id = $1', [req.params.id]);

    // Create new BoM
    const bomResult = await client.query(
      'INSERT INTO bom (product_id) VALUES ($1) RETURNING *', [req.params.id]
    );
    const bomId = bomResult.rows[0].id;

    // Insert components
    for (const c of (components || [])) {
      await client.query(
        'INSERT INTO bom_components (bom_id, component_id, quantity) VALUES ($1, $2, $3)',
        [bomId, c.component_id, c.quantity]
      );
    }

    // Insert operations
    for (const op of (operations || [])) {
      await client.query(
        'INSERT INTO bom_operations (bom_id, operation_name, duration) VALUES ($1, $2, $3)',
        [bomId, op.operation_name, op.duration]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'BoM saved', bom_id: bomId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
