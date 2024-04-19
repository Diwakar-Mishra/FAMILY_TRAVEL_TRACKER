import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// managing database
const db = new pg.Client(
{
  host : "localhost",
  port : 5432,
  database : "familyTravelTracker",
  user : "postgres",
  password : "dkdada1212"
}  
);
db.connect();

async function get_visited_countries(given_user_id){
  // console.log(given_user_id);
  const result = await db.query(`SELECT country_code FROM visited_countries WHERE user_id = $1`,[given_user_id]);
  var visited_country_codes = [];
  result.rows.forEach(element => {
    visited_country_codes.push(element.country_code);
  });
  return visited_country_codes;
}
// var result = await get_visited_countries(1);
// console.log(result);
let user_id = 1;
// var countries = await get_visited_countries(user_id);
  // var users = await db.query("SELECT * FROM users");
// console.log(users.rows);
// console.log(countries);
async function get_current_user(){
  var total_users = await db.query("SELECT * FROM users");
  var currentUser = total_users.rows.find((element)=>element.id == user_id);
  console.log(currentUser);
  return currentUser;
}
app.get("/",async(req,res)=>{
  var countries = await get_visited_countries(user_id);
  var users = await db.query("SELECT * FROM users");
  var currentUser = await get_current_user();
  res.render("index.ejs",{
    users : users.rows,
    total : countries.length,
    countries : countries,
    color : currentUser.color
  });
});

app.post("/add",async (req,res)=>{
  var user_entered_country = req.body.country.toLowerCase().trim();
  try{
    var country_code_arr = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) = $1",[user_entered_country]);
    console.log(country_code_arr.rows[0].country_code);
    var country_code = country_code_arr.rows[0].country_code;
    try{
      await db.query("INSERT INTO visited_countries(country_code,user_id) VALUES($1,$2)",[country_code,user_id]);
      res.redirect("/");
    }catch(err){
      var countries = await get_visited_countries(user_id);
      var users = await db.query("SELECT * FROM users");
      res.render("index.ejs",{
        users : users.rows,
        total : countries.length,
        countries : countries,
        color : users.rows[user_id-1].color,
        error : "given country already inserted... enter again ..."
      });
    }
  }catch(err){
    var countries = await get_visited_countries(user_id);
    var users = await db.query("SELECT * FROM users");
    res.render("index.ejs",{
      users : users.rows,
      total : countries.length,
      countries : countries,
      color : users.rows[user_id-1].color,
      error : "invalid country ..... type again ..."
    });
  }
})
app.post("/user",(req,res)=>{
  if(req.body.user != undefined){
    user_id = req.body.user;
    res.redirect("/");
  }
  else{
    res.render("new.ejs");
  }
});
app.post("/new",async(req,res)=>{
  if(req.body.name != undefined){
  var newly_added_user=await db.query("INSERT INTO users (name,color) VALUES($1,$2) RETURNING *",[req.body.name,req.body.color]);
  user_id = newly_added_user.rows[0].id;
  res.redirect("/");
  }else{
    res.render("new.ejs");
  }
});

app.listen(port,()=>{
  console.log(`server is running on the port : ${port}`);
});