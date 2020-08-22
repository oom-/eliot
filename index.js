// automatically pick platform
const https = require('https');
const http = require('http');
const Say = require('say');
const fs = require('fs');
const iconv = require('iconv-lite')

function getDayOfWeek() {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return dayNames[new Date().getDay()]
}

function getDateString() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    let date = new Date();
    return `${date.getDate()} ${monthNames[date.getMonth()]}`
}

function getHourString() {
    let str = new Date().toLocaleTimeString();
    let cut = str.split(':');
    return `${cut[0]}:${cut[1]} ${str.indexOf('AM') ? 'am' : 'pm'} `;
}

async function HttpGet(url, forceNoEncoding = false) {
    return new Promise((resolve, reject) => {
        let obj = url.toLowerCase().startsWith('https') ? https : http;
        obj.get(url, (resp) => {
            //if (!forceNoEncoding)
            resp.setEncoding('binary');
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                if (!forceNoEncoding)
                    data = iconv.decode(data, "ISO-8859-1");
                else
                    data = new String(data);
                resolve(data);
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
            reject(err.message);
        });
    });
}

async function getTemperature() {
    return new Promise(async (resolve, reject) => {
        //here the name of your town
        const town = "thionville";
        const unit = "C"; //F if farenheit
        const url = "https://www.google.com/search?q=meteo+";

        await HttpGet(url + town, true).then(data => {
            fs.writeFileSync('test.html', data); //debug
            //Find the special caracters
            let indexEnd = data.indexOf('° ' + unit);
            let indexStart = indexEnd;
            while (data.charAt(indexStart) != '>' && indexStart >= 0) {
                indexStart--;
            }
            let temperature = data.substring(++indexStart, indexEnd).trim();
            console.log(temperature);
            resolve(`the temperature outside is ${temperature} ${unit == 'C' ? 'degree' : 'farenheit'}`);
        }).catch(err => { resolve(`please excuse me sir, but today I'm not enable to check the temperature because I cannot reach the server.`); });

    });
}

async function getRandomQuote() {
    return new Promise(async (resolve, reject) => {
        const url = "http://www.quotationspage.com/qotd.html";
        HttpGet(url)
            .then(data => {  
                let indexFQ = data.indexOf('quote/');
                indexFQ = data.indexOf('>', indexFQ) + 1;
                let indexEQ = data.indexOf('</a>', indexFQ);
                let indexFA = data.indexOf('alt="[note]"', indexEQ);
                indexFA = data.indexOf('quotes/', indexFA);
                indexFA = data.indexOf('>', indexFA) + 1;
                let indexEA = data.indexOf('<', indexFA);
                let quote = data.substring(indexFQ, indexEQ);
                let author = data.substring(indexFA, indexEA);
                resolve(`the quote of the day is from ${author.trim()}, saying ${quote.trim()}`);
            })
            .catch(err => {
                resolve('as for the temperature no quote will can be provided today, sorry sir');
            });
    });
}

(async () => {
    // Use default system voice and speed
    //Say.getInstalledVoices((b,a) => console.log(a))
    let temp = await getTemperature();
    let quote = await getRandomQuote();
    await Say.speak(`Welcome back sir, we are ${getDayOfWeek()} the ${getDateString()}, it's ${getHourString()} and ${temp}, ${quote}. I wish you a nice time sir, it was a real pleasure.`,
        'Microsoft James'); //voice downloaded
})();

