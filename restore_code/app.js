var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require("passport");
const cors = require("cors");
const mongoose = require("mongoose");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// --- Configuration and Middleware ---

// CORS for all Express routes
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

require("dotenv").config();
require("./src/utils/googlePassport"); // Initialize Google Strategy
require("./src/models/loadModels") // Load Mongoose models

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json());
app.use(passport.initialize());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors()); // Note: You had cors defined twice; removed the duplicate

// --- Routing ---

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/api/hello", (req, res) => {
  res.json({ "message": "hello world" });
});

const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);

const adminRoutes = require("./src/routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const pilotRoutes = require("./src/routes/pilotRoutes");
app.use("/api/pilot", pilotRoutes);

const consumerRoutes = require("./src/routes/consumerRoutes");
app.use("/api/consumer", consumerRoutes);

const locationRoutes = require("./src/routes/locationRoutes");
app.use("/api/locations", locationRoutes);

//----socket setup ----
// const Socket = require("./src/models/socketModel");
// const {Server} = require("socket.io");

// const server = require("http").createServer(app);
// const io= new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"]
//   }
// });


// io.on("connection", async (socket) => {
//   console.log("Pilot connected, socket ID:", socket.id);
//   socket.on("pilot-online", async (data) => {
//     const { pilotId } = data;
//     console.log("pilot-online event received for pilotId:", pilotId); 
//     const SocketDoc = new Socket({
//       userId:pilotId,
//       socketId: socket.id,
//     });
//     await SocketDoc.save();
//     console.log("Socket document saved for pilotId:", pilotId);
//   });

//   socket.on("pilot-offline", async (data) => {
//     const { pilotId } = data;
//     console.log("pilot-offline event received for pilotId:", pilotId); 
//     await Socket.deleteOne({ pilotId });
//     console.log("Socket document deleted for pilotId:", pilotId);
//   });

//   socket.on("disconnect", async () => {
//     console.log("Pilot disconnected, socket ID:", socket.id);
//     await Socket.deleteOne({ socketId: socket.id });
//   });
// });
const {initSocket} = require("./src/socket");
const server = require("http").createServer(app);
initSocket(server);
// Catch 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// ✅ Start the server here
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
