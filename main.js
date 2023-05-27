var config = require('./config.js');
var utils = require('./utils.js');

function main(text, contextText, completion) {
    (async () => {
        const translate_text = text || contextText.value || await Clipboard.readText();

        console.log("begin")

        let detected_lang = await $Lang.detect(translate_text)

        console.log("detected_lang: " + detected_lang)
        const targetLanguage = utils.langMap.get(detected_lang);

        console.log("targetLanguage: " + targetLanguage)
        if (!targetLanguage) {
            const err = new Error();
            Object.assign(err, {
                _type: 'error',
                _message: '不支持该语种',
            });
            throw err;
        }

        const originText = '[' + targetLanguage + ']' + translate_text + '[' + targetLanguage + ']'

        let base64Result = ''
        try {
            const speaker = '綾地寧々';
            // const speaker = $option.speaker;

            const socket = $websocket.new({
                url: "wss://skytnt-moe-tts.hf.space/queue/join",
                allowSelfSignedSSLCertificates: true,
                timeoutInterval: 100
            })

            socket.open()
            socket.listenClose(function (socket, code, reason) {
                completion({
                    result: {
                        "type": "error",
                        "value": "播放失败" || '未知错误',
                    },
                });
            })

            socket.listenReceiveString(function (socket, string) {
                console.log(`did receive string: ${string}`);
                if (JSON.parse(string).msg == 'send_hash') {
                    socket.sendString('{"session_hash":"ivnr592j25","fn_index":1}');
                } else if (JSON.parse(string).msg == 'send_data') {
                    let s = '{"fn_index":45,"data":["' + originText + '","' + speaker + '",1,false],"session_hash":"ivnr592j25"}';
                    // console.log(s)
                    socket.sendString(s);
                } else if (JSON.parse(string).msg == 'process_completed') {
                    // console.log('***********Client received a message==>' + JSON.parse(string).output.data[1])
                    const base64 = JSON.parse(string).output.data[1].split('base64,')
                    const contentType = base64[0].split(':')[1].split(';')[0];
                    console.log("base64:" + contentType)
                    base64Result = base64[1].split(':')
                    // socket.close()
                    completion({
                        result: {
                            "type": "audio",
                            "format": "base64",
                            "value": base64Result,
                            "contentType": contentType,
                            "raw": {}
                        },
                    });
                }
            })
        } catch (e) {
            console.log(e)
        }

    })().catch((err) => {
        completion({
            result: {
                "type": "error",
                "value": err._message || '未知错误',
            },
        });
    });
}


