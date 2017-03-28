const url = require("url");
const {send} = require("micro");
var get = require("request");
const oxfordDictionaryCredentials = {"app_id":process.env.app_id, "app_key": process.env.app_key}

var app_id = oxfordDictionaryCredentials.app_id;
var app_key = oxfordDictionaryCredentials.app_key;
var registers = ["Rare", "Ironic", "Literary", "Offensive", "Vulgar_Slang"];
var register_of_the_day = registers[get_index(5)];
var oxurl =  'https://od-api.oxforddictionaries.com:443/api/v1/wordlist/en/registers=' + register_of_the_day;
var headers = {'app_id': app_id, 'app_key': app_key};

module.exports = async req => {

    const query = url.parse(req.url, true).query;

    var surname = query.text;
    if (!query.text) {
        surname = "McCulloch";
    }
    var word = await get_surname_synonym(surname);

    return "Today '" + surname + "' stands for " + JSON.stringify(word);
}


function get_day_of_the_year() {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var diff = now - start;
    var oneDay = 1000 * 60 * 60 * 24;
    var day = Math.floor(diff / oneDay);
    return day;
}

function get_index(n, s){
    i = get_day_of_the_year();

    if (s){
        i *= s;
    }
    if (i > n) { // there are more days in a year than results.
        j = i % n;
    }
    else{
        j = i;
    }

    return j;
}

function get_surname_synonym(surname, callback){
    promise = new Promise ((resolve, reject) => {
        word = surname;
        get({url: oxurl, headers: headers}, (err, res, body) => {

            if (err){
                reject(err);
            }
            try{
                b = JSON.parse(body);
            } catch (e) {
                reject(body);
            }
            n = b.results.length;
            j = get_index(n, surname.length);
            word = b.results[j].word;
            resolve(word);
        })
    })
    return promise;
}
