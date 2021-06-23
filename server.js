var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mysql = require("mysql");
var cors = require("cors");

var isProduct = false;

//dev

var whitelist = [
  "https://ten-ticker-cms-dev.herokuapp.com",
  "http://ten-ticker-cms-dev.herokuapp.com",
  "http://cms.tentickers.net",
  "https://cms.tentickers.net",
];
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(isProduct ? corsOptions : { origin: "http://localhost:3001" }));

//local
// app.use(cors({ origin: "http://localhost:3001" }));

//product
// app.use(cors({ origin: "https://ten-ticker-cms.herokuapp.com" }));

app.use(bodyParser.json({ type: "application/json" }));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.all("*", function (req, res, next) {
  /**
   * Response settings
   * @type {Object}
   */
  var responseSettings = {
    AccessControlAllowOrigin: req.headers.origin,
    AccessControlAllowHeaders:
      "Content-Type,X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5,  Date, X-Api-Version, X-File-Name",
    AccessControlAllowMethods: "POST, GET, PUT, DELETE, OPTIONS",
    AccessControlAllowCredentials: true,
  };

  /**
   * Headers
   */
  res.header(
    "Access-Control-Allow-Credentials",
    responseSettings.AccessControlAllowCredentials
  );
  res.header(
    "Access-Control-Allow-Origin",
    responseSettings.AccessControlAllowOrigin
  );
  res.header(
    "Access-Control-Allow-Headers",
    req.headers["access-control-request-headers"]
      ? req.headers["access-control-request-headers"]
      : "x-requested-with"
  );
  res.header(
    "Access-Control-Allow-Methods",
    req.headers["access-control-request-method"]
      ? req.headers["access-control-request-method"]
      : responseSettings.AccessControlAllowMethods
  );

  if ("OPTIONS" == req.method) {
    res.send(200);
  } else {
    next();
  }
});

app.get("/", function (req, res) {
  return res.send({ error: false, message: "hello Linh Ken" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log("Node app is running on port 3000");
});

//product cPanel db_config
var db_config = isProduct
  ? {
      host: "localhost",
      // user: "zcegdeab_ten_ticker",
      user: "zcegdeab_linhken_ten_ticker",
      password: "silinh66*",
      // password: "D8XW!d[Lkm$p",

      database: "zcegdeab_ten_ticker",
    }
  : {
      // host: "us-cdbr-east-03.cleardb.com",
      // user: "bc74e7c7dc5b9e",
      // password: "f04abeb4",
      // database: "heroku_47bd66779dcda20",

      //local
      host: "localhost",
      user: "root",
      password: "123456",
      database: "my_money",
    };

//dev heroku db_config
// var db_config = {
//   host: "us-cdbr-east-03.cleardb.com",
//   user: "bc74e7c7dc5b9e",
//   password: "f04abeb4",
//   database: "heroku_47bd66779dcda20",
// };

var dbMyMoney;

//dev heroku
// var dbMyMoney = mysql.createConnection({
//   host: "us-cdbr-east-03.cleardb.com",
//   user: "bc74e7c7dc5b9e",
//   password: "f04abeb4",
//   database: "heroku_47bd66779dcda20",
// });

//product heroku
// var dbMyMoney = mysql.createConnection({
//   host: "us-cdbr-east-03.cleardb.com",
//   user: "b2b329e77fd088",
//   password: "57100c49",
//   database: "heroku_6d453306171d11b",
// });

//local
// var dbMyMoney = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "123456",
//   database: "ten_ticker",
// });
function handleDisconnect() {
  dbMyMoney = mysql.createConnection(db_config);
  console.log("restart");
  dbMyMoney.connect(function (err) {
    console.log("Connection OK");
    if (err) {
      console.log("error when connecting to db:", err);
      setTimeout(handleDisconnect, 2000);
    }
  });

  dbMyMoney.on("error", function (err) {
    console.log("db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      // Connection to the MySQL server is usually
      handleDisconnect(); // lost due to either server restart, or a
    } else {
      // connnection idle timeout (the wait_timeout
      throw err; // server variable configures this)
    }
  });
}

handleDisconnect();

/*------------------DATA---------------------*/
// Retrieve all data
app.get("/mymoney", function (req, res) {
  let user_id = req.query.user_id || 1;
  let date = req.query.date;
  // console.log("date", date);
  dbMyMoney.query(
    "SELECT * FROM data where user_id = ? && DATE_FORMAT(date,'%Y%m') = ?",
    [user_id, date],
    function (error, results, fields) {
      if (error) throw error;
      return res.send({ error: false, data: results, message: "data list." });
    }
  );
});

// Retrieve data with id
app.get("/mymoney/:id", function (req, res) {
  let data = req.body.data;
  if (!data) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide data" });
  }
  dbMyMoney.query(
    "SELECT * FROM data where id=? & user_id = ?",
    [...data],
    function (error, results, fields) {
      if (error) throw error;
      return res.send({
        error: false,
        data: results[0],
        message: "data list.",
      });
    }
  );
});

// Add a new data
app.post("/mymoney/add", function (req, res) {
  let data = req.body;
  console.log("req", req.body);
  if (!data) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide data" });
  }
  dbMyMoney.query(
    "INSERT INTO data VALUES (?, ?, ?, ?, ?, ?)",
    [...data],
    function (error, results, fields) {
      if (error) throw error;
      return res.send({
        error: false,
        data: results,
        message: "New data has been created successfully.",
      });
    }
  );
});

//  Update data with id
app.put("/mymoney", function (req, res) {
  let data_id = req.body.data_id;
  let data = req.body.data;
  console.log("data_id", data_id);
  console.log("data", data[22]);
  if (!data_id || !data) {
    return res
      .status(400)
      .send({ error: data, message: "Please provide data and data_id" });
  }
  dbMyMoney.query(
    "UPDATE data SET id = ?, type = ?, money = ?, description = ?, date = ?, user_id = ?  WHERE id = ?",
    [...data, data_id],
    function (error, results, fields) {
      if (error) throw error;
      return res.send({
        error: false,
        data: results,
        message: "data has been updated successfully.",
      });
    }
  );
});

//  Delete data
app.delete("/mymoney", function (req, res) {
  console.log("req.body", req.body);
  let data_id = req.body.data_id;
  console.log("data_id", data_id);
  if (!data_id) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide data_id" });
  }
  dbMyMoney.query(
    "DELETE FROM data WHERE id in (?)",
    [data_id],
    function (error, results, fields) {
      if (error) throw error;
      return res.send({
        error: false,
        data: results,
        message: "Data has been delete successfully.",
      });
    }
  );
});

//Delete all data
app.delete("/mymoney/all", function (req, res) {
  dbMyMoney.query("TRUNCATE TABLE data", function (error, results, field) {
    if (error) throw error;
    return res.send({
      error: false,
      data: results,
      message: "Delete all data successfully",
    });
  });
});

module.exports = app;
