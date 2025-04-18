const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());


const registrationData = {
  email: "swechchha.nigam_cs22@gla.ac.in",
  name: "Swechchha Nigam",
  mobileNo: "9068124109",
  githubUsername: "Swechchha07",
  rollNo: "2215001826"
};


async function register() {
  try {
    const response = await axios.post(
      'http://20.244.56.144/evaluation-service/register',
      registrationData
    );
    console.log('Registered successfully:', response.data);
  } catch (err) {
    console.error('Registration failed:', err.message);
  }
}

register();


const windowSize = 10;
let windowNumbers = [];


function updateWindow(newNumbers) {
  const uniqueNew = newNumbers.filter(n => !windowNumbers.includes(n));
  windowNumbers = [...windowNumbers, ...uniqueNew].slice(-windowSize);
  return uniqueNew;
}


function calculateAvg(numbers) {
  if (!numbers.length) return 0;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return parseFloat((sum / numbers.length).toFixed(2));
}


async function fetchAndRespond(type, endpoint, res) {
  try {
    const response = await axios.get(endpoint);
    const receivedNumbers = response.data.numbers;
    const prevWindow = [...windowNumbers];
    const newNumbers = updateWindow(receivedNumbers);
    const avg = calculateAvg(windowNumbers);

    res.json({
      windowPrevState: prevWindow,
      windowCurrState: windowNumbers,
      numbers: newNumbers,
      avg
    });
  } catch (err) {
    res.status(500).json({ error: `Error fetching ${type} numbers: ${err.message}` });
  }
}

app.get('/numbers/p', (req, res) => {
  fetchAndRespond('prime', 'http://20.244.56.144/evaluation-service/primes', res);
});

app.get('/numbers/e', (req, res) => {
  fetchAndRespond('even', 'http://20.244.56.144/evaluation-service/even', res);
});

app.get('/numbers/f', (req, res) => {
  fetchAndRespond('fibonacci', 'http://20.244.56.144/evaluation-service/fibo', res);
});

app.get('/numbers/r', (req, res) => {
  fetchAndRespond('random', 'http://20.244.56.144/evaluation-service/rand', res);
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
