import {
	Alert,
	Box,
	CircularProgress,
	Container,
	Typography,
} from "@mui/material";
// import { Parser } from "node-sql-parser";
// import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import initSqlJs, { type Database, type SqlValue } from "sql.js";
import Header from "./components/header";
import TableBox from "./components/main-page/TableBox";
import TextBox from "./components/main-page/Text-box";
import { createsTablesData } from "./utils/db";

export type TableData = {
	name: string;
	columns: string[];
	rows: Record<string, SqlValue>[];
};

function App() {
	const [query, setQuery] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [tablesData, setTablesData] = useState<TableData[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [db, setDb] = useState<Database | null>(null);

	/**
	 * Creates a the components using the tables of the fetchedBD
	 */
	const fetchAllTables = useCallback(async (db: Database) => {
		try {
			const tablesResult = db.exec(
				"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
			);

			if (tablesResult.length === 0) return;

			const tableNames = tablesResult[0].values.flat() as string[];
			const tables: TableData[] = [];

			for (const tableName of tableNames) {
				try {
					createsTablesData(db, tableName, tables);
				} catch (err) {
					console.error(`Error fetching data for table ${tableName}:`, err);
				}
			}

			setTablesData(tables);
		} catch (err) {
			setError(
				`Error fetching tables: ${err instanceof Error ? err.message : "Unknown error"}`,
			);
		}
	}, []);

	useEffect(() => {
		let databaseFetched: Database | null = null;

		const initDb = async () => {
			try {
				const SQL = await initSqlJs({
					locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
				});

				databaseFetched = new SQL.Database();

				databaseFetched.run(`
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

				setDb(databaseFetched);
				await fetchAllTables(databaseFetched);
			} catch (err) {
				setError(
					`Failed to initialize database: ${
						err instanceof Error ? err.message : "Unknown error"
					}`,
				);
			}
		};

		initDb();

		return () => {
			if (databaseFetched) {
				databaseFetched.close();
			}
		};
	}, [fetchAllTables]);

	/**
	 * Executes the query and modify the Tables shown
	 */
	const executeQuery = useCallback(async () => {
		if (!query.trim() || !db) return;
		setIsLoading(true);
		setError(null);

		try {
			const result = db.exec(query);

			if (result.length === 0) {
				setTablesData([
					{
						name: "Query Result",
						columns: ["Result"],
						rows: [{ Result: "Query executed successfully (no results)" }],
					},
				]);
				return;
			}

			const tables: TableData[] = [];

			for (let i = 0; i < result.length; i++) {
				const queryResult = result[i];
				const columns = queryResult.columns;
				const rows = queryResult.values.map((row) => {
					const rowData: Record<string, SqlValue> = {};
					columns.forEach((col, index) => {
						rowData[col] = row[index];
					});
					return rowData;
				});

				tables.push({
					name: `Result ${i + 1}`,
					columns,
					rows,
				});
			}

			setTablesData(tables);
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
				{error && (
					<Alert severity="error" sx={{ mb: 3 }}>
						{error}
					</Alert>
				)}

				{isLoading && (
					<Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
						<CircularProgress />
					</Box>
				)}

				{tablesData.map((tableData) => (
					<Box key={tableData.name} sx={{ mb: 4 }}>
						<Typography variant="h6" gutterBottom>
							Table: {tableData.name}
						</Typography>
						<TableBox tableData={tableData} />
					</Box>
				))}

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
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 2,
							marginTop: 10,
						}}
					>
						<CircularProgress size={24} />
						<Typography>Initializing database...</Typography>
					</Box>
				)}
			</Container>
		</div>
	);
}

export default App;
