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
  username: String,
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
    let username = req.body.username;
    let newUser = await User.create({username});
    newUser.save((err, user) => {
      if (err) res.send("User not found");
      res.send({username: newUser.username, _id: newUser._id})
    })
    
  })
  .get(async (req, res) => {
    await User.find().select('username _id').exec((err, users) => {
      if(err) return res.send("No users");
      res.send(users);
    })
  }
);

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      res.end("User not found");
    }

    let reqDate = new Date(req.body.date).toDateString();

    //reqDate == null ? new Date().toDateString() : new Date(req.body.date).toDateString();

    console.log('reqDate: ', reqDate)

    const log = new Log({
      userId: req.params._id,
      username: user.username,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: reqDate
    });
    console.log('log.date: ', log.date)

    // the log.date is converted to 1989-12-31T06:00:00.000Z

    await log.save();

    res.json({
      username: log.username,
      description: log.description,
      duration: log.duration,
      date: reqDate,
      _id: req.params._id
    });
  } catch (error) {
    res.json({error: error.message});
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const user = await User.findById(req.params._id);
  const limit = Number(req.query.limit) || 0;
  const from = req.query.from || new Date(0);
  const to = req.query.to || new Date(Date.now());

  const log = await Log.find({
    userId: req.params._id,
    date: { $gte: from, $lte: to }
  }).select("-_id -userId -__v").limit(limit);

  let logs = log.map((item) => ({
    description: item.description,
    duration: item.duration,
    date: new Date(item.date).toDateString()
  }));

  res.json({
    _id: req.params._id,
    username: user.username,
    count: log.length,
    log: logs
  })

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
