function main(text, contextText, completion) {
    (async () => {
        var target_lang = 'en-US';
        var target_voice = 'en-US-GuyNeural';
        const translate_text = text || contextText || await Clipboard.readText();

        console.log("begin")

        let source_lang = await $Lang.detect(translate_text)

        const originText = '[' + source_lang + ']' + translate_text + '[' + source_lang + ']'
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
            socket.listenReceiveString(function (socket, string) {
                $log.error(`did receive string: ${string}`);
                if (JSON.parse(string).msg == 'send_hash') {
                    socket.sendString('{"session_hash":"ivnr592j25","fn_index":1}');
                } else if (JSON.parse(string).msg == 'send_data') {
                    let s = '{"fn_index":45,"data":["' + originText + '","' + speaker + '",1,false],"session_hash":"ivnr592j25"}';
                    console.error(s)
                    socket.sendString(s);
                } else if (JSON.parse(string).msg == 'process_completed') {
                    $log.error('***********Client received a message==>' + JSON.parse(string).output.data[1])
                    base64Result = JSON.parse(string).output.data[1].split('base64,')[1]
                    // socket.close()
                    completion({
                        result: {
                            "type": "base64",
                            "value": base64Result,
                            "raw": {}
                        },
                    });
                }
            })
        } catch (e) {
            $log.error(e)
        }

    })().catch((err) => {
        completion({
            error: {
                type: err._type || 'unknown',
                message: err._message || '未知错误',
                addtion: err._addtion,
            },
        });
    });
}

function main(text, contextText, completion) {

    (async () => {
        var target_lang = 'en-US';
        var target_voice = 'en-US-GuyNeural';
        const translate_text = text || contextText || await Clipboard.readText();

        console.log("begin")

        if (translate_text !== '') {
            let source_lang = await $Lang.detect(translate_text)
            console.log("source_lang : " + source_lang)
            // 如果是中文则翻译成英文，否则翻译成中文
            if (source_lang === 'en') {
                target_lang = 'en-US'
                target_voice = 'en-US-GuyNeural'
            }
            if (source_lang === 'zh') {
                target_lang = 'zh-CN'
                target_voice = 'zh-CN-YunzeNeural'
            }

            try {
                try {
                    await $Audio.play(
                        "https://southeastasia.api.speech.microsoft.com/accfreetrial/texttospeech/acc/v3.0-beta1/vcg/speak",
                        {
                            method: "POST",
                            header: {
                                'authority': 'southeastasia.api.speech.microsoft.com',
                                'accept': '*/*',
                                'accept-language': 'zh-CN,zh;q=0.9',
                                'cache-control': 'no-cache',
                                'content-type': 'application/json',
                                'origin': 'https://azure.microsoft.com',
                                'pragma': 'no-cache',
                                'referer': 'https://azure.microsoft.com/',
                                'sec-ch-ua': '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
                                'sec-ch-ua-mobile': '?0',
                                'sec-ch-ua-platform': '"macOS"',
                                'sec-fetch-dest': 'empty',
                                'sec-fetch-mode': 'cors',
                                'sec-fetch-site': 'same-site',
                                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
                            },
                            // body: {"lang": targetLanguage, "speaker": $option[targetLanguage + '-speaker'], "text": query.text},
                            body: {
                                "ttsAudioFormat": "audio-24khz-160kbitrate-mono-mp3",
                                "ssml": `<speak xmlns=\"http://www.w3.org/2001/10/synthesis\" xmlns:mstts=\"http://www.w3.org/2001/mstts\" version=\"1.0\" xml:lang=\"${target_lang}\"><voice name=\"${target_voice}\"><mstts:express-as><prosody rate=\"1\" pitch=\"0%\">${translate_text}</prosody></mstts:express-as></voice></speak>`
                            }
                        });
                    completion(contextText)
                } catch (e) {
                    throw e;
                }

            } catch (e) {
                console.log("error" + JSON.stringify(e))
                Object.assign(e, {
                    _type: 'network',
                    _message: '接口请求错误 - ' + JSON.stringify(e),
                });
                throw e;
            }
        }
    })().catch((err) => {
        completion({
            error: {
                type: err._type || 'unknown',
                message: err._message || '未知错误',
                addtion: err._addtion,
            },
        });
    });
}

