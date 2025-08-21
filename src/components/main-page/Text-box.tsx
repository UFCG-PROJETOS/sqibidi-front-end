import { Box, Button, CircularProgress, TextField } from "@mui/material";
import type { Database } from "sql.js";

export default function TextBox({
	query,
	handleKeyDown,
	setQuery,
	isLoading,
	db,
	executeQuery,
}: TextBoxProps) {
	return (
		<div>
			<TextField
				fullWidth
				multiline
				minRows={4}
				maxRows={8}
				variant="outlined"
				label="Enter SQL Query"
				placeholder="SELECT * FROM users;"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				onKeyDown={handleKeyDown}
				disabled={isLoading || !db}
				sx={{ mb: 2, mt: 3 }}
			/>

			<Box sx={{ display: "flex", gap: 2 }}>
				<Button
					variant="contained"
					onClick={executeQuery}
					disabled={isLoading || !query.trim() || !db}
					startIcon={isLoading ? <CircularProgress size={20} /> : null}
				>
					{isLoading ? "Executing..." : "Execute (Ctrl+Enter)"}
				</Button>

				<Button
					variant="outlined"
					onClick={() => setQuery("SELECT * FROM users;")}
					disabled={isLoading || !db}
				>
					Sample Query
				</Button>
			</Box>
		</div>
	);
}

export type TextBoxProps = {
	query: string;
	handleKeyDown: (e: React.KeyboardEvent) => void;
	setQuery: React.Dispatch<React.SetStateAction<string>>;
	isLoading: boolean;
	db: Database | null;
	executeQuery: () => Promise<void>;
};
