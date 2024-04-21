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

 
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));


  app.use('/', indexRouter);
  app.use('/users', usersRouter);

  
  app.use(function(err, req, res, next) {
    
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    
    res.status(err.status || 500);
    res.render('error');
  });

  app.get('/', (req, res) => {
    res.send('Hello from the server!');
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  
  app.get('/weather', async (req, res) => {
    try {
      
      const { location } = req.query;

      
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=dc96736b27c2073a03c54d79800c90b7`);

      
      const temperatureKelvin = response.data.main.temp;
      const temperatureCelsius = temperatureKelvin;
      const weatherData = {
        temperature: temperatureCelsius,
        description: response.data.weather[0].description,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        cloudiness: response.data.clouds.all
      };

      
      let clothingRecommendations = generateClothingRecommendations(weatherData);

      
      const asosClothing = await getASOSClothing(clothingRecommendations);

      
      console.log('ASOS Clothing Recommendations:', asosClothing);

      
      res.json({ ...weatherData, clothingRecommendations, asosClothing });
    } catch (error) {
      
      console.error('Error fetching weather data:', error);
      res.status(500).send('Error fetching weather data');
    }
  });



  function generateClothingRecommendations(weatherData) {
    let recommendations = '';

    
    const temperature = weatherData.temperature -273;
    if (temperature < 5) {
      recommendations += 'It\'s freezing cold! Consider wearing heavy winter clothing like a down jacket, scarf, gloves, and boots.';
    } else if (temperature >= 5 && temperature < 15) {
      recommendations += 'It\'s cold. Wear a warm jacket, sweater, and trousers.';
    } else if (temperature >= 15 && temperature < 25) {
      recommendations += 'It\'s mild. A light jacket or long-sleeve shirt should suffice.';
    } else if (temperature >= 25 && temperature < 35) {
      recommendations += 'It\'s warm. Opt for light clothing like a t-shirt, shorts, and sandals.';
    } else {
      recommendations += 'It\'s very hot outside. Go for cotton style clothing.';
    }

    
    if (weatherData.humidity > 70) {
      recommendations += ' Beware of high humidity. Consider wearing breathable fabrics like cotton to stay comfortable.';
    }

    
    if (weatherData.windSpeed > 10) {
      recommendations += ' It\'s windy. Don\'t forget to wear a windbreaker or a jacket with good wind resistance.';
    }

    return recommendations;
  }


  async function getASOSClothing(weatherData) {
    try {
      let clothingKeywords = '';

      
      if (weatherData.temperature < 5) {
        clothingKeywords = 'winter jacket';
      } else if (5<weatherData.temperature < 15) {
        clothingKeywords = 'sweater trousers';
      } else if (15<weatherData.temperature < 25) {
        clothingKeywords = 't-shirt shorts sandals';
      } else {
        clothingKeywords = 't-shirt shorts sandals';
      }

      
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

    
      return response.data;
    } catch (error) {
      

      console.error('Error fetching ASOS clothing recommendations:', error);
      throw new Error('Error fetching ASOS clothing recommendations');
    }
  }



  module.exports = app;
