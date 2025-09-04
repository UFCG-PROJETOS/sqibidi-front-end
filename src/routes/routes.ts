import axios from "axios";

const api = axios.create({
	baseURL: "http://localhost:8000",
});

const getDailyChalenge = () => {
	return api.get("/question/day_question");
};

export const routes = { getDailyChalenge };
