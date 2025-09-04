import {
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import type { SqlValue } from "sql.js";
import type { TableData } from "../../App";

interface TableBoxProps {
	tableData: TableData;
}

export default function TableBox({ tableData }: TableBoxProps) {
	const generateRowKey = (row: Record<string, SqlValue>, index: number) => {
		return `row-${index}-${Object.values(row).join("-")}`;
	};

	if (!tableData.rows.length) {
		return (
			<Paper sx={{ p: 2, mb: 2 }}>
				<Typography>No data available for table {tableData.name}</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ width: "100%", overflow: "hidden", mb: 2 }}>
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
	);
}
