/* global $ */
/* global firebase */
$(document).ready(() => {
  const prompts = ['elephant', 'bird', 'owl', 'star', 'book', 'shoe', 'candle',
    'alligator', 'monkey', 'coin', 'cheese', 'dog', 'car', 'fire', 'chair', 'lion',
    'hammer', 'turkey', 'snail', 'snake', 'hamburger', 'santa', 'plane', 'cactus',
    'the planet Saturn', 'flamingo', 'horse', 'heart', 'tree', 'hand', 'apple',
    'banana', 'crab', 'flower', 'cat', 'smiley', 'guitar', 'boat', 'pig', 'octopus',
    'eye', 'butterfly', 'bee', 'umbrella', 'frog', 'lightning bolt', 'ice cream cone',
    'robot', 'fish', 'whale'];
  const exclude = ['text', 'font', 'line', 'line art', 'logo', 'shape', 'brand', 'clip art', 'diagram', 'icon', 'screenshot'];
  const results = {};
  let user;
  let currPrompt;
  let myBoard;

// create canvas/drawing tools and display drawing prompt
  function initiateGame() {
    currPrompt = prompts[(Math.floor(Math.random() * prompts.length))];
    $('#prompt h4').html(currPrompt);
    $('#paint').html('');
    myBoard = new DrawingBoard.Board('paint', {
      controlsPosition: 'bottom center',
      size: 5,
      controls: [
        'Color',
        { Size: { type: 'dropdown' } },
        'DrawingMode',
        'Navigation',
      ],
      webStorage: false,
    });
  }
  initiateGame();

  // create results display based on api response
  function createResult() {
    $('#result').html('');
    results.resultsArr.forEach((item) => {
      const result = $('#result');
      const $topResult = $('<h1>');
      const $newResult = $('<h4>');
      const $score = $('<h5>');

      if (results.resultsArr.indexOf(item) === 0) {
        $topResult.html(item.description);
        $score.html(`${(item.score * 100).toFixed(2)}%`);
        $topResult.append($score);
        result.append($topResult);
      } else if (exclude.indexOf(item.description) === -1) {
        $newResult.html(item.description);
        $score.html(`${(item.score * 100).toFixed(2)}%`);
        $newResult.append($score);
        result.append($newResult);
      }
    });
    $('#currImage').html($('<img>').attr('src', results.image).addClass('current'));
    $('.canvas').toggle();
    $('.results').toggle();
  }

  // write the current drawing and results to the database
  function addToGallery() {
    const newPostKey = firebase.database().ref().child('gallery').push().key;
    const updates = {};
    updates[`/gallery/${newPostKey}`] = results;
    return firebase.database().ref().update(updates);
  }

  // read the database contents to create gallery of existing images and results
  function displayGallery() {
    $('#gallery').html('');
    $.get('https://realist-167521.firebaseio.com/gallery.json?auth=nFFmDovebtKXnx7ge5hZHuIxAkpqWGOtMVImF4UY', (resp) => {
      const galleryArr = [];
      for (const key in resp) {
        galleryArr.push(resp[key]);
      }
      // generate card element for each item in database
      function makeCard(obj) {
        const $newCard = $('<div>').addClass('card col s12 m4 13');
        const $cardImage = $('<div>').addClass('card-image');
        const $newImage = $('<img>').attr('src', obj.image);
        const $cardTitle = $('<span>').addClass('card-title grey-text').html(obj.prompt);
        const $cardContent = $('<div>').addClass('card-content');

        if ('user' in obj) {
          $cardTitle.html(`${obj.prompt}: ${obj.user}`);
        }

        obj.resultsArr.forEach((item) => {
          if (exclude.indexOf(item.description) === -1) {
            const $newHead = $('<h5>').html(item.description);
            const $newPara = $('<p>').html(`${(item.score * 100).toFixed(2)}%`);

            $cardContent.append($newHead);
            $cardContent.append($newPara);
          }
        });

        $cardImage.append($newImage);
        $cardImage.append($cardTitle);
        $newCard.append($cardImage);
        $newCard.append($cardContent);

        return $newCard;
      }
      // call makeCard function for each item returned from database
      galleryArr.forEach((item) => {
        $('#gallery').append(makeCard(item));
      });
    }, 'json');
  }

  $('#submit').on('click', () => {
    const img = myBoard.getImg();
    $('#result').html('');
    // create data for POST request
    const imageRequest = {
      requests: [
        {
          image: {
            content: img.slice(img.indexOf(',') + 1),
          },
          features: [
            {
              type: 'LABEL_DETECTION',
            },
          ],
        },
      ],
    };
    // API call to get labels for current image
    // on success, create database object and call functions to display results and gallery
    $.ajax({
      type: 'POST',
      url: 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyBczLvztRvV0UPWBOWmBDlbupxxsJrzW-g',
      data: JSON.stringify(imageRequest),
      success: (resp) => {
        results.image = img;
        results.resultsArr = resp.responses[0].labelAnnotations;
        results.prompt = currPrompt;
        results.user = (typeof user === 'undefined' ? 'anonymous' : user.displayName);
        createResult();
        addToGallery();
        displayGallery();
      },
      contentType: 'application/json',
      dataType: 'json',
    });
  });
  // reset game and display drawing board when click 'Play Again' button
  $('#replay').on('click', () => {
    $('.canvas').toggle();
    $('.results').toggle();
    initiateGame();
  });

  // MAKE CANVAS RESPONSIVE
  $(window).resize(() => {
    const boardImage = myBoard.getImg();
    const penSize = myBoard.opts.size;
    const penColor = myBoard.color;
    // create canvas and drawing tools
    $('#paint').html('');
    myBoard = new DrawingBoard.Board('paint', {
      controlsPosition: 'bottom center',
      size: (penSize * 1),
      color: penColor,
      background: boardImage,
      eraserColor: '#fff',
      controls: [
        'Color',
        { Size: { type: 'dropdown' } },
        'DrawingMode',
        'Navigation',
      ],
      webStorage: false,
      stretchImg: true,
    });
    myBoard.ctx.lineCap = 'round';
    myBoard.ctx.lineJoin = 'round';
  });

  // USER LOGIN
  function login(prov) {
    firebase.auth().signInWithPopup(prov).then((result) => {
        // const token = result.credential.accessToken;
      user = result.user;
      $('.user').html(user.displayName);
      $('.user-info').toggle();
      $('.sign-in').toggle();
    });
  }
    // facebook login
  $('.facebook').on('click', () => {
    const provider = new firebase.auth.FacebookAuthProvider();
    login(provider);
  });
    // google login
  $('.google').on('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    login(provider);
  });
  // user logout
  $('.logout').on('click', () => {
    location.reload();
  });
// enable mobile side nav
  $('.button-collapse').sideNav({
    edge: 'right',
    closeOnClick: true,
    draggable: true,
  },
 );
});
