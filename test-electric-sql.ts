import { Shape, ShapeStream } from "@electric-sql/client"

// Configuration
const ELECTRIC_URL = "https://api.electric-sql.cloud/v1/shape"
const TABLE_NAME = "ohlcv_15min"
const ELECTRIC_SOURCE_SECRET =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzb3VyY2VfaWQiOiJlMzA1NGY4NC04YTM2LTQ0OTktOTgwYy05NjFmZjUwNmQwZjUiLCJpYXQiOjE3MzkyOTAxMTZ9.1yO05fJNzwXdRQQ-tfU_qpOqwCc007oIW9ujjTgoiHQ"
const ELECTRIC_SOURCE_ID = "e3054f84-8a36-4499-980c-961ff506d0f5"

async function testElectricSQL() {
  console.log(`🔌 Testing Electric SQL with ${TABLE_NAME} table...`)

  try {
    // Create shape stream
    const stream = new ShapeStream({
      url: ELECTRIC_URL,
      params: {
        table: TABLE_NAME,
        source_id: ELECTRIC_SOURCE_ID,
        secret: ELECTRIC_SOURCE_SECRET,
        columns: ["id", "token_0", "token_1", "interval_type"],
      },
    })

    const shape = new Shape(stream)

    // Subscribe to real-time updates
    shape.subscribe(({ rows }) => {
      console.log("🔄 Real-time update:", rows.length, "rows")
    })

    // Wait for initial data
    console.log("⏳ Loading initial data...")
    const rows = await shape.rows

    console.log("✅ Success!")
    console.log(`📊 Total rows: ${rows.length}`)

    if (rows.length > 0) {
      console.log("📋 Columns:", Object.keys(rows[0]).join(", "))
      console.log("📄 All data:")
      console.log(JSON.stringify(rows, null, 2))
    }

    // Exit immediately after showing data
    console.log("⏹️ Test completed")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

testElectricSQL()
