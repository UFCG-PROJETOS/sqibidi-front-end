import {
	Alert,
	Box,
	CircularProgress,
	Container,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import initSqlJs, { type Database, type SqlValue } from "sql.js";
import Header from "./components/Header";
import TableBox from "./components/Header/main-page/TableBox";
import TextBox from "./components/Header/main-page/Text-box";

export type TableData = {
	columns: string[];
	rows: Record<string, SqlValue>[];
};

function App() {
	const [query, setQuery] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [tableData, setTableData] = useState<TableData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [db, setDb] = useState<Database | null>(null);

	useEffect(() => {
		let database: Database | null = null;

		const initDb = async () => {
			try {
				const SQL = await initSqlJs({
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

	return (
		<div>
			<Header />
			<Container maxWidth="lg" sx={{ py: 4 }}>
				{tableData && <TableBox tableData={tableData} />}

				<TextBox
					query={query}
					handleKeyDown={handleKeyDown}
					setQuery={setQuery}
					isLoading={isLoading}
					db={db}
					executeQuery={executeQuery}
				/>

				{error && (
					<Alert severity="error" sx={{ mb: 3 }}>
						{error}
					</Alert>
				)}

				{!db && !error && (
					<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
						<CircularProgress size={24} />
						<Typography>Initializing database...</Typography>
					</Box>
				)}
			</Container>
		</div>
	);
}

export default App;
