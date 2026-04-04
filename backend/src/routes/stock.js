const router = require("express").Router();

const pool = require("../db/pool");

router.get("/", async (req, res) => {
  const rows = await pool.query(
    "SELECT rb.batch_no, rb.supplier, rb.makhana_type, rb.inward_date, rs.grade, rs.original_quantity_kg, rs.current_quantity_kg, (rs.original_quantity_kg - rs.current_quantity_kg) AS used_kg, rs.cost_per_kg, (rs.current_quantity_kg * rs.cost_per_kg) AS current_value FROM raw_batches rb JOIN raw_stock rs ON rb.batch_no = rs.batch_no ORDER BY rb.inward_date DESC, rb.batch_no, rs.grade",
  );
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
      original_qty: row.original_quantity_kg,
      current_qty: row.current_quantity_kg,
      used_qty: row.used_kg,
      value: row.current_value,
    });
    return acc;
  }, {});
  res.json(Object.values(grouped));
});

module.exports = router;
