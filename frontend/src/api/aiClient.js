import axios from "axios";

export const generateTestCases = async (payload) => {
  const response = await axios.post(
    "http://localhost:8080/api/ai/test-cases/generate",
    payload,
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  return response.data;
};
