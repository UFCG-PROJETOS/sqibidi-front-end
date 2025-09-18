import { useState } from "react";
import {
	TABLE_HEADER_HEIGHT,
	TABLE_ROW_HEIGHT,
	TABLE_WIDTH,
} from "./constants";
import type { Schema } from "./types";
import { calculateCanvasSize, calculateTableHeight, formatType } from "./utils";
import "./SchemaViewer.css";

interface SchemaViewerProps {
	schema: Schema;
	onTableSelect?: (tableName: string) => void;
	selectedTable?: string;
	className?: string;
}

const SchemaViewer: React.FC<SchemaViewerProps> = ({
	schema,
	onTableSelect,
	selectedTable,
	className = "",
}) => {
	const [zoom, setZoom] = useState(1);
	const [panning, setPanning] = useState(false);
	const [panStart, setPanStart] = useState({ x: 0, y: 0 });
	const [offset, setOffset] = useState({ x: 0, y: 0 });

	const handleZoomIn = () => {
		setZoom((prev) => Math.min(prev + 0.1, 2));
	};

	const handleZoomOut = () => {
		setZoom((prev) => Math.max(prev - 0.1, 0.5));
	};

	const handleReset = () => {
		setZoom(1);
		setOffset({ x: 0, y: 0 });
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		setPanning(true);
		setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (panning) {
			setOffset({
				x: e.clientX - panStart.x,
				y: e.clientY - panStart.y,
			});
		}
	};

	const handleMouseUp = () => {
		setPanning(false);
	};

	const handleTableClick = (tableName: string) => {
		onTableSelect?.(tableName);
	};

	const handleTableKeyDown = (e: React.KeyboardEvent, tableName: string) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onTableSelect?.(tableName);
		}
	};

	const { width, height } = calculateCanvasSize(schema.tables);

	return (
		<div className={`schema-viewer ${className}`}>
			<div className="schema-controls">
				<button type="button" onClick={handleZoomIn} title="Zoom In">
					<span>+</span>
				</button>
				<button type="button" onClick={handleZoomOut} title="Zoom Out">
					<span>-</span>
				</button>
				<button type="button" onClick={handleReset} title="Reset View">
					<span>↺</span>
				</button>
				<span className="zoom-level">{Math.round(zoom * 100)}%</span>
			</div>

			<div
				className="schema-container"
				role="application"
				aria-label="Visualizador de esquema do banco de dados"
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
			>
				<div
					className="schema-canvas"
					style={{
						width: `${width}px`,
						height: `${height}px`,
						transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
					}}
				>
					{/* Render relationships */}
					{schema.relationships.map((rel) => {
						const fromTable = schema.tables.find(
							(t) => t.name === rel.fromTable,
						);
						const toTable = schema.tables.find((t) => t.name === rel.toTable);

						if (!fromTable?.position || !toTable?.position) return null;

						const fromColIndex = fromTable.columns.findIndex(
							(c) => c.name === rel.fromColumn,
						);
						const toColIndex = toTable.columns.findIndex(
							(c) => c.name === rel.toColumn,
						);

						const fromX = fromTable.position.x + TABLE_WIDTH;
						const fromY =
							fromTable.position.y +
							TABLE_HEADER_HEIGHT +
							fromColIndex * TABLE_ROW_HEIGHT +
							TABLE_ROW_HEIGHT / 2;

						const toX = toTable.position.x;
						const toY =
							toTable.position.y +
							TABLE_HEADER_HEIGHT +
							toColIndex * TABLE_ROW_HEIGHT +
							TABLE_ROW_HEIGHT / 2;

						const length = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
						const angle =
							(Math.atan2(toY - fromY, toX - fromX) * 180) / Math.PI;

						return (
							<div
								key={`${rel.fromTable}-${rel.fromColumn}-${rel.toTable}-${rel.toColumn}`}
								className="relationship-line"
								style={{
									left: `${fromX}px`,
									top: `${fromY}px`,
									width: `${length}px`,
									transform: `rotate(${angle}deg)`,
								}}
							/>
						);
					})}

					{/* Render tables */}
					{schema.tables.map((table) => (
						<button
							type="button"
							key={table.name}
							className={`table-box ${selectedTable === table.name ? "selected" : ""}`}
							style={{
								left: table.position?.x || 0,
								top: table.position?.y || 0,
								width: `${TABLE_WIDTH}px`,
								height: `${calculateTableHeight(table)}px`,
							}}
							onClick={() => handleTableClick(table.name)}
							onKeyDown={(e) => handleTableKeyDown(e, table.name)}
							aria-label={`Tabela ${table.name}. Clique para selecionar`}
						>
							<div className="table-header">
								<span className="table-icon" aria-hidden="true">
									📊
								</span>
								<span className="table-name">{table.name}</span>
							</div>
							<div className="table-columns">
								{table.columns.map((column) => (
									<div key={column.name} className="table-column">
										<span className="column-key">
											{column.isPrimaryKey && <span className="pk">PK</span>}
											{column.isForeignKey && <span className="fk">FK</span>}
										</span>
										<span className="column-name">{column.name}</span>
										<span className="column-type">
											{formatType(column.type)}
										</span>
									</div>
								))}
							</div>
						</button>
					))}
				</div>
			</div>

			<div className="schema-legend">
				<div className="legend-item">
					<span className="key-indicator pk">PK</span>
					<span>Chave Primária</span>
				</div>
				<div className="legend-item">
					<span className="key-indicator fk">FK</span>
					<span>Chave Estrangeira</span>
				</div>
			</div>
		</div>
	);
};

export default SchemaViewer;
