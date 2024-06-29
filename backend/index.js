const express = require("express");
const cors = require("cors")
const morgan = require("morgan")
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

const {globalErrorController} = require('./controllers/errorsController')

const userRouter = require("./Routes/userRoutes");
const adminRouter = require("./Routes/adminRoutes");
const clientRouter = require("./Routes/clientRoutes");
const deliveryOrdersRouter = require("./Routes/deliveryOrdersRoutes");
const deliveryRouter = require("./Routes/deliveryRoutes");


dotenv.config({ path: "./config.env" });

const app = express();

app.use((req, res, next) => {
  req.setTimeout(500000); // 5 seconds
  res.setTimeout(5000); // 5 seconds
  next();
});

app.use(cors());
app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/client/order", clientRouter);
app.use("/api/v1/delivery/order", deliveryOrdersRouter);
app.use("/api/v1/delivery", deliveryRouter);


app.use( globalErrorController )

const DB = process.env.DATABASE;

mongoose
  .connect(DB)
  .then(() => {
    console.log("Connected successfully");
  });
const server = app.listen(3000, "127.0.0.1", () => {
  console.log(`Server is running on port 3000`);
});
server.setTimeout(120000);
