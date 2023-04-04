import React, { useEffect, useRef, useState } from "react";
import Recorder from "recorder-js";

import micIcon from "./assets/images/mic.gif";
import micInitial from "./assets/images/mic-initial.png";

import socketIOClient from "socket.io-client";
// import speak from "./helpers/speechSynthesis";

let socketUrl;
if (process.env.NODE_ENV === "production") {
    socketUrl = "https://vb-backend-g617.onrender.com";
} else {
    socketUrl = "http://localhost:9000";
}

const socket = socketIOClient(socketUrl);

const App = () => {

    const [audContext, setAudContext] = useState();
    const [room_joined, set_room_joined] = useState(false); // eslint-disable-next-line
    const [roomName, _setRoomName] = useState(new Date().getTime() + ""); // eslint-disable-next-line
    // const aud = useRef(null); // eslint-disable-next-line
    const rec = useRef(null);

    const [imgSrc, setImgSrc] = useState(true);

    const [userSocketId, setUserSocketId] = useState(socket.id);

    const timeoutRef = useRef();
    const dotterRef = useRef();

    // user form to start web call
    const [name, setName] = useState();
    const [phone, setPhone] = useState();
    const [email, setEmail] = useState();

    const blobToArrayBuffer = (blob) => new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.readAsArrayBuffer(blob);
        fr.onloadend = () => {
            resolve(new Int16Array(fr.result));
        }
    });

    // let ct;

    const startr = (stop = false) => {

        if (stop) {
            clearTimeout(timeoutRef.current);
            stopr(true);
            return;
        }

        if (audContext?.state === "suspended") {
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

            // let a = new Blob([blob], { type: "audio/wav" });
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
            // speak({ text: data.response, volume: data.volume, rate: data.rate, pitch: data.pitch, lang: data.lang });

            let audioRef = new Audio(data.audio_file_url);
            audioRef.play();

            startr(true);

            setImgSrc(false);

            audioRef.onended = () => {
                console.log("khatam ho gayi audio file ki play time...");
                startr();
                setImgSrc(true);
            }

            // disabling 

        });
        // eslint-disable-next-line
    }, []); // eslint-disable-next-line

    useEffect(() => {
        // function getVoices() {
        //     let voices = speechSynthesis.getVoices();
        //     if (!voices.length) {
        //         // some time the voice will not be initialized so we can call spaek with empty string
        //         // this will initialize the voices 
        //         let utterance = new SpeechSynthesisUtterance("");
        //         speechSynthesis.speak(utterance);
        //         voices = speechSynthesis.getVoices();
        //     }
        //     return voices;
        // }

        // function speak(text, voice, rate, pitch, volume) {
        //     // create a SpeechSynthesisUtterance to configure the how text to be spoken 
        //     let speakData = new SpeechSynthesisUtterance();
        //     speakData.volume = volume; // From 0 to 1
        //     speakData.rate = rate; // From 0.1 to 10
        //     speakData.pitch = pitch; // From 0 to 2
        //     speakData.text = text;
        //     speakData.lang = 'en';
        //     speakData.voice = voice;

        //     // pass the SpeechSynthesisUtterance to speechSynthesis.speak to start speaking 
        //     speechSynthesis.speak(speakData);
        //     // speechSynthesis.p

        // }

        // if ('speechSynthesis' in window) {

        //     let voices = getVoices();
        //     let rate = 1, pitch = 1, volume = 1;
        //     let text = "Spaecking with volume = 1 rate =1 pitch =2 ";

        //     // speak(text, voices[5], rate, pitch, volume);

        //     setTimeout(() => { // speak after 2 seconds 
        //         rate = 0.8; pitch = 1.5; volume = 0.5;
        //         text = "website, also called Web site, collection of files and related resources accessible through the World Wide Web and organized under a particular domain name. Typical files found at a website are HTML documents with their associated graphic image files (GIF, JPEG, etc.), scripted programs (in Perl, PHP, Java, etc.), and similar resources. The site's files.";
        //         speak(text, voices[5], rate, pitch, volume);
        //     }, 200);

        // } else {
        //     console.log(' Speech Synthesis Not Supported 😞');
        // }

        // let int16Array = new Int16Array(arr);

        // console.log("arr buffer : ", int16Array);

        // let arrBlob = new Blob([int16Array], { type: "audio/wav" });

        // console.log("arr blob = ", arrBlob);

        // aud.current.src = URL.createObjectURL(arrBlob);
        // aud.current.play();

        const dotter = document.getElementById("dotter");

        // console.log("Dotter : ", dotter);

        if (dotter) {
            let initialText = dotter.textContent;
            let i = 0;
            dotterRef.current = setInterval(() => {

                // console.log("i = ", i);

                if (i === 3) {
                    dotter.textContent = initialText;
                    i = 0;
                } else {

                    dotter.textContent = dotter.textContent + ".";

                    i = i + 1;
                }


            }, 1000);
        }

    }, [room_joined]);

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
                                    <>

                                        {
                                            imgSrc
                                                ?
                                                <>
                                                    <p>Your socket id is : {userSocketId}</p>

                                                    <div style={{ width: "40%", display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
                                                        <img src={micIcon} style={{ width: "50%" }} alt="mic-icon" />
                                                        <br />
                                                        <br />
                                                        <h2 style={{ textAlign: "center" }}>Keep saying and wait for responses as you want, like a phone call...</h2>
                                                        <br />
                                                        <br />
                                                        <h1 id="dotter" style={{ textAlign: "center" }}>I am listening</h1>
                                                    </div>
                                                </>
                                                :
                                                <div style={{ width: "40%", display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
                                                    <img src={micInitial} style={{ width: "50%" }} alt="mic-initial-icon" />
                                                </div>

                                        }

                                    </>
                                    :
                                    null
                            }

                            <button
                                style={{ cursor: "pointer", fontSize: "2rem", padding: "1rem 4rem", backgroundColor: "indigo", color: "white", border: "0.1rem solid black", borderRadius: "1rem" }}
                                onClick={() => {
                                    startr(true);
                                    set_room_joined(false);
                                    clearInterval(dotterRef.current)
                                }}
                            >
                                Cut this call &nbsp; ❌
                            </button>

                        </div>

                        {/* <audio ref={aud} id="audio" controls /> */}
                    </>

                    :

                    <div style={{ width: "100vw", height: "100vh", backgroundColor: "cyan", display: "grid", placeItems: "center" }}>

                        <div className="form-container">

                            <div className="form-container-div">
                                <p className="form-p-tag">Name</p>
                                <input value={name} onChange={(e) => setName(e.target.value)} type="text" id="name" placeholder="Your Name" required />
                            </div>

                            <div className="form-container-div">
                                <p className="form-p-tag">Phone No</p>
                                <input value={phone} onChange={(e) => setPhone(e.target.value)} type="number" id="name" placeholder="Your Phone No. Ex: 12345667890" required />
                            </div>

                            <div className="form-container-div">
                                <p className="form-p-tag">Email</p>
                                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" id="name" placeholder="Your Email Ex: abcd@example.com" required />
                            </div>

                            <br />
                            <br />

                            <button
                                style={{ width: "100%", fontSize: "2rem", padding: "1rem 4rem", backgroundColor: "indigo", color: "white", border: "0.1rem solid black", borderRadius: "1rem" }}
                                onClick={() => {

                                    if (!(name && phone && email)) {
                                        alert("Please fill all the details to start the call...");
                                        return null;
                                    }

                                    socket.emit("join_room", { roomName, name, phone, email });

                                    let audioRef = new Audio("http://localhost:9000/airlines_new_airlines_greeting_msg_tts.mp3");
                                    
                                    if (audioRef) {
                                        audioRef.play();
                                    }

                                    set_room_joined(true);

                                    audioRef.onended = () => {
                                        startr();
                                    }

                                }}
                            >
                                📞  &nbsp; Call To IVR
                            </button>

                        </div>
                    </div>
            }


        </>
    );
}

export default App;
