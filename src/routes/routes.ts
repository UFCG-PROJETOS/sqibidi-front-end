import axios from "axios";

const api = new axios.Axios({
	baseURL: "127.0.0.1:8000",
	headers: { Accept: "application/json" },
});

const getDailyChalenge = () => {
	return api.get("/question/day_question");
};

export const routes = { getDailyChalenge };
