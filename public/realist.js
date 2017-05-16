$(document).ready(() => {
  const prompts = ['elephant', 'bird', 'owl', 'star', 'heart', 'tree', 'hand', 'apple', 'banana', 'crab', 'flower', 'cat', 'cup', 'smiley', 'sun', 'guitar', 'boat', 'pig', 'octopus', 'eye', 'butterfly', 'bee', 'umbrella', 'frog', 'lightning bolt', 'ice cream cone', 'robot', 'fish', 'whale'];
  const currPrompt = prompts[(Math.floor(Math.random() * prompts.length))];
  const results = {};
  const exclude = ['text', 'font', 'line', 'logo', 'shape', 'brand', 'clip art', 'diagram', 'icon', 'screenshot'];
  let img;
  let user;

  const $toastContent = $('<span>Draw the image specified with as much detail as possible. Submit to see if Google can guess what you drew! </span>');
  Materialize.toast($toastContent, 5000);

  // Get a reference to the database service
  const database = firebase.database();

  const provider = new firebase.auth.FacebookAuthProvider();
  firebase.auth().signInWithPopup(provider).then((result) => {
    const token = result.credential.accessToken;
    // The signed-in user info.
    user = result.user;
  });

  $('#prompt h4').html(currPrompt);

  const myBoard = new DrawingBoard.Board('paint', {
    controlsPosition: 'bottom center',
    controls: [
      'Color',
	{ Size: { type: 'dropdown' } },
      'DrawingMode',
      'Navigation',
    ],
    webStorage: false,
  });

  function createResult() {
    results.resultsArr.forEach((item) => {
      const $topResult = $('<h1>');
      const $newResult = $('<h4>');
      const $score = $('<h5>');

      if (results.resultsArr.indexOf(item) === 0) {
        $topResult.html(item.description);
        $score.html(`${(item.score * 100).toFixed(2)}%`);
        $topResult.append($score);
        $('#result').append($topResult);
      } else if (exclude.indexOf(item.description) === -1) {
        $newResult.html(item.description);
        $score.html(`${(item.score * 100).toFixed(2)}%`);
        $newResult.append($score);
        $('#result').append($newResult);
      }
    });
    $('#currImage').append($('<img>').attr('src', results.image));
    $('.canvas').toggle();
    $('.results').toggle();
  }

  function addToGallery() {
  // Get a key for a new Post.
    const newPostKey = firebase.database().ref().child('gallery').push().key;

  // Write the new image and results to gallery database
    const updates = {};
    updates[`/gallery/${newPostKey}`] = results;

    return firebase.database().ref().update(updates);
  }

  function displayGallery() {
    $.get('https://realist-167521.firebaseio.com/gallery.json?auth=nFFmDovebtKXnx7ge5hZHuIxAkpqWGOtMVImF4UY', (resp) => {
      const galleryArr = [];
      for (const key in resp) {
        galleryArr.push(resp[key]);
      }

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
      galleryArr.forEach((item) => {
        $('#gallery').append(makeCard(item));
      });
    }, 'json');
  }

  $('#submit').on('click', (e) => {
    $('#result').html('');
   // get drawingboard content
    img = myBoard.getImg();

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

    $.ajax({
      type: 'POST',
      url: 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyBczLvztRvV0UPWBOWmBDlbupxxsJrzW-g',
      data: JSON.stringify(imageRequest),
      success: (resp) => {
        results.image = img;
        results.resultsArr = resp.responses[0].labelAnnotations;
        results.prompt = currPrompt;
        results.user = user.displayName;
        createResult();
        addToGallery();
        displayGallery();
      },
      contentType: 'application/json',
      dataType: 'json',
    });
  });

  $('#replay').on('click', (e) => {
    location.reload();
  });
});
