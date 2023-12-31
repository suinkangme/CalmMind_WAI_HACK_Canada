// server.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();
require('dotenv').config();
app.set('view engine', 'ejs')
const multer = require('multer');
app.use('/public', express.static('public'));
const cors = require('cors');
app.use(cors());
app.use(express.json())
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// google oauth
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Configure express session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: 'auto' } // 'auto' sets the cookie security based on the connection
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Passport serialize
passport.serializeUser((user, done) => done(null, user));
// Passport deserialize
passport.deserializeUser((obj, done) => done(null, obj));




// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if the user already exists in your database
    let credential = await Credential.findOne({ email: profile.emails[0].value });

    // If the user doesn't exist, create a new user
    if (!credential) {
      credential = new Credential({
        email: profile.emails[0].value,
        // Other fields you might want to set
      });
      await credential.save();
    }

    var user = {
      credential: credential,
      profile: profile
    }

    // Pass the user to the callback
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));




// mongoose models
const Counter = require('./models/counter');
const Post = require('./models/post');
const Credential = require('./models/credential');

// connect to mongodb
mongoose.connect(process.env.DB_URL)
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

app.listen(process.env.PORT, function () {
  console.log('Server is listening on port ' + process.env.PORT);
});

// method-override
const methodOverride = require('method-override')
app.use(methodOverride('_method'))







// GET 
app.get('/', function (req, res) {
  if (req.isAuthenticated()) {
    res.render('index.ejs', { user: req.user, isAuthenticated: true });
  } else {
    res.render('index.ejs', { isAuthenticated: false });
  }
});

app.get('/write', function (req, res) {
  if (req.isAuthenticated()) {
    res.render('write.ejs', { user: req.user, isAuthenticated: true });
  } else {
    res.redirect('/login');
  }
});

app.get('/record', function (req, res) {
  if (req.isAuthenticated()) {
    res.render('record.ejs', { user: req.user, isAuthenticated: true });
  } else {
    res.redirect('/login');
  }
});


app.get('/login', function (req, res) {
  if (req.isAuthenticated()) {
    res.render('index.ejs', { user: req.user, isAuthenticated: true });
  } else {
    res.render('login.ejs', { isAuthenticated: false });
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});


// // oauth
// app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


// app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
//     res.redirect('/');
// });

// OAuth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect to the home page or wherever you want
    res.redirect('/');
  });




// help page - anyone can see this page
app.get('/help', function (req, res) {
  res.render('help.ejs', { isAuthenticated: req.isAuthenticated() });
});




// recoommend page
app.get('/recommend', function (req, res) {
  res.render('recommend.ejs', { 
    isAuthenticated: req.isAuthenticated(),
    detected_emotion: "Sadness",
    risk_assessment: "High",
    stress_management_score: "Low",
    journal_prompts: `1. Can you identify any specific events or triggers that may have contributed to this feeling of sadness and weariness? Reflecting on these events or triggers may help you better understand the root cause of your emotions and develop strategies for managing them.
    \n2. What are some small, intentional actions you can take each day to bring a sense of joy and purpose back into your life? By focusing on small, achievable goals, you may find that your overall sense of well-being improves, even if it's just slightly.
    \n3. How have you been taking care of yourself lately? Are there any self-care practices or activities that you find particularly helpful during times of emotional challenge? By prioritizing self-care and self-compassion, you may find that your mental health and overall well-being improve.`,
    music_recommendation: "3HvYANP1uSe561aLBsrhka?si=ce07b03b6e84408b"
   });
});

// // Joy
// app.get('/recommend', function (req, res) {
//   res.render('recommend.ejs', { 
//     isAuthenticated: req.isAuthenticated(),
//     detected_emotion: "Joy",
//     risk_assessment: "No risk",
//     stress_management_score: "Low",
//     journal_prompts: `1. Reflecting on this experience of feeling "light" and "free," can you identify any patterns or habits that may have contributed to this emotional state? \n\n2. How do you think your mindset and emotional state may have shifted over time, and what are some potential factors that could be influencing these changes? \n\n3. As you continue to cultivate this sense of well-being, what strategies or practices could you implement to maintain and deepen this emotional state in the long term?`,
//     music_recommendation: "5J4G3iXGoIv4d5wUZAXtND?si=575365a4232245ad"
//    });
// });

// // disapintment
// app.get('/recommend', function (req, res) {
//   res.render('recommend.ejs', { 
//     isAuthenticated: req.isAuthenticated(),
//     detected_emotion: "Disappointment",
//     risk_assessment: "High",
//     stress_management_score: "Medium",
//     journal_prompts: `1. What are some of the thoughts and beliefs that contribute to the feeling of being weighed down? Can you challenge or reframe these thoughts to offer a more positive perspective?
//     \n2. What are some small steps you could take to break free from the isolation and connect with others? What might be the benefits of taking these steps?
//     \n3. What are some things that bring you joy or comfort when you're feeling overwhelmed? Can you make time for these things in your daily routine?`,
//     music_recommendation: "37i9dQZF1DX3rxVfibe1L0?si=9e7c3a3e0b9f4e1c"
//    });
// });






// detail page
app.get('/detail/:id', function (request, response) {
  if (request.isAuthenticated()) {
    Post.findById(request.params.id)
      .then(result => {
        if (!result) {
          // Handle the case where the post with the given ID doesn't exist
          response.status(404).send("Post not found");
          return;
        }

        // console.log(result);
        response.render('detail.ejs', { detailData: result, isAuthenticated: true });
      })
      .catch(err => {
        console.error(err);
        // Handle the error, for example, by sending a response to the client
        response.status(500).send("Error occurred");
      });
  } else {
    response.redirect('/login');
  }
});




// edit page
app.get('/edit/:id', function (request, response) {
  if (request.isAuthenticated()) {
    Post.findById(request.params.id)
      .then(result => {
        if (!result) {
          // Handle case where no post is found
          response.status(404).send("Post not found");
          return;
        }
        response.render('edit.ejs', { editData: result, isAuthenticated: true });
      })
      .catch(error => {
        console.error('Error finding post:', error);
        response.status(500).send("Error finding the post");
      });
  } else {
    response.redirect('/login');
  }
});




//submit in edit page
app.put('/edit', function (request, response) {
  const postId = request.body.id;

  const updatedData = {
    title: request.body.title,
    date: request.body.date
  };

  Post.updateOne({ _id: postId }, { $set: updatedData })
    .then(result => {
      console.log('Update complete');
      response.redirect('/detail/' + postId);
    })
    .catch(error => {
      console.error('Error updating:', error);
      response.status(500).send("Error updating the post");
    });
});




// TODO : POP-UP, redirecto to /list
//delete 
app.delete('/delete', function (request, response) {
  const postId = request.body.id;

  Post.deleteOne({ _id: postId })
    .then(() => {
      console.log('Terminal: Deletion complete');
      // response.status(200).send({ message: 'Successfully deleted', redirect: '/list' });
      response.status(200).redirect('/list');
    })
    .catch(error => {
      console.error('Error deleting post:', error);
      response.status(500).send({ message: 'Error occurred during deletion' });
    });
});









//multer -voice recordings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './recordings') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.wav')
  }
})

const upload = multer({ storage: storage })

app.post('/upload', upload.single('audio'), (req, res) => {
  res.json({ message: 'File uploaded successfully.', redirect: '/list' });
});






// // write page - send write form to DB
// app.post('/add', async function (request, response) {
//   try {
//     // console.log(request.body)
//     // Fetch the counter document
//     const counter = await Counter.findOne({ name: 'totalPostJournal' });

//     // Increment the totalPost value and save the updated counter document
//     counter.totalPost++;
//     await counter.save();

//     // Create a new post document
//     const newPost = new Post({
//       title: request.body.title,
//       date: request.body.date,
//       credential: request.user.credential._id,

//     });

//     // Save the new post document
//     await newPost.save();


//       response.redirect('/list');
//     } catch (error) {
//       console.error(error);
//       response.status(500).send('Internal Server Error');
//     }
//   });






// let node js to run external script (AI model python script)
const { spawn } = require('child_process');

// write page - send write form to DB
app.post('/add', async function (request, response) {
  try {
    // console.log(request.body)
    // Fetch the counter document
    const counter = await Counter.findOne({ name: 'totalPostJournal' });

    // Increment the totalPost value and save the updated counter document
    counter.totalPost++;
    await counter.save();

    // Create a new post document
    const newPost = new Post({
      title: request.body.title,
      date: request.body.date,
      credential: request.user.credential._id,

    });

    // Save the new post document
    await newPost.save();

    // Call Python script for emotion detection
    const text = request.body.title; // Text to analyze
    const pythonProcess = spawn('python', ['./scripts/emotion_detection_text.py', text]);

    let scriptOutput = "";

    pythonProcess.stdout.on('data', (data) => {
      scriptOutput += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        console.log("Emotion Detection Output:", scriptOutput);
        // Optionally handle the output, e.g., save it to DB, or send back to client
        // Update the Post document with emotion data
        await Post.findByIdAndUpdate(newPost._id, { emotion: scriptOutput });

        // Redirect or respond after processing
        response.redirect('/list');
      } else {
        console.error(`Python script exited with code ${code}`);
        response.status(500).send('Error in processing');
      }
    });
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal Server Error');
  }
});





// list page - Route to render the posts
app.get('/list', (req, res) => {
  if (req.isAuthenticated()) {
    Post.find({ 'credential': req.user.credential._id }).sort({ date: -1 }).exec()
      .then(posts => {
        res.render('list', { posts: posts, isAuthenticated: true });
      })
      .catch(err => {
        console.error("Error fetching posts:", err);
        res.status(500).send("Error fetching posts");
      });
  } else {
    res.redirect('/login');
  }
});


