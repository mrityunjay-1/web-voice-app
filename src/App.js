import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Recorder from "recorder-js";

import socketIOClient from "socket.io-client";

const socket = socketIOClient("http://localhost:8080");

socket.on("greeting", (data) => {
    console.log("Data: ", data);
});

const App = () => {

    const [m, setM] = useState();
    const [chunks, setChunks] = useState([]);
    const mr = useRef(null);
    const [audContext, setAudContext] = useState();

    const [room_joined, set_room_joined] = useState(false);

    const [roomName, _setRoomName] = useState(new Date().getTime() + "");

    const aud = useRef(null);

    const blobToArrayBuffer = (blob) => new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.readAsArrayBuffer(blob);
        fr.onloadend = () => {
            resolve(new Int16Array(fr.result));
        }
    });

    const arrayBufferToString = (arrayBuffer) => new Promise((resolve, reject) => {
        const arr = new Uint16Array(arrayBuffer);
        const str = String.fromCharCode(...arr);
        // console.log("Base 64 string : ", str);

        return btoa(str);
    });

    const rec = useRef(null);

    let ct;

    const startr = (stop = false) => {

        if (stop) {
            clearTimeout(ct);
            stopr(true);
            return;
        }

        if (audContext.state === "suspended") {
            audContext.resume();
        }
        rec.current.start();
        // _setRoomName();

        ct = setTimeout(() => {
            stopr(stop);
        }, 1000);
    }

    const stopr = (reallyStop = false) => {

        console.log("Stopr fn called...");

        rec.current.stop().then(async ({ blob, buffer }) => {

            let a = new Blob([blob], { type: "audio/wav" });
            aud.current.src = URL.createObjectURL(a);
            aud.current.play();

            // getting pcm data
            const pcmData = await blobToArrayBuffer(blob);

            // console.log("PCM Data: ", JSON.stringify(Object.values(pcmData)));

            // axios({url: "http://localhost:8080/audio/record", method: "POST", data: {arr : JSON.stringify(Object.values(pcmData))}}).then((res) => {
            //     console.log(res);
            // });

            if (reallyStop) {
                // disconnect user so that they can not send any data to backend
                socket.emit("disconnect_call", { roomName });
                clearTimeout(ct);
            } else {
                startr();
            }

            socket.emit("recording", {
                roomName,
                audioData: Object.values(pcmData)
            });

        });

    }

    useEffect(() => {

        (
            async () => {
                try {

                    // navigator.mediaDevices.getUserMedia({ audio: true })
                    //     .then((stream) => {

                    //         console.log(stream);

                    //         // document.getElementById("audio").srcObject = stream;

                    //         const mediaRecorder = new MediaRecorder(stream);

                    //         // mr.current = mediaReorder;

                    //         mediaRecorder.start();

                    //         setTimeout(() => {
                    //             mediaRecorder.stop();
                    //             console.log("set time out called...");
                    //             mediaRecorder.ondataavailable = async (event) => {

                    //                 let a = new Blob([event.data], { type: "audio/wav" });
                    //                 aud.current.src = URL.createObjectURL(a);

                    //                 let str = await blobToArrayBuffer(a);

                    //                 console.log("blob.text : ", str);

                    //                 axios({
                    //                     method: "POST",
                    //                     url: "http://127.0.0.1:8080/audio/record",
                    //                     data: {
                    //                         stream: str
                    //                     }
                    //                 }).then((res) => {
                    //                     console.log("Response: ", res);

                    //                 }).catch((err) => {
                    //                     console.log("Err: ", err);
                    //                 })
                    //                 mediaRecorder.start();

                    //             }
                    //         }, 2000);

                    //     })
                    //     .catch((err) => {
                    //         console.log("error while gettting user media", err);
                    //     });

                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

                    setAudContext(audioContext);

                    const recorder = new Recorder(audioContext, {
                        type: "pcm",
                        bitRate: 16,
                        sampleRate: 44100,
                        numChannels: 1
                    });

                    rec.current = recorder;

                    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                        recorder.init(stream);
                    }).catch(err => console.log("Error: ", err));

                } catch (err) {
                    console.log(err);
                }
            }
        )();

        socket.on("vb-response", (data) => {
            console.log("Yay! Data: ", data);
        })

    }, [])

    return (
        <>

            {
                room_joined ?

                    <>
                        <button onClick={() => {
                            // socket.emit("start_call", { roomName });
                            startr();
                        }}>
                            Start Record
                        </button>

                        <button onClick={() => {
                            startr(true);
                        }}>
                            Stop Record
                        </button>

                        <audio ref={aud} id="audio" controls />
                    </>

                    :

                    <>

                        <button
                            onClick={() => {
                                socket.emit("start_call", { roomName });
                                set_room_joined(true);
                            }}
                        >Call To Agent</button>
                    </>
            }


        </>
    );
}

export default App;

// import { useState, useRef } from 'react';
// const App = () => {

//         const [recording, setRecording] = useState(false);
//         const [audioSrc, setAudioSrc] = useState(null);
//         const mediaRecorderRef = useRef(null);
//         const audioRef = useRef(null);

//         const handleStartRecording = () => {
//             navigator.mediaDevices.getUserMedia({ audio: true })
//                 .then(stream => {
//                     const mediaRecorder = new MediaRecorder(stream);
//                     mediaRecorderRef.current = mediaRecorder;
//                     mediaRecorder.start();
//                     setRecording(true);
//                 })
//                 .catch(error => {
//                     console.error(error);
//                 });
//         };

//         const handleStopRecording = () => {
//             mediaRecorderRef.current.stop();
//             setRecording(false);
//             mediaRecorderRef.current.ondataavailable = (event) => {
//                 const audioBlob = new Blob([event.data], { type: 'audio/wav' });
//                 const audioUrl = URL.createObjectURL(audioBlob);
//                 setAudioSrc(audioUrl);
//             };
//         };

//         return (
//             <div>
//                 {recording ?
//                     <button onClick={handleStopRecording}>Stop Recording</button> :
//                     <button onClick={handleStartRecording}>Start Recording</button>
//                 }
//                 {audioSrc &&
//                     <audio ref={audioRef} controls src={audioSrc} />
//                 }
//             </div>
//         );


// }

// export default App;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// New Audio streaming data
// import React, { useEffect } from "react";

// const App = () => {

//     useEffect(() => {

//         navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
//             console.log("Stream: ", stream);

//         })

//     }, []);

//     return (
//         <>



//         </>
//     );
// }

// export default App;