const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const bodyParser = require("body-parser")
const path = require("path")

const app = express()
const PORT = 3000

app.use(bodyParser.json())
app.use(express.static("public"))

const db = new sqlite3.Database("database.db")

// Основная таблица заявок
db.run(`
CREATE TABLE IF NOT EXISTS bookings (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT,
phone TEXT,
date TEXT,
time TEXT,
comment TEXT
)
`)

// Таблица удаленных заявок
db.run(`
CREATE TABLE IF NOT EXISTS deleted_bookings (
id INTEGER PRIMARY KEY,
name TEXT,
phone TEXT,
date TEXT,
time TEXT,
comment TEXT
)
`)

// Настройки графика
db.run(`
CREATE TABLE IF NOT EXISTS settings (
id INTEGER PRIMARY KEY,
start_hour INTEGER,
end_hour INTEGER,
work_days TEXT
)
`)

// создаём настройки если их нет
db.get("SELECT * FROM settings WHERE id=1",(err,row)=>{

if(!row){

db.run(
"INSERT INTO settings (id,start_hour,end_hour,work_days) VALUES (1,9,18,'1,2,3,4,5')"
)

}

})

// получить все заявки
app.get("/api/bookings",(req,res)=>{

db.all("SELECT * FROM bookings",(err,rows)=>{

res.json(rows)

})

})

// создать заявку
app.post("/api/bookings",(req,res)=>{

const {name,phone,date,time,comment}=req.body

db.get(

"SELECT * FROM bookings WHERE date=? AND time=?",

[date,time],

(err,row)=>{

if(row){

return res.status(400).json({error:"Время занято"})

}

db.run(

"INSERT INTO bookings (name,phone,date,time,comment) VALUES (?,?,?,?,?)",

[name,phone,date,time,comment],

function(){

res.json({id:this.lastID})

}

)

})

})

// удалить заявку (в архив)
app.delete("/api/bookings/:id",(req,res)=>{

const id=req.params.id

db.get("SELECT * FROM bookings WHERE id=?",[id],(err,row)=>{

if(!row) return res.json({error:"not found"})

db.run(

"INSERT INTO deleted_bookings (id,name,phone,date,time,comment) VALUES (?,?,?,?,?,?)",

[row.id,row.name,row.phone,row.date,row.time,row.comment]

)

db.run("DELETE FROM bookings WHERE id=?",[id])

res.json({success:true})

})

})

// получить удаленные
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

"INSERT INTO bookings (name,phone,date,time,comment) VALUES (?,?,?,?,?)",

[row.name,row.phone,row.date,row.time,row.comment]

)

db.run("DELETE FROM deleted_bookings WHERE id=?",[id])

res.json({success:true})

})

})

// удалить навсегда
app.delete("/api/deleted/:id",(req,res)=>{

const id=req.params.id

db.run(

"DELETE FROM deleted_bookings WHERE id=?",

[id],

()=>{

res.json({success:true})

}

)

})

// получить настройки
app.get("/api/settings",(req,res)=>{

db.get("SELECT * FROM settings WHERE id=1",(err,row)=>{

res.json(row)

})

})

// изменить настройки
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
