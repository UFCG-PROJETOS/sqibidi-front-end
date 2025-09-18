import {
	Alert,
	Box,
	CircularProgress,
	Container,
	Snackbar,
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

const regexChecker =
	/(\s*([\0\b\'\"\n\r\t\%\_\\]*\s*(((select\s+\S.*\s+from\s+\S+)|(insert\s+into\s+\S+)|(update\s+\S+\s+set\s+\S+)|(delete\s+from\s+\S+)|(((drop)|(create)|(alter)|(backup))\s+((table)|(index)|(function)|(PROCEDURE)|(ROUTINE)|(SCHEMA)|(TRIGGER)|(USER)|(VIEW))\s+\S+)|(truncate\s+table\s+\S+)|(exec\s+)|(\/\*)|(--)))(\s*[\;]\s*)*)+)/i;

function App() {
	const [query, setQuery] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [tableData, setTableData] = useState<TableData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [db, setDb] = useState<Database | null>(null);
	const [schema, setSchema] = useState<Schema | null>(null);
	const [selectedTable, setSelectedTable] = useState<string | undefined>();
	const [activeTab, setActiveTab] = useState("editor");
	const [expectedResult, setExpectedResult] = useState<TableData | null>(null);
	const [isQuestionLoading, setIsQuestionLoading] = useState(true);
	const [feedback, setFeedback] = useState<{
		message: string;
		type: "success" | "error";
	} | null>(null);

	const areTableDataEqual = useCallback(
		(data1: TableData | null, data2: TableData | null): boolean => {
			if (!data1 || !data2) {
				return false;
			}

			if (
				data1.columns.length !== data2.columns.length ||
				!data1.columns.every((col, i) => col === data2.columns[i])
			) {
				return false;
			}

			if (data1.rows.length !== data2.rows.length) {
				return false;
			}

			for (let i = 0; i < data1.rows.length; i++) {
				const row1 = data1.rows[i];
				const row2 = data2.rows[i];

				const keys1 = Object.keys(row1);
				const keys2 = Object.keys(row2);

				if (
					keys1.length !== keys2.length ||
					!keys1.every((key) => keys2.includes(key))
				) {
					return false;
				}

				for (const key of keys1) {
					if (row1[key] !== row2[key]) {
						return false;
					}
				}
			}

			return true;
		},
		[],
	);

	useEffect(() => {
		let databaseFetched: Database | null = null;

		const initDb = async () => {
			try {
				const SQL = await initSqlJs({
					locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
				});

				databaseFetched = new SQL.Database();

				const dayQuestionResponse = await axios.get(
					"http://localhost:8000/question/day_question/",
				);
				const sqlCode = dayQuestionResponse.data.code;
				const questionId = dayQuestionResponse.data.id;

				if (!questionId) {
					throw new Error("ID da questão diária não foi retornado pela API.");
				}

				if (databaseFetched) {
					const dbInstance = databaseFetched;

					dbInstance.exec(sqlCode);
					setDb(dbInstance);

					const tablesResult = dbInstance.exec(
						"SELECT name FROM sqlite_master WHERE type='table'",
					);
					if (tablesResult.length > 0) {
						const tables = tablesResult[0].values.map((row, index) => {
							const tableName = row[0] as string;
							const columnsResult = dbInstance.exec(
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
					throw new Error("Database object could not be initialized.");
				}

				const expectedAnswerResponse = await axios.get(
					`http://localhost:8000/question/${questionId}`,
				);
				const rawExpectedAnswer = expectedAnswerResponse.data.expected_answer;
				let formattedExpectedAnswer: TableData | null = null;

				if (Array.isArray(rawExpectedAnswer)) {
					const columns =
						rawExpectedAnswer.length > 0
							? Object.keys(rawExpectedAnswer[0])
							: [];
					const rows = rawExpectedAnswer;

					formattedExpectedAnswer = {
						columns: columns,
						rows: rows,
					};
				}
				setExpectedResult(formattedExpectedAnswer);
			} catch (err) {
				setError(
					`Failed to initialize database: ${
						err instanceof Error ? err.message : "Unknown error"
					}`,
				);
			} finally {
				setIsQuestionLoading(false);
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
			if (regexChecker.test(query)) throw new Error("Invalid SQL query");
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

			const userResult: TableData = { columns, rows };
			setTableData(userResult);

			if (expectedResult) {
				if (areTableDataEqual(userResult, expectedResult)) {
					setFeedback({ message: "Parabéns! Você acertou!", type: "success" });
				} else {
					setFeedback({
						message: "Tente novamente. O resultado não está correto.",
						type: "error",
					});
				}
			}
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
	}, [query, db, expectedResult, areTableDataEqual]);

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
						<Tab label="Resposta Esperada" value="expected" />
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

					{activeTab === "expected" &&
						(isQuestionLoading ? (
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 2,
									marginTop: 10,
								}}
							>
								<CircularProgress size={24} />
								<Typography>Carregando resposta esperada...</Typography>
							</Box>
						) : expectedResult ? (
							<TableBox tableData={expectedResult} />
						) : (
							<Alert severity="warning">
								A resposta esperada não foi fornecida para este desafio.
							</Alert>
						))}
				</Box>
			</Container>

			{feedback && (
				<Snackbar
					open
					autoHideDuration={6000}
					onClose={() => setFeedback(null)}
					anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
				>
					<Alert
						onClose={() => setFeedback(null)}
						severity={feedback.type}
						sx={{ width: "100%" }}
					>
						{feedback.message}
					</Alert>
				</Snackbar>
			)}
		</div>
	);
}

export default App;
