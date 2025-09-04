import type { Database, SqlValue } from "sql.js";
import type { TableData } from "../App";

export function createsTablesData(
	db: Database,
	tableName: string,
	tables: TableData[],
) {
	const dataResult = db.exec(`SELECT * FROM "${tableName}"`);

	if (dataResult.length > 0) {
		const columns = dataResult[0].columns;
		const rows = dataResult[0].values.map((row) => {
			const rowData: Record<string, SqlValue> = {};
			columns.forEach((col, index) => {
				rowData[col] = row[index];
			});
			return rowData;
		});

		tables.push({
			name: tableName,
			columns,
			rows,
		});
	}
}
