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
    synonym = await get_surname_synonym(surname);
    word =synonym[0]; word_id=synonym[1];
    var definition = await get_word_definition(word_id);
    return "Today '" + surname + "' stands for " + JSON.stringify(word) + "\n" + definition;
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

function get_surname_synonym(surname){
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
            word_id = b.results[j].id;
            word = b.results[j].word;
            resolve([word, word_id]);
        })
    })
    return promise;
}



function get_word_definition(word){
    defurl = "https://od-api.oxforddictionaries.com:443/api/v1/entries/en/"+word+"/definitions";
    promise = new Promise ((resolve, reject) => {
        get({url:defurl, headers:headers}, (err, res, body)=>{

            if (err){
                reject(err);
            }
            try{
                b = JSON.parse(body);
            } catch (e) {
                reject(body);
            }

            a = b.results.map(function(c){
                my_defs = [];
                c.lexicalEntries.forEach(function(LexEntries){
                    LexEntries.entries.forEach(function(entry){
                        definition = [];
                        entry.senses.forEach(function(sense){
                            definition.push(sense.definitions);
                        })
                    })

                    lexicalCategory = LexEntries.lexicalCategory;
                    my_defs.push({"category": lexicalCategory, "definition":definition})
                })
                return my_defs;
            })

            resolve(JSON.stringify(a));
        })
    })
    return promise;
}
