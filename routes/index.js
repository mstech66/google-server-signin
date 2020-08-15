var express = require('express');
var router = express.Router();
const { request } = require('gaxios');
const { google } = require('googleapis');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URL = process.env.REDIRECT_URL

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
const scopes = ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'];
const url = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes });

router.get('/login', function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.redirect(url);
});

async function codparser(url, callback) {
    let rawurl = url;
    let unreplacedurl = rawurl.substring(rawurl.indexOf("code=") + 5, rawurl.indexOf("&scope="));
    var code = unreplacedurl.replace("%2F", "/");
    let { tokens } = await oauth2Client.getToken(code)
    return callback(tokens.access_token)
}
async function httpcaller(gottoken) {
    const userdata = await request({ baseURL: 'https://www.googleapis.com', url: '/oauth2/v2/userinfo', headers: { 'Authorization': 'Bearer ' + gottoken } })
    return (userdata.data)
}

router.get('/redirect', async function(req, res) {
    const finaluserdata = await codparser(req.url, httpcaller)
    console.log(finaluserdata);
    res.cookie('login', JSON.stringify(finaluserdata));
    res.render('user', { name: finaluserdata.name, img_url: finaluserdata.picture, email: finaluserdata.email });
});

router.get('/signout', function(req, res) {
    res.cookie('login', '');
    res.redirect('http://localhost:3000/');
});

/* GET home page. */
router.get('/', function(req, res, next) {
    let usrCookie = req.cookies.login;
    if (usrCookie == undefined || usrCookie == '') {
        res.render('index', { title: 'Google Sign In Example' });
    } else {
        usrCookie = JSON.parse(usrCookie);
        res.render('user', { name: usrCookie.name, img_url: usrCookie.picture, email: usrCookie.email });
    }
});

module.exports = router;