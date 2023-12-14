const mongoose = require('mongoose');
const dotenv = require('dotenv');

//Unhandled Exceptions
process.on('uncaughtException', err => {
  console.log(`Error : ${err.name}, ${err.message}`);
  //shutting down the app
  console.log('Uncaught Exception');
  console.log('Shutting down app');
  //server.close(() => process.exit(1)); //1 - Uncaught exception
});

dotenv.config({
  path: './config.env'
});
const app = require('./app');

const db = process.env.DB_NAME.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(conn =>
    console.log(`Connected to database successfully. ${conn.connection.host}`)
  );

//console.log(process.env);
//Starting server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port : ${port}`);
});

//Unhandled Rejection
process.on('unhandledRejection', err => {
  console.log(`Error : ${err.name}, ${err.message}`);
  //shutting down the app
  console.log('Unhandled Rejection');
  console.log('Shutting down app');
  server.close(() => process.exit(1)); //1 - Uncaught exception
});

// const testTour = new Tour({
//     name: 'The Park Camper',
//     price: 999,
//   });

//   testTour
//     .save()
//     .then((doc) => {
//       console.log(doc);
//     })
//     .catch((error) => {
//       console.log(`Error: ${error}`);
//     });
