const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');



app.use(cors())
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// app.route("/api/users")
//   //.get()
//   .post((res, req) => {
//     const user = req.body.username;
    
//   })




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
