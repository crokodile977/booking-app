const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const bodyParser = require("body-parser")

const app = express()
const PORT = 3000

app.use(bodyParser.json())
app.use(express.static("public"))

const db = new sqlite3.Database("database.db")

// заявки
db.run(`
CREATE TABLE IF NOT EXISTS bookings (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT,
phone TEXT,
service TEXT,
date TEXT,
time TEXT,
comment TEXT
)
`)

// удаленные
db.run(`
CREATE TABLE IF NOT EXISTS deleted_bookings (
id INTEGER PRIMARY KEY,
name TEXT,
phone TEXT,
service TEXT,
date TEXT,
time TEXT,
comment TEXT
)
`)

// услуги
db.run(`
CREATE TABLE IF NOT EXISTS services (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT
)
`)

// настройки
db.run(`
CREATE TABLE IF NOT EXISTS settings (
id INTEGER PRIMARY KEY,
start_hour INTEGER,
end_hour INTEGER,
work_days TEXT
)
`)

// начальные настройки
db.get("SELECT * FROM settings WHERE id=1",(err,row)=>{

if(!row){

db.run(
"INSERT INTO settings (id,start_hour,end_hour,work_days) VALUES (1,9,18,'1,2,3,4,5')"
)

}

})

// получить заявки
app.get("/api/bookings",(req,res)=>{

db.all("SELECT * FROM bookings",(err,rows)=>{

res.json(rows)

})

})

// создать заявку
app.post("/api/bookings",(req,res)=>{

const {name,phone,service,date,time,comment}=req.body

db.get(
"SELECT * FROM bookings WHERE date=? AND time=?",
[date,time],
(err,row)=>{

if(row){
return res.status(400).json({error:"busy"})
}

db.run(
"INSERT INTO bookings (name,phone,service,date,time,comment) VALUES (?,?,?,?,?,?)",
[name,phone,service,date,time,comment],
function(){

res.json({id:this.lastID})

}
)

})

})

// удалить (в архив)
app.delete("/api/bookings/:id",(req,res)=>{

const id=req.params.id

db.get("SELECT * FROM bookings WHERE id=?",[id],(err,row)=>{

db.run(
"INSERT INTO deleted_bookings (id,name,phone,service,date,time,comment) VALUES (?,?,?,?,?,?,?)",
[row.id,row.name,row.phone,row.service,row.date,row.time,row.comment]
)

db.run("DELETE FROM bookings WHERE id=?",[id])

res.json({success:true})

})

})

// архив
app.get("/api/deleted",(req,res)=>{

db.all("SELECT * FROM deleted_bookings",(err,rows)=>{

res.json(rows)

})

})

// восстановить
app.post("/api/restore/:id",(req,res)=>{

const id=req.params.id

db.get("SELECT * FROM deleted_bookings WHERE id=?",[id],(err,row)=>{

db.run(
"INSERT INTO bookings (name,phone,service,date,time,comment) VALUES (?,?,?,?,?,?)",
[row.name,row.phone,row.service,row.date,row.time,row.comment]
)

db.run("DELETE FROM deleted_bookings WHERE id=?",[id])

res.json({success:true})

})

})

// удалить навсегда
app.delete("/api/deleted/:id",(req,res)=>{

db.run(
"DELETE FROM deleted_bookings WHERE id=?",
[req.params.id],
()=>{

res.json({success:true})

})

})

// услуги
app.get("/api/services",(req,res)=>{

db.all("SELECT * FROM services",(err,rows)=>{

res.json(rows)

})

})

app.post("/api/services",(req,res)=>{

const {name}=req.body

db.run(
"INSERT INTO services (name) VALUES (?)",
[name],
function(){

res.json({id:this.lastID})

}
)

})

// занятые часы
app.get("/api/busy",(req,res)=>{

const date=req.query.date

db.all(
"SELECT time FROM bookings WHERE date=?",
[date],
(err,rows)=>{

res.json(rows)

})

})

// настройки
app.get("/api/settings",(req,res)=>{

db.get("SELECT * FROM settings WHERE id=1",(err,row)=>{

res.json(row)

})

})

app.post("/api/settings",(req,res)=>{

const {start,end,days}=req.body

db.run(
"UPDATE settings SET start_hour=?, end_hour=?, work_days=? WHERE id=1",
[start,end,days]
)

res.json({success:true})

})

app.listen(PORT,()=>{

console.log("Server started")

})
