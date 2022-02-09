// Chat room where messages do not persist between clients,
// you only see the messages that are sent/received since
// you log in. Each user receives a random number string username.
//
// CLIENT:
// - On connection, RECEIVES it's unique id [0, id]
// - RECEIVES messages from server when other users (including themselves)
//      send messages to the server [1, [id, message], time]
// - SENDS messages that are in input field [id, message]
//
// SERVER:
// - On connection, makes a new id and SENDS this to the client [0, id]
// - RECEIVES message from the user [id, message], timestamps when it receives,
//      SENDS back to all clients [1, [id, message], time].

import express from "express";
import WebSocket, { WebSocketServer } from "ws";

const app = express();
app.use(express.static("/public"));
const server = app.listen(3000);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (socket) => {
        wss.emit("connection", socket, request);
    });
});

// Makes a random string, checks against current clients
// TODO this is not nice code, improve this.
// ALSO if there are enough clients connecting at the same time,
// this COULD give duplicate numbers. Async/await something here.
wss.getUniqueID = () => {
    while (true) {
        let flag = false;
        const currentId = Math.random().toString().slice(2, 7);
        wss.clients.forEach((client) => {
            if (client.id === currentId) {
                flag = true;
            }
        });
        if (!flag) {
            return currentId;
        }
    }
};

wss.on("connection", (ws) => {
    ws.id = wss.getUniqueID();
    // number flag indicates it's sending the client it's id
    ws.send(JSON.stringify([0, ws.id]));

    // receives a message from the clients
    ws.on("message", (data) => {
        data = JSON.parse(data);
        // NOTE data is a buffer object
        // get the time when the server receives it and attach as time stamp
        const timestamp = new Date();
        console.log(
            `received: ${data[1]}\nFrom: ${data[0]}\nAt Time: ${timestamp
                .toTimeString()
                .slice(0, 8)}\nSending to ${wss.clients.size} clients.`
        );
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                console.log(`Sending data to client ${client.id} now.`);
                client.send(JSON.stringify([1, data, timestamp]));
            }
        });
    });
});
