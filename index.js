const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const db = mongoose.connection;

db.on("error", () => {
  console.log("MongoDB connection error");
}).on("open", () => {
  console.log("MongoDB Exercise Tracker running");
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});
let User = mongoose.model('User', userSchema);

const logSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date
});
let Log = mongoose.model('Log', logSchema);

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users')
  .post(async (req, res) => {
    try {
      let username = req.body.username;
      let existingUser = await User.findOne({ username });
  
      if (username === "") res.json({error: "Username required"});
      if (existingUser) return res.json(existingUser)
  
      let user = await User.create({ username });
      res.json(user);
    } catch (error) { res.json({ error: error.message })};
  })
  .get(async (req, res) => {
    try {
      let allUsers = await User.find();
      res.json(allUsers);
    } catch (error) { res.json({ error: error.message })};
  }
);

app.post('/api/users/:_id/exercises', async (req, res) => {
  let userId = req.params._id;
  let description = req.body.description;
  let duration = parseInt(req.body.duration);
  let date = req.body.date;
  try {
    let user = await User.findById(userId);
    if (!user) return res.json({error:  "User ID not found"});
    const newLog = await Log.create({
      userId,
      description,
      duration,
      date: date ? new Date(date) : new Date()
    });
    const log = await newLog.save();
    res.json({
      _id: user._id,
      username: user.username,
      description: log.description,
      duration: log.duration,
      date: new Date(log.date).toUTCString()
    });
  } catch (error) { res.json({ error: error.message })};
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  let userId = req.params._id;
  let user = await User.findById(userId);

  if (!user) {
    return res.json({ error: "User ID not found"});
  }

  let dateObj = {};
  if (from) {
    dateObj["$gte"] = new Date(from);
  }
  if (to) {
    dateObj["$lte"] = new Date(to);
  }

  let filter = {userId};
  if (from || to) {
    filter.date = dateObj;
  }

  const exercises = await Log.find(filter)
    .limit(+limit ?? 999);

  const count = exercises.length;

  const log = exercises.map((exercise) => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
  }));

});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
