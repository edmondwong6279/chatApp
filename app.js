// Chat room where messages do not persist between clients,
// you only see the messages that are sent/received since
// you log in. Each user receives a random number string username.

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

// This is called between each new connection (I think).
wss.on("connection", (ws) => {
    ws.id = wss.getUniqueID();
    // does the client receive this?
    ws.send(ws.id);

    ws.on("message", (data) => {
        console.log("---------------");
        console.log(
            `received: ${data}\nSending to ${wss.clients.size} clients.`
        );
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                console.log(`Sending data to client ${client.id} now:`);
                client.send(data);
            }
        });
    });
});
