const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
let mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

var userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: false,
  },
});

let User = mongoose.model("User", userSchema);

var exerciseSchema = new mongoose.Schema({
  duration: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  user_id: {
    type: String,
    required: true,
  },
});

let Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  var newUser = new User({
    username: req.body.username,
  });
  newUser
    .save()
    .then((user) => res.json({ _id: user._id, username: user.username }));
});

app.get("/api/users", (req, res) => {
  User.find({}).then((users) => res.json(users));
});

app.post("/api/users/:_id/exercises", (req, res) => {
  User.findById(req.params._id).then((user) => {
    var newExercise = new Exercise({
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date || Date.now(),
      user_id: req.params._id,
    });
    newExercise.save().then((exercise) => {
      res.json({
        duration: exercise.duration,
        description: exercise.description,
        date: exercise.date.toDateString(),
        _id: exercise.user_id,
        username: user.username,
      });
    });
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const { from, limit, to } = req.query;
  User.findById(req.params._id).then((user) => {
    var filter = { user_id: user._id };
    if (from) {
      filter.date = { $gte: from };
    }
    if (to) {
      filter.date = { $lte: to };
    }
    Exercise.find(filter)
      .limit(limit || 500)
      .then((exercises) => {
        var log = exercises.map((e) => ({
          duration: e.duration,
          date: e.date.toDateString(),
          description: e.description,
        }));
        res.json({
          _id: user._id,
          username: user.username,
          count: exercises.length,
          log: log,
        });
      });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
