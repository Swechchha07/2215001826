require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;
const WINDOW_SIZE = 10;
const TIMEOUT = 500;
const VALID_IDS = ['p', 'f', 'e', 'r'];

let tokenCache = null;

const numberStore = {
  p: [],
  f: [],
  e: [],
  r: []
};

const SERVER_API = {
  p: 'http://20.244.56.144/evaluation-service/primes',
  f: 'http://20.244.56.144/evaluation-service/fibo',
  e: 'http://20.244.56.144/evaluation-service/even',
  r: 'http://20.244.56.144/evaluation-service/rand'
};

const getAccessToken = async () => {
  if (tokenCache) return tokenCache;

  try {
    const res = await axios.post(process.env.AUTH_URL, {
      email: process.env.EMAIL,
      name: process.env.NAME,
      rollNo: process.env.ROLLNO,
      accessCode: process.env.ACCESS_CODE,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET
    }, {
      headers: { "Content-Type": "application/json" }
    });

    tokenCache = res.data.access_token;
    return tokenCache;
  } catch (err) {
    console.error("Auth failed:", err.message);
    throw new Error("Failed to fetch access token");
  }
};

const fetchNumbers = async (id) => {
  try {
    const token = await getAccessToken();
    const source = axios.CancelToken.source();
    const timeout = setTimeout(() => {
      source.cancel("Request timeout exceeded");
    }, TIMEOUT);

    const response = await axios.get(SERVER_API[id], {
      headers: { Authorization: `Bearer ${token} `},
      cancelToken: source.token
    });

    clearTimeout(timeout);
    return response.data.numbers || [];
  } catch (err) {
    console.warn(`Fetch error for ${id}:`, err.message);
    return [];
  }
};

app.get("/numbers/:numberid", async (req, res) => {
  const id = req.params.numberid;

  if (!VALID_IDS.includes(id)) {
    return res.status(400).json({ error: "Invalid number ID" });
  }

  const prevState = [...numberStore[id]];
  const newNumbers = await fetchNumbers(id);

  const currentSet = new Set(numberStore[id]);
  const uniqueNewNumbers = newNumbers.filter(n => !currentSet.has(n));

  numberStore[id].push(...uniqueNewNumbers);
  if (numberStore[id].length > WINDOW_SIZE) {
    numberStore[id] = numberStore[id].slice(-WINDOW_SIZE);
  }

  const avg = numberStore[id].length
    ? numberStore[id].reduce((a, b) => a + b, 0) / numberStore[id].length
    : 0;

  res.json({
    windowPrevState: prevState,
    windowCurrState: numberStore[id],
    numbers: uniqueNewNumbers,
    avg: parseFloat(avg.toFixed(2))
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
