import {
  Box, Button, CircularProgress, Container, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, Alert
} from "@mui/material";
import { useEffect, useState } from "react";
import initSqlJs, { Database, SqlValue } from "sql.js";

type TableData = {
  columns: string[];
  rows: Record<string, SqlValue>[];
};

function App() {
	const [query, setQuery] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [tableData, setTableData] = useState<TableData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [db, setDb] = useState<Database | null>(null);

  // Initialize the database with sample data
  useEffect(() => {
    const initDb = async () => {
      try {
        const SQL = await initSqlJs({
          // Required to load the wasm binary asynchronously
          locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
        });
        
        // Create a new database
        const database = new SQL.Database();
        
        // Create a sample table and insert some data
        database.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          
          INSERT OR IGNORE INTO users (name, email) VALUES 
            ('John Doe', 'john@example.com'),
            ('Jane Smith', 'jane@example.com'),
            ('Bob Johnson', 'bob@example.com');
        `);
        
        setDb(database);
      } catch (err) {
        setError(`Failed to initialize database: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error(err);
      }
    };
    
    initDb();
    
    // Cleanup function to close the database when the component unmounts
    return () => {
      if (db) {
        db.close();
      }
    };
  }, []);

	const executeQuery = async () => {
		if (!query.trim()) return;

		setIsLoading(true);
		setError(null);

		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			const sampleData: TableData = {
				columns: ["id", "name", "email"],
				rows: [
					{ id: 1, name: "John Doe", email: "john@example.com" },
					{ id: 2, name: "Jane Smith", email: "jane@example.com" },
					{ id: 3, name: "Bob Johnson", email: "bob@example.com" },
				],
			};

			setTableData(sampleData);
		} catch (err) {
			setError("Error executing query. Please try again.");
			console.error("Query execution error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				SQL Query Interface
			</Typography>

			<Paper sx={{ p: 3, mb: 3 }}>
				<TextField
					fullWidth
					multiline
					minRows={3}
					maxRows={8}
					variant="outlined"
					placeholder="Enter your SQL query here..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					sx={{ mb: 2 }}
				/>
				<Box display="flex" justifyContent="flex-end">
					<Button
						variant="contained"
						color="primary"
						onClick={executeQuery}
						disabled={isLoading || !query.trim()}
						startIcon={
							isLoading ? <CircularProgress size={20} color="inherit" /> : null
						}
					>
						{isLoading ? "Executing..." : "Execute Query"}
					</Button>
				</Box>
			</Paper>

			{error && (
				<Paper sx={{ p: 2, mb: 3, bgcolor: "error.light" }}>
					<Typography color="error">{error}</Typography>
				</Paper>
			)}

			{tableData && (
				<Paper sx={{ width: "100%", overflow: "hidden", mb: 3 }}>
					<TableContainer sx={{ maxHeight: 440 }}>
						<Table stickyHeader>
							<TableHead>
								<TableRow>
									{tableData.columns.map((column) => (
										<TableCell key={column} sx={{ fontWeight: "bold" }}>
											{column}
										</TableCell>
									))}
								</TableRow>
							</TableHead>
							<TableBody>
								{tableData.rows.map((row, rowIndex) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: <biome plmds>
									<TableRow key={rowIndex}>
										{tableData.columns.map((column) => (
											<TableCell key={`${rowIndex}-${column}`}>
												{row[column]?.toString() || "NULL"}
											</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</Paper>
			)}
		</Container>
	);
}

export default App;
