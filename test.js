const fs =require("fs")



// 读取 数据库
const  usersString = fs.readFileSync("./db/users.json").toString()
const usersArray = JSON.parse(usersString)
// console.log(usersArray)
// console.log(usersString)
// console.log(usersArray instanceof Array)
// console.log(typeof usersString)

// 写 数据库
const user4 = {id:4,name:"Tom",password:"123"}
usersArray.push(user4)
const string = JSON.stringify(usersArray)
fs.writeFileSync("./db/users.json",string)