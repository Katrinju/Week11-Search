
const express = require('express');
const axios = require('axios');
const http = require('http');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/search', (req, res) => {
    res.render('search', {movieData:''});
});

app.post('/search', (req, res) => {
    let movieTitle = req.body.movieTitle;

    let movieUrl = `https://api.themoviedb.org/3/search/movie?api_key=4ca94f8b470d7e34bd3f59c3914295c8&query=${movieTitle}`;
    let genres = 'https://api.themoviedb.org/3/genre/movie/list?api_key=4ca94f8b470d7e34bd3f59c3914295c8&language=en-US';
   
    let endpoints = [movieUrl, genres];

    axios.all(endpoints.map((endpoint) => axios.get(endpoint)))
    .then(
        axios.spread((movie, genres) => {
            const [general, generalComingSoon] = movie.data.results;
            const movieGenreIds = general.genre_ids;        
            const movieGenres = genres.data.genres; 
            
            let genresArray = [];
            for(let i = 0; i < movieGenreIds.length; i++) {
                for(let j = 0; j < movieGenres.length; j++) {
                    if(movieGenreIds[i] === movieGenres[j].id) {
                        console.log(movieGenres[j].name);
                        genresArray.push(movieGenres[j].name)
                    }
                    
                }
            }

            let genresToDisplay = '';
            genresArray.forEach(genre => {
                genresToDisplay = genresToDisplay+ `${genre}, `;
            });

            genresToDisplay = genresToDisplay.slice(0, -2) + '.';
            
            let movieObject = {
                title: general.original_title,
                year: new Date(general.release_date).getFullYear(),
                overview: general.overview,
                posterUrl: `https://image.tmdb.org/t/p/w500/${general.poster_path}`,
                genres: genresToDisplay

            };

            res.render('search', {movieData: movieObject});
        })
      );
    
});

app.post('/getmovie', (req, res) => {
	const movieToSearch =
		req.body.queryResult && req.body.queryResult.parameters && req.body.queryResult.parameters.movie
			? req.body.queryResult.parameters.movie
			: '';

	const reqUrl = encodeURI(
		`http://www.omdbapi.com/?t=${movieToSearch}&apikey={cc6f9d1b}`
	);
	http.get(
		reqUrl,
		responseFromAPI => {
			let completeResponse = ''
			responseFromAPI.on('data', chunk => {
				completeResponse += chunk
			})
			responseFromAPI.on('end', () => {
				const movie = JSON.parse(completeResponse);
                if (!movie || !movie.Title) {
                    return res.json({
                        fulfillmentText: 'Sorry, we could not find the movie you are asking for.',
                        source: 'getmovie'
                    });
                }

				let dataToSend = movieToSearch;
				dataToSend = `${movie.Title} was released in the year ${movie.Year}. It is directed by ${
					movie.Director
				} and stars ${movie.Actors}.\n Here some glimpse of the plot: ${movie.Plot}.`;

				return res.json({
					fulfillmentText: dataToSend,
					source: 'getmovie'
				});
			})
		},
		error => {
			return res.json({
				fulfillmentText: 'Could not get results at this time',
				source: 'getmovie'
			});
		}
	)
});



app.listen(process.env.PORT || 5000, () => {
    console.log('server is running');
});