import React, { useEffect, useRef, useState } from "react";
import "./css/app.css";
import Recorder from "recorder-js";

import micIcon from "./assets/images/mic.gif";
import micInitial from "./assets/images/mic-initial.png";

import socketIOClient from "socket.io-client";
// import speak from "./helpers/speechSynthesis";

const socket = socketIOClient(process.env.REACT_APP_SERVER_URL);

const App = () => {

    const [audContext, setAudContext] = useState();
    const [room_joined, set_room_joined] = useState(false); // eslint-disable-next-line
    const [roomName, _setRoomName] = useState(new Date().getTime() + ""); // eslint-disable-next-line
    const rec = useRef(null);

    const [imgSrc, setImgSrc] = useState(false);

    const [userSocketId, setUserSocketId] = useState(socket.id);

    const timeoutRef = useRef();
    const dotterRef = useRef();

    // user form to be filled before making web call
    const [name, setName] = useState(["Mayank Sinha"]);
    const [phone, setPhone] = useState("9809890989");
    const [email, setEmail] = useState("sample@email.com");

    const botAudioRef = useRef(null);

    const blobToArrayBuffer = (blob) => new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.readAsArrayBuffer(blob);
        fr.onloadend = () => {
            resolve(new Int16Array(fr.result));
        }
    });

    const startRecording = (stop = false) => {

        if (stop) {
            clearTimeout(timeoutRef.current);
            stopRecording(true);
            return;
        }

        if (audContext?.state === "suspended") {
            audContext.resume();
        }
        rec.current.start();

        timeoutRef.current = setTimeout(() => {
            stopRecording(stop);
        }, 1000);
    }

    const stopRecording = (reallyStop = false) => {

        // console.log("StopRecording fn called...");

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
                startRecording();
            }

            console.log("pcm Data : ", pcmData.length);

            socket.emit("recording", {
                roomName,
                audioData: Object.values(pcmData)
            });

        });

    }

    const playBotAudio = (url) => {

        if (botAudioRef.current) {
            botAudioRef.current.pause();
        }

        if (!url) {
            alert("Please provide url in order to speak!");
            return;
        }

        let botAudio = new Audio(url);
        botAudio.play();
        startRecording(true);

        botAudio.onended = () => {
            startRecording();
            setImgSrc(true);
        }

        botAudioRef.current = botAudio;
    }

    const startCall = () => {

        // validating for non empty data 
        if (!(name && phone && email)) {
            alert("Please fill all the details to start the call...");
            return null;
        } else {

            // Phone number validation
            let phone_no = phone.toString();

            if ((phone_no && phone_no.length !== 10) || !(phone_no.startsWith("6") || phone_no.startsWith("7") || phone_no.startsWith("8") || phone_no.startsWith("9"))) {
                alert("Please enter a valid phone number!");
                return null;
            }

            // Email number validation
            if (!(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/.test(email))) {
                alert("Please enter a valid email!");
                return null;
            }
        }

        socket.emit("join_room", { roomName, name, phone, email, startDateTime: new Date().getTime() });

        // playBotAudio(`${process.env.REACT_APP_SERVER_URL}/airlines_new_airlines_greeting_msg_tts.mp3`);
        let botAudio = new Audio(`${process.env.REACT_APP_SERVER_URL}/airlines_new_airlines_greeting_msg_tts.mp3`);
        botAudio.play();

        botAudio.onended = () => {
            startRecording();
        }

        set_room_joined(true);

    }

    const cutCall = () => {

        if (botAudioRef.current) {
            botAudioRef.current.pause();
        }

        startRecording(true);
        set_room_joined(false);
        clearInterval(dotterRef.current);
        setImgSrc(false);
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
            console.log("Yay! Data: ", data);
            // speak({ text: data.response, volume: data.volume, rate: data.rate, pitch: data.pitch, lang: data.lang });

            playBotAudio(data.audio_file_url);

            // startRecording(true);

            setImgSrc(false);

        });
        // eslint-disable-next-line
    }, []); // eslint-disable-next-line

    useEffect(() => {

        const dotter = document.getElementById("dotter");

        if (dotter) {
            let initialText = dotter.textContent;
            let i = 0;
            dotterRef.current = setInterval(() => {

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
            {
                room_joined ?

                    <>
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
                                    <p>uh-oh! Looks like this app is not able to communicate with the backend server.</p>
                            }

                            <button className="cut-call-button" onClick={cutCall}> Cut this call &nbsp; ❌ </button>

                        </div>
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

                            <button className="start-call-button" onClick={startCall} > 📞  &nbsp; Call To IVR </button>

                        </div>
                    </div>
            }


        </>
    );
}

export default App;
