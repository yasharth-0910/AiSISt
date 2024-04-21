var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const axios = require('axios');

const PORT = process.env.PORT || 3000;
const ASOS_API_KEY = '44480c4e9fmshc84bfdc57418cb6p123fe7jsn73b11bdbc0bb';

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/users', usersRouter);

// Route for handling generic errors
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.get('/', (req, res) => {
  res.send('Hello from the server!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Route for fetching weather data and recommending clothing
// Route for fetching weather data and recommending clothing

// Route for fetching weather data and recommending clothing
// Route for fetching weather data and recommending clothing
app.get('/weather', async (req, res) => {
  try {
    // Get the location query parameter from the request
    const { location } = req.query;

    // Make a GET request to the weather API
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=dc96736b27c2073a03c54d79800c90b7`);

    // Extract relevant weather data from the response
    const weatherData = {
      temperature: response.data.main.temp,
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed,
      cloudiness: response.data.clouds.all
    };

    // Determine clothing recommendations based on weather conditions
    let clothingRecommendations = generateClothingRecommendations(weatherData);

    // Fetch clothing recommendations from ASOS API
    const asosClothing = await getASOSClothing(clothingRecommendations);

    // Log the ASOS clothing recommendations response
    console.log('ASOS Clothing Recommendations:', asosClothing);

    // Send the weather data, clothing recommendations, and ASOS clothing back to the client
    res.json({ ...weatherData, clothingRecommendations, asosClothing });
  } catch (error) {
    // Handle any errors
    console.error('Error fetching weather data:', error);
    res.status(500).send('Error fetching weather data');
  }
});


// Function to generate clothing recommendations based on weather conditions
function generateClothingRecommendations(weatherData) {
  let recommendations = '';

  // Temperature-based recommendations
  if (weatherData.temperature < 5) {
    recommendations += 'It\'s freezing cold! Consider wearing heavy winter clothing like a down jacket, scarf, gloves, and boots.';
  } else if (weatherData.temperature < 15) {
    recommendations += 'It\'s cold. Wear a warm jacket, sweater, and trousers.';
  } else if (weatherData.temperature < 25) {
    recommendations += 'It\'s mild. A light jacket or long-sleeve shirt should suffice.';
  } else {  
    recommendations += 'It\'s warm. Opt for light clothing like a t-shirt, shorts, and sandals.';
  }

  // Humidity-based recommendations
  if (weatherData.humidity > 70) {
    recommendations += ' Beware of high humidity. Consider wearing breathable fabrics like cotton to stay comfortable.';
  }

  // Wind speed-based recommendations
  if (weatherData.windSpeed > 10) {
    recommendations += ' It\'s windy. Don\'t forget to wear a windbreaker or a jacket with good wind resistance.';
  }

  return recommendations;
}

async function getASOSClothing(weatherData) {
  try {
    let clothingKeywords = '';

    // Customize clothing keywords based on weather conditions
    if (weatherData.temperature < 5) {
      clothingKeywords = 'winter jacket';
    } else if (weatherData.temperature < 15) {
      clothingKeywords = 'sweater trousers';
    } else if (weatherData.temperature < 25) {
      clothingKeywords = 't-shirt shorts sandals';
    } else {
      clothingKeywords = 't-shirt shorts sandals';
    }

    // Make a GET request to the ASOS API with the customized query
    const response = await axios.get('https://asos2.p.rapidapi.com/v2/auto-complete', {
      params: {
        q: clothingKeywords,
        store: 'US',
        country: 'US',
        currency: 'USD',
        sizeSchema: 'US',
        lang: 'en-US'
      },
      headers: {
        'X-RapidAPI-Key': ASOS_API_KEY,
        'X-RapidAPI-Host': 'asos2.p.rapidapi.com'
      }
    });

    // Return the data from the ASOS API response
    return response.data;
  } catch (error) {
    // Handle any errors
    console.error('Error fetching ASOS clothing recommendations:', error);
    throw new Error('Error fetching ASOS clothing recommendations');
  }
}



module.exports = app;
