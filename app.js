// Chat room where messages do not persist between clients,
// you only see the messages that are sent/received since
// you log in.
//
// Maybe add a name thing before hand too to identify who is who?

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

// This is called between each new connection (I think).
wss.on("connection", (ws) => {

    ws.on("message", (data) => {
        console.log(
            `received: ${data}\nSending to ${wss.clients.size} clients.`
        );
        wss.clients.forEach((client) => {
            console.log(client.readyState);
            console.log(WebSocket.OPEN);
            if (client.readyState === WebSocket.OPEN) {
                console.log("Sending data to client now.");
                client.send(data);
            }
        });
    });
});
