![REALiST](https://realist-167521.firebaseapp.com/)

Powered By [Drawingboard.js](http://leimi.github.io/drawingboard.js/) and [Google Vision](https://cloud.google.com/vision/).

Playing Pictionary with Google's image recognition technology.

**Realist** allows users to test their drawing skills using Google Vision's image recognition API. Using drawingboard.js, Realist enables users to draw the prompted image and submit that image to Google Vision. Google Vision then returns a list of labels for the image. Each submission is stored in Firebase, along with the given prompt and the artist's name. These stored objects are then returned as a Gallery so each masterpiece may be admired by all users.

## Canvas

The Canvas element is created using the drawingboard.js library.

### Firebase

The Firebase Realtime Database is used to store each of the image objects. These objects are then retrieved and rendered to create the Gallery. Firebase also provides a simple single sign-on interface to allow users to log in using either Google or Facebook. This allows the app to retrieve the user's name to display with their artwork.

### Materialize

The Materialize framework is used to generate and style the html elements. Materialize cards create an easy way to style and present the Gallery.

Thanks for reading and happy drawing!
[REALiST](https://realist-167521.firebaseapp.com/).
