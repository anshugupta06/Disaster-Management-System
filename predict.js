router.post('/predict', async (req, res) => {
  try {
    const { latitude, longitude, temperature, humidity, windspeed, pressure } = req.body;

    // Example dummy model logic:
    const riskScore = Number(temperature) + Number(humidity) + Number(windspeed);
    let prediction = 'Low Risk';
    if (riskScore > 200) prediction = 'High Risk';
    else if (riskScore > 120) prediction = 'Moderate Risk';

    res.json({ prediction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});
