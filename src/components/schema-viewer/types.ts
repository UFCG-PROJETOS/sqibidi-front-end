export interface Column {
	name: string;
	type: string;
	isPrimaryKey?: boolean;
	isForeignKey?: boolean;
}

export interface Table {
	name: string;
	columns: Column[];
	position?: { x: number; y: number };
}

export interface Relationship {
	fromTable: string;
	fromColumn: string;
	toTable: string;
	toColumn: string;
}

export interface Schema {
	tables: Table[];
	relationships: Relationship[];
}
