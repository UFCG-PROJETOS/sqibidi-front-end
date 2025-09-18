import {
	Alert,
	Box,
	CircularProgress,
	Container,
	Tab,
	Tabs,
	Typography,
} from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import initSqlJs, { type Database, type SqlValue } from "sql.js";
import Header from "./components/header";
import TableBox from "./components/main-page/TableBox";
import TextBox from "./components/main-page/Text-box";
import SchemaViewer from "./components/schema-viewer/SchemaViewer";
import type { Schema } from "./components/schema-viewer/types";

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
	const [schema, setSchema] = useState<Schema | null>(null);
	const [selectedTable, setSelectedTable] = useState<string | undefined>();
	const [activeTab, setActiveTab] = useState("editor");

	useEffect(() => {
		let databaseFetched: Database | null = null;

		const initDb = async () => {
			try {
				const SQL = await initSqlJs({
					locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
				});

				databaseFetched = new SQL.Database();

				const response = await axios.get(
					"http://localhost:8000/question/day_question/",
				);
				const sqlCode = response.data.code;

				if (databaseFetched) {
					databaseFetched.exec(sqlCode);

					setDb(databaseFetched);

					// Extrai o schema do banco de dados
					const tablesResult = databaseFetched.exec(
						"SELECT name FROM sqlite_master WHERE type='table'",
					);
					if (tablesResult.length > 0) {
						const tables = tablesResult[0].values.map((row, index) => {
							const tableName = row[0] as string;
							const columnsResult = databaseFetched.exec(
								`PRAGMA table_info(${tableName})`,
							);
							const columns = columnsResult[0].values.map(
								(col: SqlValue[]) => ({
									name: col[1] as string,
									type: col[2] as string,
									isPrimaryKey: (col[5] as number) === 1,
								}),
							);

							return {
								name: tableName,
								columns,
								position: {
									x: (index % 3) * 320,
									y: Math.floor(index / 3) * 250,
								},
							};
						});

						setSchema({ tables, relationships: [] });
					}
				} else {
					// Caso algo muito inesperado aconteça
					throw new Error("Database object could not be initialized.");
				}
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
	}, []);

	const executeQuery = useCallback(async () => {
		if (!query.trim() || !db) return;
		setIsLoading(true);
		setError(null);
		setTableData(null);

		try {
			const result = db.exec(query);

			if (result.length === 0) {
				setTableData({
					columns: ["Result"],
					rows: [{ Result: "Query executed successfully (no results)" }],
				});
				return;
			}

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

	const handleTableSelect = (tableName: string) => {
		setSelectedTable(tableName);
		setQuery(`SELECT * FROM ${tableName};`);
		setActiveTab("editor");
	};

	const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
		setActiveTab(newValue);
	};

	return (
		<div>
			<Header />
			<Container maxWidth="lg" sx={{ py: 4 }}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Tabs value={activeTab} onChange={handleTabChange}>
						<Tab label="Editor" value="editor" />
						<Tab label="Schema" value="schema" />
					</Tabs>
				</Box>

				<Box sx={{ pt: 3 }}>
					{activeTab === "editor" && (
						<>
							{isLoading ? (
								<Alert severity="info" sx={{ mb: 3 }}>
									Executing query...
								</Alert>
							) : error ? (
								<Alert severity="error" sx={{ mb: 3 }}>
									{error}
								</Alert>
							) : (
								tableData && <TableBox tableData={tableData} />
							)}

							<TextBox
								query={query}
								handleKeyDown={handleKeyDown}
								setQuery={setQuery}
								isLoading={isLoading}
								db={db}
								executeQuery={executeQuery}
							/>

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
						</>
					)}

					{activeTab === "schema" &&
						(schema ? (
							<SchemaViewer
								schema={schema}
								selectedTable={selectedTable}
								onTableSelect={handleTableSelect}
							/>
						) : (
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 2,
									marginTop: 10,
								}}
							>
								<CircularProgress size={24} />
								<Typography>Loading schema...</Typography>
							</Box>
						))}
				</Box>
			</Container>
		</div>
	);
}

export default App;
