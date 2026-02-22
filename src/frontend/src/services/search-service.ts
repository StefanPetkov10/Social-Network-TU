import api from "../lib/axios";

export const searchService = {
    searchUsers: async (query: string) => {
        if (!query || query.length === 0) return { data: [] };
        const response = await api.get(`/api/Search/users`, { params: { search: query } });
        return response.data;
    },
};
