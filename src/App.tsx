import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Container,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import initSqlJs, { type Database, type SqlValue } from "sql.js";

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
		let database: Database | null = null;

		const initDb = async () => {
			try {
				const SQL = await initSqlJs({
					// Required to load the wasm binary asynchronously
					locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
				});

				// Create a new database
				database = new SQL.Database();

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
				setError(
					`Failed to initialize database: ${
						err instanceof Error ? err.message : "Unknown error"
					}`,
				);
				console.error(err);
			}
		};

		initDb();

		// Cleanup function to close the database when the component unmounts
		return () => {
			if (database) {
				database.close();
			}
		};
	}, []);

	const executeQuery = useCallback(async () => {
		if (!query.trim() || !db) return;

		setIsLoading(true);
		setError(null);
		setTableData(null);

		try {
			// Execute the query
			const result = db.exec(query);

			if (result.length === 0) {
				setTableData({
					columns: ["Result"],
					rows: [{ Result: "Query executed successfully (no results)" }],
				});
				return;
			}

			// Get the first result set
			const firstResult = result[0];
			const columns = firstResult.columns;
			const rows = firstResult.values.map((row) => {
				const rowData: Record<string, SqlValue> = {};
				columns.forEach((col, index) => {
					rowData[col] = row[index];
				});
				return rowData;
			});

			setTableData({ columns, rows });
		} catch (err) {
			setError(
				`Error executing query: ${
					err instanceof Error ? err.message : "Unknown error"
				}`,
			);
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	}, [query, db]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			executeQuery();
		}
	};

	// Generate a unique key for each row based on its content
	const generateRowKey = (row: Record<string, SqlValue>, index: number) => {
		return `row-${index}-${Object.values(row).join("-")}`;
	};

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				SQL.js Query Executor
			</Typography>

			<TextField
				fullWidth
				multiline
				minRows={4}
				maxRows={8}
				variant="outlined"
				label="Enter SQL Query"
				placeholder="SELECT * FROM users;"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				onKeyDown={handleKeyDown}
				disabled={isLoading || !db}
				sx={{ mb: 2 }}
			/>

			<Box sx={{ display: "flex", gap: 2, mb: 3 }}>
				<Button
					variant="contained"
					onClick={executeQuery}
					disabled={isLoading || !query.trim() || !db}
					startIcon={isLoading ? <CircularProgress size={20} /> : null}
				>
					{isLoading ? "Executing..." : "Execute (Ctrl+Enter)"}
				</Button>

				<Button
					variant="outlined"
					onClick={() => setQuery("SELECT * FROM users;")}
					disabled={isLoading || !db}
				>
					Sample Query
				</Button>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{error}
				</Alert>
			)}

			{tableData && (
				<Paper sx={{ width: "100%", overflow: "hidden" }}>
					<TableContainer sx={{ maxHeight: 440 }}>
						<Table stickyHeader>
							<TableHead>
								<TableRow>
									{tableData.columns.map((column) => (
										<TableCell key={column}>
											<strong>{column}</strong>
										</TableCell>
									))}
								</TableRow>
							</TableHead>
							<TableBody>
								{tableData.rows.map((row, rowIndex) => (
									<TableRow key={generateRowKey(row, rowIndex)}>
										{tableData.columns.map((column) => (
											<TableCell key={`${column}-${row[column]}`}>
												{String(row[column] ?? "NULL")}
											</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</Paper>
			)}

			{!db && !error && (
				<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
					<CircularProgress size={24} />
					<Typography>Initializing database...</Typography>
				</Box>
			)}
		</Container>
	);
}

export default App;
