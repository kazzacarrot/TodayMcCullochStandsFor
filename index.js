const url = require("url");
const gen = require("random-seed");
const {send} = require("micro");
var get = require("request");
const oxfordDictionaryCredentials = {"app_id":process.env.app_id, "app_key": process.env.app_key}

var app_id = oxfordDictionaryCredentials.app_id;
var app_key = oxfordDictionaryCredentials.app_key;
var registers = ["Rare", "Ironic", "Literary", "Offensive" ];
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
    var ret = {"Surname":surname,
               "stands_for": definition};
    return JSON.stringify(ret);
}


function get_index(n, s=""){
    today = new Date();

    var rand = gen.create(today.toString() + s);

    return rand.intBetween(0, n);
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

                ret = b.results.map(function(c){
                    my_defs = [];
                    word = c.word;
                    c.lexicalEntries.forEach(function(LexEntries){
                        lexicalCategory = LexEntries.lexicalCategory;
                        LexEntries.entries.forEach(function(entry){
                            entry.senses.forEach(function(sense){
                                sense.definitions.forEach(function(definition){
                                    my_defs.push({"word": word, "category": lexicalCategory, "definition": definition});
                                })
                            })
                        })

                    })
                    return my_defs;
                })

               resolve(ret);

            } catch (e) {
                reject(body);
            }
        })
    })
    return promise;
}
