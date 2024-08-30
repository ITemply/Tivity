const express = require('express')
const path = require('node:path')
const bodyParser = require('body-parser')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server, {maxHttpBufferSize: 3.5e6, pingTimeout: 60000})
const dotenv = require('dotenv')
const mysql = require('mysql')
const crypto = require('crypto')
const cookieParser = require('cookie-parser')
dotenv.config()

app.set('views', path.join(__dirname, 'public'))
app.use('/images', express.static('images'));
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser())

const databaseUrl = process.env.DATABASE_URL
const username = process.env.USERNAME
const password = process.env.PASSWORD
const port = process.env.PORT

const algorithm = process.env.ALG
const key = process.env.KEY
const iv = process.env.IV

const validChars = process.env.VALID_CHARS
const validUsernameChars = process.env.VALID_UNAME_CHARS

const sqlConnection = mysql.createPool({
    connectionLimit: 100,
    host: databaseUrl,
    user: username,
    password: password,
    port: port
})

async function executeSQL(sql){
  return new Promise((resolve, reject) =>{
      try{
        sqlConnection.query(sql, function (err, result) {
            if (err){
                return reject(err)
            }
            return resolve(result)
        })
      }
      catch(e){
          reject(e)
      }
  })
}

function randomString(length) {
    let result = ''
    const characters = validChars
    const charactersLength = characters.length
    let counter = 0

    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
      counter += 1
    }

    return result
}

function hash(string) {
    return crypto.createHash('sha256').update(string).digest('hex')
}

function base64Image(file){
    return fs.readFileSync(file, 'base64')
}

function encode(text, ekey, eiv) {
    let base = btoa(text)
    let cipher = crypto.createCipheriv(algorithm, ekey, eiv)
    let encrypted = cipher.update(base)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return encrypted.toString('hex')
 }

function decode(text, dkey, div) {
    let encryptedText = Buffer.from(text, 'hex')
    let decipher = crypto.createDecipheriv('aes-256-cbc', dkey, div)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return atob(decrypted.toString())
 }

function checkUsernameCharacters(inputString) {
    const characterList = new RegExp(`[^${validUsernameChars}]`, 'g')
    return !characterList.test(inputString)
}

function checkCharacters(inputString) {
    const characterList = new RegExp(`[^${validChars}]`, 'g')
    return !characterList.test(inputString)
}

async function checkCurrentUsername(checkUsername){
    const sqlCheck = await executeSQL('SELECT * FROM Centri.accounting WHERE checkUsername="' + checkUsername + '";')
    if (sqlCheck[0] === null) {
        return false
    } else if (sqlCheck[0] === undefined) {
        return false
    } else {
        return true       
    }
}