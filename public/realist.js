/* global $ */
/* global firebase */
$(document).ready(() => {
  const prompts = ['elephant', 'bird', 'owl', 'star', 'heart', 'tree', 'hand', 'apple', 'banana', 'crab', 'flower', 'cat', 'cup', 'smiley', 'guitar', 'boat', 'pig', 'octopus', 'eye', 'butterfly', 'bee', 'umbrella', 'frog', 'lightning bolt', 'ice cream cone', 'robot', 'fish', 'whale'];
  const results = {};
  const exclude = ['text', 'font', 'line', 'line art', 'logo', 'shape', 'brand', 'clip art', 'diagram', 'icon', 'screenshot'];
  let img;
  let user;
  let currPrompt;
  let myBoard;

  function initiateGame() {
    // generate and display prompt
    currPrompt = prompts[(Math.floor(Math.random() * prompts.length))];
    $('#prompt h4').html(currPrompt);
    // create canvas and drawing tools
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

  // facebook login
  $('#facebook').on('click', () => {
    const provider = new firebase.auth.FacebookAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
      // const token = result.credential.accessToken;
      user = result.user;
      $('#user').html(user.displayName);
      $('#sign-in').toggle();
    }).catch((error) => {
  // Handle Errors here.
      alert(error.message);
    });
  });

  $('#google').on('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
      // const token = result.credential.accessToken;
      user = result.user;
      $('#user').html(user.displayName);
      $('#sign-in').toggle();
    }).catch((error) => {
  // Handle Errors here.
      alert(error.message);
    });
  });

  // show toast to provide app instructions on initial page load
  const $toastContent = $('<span>Draw the image specified with as much detail as possible. Submit to see if Google can guess what you drew! </span>');
  Materialize.toast($toastContent, 5000);

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

  // read the database contents to create gallery of existing images
  function displayGallery() {
    $.get('https://realist-167521.firebaseio.com/gallery.json?auth=nFFmDovebtKXnx7ge5hZHuIxAkpqWGOtMVImF4UY', (resp) => {
      const galleryArr = [];
      for (const key in resp) {
        galleryArr.push(resp[key]);
      }
      // generate card for each item in database
      function makeCard(obj) {
        const $newCard = $('<div>').addClass('card');
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
    $('#result').html('');
    img = myBoard.getImg();
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
    // call to get labels for current image
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
  // reset game and display drawing board
  $('#replay').on('click', () => {
    initiateGame();
    $('.canvas').toggle();
    $('.results').toggle();
  });
});
