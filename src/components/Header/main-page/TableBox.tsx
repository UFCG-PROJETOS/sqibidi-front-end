import {
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material";
import type { SqlValue } from "sql.js";
import type { TableData } from "../../../App";

export default function TableBox({ tableData }: TableProps) {
	const generateRowKey = (row: Record<string, SqlValue>, index: number) => {
		return `row-${index}-${Object.values(row).join("-")}`;
	};
	return (
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
	);
}

export type TableProps = {
	tableData: TableData;
};
