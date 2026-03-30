const router = require("express").Router();
const pool = require("../db/pool");

router.post("/", async (req, res) => {
  const { supplier, invoice_no, inward_date, makhana_type, grades } = req.body;

  //Calulate totals from grades array
  const total_quantity_kg = grades.reduce(
    (sum, g) => sum + Number(g.quantity_kg),
    0,
  );
  const total_cost = grades.reduce(
    (sum, g) => sum + Number(g.quantity_kg) * Number(g.cost_per_kg),
    0,
  );

  //Get a client from pool for transaction
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    //Auto generate batch number
    const countResult = await client.query("SELECT COUNT(*) from raw_batches");
    const count = parseInt(countResult.rows[0].count) + 1;
    const batch_no = `RAW-${String(count).padStart(3, "0")}`;
    //padStart just formats the number to be 3 digits only

    //Insert into raw_batches
    const batchResult = await client.query(
      `INSERT INTO raw_batches (batch_no, supplier, invoice_no, inward_date, makhana_type, total_quantity_kg, total_cost) 
        VALUES($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
      [
        batch_no,
        supplier,
        invoice_no,
        inward_date,
        makhana_type,
        total_quantity_kg,
        total_cost,
      ],
    );

    //Insert each grade into raw_stock
    for (const g of grades) {
      await client.query(
        `INSERT INTO raw_stock
                (batch_no, grade, original_quantity_kg, current_quantity_kg, cost_per_kg)
            VALUES($1, $2, $3, $4, $5)`,
        [batch_no, g.grade, g.quantity_kg, g.quantity_kg, g.cost_per_kg],
      );
    }

    await client.query("COMMIT");

    res.json({
      message: "Batch Created Successfully",
      batch: batchResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  } finally {
    client.release();
  }
});

router.get("/", async (req, res) => {
  const rows = await pool.query(`
        SELECT rb.batch_no, rb.supplier, rb.makhana_type, rs.grade, rs.current_quantity_kg, rs.cost_per_kg 
        FROM raw_batches rb JOIN raw_stock rs ON rb.batch_no = rs.batch_no
        `);
  const grouped = rows.rows.reduce((acc, row) => {
    if (!acc[row.batch_no]) {
      acc[row.batch_no] = {
        batch_no: row.batch_no,
        supplier: row.supplier,
        grades: [],
      };
    }

    acc[row.batch_no].grades.push({
      grade: row.grade,
      cost_per_kg: row.cost_per_kg,
    });
    return acc;
  }, {});
  const result = Object.values(grouped);
  res.json(result)
});

module.exports = router;
