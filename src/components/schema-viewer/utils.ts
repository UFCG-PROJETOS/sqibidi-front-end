import {
	CANVAS_PADDING,
	TABLE_HEADER_HEIGHT,
	TABLE_ROW_HEIGHT,
	TABLE_WIDTH,
} from "./constants";
import type { Table } from "./types";

export const calculateTableHeight = (table: Table): number => {
	return TABLE_HEADER_HEIGHT + table.columns.length * TABLE_ROW_HEIGHT;
};

export const calculateCanvasSize = (
	tables: Table[],
): { width: number; height: number } => {
	if (tables.length === 0) return { width: 800, height: 600 }; // Default size

	let maxX = 0;
	let maxY = 0;

	tables.forEach((table) => {
		if (table.position) {
			const tableRight = table.position.x + TABLE_WIDTH;
			const tableBottom = table.position.y + calculateTableHeight(table);

			if (tableRight > maxX) {
				maxX = tableRight;
			}
			if (tableBottom > maxY) {
				maxY = tableBottom;
			}
		}
	});

	return {
		width: maxX + CANVAS_PADDING,
		height: maxY + CANVAS_PADDING,
	};
};

export const formatType = (type: string): string => {
	return type.toLowerCase().includes("varchar") ? type : type.toUpperCase();
};
