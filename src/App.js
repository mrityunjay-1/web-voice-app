import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Recorder from "recorder-js";
import arr from "./int";

import socketIOClient from "socket.io-client";
import speak from "./helpers/speechSynthesis";

const socket = socketIOClient("http://localhost:8080");

const App = () => {

    const [audContext, setAudContext] = useState();
    const [room_joined, set_room_joined] = useState(false);
    const [roomName, _setRoomName] = useState(new Date().getTime() + "");
    const aud = useRef(null);
    const rec = useRef(null);

    const [userSocketId, setUserSocketId] = useState(socket.id);

    const timeoutRef = useRef();

    const blobToArrayBuffer = (blob) => new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.readAsArrayBuffer(blob);
        fr.onloadend = () => {
            resolve(new Int16Array(fr.result));
        }
    });

    let ct;

    const startr = (stop = false) => {

        if (stop) {
            clearTimeout(timeoutRef.current);
            stopr(true);
            return;
        }

        if (audContext.state === "suspended") {
            audContext.resume();
        }
        rec.current.start();

        timeoutRef.current = setTimeout(() => {
            stopr(stop);
        }, 1000);
    }

    const stopr = (reallyStop = false) => {

        // console.log("Stopr fn called...");

        rec.current.stop().then(async ({ blob, buffer }) => {

            let a = new Blob([blob], { type: "audio/wav" });
            // aud.current.src = URL.createObjectURL(a);
            // aud.current.play();

            // getting pcm data
            const pcmData = await blobToArrayBuffer(blob);


            if (reallyStop) {
                // disconnect user so that they can not send any data to backend
                socket.emit("disconnect_call", { roomName });
                clearTimeout(timeoutRef.current);
            } else {
                startr();
            }

            console.log("pcm Data : ", pcmData);

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

        socket.on("greeting", (data) => {
            // console.log("greeting message: ", data.message);
            console.log("socketId: ", data.socketId);
            if (data.socketId) {
                setUserSocketId(data.socketId);
            }
        });

        socket.on("vb-response", (data) => {
            // console.log("Yay! Data: ", data);
            speak({ text: data.response, volume: data.volume, rate: data.rate, pitch: data.pitch, lang: data.lang });
        });

    }, []);

    // useEffect(() => {
    //     // function getVoices() {
    //     //     let voices = speechSynthesis.getVoices();
    //     //     if (!voices.length) {
    //     //         // some time the voice will not be initialized so we can call spaek with empty string
    //     //         // this will initialize the voices 
    //     //         let utterance = new SpeechSynthesisUtterance("");
    //     //         speechSynthesis.speak(utterance);
    //     //         voices = speechSynthesis.getVoices();
    //     //     }
    //     //     return voices;
    //     // }

    //     // function speak(text, voice, rate, pitch, volume) {
    //     //     // create a SpeechSynthesisUtterance to configure the how text to be spoken 
    //     //     let speakData = new SpeechSynthesisUtterance();
    //     //     speakData.volume = volume; // From 0 to 1
    //     //     speakData.rate = rate; // From 0.1 to 10
    //     //     speakData.pitch = pitch; // From 0 to 2
    //     //     speakData.text = text;
    //     //     speakData.lang = 'en';
    //     //     speakData.voice = voice;

    //     //     // pass the SpeechSynthesisUtterance to speechSynthesis.speak to start speaking 
    //     //     speechSynthesis.speak(speakData);
    //     //     // speechSynthesis.p

    //     // }

    //     // if ('speechSynthesis' in window) {

    //     //     let voices = getVoices();
    //     //     let rate = 1, pitch = 1, volume = 1;
    //     //     let text = "Spaecking with volume = 1 rate =1 pitch =2 ";

    //     //     // speak(text, voices[5], rate, pitch, volume);

    //     //     setTimeout(() => { // speak after 2 seconds 
    //     //         rate = 0.8; pitch = 1.5; volume = 0.5;
    //     //         text = "website, also called Web site, collection of files and related resources accessible through the World Wide Web and organized under a particular domain name. Typical files found at a website are HTML documents with their associated graphic image files (GIF, JPEG, etc.), scripted programs (in Perl, PHP, Java, etc.), and similar resources. The site's files.";
    //     //         speak(text, voices[5], rate, pitch, volume);
    //     //     }, 200);

    //     // } else {
    //     //     console.log(' Speech Synthesis Not Supported 😞');
    //     // }

    //     // let int16Array = new Int16Array(arr);

    //     // console.log("arr buffer : ", int16Array);

    //     // let arrBlob = new Blob([int16Array], { type: "audio/wav" });

    //     // console.log("arr blob = ", arrBlob);

    //     // aud.current.src = URL.createObjectURL(arrBlob);
    //     // aud.current.play();

    // }, []);

    return (
        <>

            {/* <audio ref={aud} id="audio" controls /> */}

            {
                room_joined ?

                    <>
                        {/* <button onClick={() => {
                            // socket.emit("start_call", { roomName });
                            startr();
                        }}>
                            Start Record
                        </button> */}

                        <div style={{ width: "100vw", height: "100vh", backgroundColor: "lightgreen", display: "grid", placeItems: "center" }}>

                            {
                                userSocketId ?
                                    <p>Your Socket id is : {userSocketId}</p>
                                    :
                                    null
                            }

                            <button
                                style={{ fontSize: "2rem", padding: "2rem 4rem", backgroundColor: "indigo", color: "white", border: "0.1rem solid black", borderRadius: "1rem" }}
                                onClick={() => {
                                    startr(true);
                                    set_room_joined(false);
                                }}
                            >
                                📞  &nbsp; Cut this call
                            </button>

                        </div>

                        {/* <audio ref={aud} id="audio" controls /> */}
                    </>

                    :

                    <div style={{ width: "100vw", height: "100vh", backgroundColor: "cyan", display: "grid", placeItems: "center" }}>
                        <button
                            style={{ fontSize: "2rem", padding: "2rem 4rem", backgroundColor: "indigo", color: "white", border: "0.1rem solid black", borderRadius: "1rem" }}
                            onClick={() => {
                                socket.emit("join_room", { roomName });
                                set_room_joined(true);
                                startr();
                            }}
                        >
                            📞  &nbsp; Call To IVR
                        </button>
                    </div>
            }


        </>
    );
}

export default App;
